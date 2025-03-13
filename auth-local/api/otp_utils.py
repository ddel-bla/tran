from django_otp.plugins.otp_totp.models import TOTPDevice
from django.contrib.auth import get_user_model
import jwt
import datetime
import os
import environ
import base64
import traceback

env = environ.Env()
environ.Env.read_env(os.path.join(os.path.dirname(__file__), '../.env'))

SECRET_KEY = env('SECRET_KEY')
CustomUser = get_user_model()

def generate_temp_token(user):
    """Genera un token temporal para el proceso de verificación 2FA"""
    payload = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'temp_auth': True,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)  # Expira en 15 minutos
    }
    temp_token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    # Guardar el token temporal en el usuario
    user.temp_token = temp_token
    user.save()
    
    return temp_token

def generate_jwt(user):
    """Genera un JWT completo para el usuario autenticado con 2FA"""
    payload = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'image_url': user.image_url,
        'two_factor_verified': True,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def get_user_by_temp_token(token):
    """Obtiene un usuario a partir de un token temporal"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if not payload.get('temp_auth'):
            print("No es un token temporal")
            return None
        
        user = CustomUser.objects.get(id=payload["id"])
        if user.temp_token != token:
            print("Token no coincide con el guardado en usuario")
            return None
            
        return user
    except jwt.ExpiredSignatureError:
        print("Token expirado")
        return None
    except jwt.DecodeError:
        print("Error decodificando token")
        return None
    except CustomUser.DoesNotExist:
        print("Usuario no existe")
        return None

def generate_qr_code_for_user(user):
    """Genera información para configurar 2FA (sin QR)"""
    try:
        device = user.get_or_create_totp_device()
        
        # Configurar el dispositivo si no está confirmado
        if not device.confirmed:
            device.confirmed = True
            device.save()
        
        # Generar la URL para aplicaciones de autenticación
        url = device.config_url
        
        return {
            'config_url': url,
            'secret_key': base64.b32encode(device.bin_key).decode('utf-8')
        }
    except Exception as e:
        print(f"Error generando QR para usuario: {str(e)}")
        traceback.print_exc()
        raise

def verify_otp_code(user, otp_code):
    """Verifica un código OTP para un usuario"""
    try:
        devices = TOTPDevice.objects.devices_for_user(user)
        
        for device in devices:
            if device.verify_token(otp_code):
                # Actualizar el estado de 2FA del usuario
                user.two_factor_enabled = True
                user.two_factor_setup_required = False
                user.temp_token = None
                user.save()
                return True
                
        return False
    except Exception as e:
        print(f"Error verificando código OTP: {str(e)}")
        traceback.print_exc()
        return False