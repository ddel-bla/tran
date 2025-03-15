from django.http import JsonResponse
from rest_framework.decorators import api_view
import requests
import jwt
import datetime
import os
from django.shortcuts import redirect
from django.contrib.auth import get_user_model
import environ
from urllib.parse import quote

env = environ.Env()
environ.Env.read_env(os.path.join(os.path.dirname(__file__), '../.env'))

User = get_user_model()

SECRET_KEY = env('SECRET_KEY')
CLIENT_ID = env('CLIENT_ID')
CLIENT_SECRET = env('CLIENT_SECRET')
REDIRECT_URI = env('REDIRECT_URI')
encoded_redirect_uri = quote(REDIRECT_URI, safe='')


LOGGED_IN_USERS = {}

def generate_jwt(user):
    """Genera un token JWT para un usuario"""
    payload = {
        'id': user.id,
        'username': user.username,
        'intra_id': user.intra_id,
        'image_url': user.image_url,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def login_42(request):
    """Redirige al usuario a la autenticación de 42"""
    auth_url = f"https://api.intra.42.fr/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={encoded_redirect_uri}&response_type=code"
    return redirect(auth_url)

@api_view(['GET'])
def callback_42(request):
    code = request.GET.get("code")
    error = request.GET.get("error")

    if error or not code:
        return redirect("https://localhost:8443") 

    token_url = "https://api.intra.42.fr/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    response = requests.post(token_url, data=token_data, verify=False)

    if response.status_code != 200:
        return JsonResponse({"error": "Failed to obtain access token"}, status=400)

    access_token = response.json().get("access_token")

    user_info_url = "https://api.intra.42.fr/v2/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    user_info_response = requests.get(user_info_url, headers=headers, verify=False)

    if user_info_response.status_code != 200:
        return JsonResponse({"error": "Failed to fetch user info"}, status=400)

    user_data = user_info_response.json()
    intra_id = user_data.get("id")
    login = user_data.get("login")
    email = user_data.get("email")
    image_url = user_data.get("image", {}).get("link")

    user, created = User.objects.get_or_create(
        login=login,
        defaults={
            "username": login,
            "intra_id": intra_id,
            "email": email,
            "image_url": image_url,
            "token": access_token,
        }
    )

    if not created:
        user.email = email
        user.image_url = image_url
        user.token = access_token
        user.save()

    jwt_token = generate_jwt(user)

    LOGGED_IN_USERS[user.id] = jwt_token

    redirect_url = f"https://localhost:8443/?token={jwt_token}&auth=42&username={login}&image_url={image_url}"
    return redirect(redirect_url)

@api_view(["GET"])
def get_user_info(request):
    """Devuelve la información del usuario autenticado"""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.objects.get(id=payload["id"])

        return JsonResponse({
            "username": user.username,
            "image_url": user.image_url
        })
    
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except jwt.DecodeError:
        return JsonResponse({"error": "Invalid token"}, status=401)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

@api_view(["GET"])
def get_user_token(request):
    """Devuelve el token JWT del usuario autenticado, solo si está logueado"""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("id")

        if user_id not in LOGGED_IN_USERS or LOGGED_IN_USERS[user_id] != token:
            return JsonResponse({"error": "Unauthorized"}, status=401)

        return JsonResponse({"token": token})
    
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except jwt.DecodeError:
        return JsonResponse({"error": "Invalid token"}, status=401)

@api_view(["POST"])
def logout_user(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("id")
        if user_id in LOGGED_IN_USERS:
            del LOGGED_IN_USERS[user_id]

        return JsonResponse({"message": "Logout exitoso"}, status=200)
    
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except jwt.DecodeError:
        return JsonResponse({"error": "Invalid token"}, status=401)
