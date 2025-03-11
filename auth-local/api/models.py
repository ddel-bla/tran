from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    """Modelo de usuario personalizado con email obligatorio"""
    email = models.EmailField(unique=True)
    image_url = models.URLField(blank=True, null=True)

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
