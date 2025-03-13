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
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

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

@api_view(['POST'])
@csrf_protect 
def login_user(request):
    """Autentica un usuario con email y contraseña"""
    email = request.data.get("email")
    password = request.data.get("password")

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

@api_view(["POST"])
def verify_otp(request):
    """Verifica el código OTP para completar la autenticación"""
    temp_token = request.data.get("temp_token")
    otp_code = request.data.get("otp_code")
    
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

@api_view(["GET"])
def get_2fa_setup(request):
    """Obtiene los datos para la configuración de 2FA"""
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
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": f"Error al generar configuración 2FA: {str(e)}"}, status=500)

@api_view(["POST"])
def verify_2fa_setup(request):
    """Verifica la configuración inicial de 2FA y completa el registro"""
    temp_token = request.data.get("temp_token")
    otp_code = request.data.get("otp_code")
    client_secret_key = request.data.get("secret_key")  # Nueva: clave generada por el cliente
    
    if not temp_token or not otp_code:
        return JsonResponse({"error": "Token temporal y código OTP son requeridos."}, status=400)
    
    user = get_user_by_temp_token(temp_token)
    if not user:
        return JsonResponse({"error": "Token temporal inválido o expirado."}, status=401)
    
    # Si recibimos una clave secreta del cliente, la usamos para crear/actualizar el dispositivo TOTP
    if client_secret_key:
        try:
            from django_otp.plugins.otp_totp.models import TOTPDevice
            
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
            
            # Verificamos el código directamente
            if device.verify_token(otp_code):
                # Actualizar estado 2FA del usuario
                user.two_factor_enabled = True
                user.two_factor_setup_required = False
                user.temp_token = None
                user.save()
                
                # Generar JWT completo
                token = generate_jwt(user)
                
                return JsonResponse({
                    "token": token,
                    "username": user.username,
                    "image_url": user.image_url,
                    "message": "Configuración 2FA completada exitosamente"
                }, status=200)
            else:
                return JsonResponse({"error": "Código OTP inválido."}, status=401)
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({"error": f"Error al configurar dispositivo TOTP: {str(e)}"}, status=500)
    
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

@api_view(["GET"])
def get_csrf_token(request):
    response = JsonResponse({"csrfToken": get_token(request)})
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Origin"] = "https://localhost:8443"  # Asegurar origen correcto
    response.set_cookie(
        "csrftoken",
        get_token(request),
        max_age=60 * 60,  # 1 hora
        secure=True,  # Solo HTTPS
        httponly=False,  # Accesible por JavaScript
        samesite="None"  # Permitir en peticiones cross-origin
    )
    return response