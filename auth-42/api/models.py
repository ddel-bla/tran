from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    intra_id = models.IntegerField(unique=True, null=True, blank=True)
    login = models.CharField(max_length=100, unique=True)
    image_url = models.URLField(blank=True, null=True)
    token = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.username
