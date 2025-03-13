from django_otp.plugins.otp_totp.models import TOTPDevice
from django.contrib.auth import get_user_model
import jwt
import datetime
import os
import environ

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
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=5)  # Expira en 5 minutos
    }
    temp_token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    # Guarda el token temporal en el usuario
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
            return None
        
        user = CustomUser.objects.get(id=payload["id"])
        if user.temp_token != token:
            return None
            
        return user
    except (jwt.ExpiredSignatureError, jwt.DecodeError, CustomUser.DoesNotExist):
        return None

def generate_qr_code_for_user(user):
    """Genera una clave TOTP para la configuración de 2FA (sin QR)"""
    device = user.get_or_create_totp_device()
    
    # Configurar el dispositivo si no está confirmado
    if not device.confirmed:
        device.confirmed = True
        device.save()
    
    # Generar la URL para Google Authenticator
    url = device.config_url
    
    return {
        'config_url': url,
        'secret_key': device.key
    }

def verify_otp_code(user, otp_code):
    """Verifica un código OTP para un usuario"""
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