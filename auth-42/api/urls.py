from django.urls import path, include
from . import views
from .views import get_user_info


urlpatterns = [
    path("api/auth/42/login", views.login_42, name="login_42"),
    path("api/auth/callback", views.callback_42, name="callback_42"),
    path("api/auth/user", get_user_info, name="get_user_info"),
    path("api/auth/logout", views.logout_and_delete_user, name="logout"),
    path("", include("django_prometheus.urls")),
]
