from django.urls import path, include
from .views import login_user, register_user, get_csrf_token

urlpatterns = [
    path("api/auth/register", register_user, name="register_user"),
    path("api/auth/login", view=login_user, name="login_user"),
    path("api/auth/csrf/", get_csrf_token, name="get_csrf_token"),
    path("", include("django_prometheus.urls")),
]
