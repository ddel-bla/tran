from django.urls import path, include
from .views import get_2fa_setup, get_csrf_token
from .views import login_user, register_user, get_csrf_token, get_user_token, logout_user
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse
from .views import verify_otp, verify_2fa_setup
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def metrics_view(request):
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)

urlpatterns = [
    path("api/auth/register", register_user, name="register_user"),
    path("api/auth/login", login_user, name="login_user"),
    path("api/auth/csrf/", get_csrf_token, name="get_csrf_token"),
    path("api/auth/get_user_token", get_user_token, name="get_user_token"),
    path("api/auth/logout", logout_user, name="logout_user"),
	path("api/auth/verify-otp", verify_otp, name="verify_otp"),
    path("api/auth/2fa-setup", get_2fa_setup, name="get_2fa_setup"),
    path("api/auth/verify-2fa-setup", view=verify_2fa_setup, name="verify_2fa_setup"),
    path("", include("django_prometheus.urls")),
    path("metrics/", metrics_view, name="metrics"),

]

    
