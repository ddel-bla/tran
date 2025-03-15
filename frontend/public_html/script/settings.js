let translations = {};
const allowedSizes = [10, 15, 20];
const allowedSpeeds = [400, 450, 500, 550, 600];
const allowedColors = ["#B63A4B", "#5A9F6B", "#516A99", "#ECE570", "#9C77C1", "#fff2f2"];
const allowedBackgrounds = ["#161618", "#70b8b1", "#b2afb1", "#f4a6b1", "#74748d"];
const allowedModes = ["enabled", "disabled"];
const allowedLanguages = ["es", "en", "fr"]

// Gestion de sonidos
function toggleSound() {
    let soundIcon = document.getElementById("soundIcon");

    if (audioContext.state === "running") {
        audioContext.suspend();  // Pausa el sonido
        
        soundIcon.classList.replace("fa-bell", "fa-bell-slash");
        localStorage.setItem("sound", "muted");
    } else {
        audioContext.resume();   // Reanuda el sonido
        soundIcon.classList.replace("fa-bell-slash", "fa-bell");
        localStorage.setItem("sound", "unmuted");
    }
}

// Gestion de modos (claro/oscuro)
function toggleMode() {
    let modeIcon = document.getElementById("modeIcon");

    if (document.body.classList.contains("light-mode")) {
        document.body.classList.remove("light-mode");
        modeIcon.classList.replace("fa-moon", "fa-sun");
        localStorage.setItem("darkMode", "disabled");
        
        let canvasBorders = document.querySelectorAll('.canvas-border');
        canvasBorders.forEach(function(element) {
            element.classList.remove("light-mode");
        });

        let navbar = document.querySelectorAll('.navbar');
        navbar.forEach(function(element) {
            element.classList.remove("light-mode");
        });
    } else {
        document.body.classList.add("light-mode");
        modeIcon.classList.replace("fa-sun", "fa-moon");
        localStorage.setItem("darkMode", "enabled");

        let canvasBorders = document.querySelectorAll('.canvas-border');
        canvasBorders.forEach(function(element) {
            element.classList.add("light-mode");
        });
        let navbar = document.querySelectorAll('.navbar');
        navbar.forEach(function(element) {
            element.classList.add("light-mode");
        });
    }
}

// Gestion de modos (claro/oscuro)
function changeBackground(value, button) {
    const buttons = document.querySelectorAll('.background-option');
    
    buttons.forEach(button => {
        button.classList.remove('selected');
    });

    if (button)
        button.classList.add('selected');

    if (value) {
        canvas.style.backgroundColor = value;
        localStorage.setItem("backgroundColor", value); //Guardar en localStorage
    }
}

/* Traducciones (en/es/fr) */

// Cargas traducciones
async function loadTranslations() {
    try {
        const response = await fetch('script/translations.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        translations = await response.json();

        if (!translations) {
            throw new Error("Las traducciones no se han cargado correctamente.");
        }

        const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';

        if (translations[savedLanguage]) {
            changeLanguage(savedLanguage);
            localStorage.setItem("preferredLanguage", savedLanguage)
        }
    } catch (error) {
    }
}

// Traducir cada clave de la página
function changeLanguage(language) {
    document.documentElement.lang = language; 
    const translation = translations[language];

    if (!translation) {
        return;
    }

    document.querySelectorAll('[data-key]').forEach(function(element) {
        const key = element.getAttribute('data-key');
        if (translation[key]) {
            if (element.tagName === "INPUT") {
                // Si es un input, cambiar el placeholder
                element.placeholder = translation[key];
            } else {
                // Para otros elementos, cambiar el texto
                element.textContent = translation[key];
            }       
        }
    });
}

// Cambiar idioma cuando se selecciona uno
function setLanguage(language) {
    localStorage.setItem('preferredLanguage', language);
    changeLanguage(language);
}

// Formatear campos con variables
function formatTranslation(key, placeholders) {
    let translation = translations[document.documentElement.lang]?.[key];
    if (!translation) return key;

    for (const [placeholder, value] of Object.entries(placeholders)) {
        if (document.documentElement.lang == "en" && key == "usersTeam")
            translation = translation.replace(`{${placeholder}}`, formatPossessive(value));
        else
            translation = translation.replace(`{${placeholder}}`, value);
    }

    return translation;
}

/* CARGAR SETTINGS (tamaño, velocidad, color, fondo ...) */

// Actualizar páginas con los ajustes seleccionados
function applySettings() {

    // 1. Tamaño bola
    const savedSize = Number(localStorage.getItem("ballSize"));
    if (allowedSizes.includes(savedSize)) {
        updateBallSize(savedSize);
    } else {
        localStorage.setItem("ballSize", 10);
    }

    // 2. Velocidad bola
    const savedSpeed = localStorage.getItem("ballSpeed");
    if (allowedSpeeds.includes(savedSpeed)) {
        updateBallSpeed(savedSpeed)
    } else {
        localStorage.setItem("ballSpeed", 500)
    }

    // 3. Color bola
    const savedColor = localStorage.getItem("ballColor");
    if (allowedColors.includes(savedColor)) {
        updateBallColor(savedColor)
    } else {
        localStorage.setItem("ballColor", "#fff2f2")
    }

    // 4. Color fondo
    const savedBackground = localStorage.getItem("backgroundColor")
    if (allowedBackgrounds.includes(savedBackground)) {
        canvas.style.backgroundColor = savedBackground;
    } else {
        localStorage.setItem("backgroundColor", "#161618")
    }

    // 5. Modo (oscuro/claro)
    const savedMode = localStorage.getItem("darkMode");
    if (allowedModes.includes(savedMode)) {
        updateMode(savedMode)
    } else {
        localStorage.setItem("darkMode", "enable")
    }

    // 6. Sonido
    if (localStorage.getItem("sound") === "muted") {
        audioContext.suspend();  // Silencia el sonido
    } else {
        audioContext.resume();   // Activa el sonido
    }

    // 7. Idioma
    loadTranslations();
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (allowedLanguages.includes(savedLanguage)) {
        document.querySelector(`.login-language-select`).value = savedLanguage;
        changeLanguage(savedLanguage);
    }
}