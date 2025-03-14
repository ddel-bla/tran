from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from rest_framework.decorators import api_view
from django.middleware.csrf import get_token
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import get_user_model
import jwt
import datetime
import os
import environ
import json
import traceback
from django.core.exceptions import ValidationError
from .otp_utils import (
    generate_temp_token,
    generate_jwt,
    get_user_by_temp_token,
    generate_qr_code_for_user,
    verify_otp_code
)

CustomUser = get_user_model()
env = environ.Env()
environ.Env.read_env(os.path.join(os.path.dirname(__file__), '../.env'))

SECRET_KEY = env('SECRET_KEY')

@api_view(["POST"])
@csrf_protect
def register_user(request):
    """Registra un usuario con email obligatorio"""
    try:
        # Intentar obtener datos del cuerpo de la solicitud
        if isinstance(request.data, dict):
            data = request.data
        else:
            # Si request.data no es un diccionario, intentar parsear el cuerpo como JSON
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError:
                return JsonResponse({"error": "Formato de solicitud inválido."}, status=400)
        
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username or not email or not password:
            return JsonResponse({"error": "Todos los campos son obligatorios."}, status=400)
        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({"error": "Este email ya está registrado."}, status=400)
        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse({"error": "Este nombre de usuario ya está en uso."}, status=400)
        if len(password) < 8:
            return JsonResponse({"error": "La contraseña debe tener al menos 8 caracteres."}, status=400)
        if(len(username) < 4):
            return JsonResponse({"error": "El nombre de usuario debe tener al menos 4 caracteres."}, status=400)
        if not any(char.isdigit() for char in password):
            return JsonResponse({"error": "La contraseña debe tener al menos un dígito."}, status=400)
        if not any(char.isupper() for char in password):
            return JsonResponse({"error": "La contraseña debe tener al menos una letra mayúscula."}, status=400)

        if not email.count("@") == 1 or not email.count(".") >= 1:
            return JsonResponse({"error": "Email inválido."}, status=400)

        try:
            user = CustomUser.objects.create(
                username=username,
                email=email,
                password=make_password(password),
                image_url="https://i.imgur.com/DP2aShH.png",
                two_factor_setup_required=True
            )
            # Generar token temporal para la configuración de 2FA
            temp_token = generate_temp_token(user)
            
            # Crear dispositivo TOTP
            device = user.get_or_create_totp_device()
            
            return JsonResponse({
                "message": "Usuario registrado correctamente. Configura la autenticación de dos factores.",
                "temp_token": temp_token,
                "username": user.username,
                "requires_2fa_setup": True
            }, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)
        except Exception as e:
            print(f"Error inesperado en registro: {str(e)}")
            traceback.print_exc()
            return JsonResponse({"error": "Error interno del servidor."}, status=501)
            
    except Exception as e:
        print(f"Error general en register_user: {str(e)}")
        traceback.print_exc()
        return JsonResponse({"error": "Error interno del servidor."}, status=502)

@api_view(['POST'])
@csrf_protect 
def login_user(request):
    """Autentica un usuario con email y contraseña"""
    try:
        # Intentar obtener datos del cuerpo de la solicitud
        if isinstance(request.data, dict):
            data = request.data
        else:
            # Si request.data no es un diccionario, intentar parsear el cuerpo como JSON
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError:
                return JsonResponse({"error": "Formato de solicitud inválido."}, status=400)
        
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return JsonResponse({"error": "Email y contraseña son requeridos."}, status=400)

        user = CustomUser.objects.filter(email=email).first()
        
        if user and check_password(password, user.password):
            # Primera fase de autenticación exitosa
            temp_token = generate_temp_token(user)
            
            return JsonResponse({
                "message": "Primera fase de autenticación exitosa. Requiere verificación 2FA.",
                "temp_token": temp_token,
                "username": user.username,
                "requires_2fa": True
            }, status=200)
        
        return JsonResponse({"error": "Credenciales inválidas"}, status=401)
    except Exception as e:
        print(f"Error en login_user: {str(e)}")
        traceback.print_exc()
        return JsonResponse({"error": "Error interno del servidor."}, status=503)

@api_view(["POST"])
def verify_otp(request):
    """Verifica el código OTP para completar la autenticación"""
    try:
        # Intentar obtener datos del cuerpo de la solicitud
        if isinstance(request.data, dict):
            data = request.data
        else:
            # Si request.data no es un diccionario, intentar parsear el cuerpo como JSON
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError:
                return JsonResponse({"error": "Formato de solicitud inválido."}, status=400)
        
        temp_token = data.get("temp_token")
        otp_code = data.get("otp_code")
        
        if not temp_token or not otp_code:
            return JsonResponse({"error": "Token temporal y código OTP son requeridos."}, status=400)
        
        user = get_user_by_temp_token(temp_token)
        if not user:
            return JsonResponse({"error": "Token temporal inválido o expirado."}, status=401)
        
        if verify_otp_code(user, otp_code):
            # Verificación 2FA exitosa, generar JWT completo
            token = generate_jwt(user)
            
            return JsonResponse({
                "token": token,
                "username": user.username,
                "image_url": user.image_url,
                "message": "Autenticación completa exitosa"
            }, status=200)
        
        return JsonResponse({"error": "Código OTP inválido."}, status=401)
    except Exception as e:
        print(f"Error en verify_otp: {str(e)}")
        traceback.print_exc()
        return JsonResponse({"error": "Error interno del servidor."}, status=504)

@api_view(["GET"])
def get_2fa_setup(request):
    """Obtiene los datos para la configuración de 2FA"""
    try:
        temp_token = request.GET.get("temp_token")
        
        if not temp_token:
            return JsonResponse({"error": "Token temporal requerido."}, status=400)
        
        user = get_user_by_temp_token(temp_token)
        if not user:
            return JsonResponse({"error": "Token temporal inválido o expirado."}, status=401)
        
        try:
            qr_data = generate_qr_code_for_user(user)
            
            return JsonResponse({
                "secret_key": qr_data["secret_key"],
                "config_url": qr_data.get("config_url", ""),
                "username": user.username
            }, status=200)
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": f"Error al generar configuración 2FA: {str(e)}"}, status=505)
    except Exception as e:
        print(f"Error en get_2fa_setup: {str(e)}")
        traceback.print_exc()
        return JsonResponse({"error": "Error interno del servidor."}, status=506)

@api_view(["POST"])
def verify_2fa_setup(request):
    """Verifica la configuración inicial de 2FA y completa el registro"""
    print("Recibida solicitud verify_2fa_setup")
    try:
        # Intentar obtener datos del cuerpo de la solicitud
        if isinstance(request.data, dict):
            data = request.data
        else:
            # Si request.data no es un diccionario, intentar parsear el cuerpo como JSON
            try:
                data = json.loads(request.body.decode('utf-8'))
                print(f"Datos decodificados: {json.dumps(data)}")
            except json.JSONDecodeError as e:
                print(f"Error decodificando JSON: {str(e)}")
                return JsonResponse({"error": "Formato de solicitud inválido."}, status=400)
        
        temp_token = data.get("temp_token")
        otp_code = data.get("otp_code")
        client_secret_key = data.get("secret_key")  # Nueva: clave generada por el cliente
        
        print(f"Token recibido: {temp_token[:15]}... OTP: {otp_code}, Secret key: {client_secret_key[:5]}...")
        
        if not temp_token or not otp_code:
            return JsonResponse({"error": "Token temporal y código OTP son requeridos."}, status=400)
        
        user = get_user_by_temp_token(temp_token)
        if not user:
            return JsonResponse({"error": "Token temporal inválido o expirado."}, status=401)
        
        # Si recibimos una clave secreta del cliente, la usamos para crear/actualizar el dispositivo TOTP
        if client_secret_key:
            try:
                from django_otp.plugins.otp_totp.models import TOTPDevice
                
                print("Creando nuevo dispositivo TOTP con clave del cliente")
                
                # Buscar dispositivos existentes
                devices = TOTPDevice.objects.devices_for_user(user)
                # Eliminar dispositivos existentes
                for device in devices:
                    device.delete()
                    
                # Crear nuevo dispositivo con la clave proporcionada por el cliente
                device = TOTPDevice.objects.create(
                    user=user,
                    name="default",
                    confirmed=True,
                    key=client_secret_key
                )
                
                print(f"Dispositivo creado. Verificando código: {otp_code}")
                
                # Verificamos el código directamente
                if device.verify_token(otp_code):
                    # Actualizar estado 2FA del usuario
                    user.two_factor_enabled = True
                    user.two_factor_setup_required = False
                    user.temp_token = None
                    user.save()
                    
                    # Generar JWT completo
                    token = generate_jwt(user)
                    
                    print("Verificación exitosa. Generando token JWT.")
                    
                    return JsonResponse({
                        "token": token,
                        "username": user.username,
                        "image_url": user.image_url,
                        "message": "Configuración 2FA completada exitosamente"
                    }, status=200)
                else:
                    print("Código OTP inválido")
                    return JsonResponse({"error": "Código OTP inválido."}, status=401)
                    
            except Exception as e:
                print(f"Error al configurar dispositivo TOTP: {str(e)}")
                traceback.print_exc()
                return JsonResponse({"error": f"Error al configurar dispositivo TOTP: {str(e)}"}, status=501)
        
        # Comportamiento original (solo como fallback)
        if verify_otp_code(user, otp_code):
            # Verificación 2FA exitosa, generar JWT completo
            token = generate_jwt(user)
            
            return JsonResponse({
                "token": token,
                "username": user.username,
                "image_url": user.image_url,
                "message": "Configuración 2FA completada exitosamente"
            }, status=200)
        
        return JsonResponse({"error": "Código OTP inválido."}, status=401)
    except Exception as e:
        print(f"Error general en verify_2fa_setup: {str(e)}")
        traceback.print_exc()
        return JsonResponse({"error": "Error interno del servidor."}, status=507)

@api_view(["GET"])
def get_csrf_token(request):
    response = JsonResponse({"csrfToken": get_token(request)})
    response["Access-Control-Allow-Credentials"] = "true"
    # Permitir los orígenes específicos
    origin = request.headers.get('Origin', '')
    allowed_origins = ["https://localhost:8443", "https://localhost:8441"]
    
    if origin in allowed_origins:
        response["Access-Control-Allow-Origin"] = origin
    else:
        response["Access-Control-Allow-Origin"] = "https://localhost:8443"  # Por defecto
        
    response.set_cookie(
        "csrftoken",
        get_token(request),
        max_age=60 * 60,  # 1 hora
        secure=True,  # Solo HTTPS
        httponly=False,  # Accesible por JavaScript
        samesite="None"  # Permitir en peticiones cross-origin
    )
    return response