// Activar o descativar boosts
function enableBoost(mode) {

    document.getElementById("spellToggle").addEventListener("change", function() {
        if (this.checked) {
            boostEnable = true;
        } else {
            boostEnable = false;
        }
    });
    reloadGame(mode);
}


// Selección número de jugadores
function selectPlayers(players) {
    let playersButtons = document.querySelectorAll('.players-btn-group');
    playersButtons.forEach(button => button.classList.remove('button-selected'));

    let selectedButton;
    if (players === 2) {
        selectedButton = playersButtons[1]; // Selecciona el botón de 2 jugador
    } else if (players === 4) {
        selectedButton = playersButtons[2]; // Selecciona el botón de 4 jugadores
    } else {
        selectedButton = playersButtons[0]; // Selecciona el botón de 1 jugador
        players = 1;
    }
    
    selectedButton.classList.add('button-selected');

    playersToPlay = players;
    
    const startButton = document.getElementById('startButton');
    if (playersToPlay && startButton) {
        startButton.disabled = false;
        generatePlayerForms(playersToPlay, false, false, truncateName(getUsername()));
    }
    else {
        startButton.disabled = true;
    }
    
    // Dibujamos el tablero acorde
    drawGameBoard();
}

// Selección número de puntos de partida
function selectPoints(points) {
    let pointsButtons = document.querySelectorAll('.points-btn-group');
    pointsButtons.forEach(button => button.classList.remove('button-selected'));

    
    let selectedButton;
    if (points === 5) {
        selectedButton = pointsButtons[0];
    } else if (points === 10) {
        selectedButton = pointsButtons[1];
    } else if (points === 15) {
        selectedButton = pointsButtons[2];
    }
    
    selectedButton.classList.add('button-selected');

    pointsToWin = points;
}

// Inicio juego (pantalla home)
async function startGame() {
    
    // 1. Obtenemos datos de registro
    registerData = getFormData("playerForm", "game-registration-error")
    if (!registerData) {
        return; // Datos inválidos
    }

    // 2. Deshabilitamos botones seleccion
    disableSelectionButtons();

    // 3. Quitar registro jugadores
    hideElement(document.getElementById("gameRegister"));

    // 4. Actualizar info del jugador (nombre/boost)
    displayPlayerInfo(registerData);

    // 5. Modo movil 2 jugadores por defecto siempre
    if (window.innerWidth <= 768)
        playersToPlay = 2;
    
    if (playersToPlay != null && pointsToWin)
    {
        // 6. Comienza el juego
        started = true;
        playSound('resume');
        debugMessage.textContent = translations[document.documentElement.lang]?.["pressSpaceBar"];;
        
        // 7. Bucle juego
        await runGame();

        toggleBoostButtons(true);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos antes del siguiente partido
        
        // 8. Recargamos juego
        reloadGame("game");
        
    } else {
        const error_element = document.getElementById('game-error');
        showElement(error_element)
        error_element.textContent = translations[document.documentElement.lang]?.["noPlayers"];;
    }
}

// Función de recarga (pantalla home)
function reloadingGamePage() {

    /* Mobile mode */
    if (window.innerWidth <= 768) {

        // Enable button (no selection)
        const startButton = document.getElementById("startButton");
        startButton.disabled = false;
        
        // Remove registration process (selection mode enabled)
        generatePlayerForms(2, false, false, truncateName(getUsername()));
    }

    /* PC mode */
    else {
        // Remove registration process (selection mode enabled)
        const popupContainer = document.getElementById("gameRegister");
        popupContainer.innerHTML = "";

        // Remove selected Players (select players available)
        let playersButtons = document.querySelectorAll('.players-btn-group');
        playersButtons.forEach(button => button.classList.remove('button-selected'));

        // Enable selection buttons (no)
        playersButtons.forEach(button => button.disabled = false);

        // Disable start button
        const startButton = document.getElementById("startButton");
        startButton.disabled = true;
    }

    /*  Common */
    // Remove error msg
    const error_msg = document.getElementById("game-registration-error");
    hideElement(error_msg);

    // Hide player info
    const gameBoosts = document.getElementById("gameBoosts");
    gameBoosts.style.display = "none";

    // Update score position
    const score = document.getElementById("score");
    score.style.top = "10px";

    // Enable score selection
    let pointsButtons = document.querySelectorAll('.points-btn-group');
    pointsButtons.forEach(button => button.disabled = false);

    // Enable boost button
    let spellToggle = document.getElementById("spellToggle");
    spellToggle.disabled = false;
}

// Generación formularios de jugadores
function generatePlayerForms(num_players, isTournament, isTeamGame, loggedInPlayerName) {
    const popupContainer = document.getElementById("gameRegister");
    
    // 1. Mostramos formulario
    showElement(popupContainer);
    popupContainer.style.display = "flex";
    popupContainer.innerHTML = ""; // Limpiar contenido previo

    // 2. Establecemos número de jugadores (indv/equipo)
    let teamNumber = num_players == 2 ? 2 : 2;
    let titleKey = num_players == 4 ? "team" : "player";

    // 3. Si es torneo actualizamos jugadores
    if (isTournament) {
        teamNumber = num_players;
        titleKey = isTeamGame ? "team" : "player";    
    }

    // 4. Obtenemos traducciones de campos del formulario
    if (titleKey == "team")
        loggedInPlayerName = formatTranslation("usersTeam", {username : loggedInPlayerName})
    let { titleText, username_label, username_placeholder, boost_label, speed_label, power_label, defense_label } = loadPlayerFormTranslations(titleKey);

    // 5. Generamos formulario por jugador/equipo
    for (let i = 1; i <= teamNumber; i++) {
        const playerForm = document.createElement("div");
        playerForm.classList.add("game-register-content");
        
        // Si es el primer jugador (el que hizo login), deshabilitar el input y mostrar su nombre
        let usernameInputHtml = '';
        if (i === 1 && loggedInPlayerName) {
            usernameInputHtml = `
                <input type="text" class="form-control" id="usernameInput${i}" name="usernameInput${i}" value="${loggedInPlayerName}" placeholder="${username_placeholder}" disabled required>
            `;
		} else if (num_players === 1 && i === 2) {
			// Si es modo 1 jugador, el segundo jugador es "Pong Bot" (no modificable)
			usernameInputHtml = `
				<input type="text" class="form-control" id="usernameInput${i}" name="usernameInput${i}" value="Pong Bot" disabled required>
			`;
		} else {
            usernameInputHtml = `
                <input type="text" class="form-control" id="usernameInput${i}" name="usernameInput${i}" placeholder="${username_placeholder}" required>
            `;
        }

        if (boostEnable) {
            playerForm.innerHTML = `
                <h3 id="modalTitle">${titleText} ${i}</h3>
                <div class="game-register-content-input">
                    <label for="usernameInput${i}" class="game-register-content-label">${username_label}</label>
                    ${usernameInputHtml}
                </div>
                <div class="game-register-content-input">
                    <label class="game-register-content-label">${boost_label}</label>
                    <div class="boost-options">
                        <div class="boost-option game-option-selected" data-boost="speed" title="${speed_label}" onclick="selectBoost('speed', ${i})">
                            <img src="images/speed.png" alt="Speed Boost">
                        </div>
                        <div class="boost-option" data-boost="power" title="${power_label}" onclick="selectBoost('power', ${i})">
                            <img src="images/power.png" alt="Power Boost">
                        </div>
                        <div class="boost-option" data-boost="defense" title="${defense_label}" onclick="selectBoost('defense', ${i})">
                            <img src="images/shield.png" alt="Defense Boost">
                        </div>
                    </div>
                </div>
            `;
        } else {
            playerForm.innerHTML = `
                <h3 id="modalTitle">${titleText} ${i}</h3>
                <div class="game-register-content-input">
                    <label for="usernameInput${i}" class="game-register-content-label">${username_label}</label>
                    ${usernameInputHtml}
                </div>  
            `;
        }
        popupContainer.appendChild(playerForm);
    }
}

// Obtener información formulario registro
function getFormData(form_id, error_id) {
    let playersData = [];

    // 1. Obtener formulario
    const form = document.getElementById(form_id);
    const error_element = document.getElementById(error_id);

    // 2. Limpiar campo error de ejecuciones previas
    hideElement(error_element);
    
    // 2. Comprobamos que los campos cumplen las restricciones
    if (!form.checkValidity()) {
        form.reportValidity();
        error_element.innerHTML = translations[document.documentElement.lang]?.["missingFields"];
        showElement(error_element);
        return null;
    }

    const playerForms = document.querySelectorAll(".game-register-content");

    // 3. Extraemos y validamos información
    let usernamesSet = new Set();
    let validBoosts = new Set(["speed", "power", "defense"]);
    let isValid = true;
    let errorMsg;

    // 4. Validamos cada jugador
    playerForms.forEach((form, index) => {
        const usernameInput = document.getElementById(`usernameInput${index + 1}`);
        const selectedBoost = form.querySelector(".boost-option.game-option-selected");
        
        let username = usernameInput.value.trim();
        let boost = selectedBoost ? selectedBoost.getAttribute("data-boost") : "speed";

        // Nombre de usuario único
        if (usernamesSet.has(username)) {
            errorMsg = formatTranslation("usernameDuplicated", {username: username})
            isValid = false;
        } else if (username.length > 8 && index != 0)  {
            errorMsg = translations[document.documentElement.lang]?.["usernameTooLong"];
            isValid = false;
        } else {
            usernamesSet.add(username);
        }

        // Boost válido
        if (!validBoosts.has(boost)) {
            error_element.innerHTML = translations[document.documentElement.lang]?.["missingFields"];
            errorMsg =  formatTranslation("invalidBoost", { boost: boost });
            isValid = false;
        }

        playersData.push({ username, boost });
    });

    // 5. Comprobamos validez
    if (!isValid)
    {
        error_element.innerHTML = errorMsg
        showElement(error_element);
        return null;
    }

    return playersData;
}

// Mostrar hechizos de jugador
function displayPlayerInfo(playersData) {
    
    // 1. Establecemos nombres globales de jugadores
    player1 = playersData[0].username;
    player2 = playersData[1].username;

    // 2. Boost no estan activados
    if (!boostEnable) {
        debugMessage.style.top = "56%";
        return;
    }

    const gameBoosts = document.getElementById("gameBoosts");
    const boostImages = {
        speed: "images/speed.png",
        power: "images/power.png",
        defense: "images/shield.png"
    };

    // 3. Mostramos los boost que corresponden por jugador
    playersData.forEach((player, index) => {
        let playerContainer = gameBoosts.children[index];
        if (playerContainer) {
            let nameElement = playerContainer.querySelector("p, span");
            let button = playerContainer.querySelector("button");

            if (nameElement) {
                nameElement.textContent = truncateName(player.username);
                nameElement.title = player.username;
            }
            
            const boostKey = index === 0 ? "E" : ">";           
            if (button) {
                button.title = translations[document.documentElement.lang]?.[player.boost]
                button.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <img src="${boostImages[player.boost]}" alt="${player.boost}" width="30">
                        <span style="
                            font-family: 'retro';
                            color: #161618; 
                            text-transform: uppercase;">
                            ${boostKey}
                        </span>
                    </div>
                `;
                
                // Asegurar que no haya eventos previos duplicados
                button.replaceWith(button.cloneNode(true));
                button = playerContainer.querySelector("button");

                // Asignar la función del boost correspondiente
                button.addEventListener("click", () => activateBoost(player.boost, player.username, index, button));

                // Deshabilitar
                button.disabled = true;
            }
        }
    });

    // 3. Actualizamos css de componentes
    gameBoosts.style.display = "flex";
    gameBoosts.style.visibility = "visible";
    const score = document.getElementById("score");
    score.style.top = "105px";
}

// Selección del boost
function selectBoost(boostType, playerId) {
    const playerBoosts = document.querySelectorAll(`.game-register-content:nth-child(${playerId}) .boost-option`);

    playerBoosts.forEach(boost => boost.classList.remove('game-option-selected'));

    playerBoosts.forEach(boost => {
        if (boost.dataset.boost === boostType) {            
            boost.classList.add('game-option-selected');
        }
    });
}

// Deshabilitar botones inicio juego
function disableSelectionButtons()
{
    let playerButtons = document.querySelectorAll('.players-btn-group');
    let pointsButtons = document.querySelectorAll('.points-btn-group');
    const startButton = document.getElementById('startButton');
    let spellToggle = document.getElementById("spellToggle");
    
    playerButtons.forEach(button => button.disabled = true);
    pointsButtons.forEach(button => button.disabled = true);
    startButton.disabled = true;
    spellToggle.disabled = true;
}

// Traducción de campos de formulario
function loadPlayerFormTranslations(titleKey) {
    return {
        titleText: translations[document.documentElement.lang]?.[titleKey] || titleKey,
        username_label: translations[document.documentElement.lang]?.["username_label"],
        username_placeholder: translations[document.documentElement.lang]?.["username_placeholder"],
        boost_label: translations[document.documentElement.lang]?.["chooseBoost"],
        speed_label:  translations[document.documentElement.lang]?.["speed"],
        power_label:  translations[document.documentElement.lang]?.["power"],
        defense_label:  translations[document.documentElement.lang]?.["defense"]
    };
}
