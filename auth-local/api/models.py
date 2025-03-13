from django.db import models
from django.contrib.auth.models import AbstractUser
from django_otp.plugins.otp_totp.models import TOTPDevice

class CustomUser(AbstractUser):
    """Modelo de usuario personalizado con email obligatorio y 2FA"""
    email = models.EmailField(unique=True)
    image_url = models.URLField(blank=True, null=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_setup_required = models.BooleanField(default=True)
    temp_token = models.CharField(max_length=255, blank=True, null=True)

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
        devices = TOTPDevice.objects.devices_for_user(self, confirmed=True)
        for device in devices:
            if device.confirmed:
                return device
                
        # Si no existe, crea uno nuevo
        device = TOTPDevice.objects.create(user=self, name="default", confirmed=False)
        device.save()
        return device