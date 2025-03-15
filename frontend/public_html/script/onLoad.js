
document.addEventListener("DOMContentLoaded", function () {
    applySettings();
        const jwtToken = getJwtToken();
        const jwtTemp = localStorage.getItem("temp_token");

        console.warn("⚠️ DOMContentLoaded");
        console.warn("jwtToken", jwtToken);
        console.warn("temp_token", jwtTemp); // Corregido aquí

        if (jwtTemp) {
            if (!jwtToken) {
                console.warn("Redirecting to 2FA verification");
                PageManager.load("setup_2fa");
            } else {
                console.warn("Redirecting to game");
                PageManager.load("game");
            }
        } else {
            console.warn("Redirecting to login");
            PageManager.load("login");
        }

        applySettings();
        updateNavbar();

        window.addEventListener("resize", mobileGame);
        window.addEventListener("resize", mobileTournament);
    });

window.onpopstate = function (event) {
    if (event.state && event.state.page) {
        PageManager.load(event.state.page, null, false);
    }
};

// Hacer resize sobre pantalla Juego
function mobileGame() {
    const button = document.getElementById("startButton")
    if (window.innerWidth <= 768){

        // Activamos botón START
        if (button){
            button.disabled = false;
            // Mostramos formularios
            generatePlayerForms(2, false, false, truncateName(getUsername())); 
        }

        // 2 jugadores
        if (playersToPlay != 2) {
            playersToPlay = 2;
            drawGameBoard();
        }
    }
    else {
        if (button) {
            button.disabled = true;
        }
        let playersButtons = document.querySelectorAll('.players-btn-group');
        if (playersButtons) {
            playersButtons.forEach(button => button.classList.remove('button-selected'));
            if (playersButtons[0])
                playersButtons[0].classList.add('button-selected');
        }
    }
}

// Hacer resize sobre pantalla Torneo
function mobileTournament() {
    const teamsButton = document.querySelectorAll(".tour-players-btn-group")
    if (window.innerWidth <= 768){
        if (teamsButton)
            teamsButton.forEach(button => button.disabled = false)

    } else {
        if (teamsButton)
            teamsButton.forEach(button => button.disabled = true)
    }
}

window.onload = function () {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const authMethod = params.get("auth");
    const username = params.get("username");
    const imageUrl = params.get("image_url");

    if (token) {
        if (authMethod === "42") {
            localStorage.setItem("jwt_backend", token);
            localStorage.setItem("auth_method_backend", authMethod);
            if (username) {
                localStorage.setItem("username_backend", username);
            }
            if (imageUrl) {
                localStorage.setItem("image_url_backend", imageUrl);
            }
        } else {
            localStorage.setItem("jwt_backend2", token);
            localStorage.setItem("auth_method_backend2", authMethod);
            if (username) {
                localStorage.setItem("username_backend2", username);
            }
            if (!localStorage.getItem("image_url_backend2")) {
                localStorage.setItem("image_url_backend2", "https://i.imgur.com/DP2aShH.png");
            }
        }
        window.history.replaceState({}, document.title, "/");
    }
    const lastPage = window.location.hash.substring(1);
    const jwt_backend = localStorage.getItem("jwt_backend");
    const jwt_backend2 = localStorage.getItem("jwt_backend2");

    if (lastPage && ["game", "tournament", "info", "settings"].includes(lastPage)) {
        PageManager.load(lastPage, null, false);
    } else if (jwt_backend || jwt_backend2) {
        updateNavbar();
        PageManager.load("game");
    } else {
        resetNavbar();
        PageManager.load("login");
    }
    applySettings();
};

function updateNavbar() {
    const authContainer = document.getElementById("auth-container");
    const navbarLinks = document.querySelectorAll(".navbar-nav .nav-item");
    const homeButton = document.getElementById("homeButton");

    const jwt_backend = localStorage.getItem("jwt_backend");
    const jwt_backend2 = localStorage.getItem("jwt_backend2");

    if (jwt_backend || jwt_backend2) {
        const username = jwt_backend 
            ? localStorage.getItem("username_backend") 
            : localStorage.getItem("username_backend2");

        let imageUrl;
        if (jwt_backend) {
            imageUrl = localStorage.getItem("image_url_backend");
        } else if (jwt_backend2) {
            imageUrl = localStorage.getItem("image_url_backend2") || "https://i.imgur.com/DP2aShH.png";
        }

        authContainer.innerHTML = `
            <div class="user-info">
                <img src="${imageUrl}" alt="Profile" class="profile-pic">
                <span class="username">${username}</span>
                <button class="btn logout-button" onclick="logout()">Logout</button>
            </div>
        `;
        document.querySelector(".navbar-nav").style.display = "flex";
        navbarLinks.forEach(link => {
            link.style.display = "block";
            link.style.visibility = "visible";
        });

        const lang = document.getElementById("loginLanguage")
        
        if (lang) {
            hideElement(lang)
        }
        homeButton.setAttribute("onclick", "PageManager.load('game')");
    } else {
        resetNavbar();
    }
}

function resetNavbar() {
    const authContainer = document.getElementById("auth-container");
    const navbarLinks = document.querySelectorAll(".navbar-nav .nav-item");
    const homeButton = document.getElementById("homeButton");

    if (!authContainer) return;

    authContainer.innerHTML = `
        <button class="btn login-button" onclick="PageManager.load('login')" data-key="login">Login</button>
        <button class="btn signup-button" onclick="PageManager.load('register')" data-key="signup_button">Sign Up</button>
    `;

    navbarLinks.forEach(link => {
        link.style.display = "none";
    });

    homeButton.setAttribute("onclick", "PageManager.load('login')");
}

function getJwtToken() {
    if(localStorage.getItem("jwt_backend") && !localStorage.getItem("jwt_backend2")) {
        return localStorage.getItem("jwt_backend");
    }
    else if(localStorage.getItem("jwt_backend2") && !localStorage.getItem("jwt_backend")) {
        return localStorage.getItem("jwt_backend2");
    }
}

let isLoggingOut = false;

async function verifyToken() {
    if (isLoggingOut) return;

    const jwtBackend42 = localStorage.getItem("jwt_backend");
    const jwtBackendGoogle = localStorage.getItem("jwt_backend2");

    if (!jwtBackend42 && !jwtBackendGoogle) {;
        logout();
        return;
    }

    try {
        let response;
        let localToken;
        let backendUrl;

        if (jwtBackend42 && !jwtBackendGoogle) {
            localToken = jwtBackend42;
            backendUrl = "https://localhost:8442/api/auth/get_user_token";
        } 
        else if (jwtBackendGoogle && !jwtBackend42) {
            localToken = jwtBackendGoogle;
            backendUrl = "https://localhost:8441/api/auth/get_user_token";
        } 
        else {
            logout();
            return;
        }
        response = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localToken}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
            }
            return;
        }

        const data = await response.json();

        if (data.token !== localToken) {
            logout();
        }
    } catch (error) {
        logout();
    }
}


document.addEventListener("DOMContentLoaded", () => {
    resetNavbar();
    verifyToken();
});

window.addEventListener("storage", (event) => {
    if ((event.key === "jwt_backend" && localStorage.getItem("jwt_backend")) ||
        (event.key === "jwt_backend2" && localStorage.getItem("jwt_backend2"))) {
        verifyToken();
    }
});

async function logout() {
    if (isLoggingOut) return;
    isLoggingOut = true;

    const jwtBackend42 = localStorage.getItem("jwt_backend");
    const jwtBackendGoogle = localStorage.getItem("jwt_backend2");

    let backendUrl = null;
    let tokenToRevoke = null;

    if (jwtBackend42 && !jwtBackendGoogle) {
        backendUrl = "https://localhost:8442/api/auth/logout";
        tokenToRevoke = jwtBackend42;
    } else if (jwtBackendGoogle && !jwtBackend42) {
        backendUrl = "https://localhost:8441/api/auth/logout";
        tokenToRevoke = jwtBackendGoogle;
    }

    if (backendUrl) {
        try {
            await fetch(backendUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${tokenToRevoke}`,
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
        } catch (error) {
        }
    }

    localStorage.clear();
    sessionStorage.clear();
    pageHistory = [];

    resetNavbar();
    PageManager.load("login");

    setTimeout(() => {
        isLoggingOut = false;
    }, 100);
}