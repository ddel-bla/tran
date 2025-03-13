
async function registerUser() {
    const username = document.getElementById("newUsername").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!username || !email || !password || !confirmPassword) {
        alert("❌ Todos los campos son obligatorios.");
        PageManager.load("register", updateNavbar);
        return;
    }

    if (password !== confirmPassword) {
        alert("❌ Las contraseñas no coinciden.");
        PageManager.load("register", updateNavbar);
        return;
    }

    try {
        const csrfToken = await getCsrfToken();  

        const response = await fetch("https://localhost:8441/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken  
            },
            credentials: "include",  
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();

        if (response.ok) {
            // Si el registro fue exitoso, pero requiere configuración de 2FA
            if (data.requires_2fa_setup) {
                // Guardar token temporal para el proceso de configuración 2FA
                localStorage.setItem("temp_token", data.temp_token);
                
                // Redireccionar a la página de configuración 2FA
                PageManager.load("setup_2fa");
            } else {
                // Flujo antiguo (no debería ocurrir con 2FA obligatorio)
                localStorage.setItem("jwt", data.token);
                localStorage.setItem("username", data.username);
                if (!localStorage.getItem("image_url") || data.image_url !== "https://i.imgur.com/DP2aShH.png") {
                    localStorage.setItem("image_url", data.image_url);
                }

                PageManager.load("game", updateNavbar);
            }
        } else {
            alert("⚠️ Error: " + (data.error || "Error desconocido."));
        }
    } catch (error) {
        console.error("🚨 Error en la solicitud:", error);
    }
}

async function loginUser() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("❌ Email y contraseña son obligatorios.");
        return;
    }

    try {
        const csrfToken = await getCsrfToken();

        const response = await fetch("https://localhost:8441/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Si la primera fase de autenticación fue exitosa, pero requiere 2FA
            if (data.requires_2fa) {
                // Guardar token temporal para la verificación 2FA
                localStorage.setItem("temp_token", data.temp_token);
                
                // Redireccionar a la página de verificación OTP
                PageManager.load("verify_otp");
            } else {
                // Flujo antiguo (no debería ocurrir con 2FA obligatorio)
                localStorage.setItem("jwt_backend2", data.token);
                localStorage.setItem("username_backend2", data.username);
                localStorage.setItem("image_url_backend2", data.image_url || "https://i.imgur.com/DP2aShH.png");

                PageManager.load("game", updateNavbar);
            }
        } else {
            alert("⚠️ Error: " + (data.error || "Error desconocido." ));
        }
    } catch (error) {
        console.error("🚨 Error en la solicitud:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const signUpLink = document.getElementById("signUpLink");

    if (signUpLink) {
        signUpLink.addEventListener("click", function (event) {
            event.preventDefault(); // Evita la recarga de la página
            if (typeof PageManager !== "undefined" && PageManager.load) {
                PageManager.load("register");
            } else {
                console.error("❌ Error: PageManager no está definido o no tiene la función 'load'.");
            }
        });
    }
});


// claudia lo puedes usar para proteger las funciones como LoadPage
// que solo se puedan ejecutar si el usuario esta autenticado
async function getCsrfToken() {
    try {
        const response = await fetch("https://localhost:8441/api/auth/csrf/", {
            method: "GET",
            credentials: "include"  // 🔥 Permitir cookies cross-origin
        });

        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error("🚨 No se pudo obtener el CSRF Token:", error);
        return "";
    }
}

function togglePassword(passwordFieldId, toggleIconId) {
    const passwordField = document.getElementById(passwordFieldId);
    const toggleIcon = document.getElementById(toggleIconId);
    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleIcon.classList.add("fa-eye-slash");
        toggleIcon.classList.remove("fa-eye");
    } else {
        passwordField.type = "password";
        toggleIcon.classList.add("fa-eye");
        toggleIcon.classList.remove("fa-eye-slash");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const signUpLink = document.querySelector(".sign-up");
    const loginButton = document.getElementById("loginButton");

    if (signUpLink) {
        signUpLink.addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof PageManager !== "undefined" && PageManager.load) {
                PageManager.load("register");
            }
        });
    }

    if (loginButton) {
        loginButton.addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof PageManager !== "undefined" && PageManager.load) {
                PageManager.load("login");
            }
        });
    }
});
