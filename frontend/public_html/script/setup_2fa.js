
// Variables globales
let secretKey = '';
let qrUrl = '';
let qrCodeInstance = null;

function initSetup2FA() {
    console.log("Inicializando configuración 2FA");
	tempToken = localStorage.getItem("temp_token");
    // Verificar si tenemos token temporal
    if (!tempToken) {
        showMessage("No se encontró un token temporal. Por favor, regístrate nuevamente.", "danger");
        setTimeout(() => PageManager.load('register'), 2000);
        return;
    }
    
    // Inicializar listeners
    const generateBtn = document.getElementById('generateKeyBtn');
    if (generateBtn) {
        console.log("Configurando listener para el botón generateKeyBtn");
        generateBtn.addEventListener('click', generateTOTPKey);
    } else {
        console.error("Elemento 'generateKeyBtn' no encontrado en el DOM");
    }
    
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            copyToClipboard('secretKey');
        });
    }
    
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyOTP);
    }
    
    // Mostrar mensaje informativo
    showMessage("Sigue los pasos para configurar la autenticación de dos factores", "info");
}

// Función para generar la clave TOTP
function generateTOTPKey() {
    console.log("Función generateTOTPKey ejecutada");
    const generateBtn = document.getElementById('generateKeyBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generando...';
    showMessage("Generando clave y QR...", "info");
    
    // Generar localmente
    try {
        generateLocalKey();
    } catch (error) {
        console.error('Error al generar la clave localmente:', error);
        showMessage("Error al generar la clave TOTP. Intenta de nuevo.", "danger");
        generateBtn.disabled = false;
        generateBtn.textContent = 'Intentar de nuevo';
    }
}

// Función para generar una clave localmente
function generateLocalKey() {
    // Generar una clave aleatoria de 16 caracteres base32
    secretKey = generateRandomBase32Key(16);
    
    // Crear URL para QR (formato estándar para aplicaciones de autenticación)
    const username = localStorage.getItem('username_backend2') || 'usuario';
    const issuer = encodeURIComponent('PongApp');
    const encodedKey = encodeURIComponent(secretKey);
    const encodedUsername = encodeURIComponent(username);
    
    qrUrl = `otpauth://totp/${issuer}:${encodedUsername}?secret=${encodedKey}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    
    // Mostrar la clave y generar QR
    displayKeyAndQR(secretKey, qrUrl);
}

// Función para generar una clave aleatoria en formato Base32
function generateRandomBase32Key(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Caracteres base32
    let result = '';
    
    // Usar método seguro si está disponible
    if (window.crypto && window.crypto.getRandomValues) {
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += chars.charAt(randomValues[i] % chars.length);
        }
    } else {
        // Fallback a Math.random
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return result;
}

// Función para mostrar la clave y generar QR
function displayKeyAndQR(key, url) {
    console.log("Mostrando clave generada");
    
    // Mostrar la clave secreta
    const secretKeyElement = document.getElementById('secretKey');
    if (secretKeyElement) {
        secretKeyElement.textContent = key;
    }
    
    const keyDetails = document.getElementById('keyDetails');
    if (keyDetails) {
        keyDetails.style.display = 'block';
    }
    
    // Intentar generar QR si tenemos la biblioteca
    try {
        if (typeof QRCode !== 'undefined') {
            console.log("Generando código QR");
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer) {
                // Limpiar contenedor si ya hay un QR anterior
                qrContainer.innerHTML = '';
                
                // Crear nuevo QR
                new QRCode(qrContainer, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                // Mostrar contenedor
                const qrCodeContainer = document.getElementById('qrCodeContainer');
                if (qrCodeContainer) {
                    qrCodeContainer.style.display = 'block';
                }
                console.log("Código QR generado exitosamente");
            }
        } else {
            console.warn('La biblioteca QRCode no está disponible');
        }
    } catch (e) {
        console.error('Error al generar el código QR:', e);
    }
    
    // Mostrar pasos siguientes
    const step2 = document.getElementById('step2');
    if (step2) {
        step2.style.display = 'block';
    }
    
    const step3 = document.getElementById('step3');
    if (step3) {
        step3.style.display = 'block';
    }
    
    // Actualizar el botón
    const generateBtn = document.getElementById('generateKeyBtn');
    if (generateBtn) {
        generateBtn.textContent = 'Clave generada';
        generateBtn.classList.replace('btn-primary', 'btn-success');
    }
    
    showMessage("Clave generada exitosamente. Continúa con el paso 2.", "success");
}
// En la función verifyOTP de setup_2fa.js, asegúrate de que la clave secreta esté bien formateada

async function verifyOTP() {
    const otpCode = document.getElementById('otpCode').value.trim();
    
    if (!otpCode || otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
        showMessage("El código debe contener 6 dígitos", "danger");
        return;
    }
    
    if (!tempToken) {
        showMessage("Error de autenticación. Regístrate nuevamente.", "danger");
        setTimeout(() => PageManager.load('register'), 2000);
        return;
    }
    
    if (!secretKey) {
        showMessage("Primero debes generar una clave secreta", "danger");
        return;
    }
    
    try {
        showMessage("Verificando el código...", "info");
        
        const csrfToken = await getCsrfToken();
        console.log("CSRF Token obtenido:", csrfToken ? "Sí" : "No");
        
        // Asegúrate de que la clave secreta no tenga padding (=)
        // ya que lo añadiremos en el backend
        const cleanSecretKey = secretKey.replace(/=+$/, '');
        
        const requestData = {
            temp_token: tempToken,
            otp_code: otpCode,
            secret_key: cleanSecretKey
        };
        
        console.log("Enviando datos para verificación");
        
        const response = await fetch("https://localhost:8441/api/auth/verify-2fa-setup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            credentials: "include",
            body: JSON.stringify(requestData)
        });
        
        console.log("Código de estado HTTP:", response.status);
        
        // El resto de la función permanece igual
        
        // ...
    } catch (error) {
        console.error("Error en la verificación:", error);
        showMessage("Error en la comunicación con el servidor. Verifica tu conexión.", "danger");
    }
}

// Función para copiar al portapapeles
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            // Cambiar temporalmente el texto del botón
            const button = document.getElementById('copyBtn');
            const originalText = button.textContent;
            button.textContent = '¡Copiado!';
            setTimeout(() => { button.textContent = originalText; }, 2000);
        })
        .catch(err => {
            console.error('Error al copiar: ', err);
            // Método alternativo
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const button = document.getElementById('copyBtn');
            button.textContent = '¡Copiado!';
            setTimeout(() => { button.textContent = 'Copiar clave'; }, 2000);
        });
}

// Función para mostrar mensajes
function showMessage(message, type) {
    const element = document.getElementById('setup-message');
    if (element) {
        element.textContent = message;
        element.className = `alert alert-${type} mb-3`;
        element.style.display = "block";
        console.log(`[${type}] ${message}`);
    } else {
        console.error("Elemento 'setup-message' no encontrado");
    }
}

// Función para obtener el token CSRF
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
        console.error("🚨 No se pudo obtener el CSRF Token:", error);
        // Fallback: intentar obtener el token de las cookies
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith('csrftoken=')) {
                console.log("Token CSRF encontrado en cookies");
                return cookie.substring('csrftoken='.length, cookie.length);
            }
        }
        console.warn("No se encontró ningún token CSRF");
        return "";
    }
}