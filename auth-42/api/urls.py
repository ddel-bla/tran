from django.urls import path, include
from . import views
from .views import get_user_info, logout_user
from .views import get_user_info
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def metrics_view(request):
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)

urlpatterns = [
    path("api/auth/42/login", views.login_42, name="login_42"),
    path("api/auth/callback", views.callback_42, name="callback_42"),
    path("api/auth/user", get_user_info, name="get_user_info"),
    path("api/auth/get_user_token", views.get_user_token, name="get_user_token"),
    path("api/auth/logout", logout_user, name="logout_user"),
    path("", include("django_prometheus.urls")),
    path("metrics/", metrics_view, name="metrics"),
]