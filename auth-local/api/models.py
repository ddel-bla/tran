from django.db import models
from django.contrib.auth.models import AbstractUser
from django_otp.plugins.otp_totp.models import TOTPDevice

class CustomUser(AbstractUser):
    """Modelo de usuario personalizado con email obligatorio y 2FA"""
    email = models.EmailField(unique=True)
    image_url = models.URLField(blank=True, null=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_setup_required = models.BooleanField(default=True)
    temp_token = models.TextField(blank=True, null=True)  # Cambiado a TextField para evitar limitaciones de longitud

    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["email"]

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="customuser_groups",
        blank=True
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="customuser_permissions",
        blank=True
    )

    class Meta:
        db_table = "auth_user"

    def __str__(self):
        return self.username
        
    def get_or_create_totp_device(self):
        """Obtiene o crea un dispositivo TOTP para el usuario"""
        try:
            # Intentar obtener un dispositivo confirmado existente
            devices = TOTPDevice.objects.devices_for_user(self, confirmed=True)
            for device in devices:
                if device.confirmed:
                    return device
                    
            # Si existe un dispositivo no confirmado, intentar obtenerlo
            devices = TOTPDevice.objects.devices_for_user(self, confirmed=False)
            for device in devices:
                return device
                
            # Si no existe, crear uno nuevo
            device = TOTPDevice.objects.create(user=self, name="default", confirmed=False)
            device.save()
            return device
        except Exception as e:
            import traceback
            traceback.print_exc()
            # Si hay algún error, intentar crear uno nuevo de todos modos
            device = TOTPDevice.objects.create(user=self, name="default", confirmed=False)
            device.save()
            return device