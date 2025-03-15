const PageManager = (() => {
    let currentPage = null;
    let pageHistory = [];

    const PUBLIC_PAGES = ["login", "register", "verify_otp", "setup_2fa"];

    async function loadPage(page, callback, addToHistory = true) {
        const jwt_backend = localStorage.getItem("jwt_backend");
        const jwt_backend2 = localStorage.getItem("jwt_backend2");
        const temp_token = localStorage.getItem("temp_token");
    
        if (!jwt_backend && !jwt_backend2 && !temp_token && !PUBLIC_PAGES.includes(page)) {
			return PageManager.load("login");
}   
        if (page === currentPage) {
            return;
        }
    
        try {
            const response = await fetch(`pages/${page}.html`);
    
            const html = await response.text();
            document.getElementById("content-container").innerHTML = html;
            currentPage = page;
    
            if (addToHistory) {
                window.history.pushState({ page }, "", window.location.pathname);
                if (!PUBLIC_PAGES.includes(page)) {
                    pageHistory.push(page);
                }
            }

            if (page == "game")
                loadGame();
            else if (page == "tournament")
                loadTournament();
            else if (page == "register")
            {
                let register = document.getElementById("registerForm");
                if (register) {
                    register.addEventListener("submit", function(event) {
                        event.preventDefault();
                    });
                } 
            }

            toggleGameVisibility(page === "game" || page === "tournament");
    
            changeLanguage(localStorage.getItem("preferredLanguage"));
    
            if (callback) callback();
        } catch (error) {
        }
    }

    function goBack() {
        if (pageHistory.length > 1) {
            pageHistory.pop();
            const lastPage = pageHistory[pageHistory.length - 1];
            PageManager.load(lastPage, null, false);
        }
    }

    function toggleGameVisibility(show) {
        const gameElement = document.getElementById("game");
        if (gameElement) {
            gameElement.style.display = show ? "block" : "none";
        }
    }

    return {
        load: loadPage,
        goBack
    };
})();




/* LOADING GAME */
function loadGame() {

    // Title reload button 
    document.getElementById("RELOAD").title = translations[document.documentElement.lang]?.["reload"] || "Reload";
        
    // Disable default start button option 
    document.getElementById("playerForm").addEventListener("submit", function(event) {
        event.preventDefault();
    });
    document.getElementById("RELOAD").addEventListener("submit", function(event) {
        event.preventDefault();
    });

    //Reload game 
    reloadGame("game");
}

/* LOADING TOURNAMENT */
function loadTournament() {
    // Title reload button
    document.getElementById("RELOAD2").title = translations[document.documentElement.lang]?.["reload"] || "Reload";

    // Disable startButton
    const startButton = document.getElementById('tournamentButton'); 
    startButton.disabled = true;

    const playersButtons = document.querySelectorAll('.tour-players-btn-group')
    playersButtons.forEach(button => button.disabled = false);

    // Disable default start button option
    document.getElementById("tournamentButton").addEventListener("submit", function(event) {
        event.preventDefault();
    });
    document.getElementById("tournamentForm").addEventListener("submit", function(event) {
        event.preventDefault();
    });    

    //Reload game
    reloadGame("tournament");
}

/* LOADING SETTINGS */
function loadSettings() {
    PageManager.load("settings", () => {
        // Cargar configuraciones guardadas en el localStorage
        
        // size
        const sizeRange = document.getElementById("sizeRange");
        const savedSize = localStorage.getItem("ballSize");

        if (sizeRange && savedSize) {
            sizeRange.value = savedSize;
        }
        
        // speed
        const speedRange = document.getElementById("ballRange");
        const savedSpeed = localStorage.getItem("ballSpeed");

        if (savedSpeed && savedSpeed) {
            speedRange.value = savedSpeed;
        }

        // color
        const colorButtons = document.querySelectorAll('.color-option');
        colorButtons.forEach(button => button.classList.remove('selected'));

        const selectedColorButton = Array.from(colorButtons).find(button => button.style.backgroundColor === ballColor  || button.style.backgroundColor === hexToRgb(ballColor));
        if (selectedColorButton) {
            selectedColorButton.classList.add('selected');
        }

        // background
        const backgroundButtons = document.querySelectorAll('.background-option');
        const savedBackground = localStorage.getItem("backgroundColor");
        backgroundButtons.forEach(button => button.classList.remove('selected'));
        
        const selectedButton = document.querySelector(`.background-option[data-color="${savedBackground}"]`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }

        // Cargar estado del sonido
        let soundIcon = document.getElementById("soundIcon");
        if (soundIcon){
            if (localStorage.getItem("sound") === "muted") {
                soundIcon.classList.replace("fa-bell", "fa-bell-slash");
                audioContext.suspend();  // Silencia el sonido
            } else {
                soundIcon.classList.replace("fa-bell-slash", "fa-bell");
                audioContext.resume();   // Activa el sonido
            }
        }

        if (modeIcon && localStorage.getItem("darkMode") === "enabled") {
            document.body.classList.add("dark-mode");
            modeIcon.classList.replace("fa-sun", "fa-moon");
        }
        
        // Lenguaje 
        const savedLanguage = localStorage.getItem('preferredLanguage');
        
        if (savedLanguage) {
            document.querySelector(`.language-select`).value = savedLanguage;
            changeLanguage(savedLanguage);
        }
    });
}