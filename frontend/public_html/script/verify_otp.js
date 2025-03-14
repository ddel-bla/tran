

// Variable global para guardar el token temporal
let tempToken = localStorage.getItem('temp_token') || '';

function initVerifyOtp() {
    console.log("Inicializando verificación OTP");
    
    // Inicializar el token temporal desde localStorage
    tempToken = localStorage.getItem('temp_token');
    if (tempToken) {
        document.getElementById('tempToken').value = tempToken;
        console.log("Token temporal cargado:", tempToken.substring(0, 15) + "...");
        showMessage(document.getElementById('otp-message'), "Introduce el código de verificación de tu aplicación", "info");
    } else {
        console.error("No se encontró token temporal");
        showMessage(document.getElementById('otp-message'), "Error de autenticación. Inicia sesión nuevamente.", "danger");
        setTimeout(() => PageManager.load('login'), 2000);
    }
    
    // Configurar event listeners
    const otpCodeInput = document.getElementById('otpCode');
    if (otpCodeInput) {
        otpCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyOtp();
            }
        });
    }
    
    const verifyButton = document.getElementById('verifyBtn');
    if (verifyButton) {
        verifyButton.addEventListener('click', verifyOtp);
    }
}

async function verifyOtp() {
    const otpCode = document.getElementById('otpCode').value.trim();
    const messageElement = document.getElementById('otp-message');
    
    // Validar código OTP
    if (!otpCode || otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
        showMessage(messageElement, "El código debe contener 6 dígitos", "danger");
        return;
    }
    
    // Validar que tenemos token temporal
    if (!tempToken) {
        showMessage(messageElement, "Error de autenticación. Inicia sesión nuevamente.", "danger");
        setTimeout(() => PageManager.load('login'), 2000);
        return;
    }
    
    showMessage(messageElement, "Verificando código...", "info");
    console.log("Verificando código OTP:", otpCode);
    
    try {
        // Obtener CSRF token
        const csrfToken = await getCsrfToken();
        console.log("CSRF Token obtenido:", csrfToken ? "Sí" : "No");
        
        const requestData = { 
            temp_token: tempToken,
            otp_code: otpCode
        };
        
        console.log("Enviando solicitud a verify-otp");
        
        // Realizar la petición al servidor
        const response = await fetch("https://localhost:8441/api/auth/verify-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            credentials: "include",
            body: JSON.stringify(requestData)
        });
        
        console.log("Respuesta recibida, estado:", response.status);
        
        // Leer la respuesta como texto primero para debug
        const responseText = await response.text();
        console.log("Texto de respuesta:", responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""));
        
        // Intentar parsear como JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Error al parsear JSON:", e);
            showMessage(messageElement, "Respuesta del servidor inválida", "danger");
            return;
        }
        
        // Procesar la respuesta
        if (response.ok) {
            showMessage(messageElement, "Autenticación completada exitosamente", "success");
            console.log("Autenticación exitosa, guardando datos en localStorage");
            
            // Guardar el token JWT y los datos del usuario
            localStorage.setItem("jwt_backend2", data.token);
            localStorage.setItem("username_backend2", data.username);
            localStorage.setItem("image_url_backend2", data.image_url || "https://i.imgur.com/DP2aShH.png");
            
            // Limpiar el token temporal
            localStorage.removeItem("temp_token");
            
            // Redireccionar al juego
            setTimeout(() => {
                PageManager.load('game');
                if (typeof updateNavbar === 'function') {
                    updateNavbar();
                }
            }, 1500);
        } else {
            console.error("Error en la verificación:", data.error);
            showMessage(messageElement, data.error || "Error de verificación", "danger");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        showMessage(messageElement, "Error en la comunicación con el servidor", "danger");
    }
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `alert alert-${type} mb-3`;
    element.style.display = "block";
    console.log(`Mensaje [${type}]:`, message);
}

async function getCsrfToken() {
    try {
        console.log("Solicitando CSRF token...");
        const response = await fetch("https://localhost:8441/api/auth/csrf/", {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("CSRF token obtenido correctamente");
        return data.csrfToken;
    } catch (error) {
        console.error("Error obteniendo CSRF token:", error);
        
        // Fallback: intentar obtener el token de las cookies
        console.log("Intentando obtener token de cookies...");
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith('csrftoken=')) {
                const token = cookie.substring('csrftoken='.length, cookie.length);
                console.log("Token encontrado en cookies");
                return token;
            }
        }
        console.warn("No se encontró token CSRF en cookies");
        return "";
    }
}