from django.urls import path, include
from .views import (
    login_user,
    register_user,
    get_csrf_token,
    verify_otp,
    get_2fa_setup,
    verify_2fa_setup
)

urlpatterns = [
    path("api/auth/register", register_user, name="register_user"),
    path("api/auth/login", view=login_user, name="login_user"),
    path("api/auth/verify-otp", verify_otp, name="verify_otp"),
    path("api/auth/2fa-setup", get_2fa_setup, name="get_2fa_setup"),
    path("api/auth/verify-2fa-setup", verify_2fa_setup, name="verify_2fa_setup"),
    path("api/auth/csrf/", get_csrf_token, name="get_csrf_token"),
    path("", include("django_prometheus.urls")),
]