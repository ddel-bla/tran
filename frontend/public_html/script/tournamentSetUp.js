let isTeamPlay = false;

function getUsername() {
    const jwt_backend = localStorage.getItem("jwt_backend");
    const jwt_backend2 = localStorage.getItem("jwt_backend2");

    if (jwt_backend || jwt_backend2) {
        const username = jwt_backend 
            ? localStorage.getItem("username_backend") 
            : localStorage.getItem("username_backend2");
        return username
    }

    return "User";
}
// Seleccionar numero de jugadores por equipo
function selectTeamPlayers(teamPlayers) {

    let teamPlayersButtons = document.querySelectorAll('.team-players-btn-group');
    teamPlayersButtons.forEach(button => button.classList.remove('button-selected'));

    let selectedButton;
    if (teamPlayers === 1){
        isTeamPlay = false;
        playersToPlay = 2;
        selectedButton = teamPlayersButtons[0]; // Selecciona el boton de 1 jugador por equipo
    } else if (teamPlayers === 2) {
        isTeamPlay = true;
        playersToPlay = 4;
        selectedButton = teamPlayersButtons[1]; // Selecciona el boton de 2 jugador por equipo
    } else {
        playersToPlay = 2;
        isTeamPlay = false;
        selectedButton = teamPlayersButtons[0]; // Selecciona el boton de 1 jugador por equipo
    }

    // Seleccionamos el boton pulsado
    selectedButton.classList.add('button-selected');

    // Desactivar disable para jugadores
    const pointsButtons = document.querySelectorAll('.tour-players-btn-group')
    pointsButtons.forEach(button => button.disabled = false);
    
    // Dibujamos el mapa actualizado
    drawGameBoard();
    if (numplayers) {
        generatePlayerForms(numplayers, true, isTeamPlay, truncateName(getUsername()));
    }
}

// Seleccionar número de equipos/personas
function selectTournamentPlayers(players) {
    let playersButtons = document.querySelectorAll('.tour-players-btn-group');
    playersButtons.forEach(button => button.classList.remove('button-selected'));

    let selectedButton;
    if (players === 2){
        selectedButton = playersButtons[0]; // Selecciona el boton de 1 jugador por equipo
    } else if (players === 4) {
        selectedButton = playersButtons[1]; // Selecciona el boton de 2 jugador por equipo
    } else if (players === 8) {
        selectedButton = playersButtons[2]; // Selecciona el boton de 3 jugador por equipo
    } else {
        players = 2;
        selectedButton = playersButtons[0]; // Selecciona el boton de 1 jugador por equipo
    }
    
    numplayers = players; // variable local global
    selectedButton.classList.add('button-selected');
    const startButton = document.getElementById('tournamentButton');
    
    if (numplayers && startButton) {
        startButton.disabled = false;
        // Generate form
        
        generatePlayerForms(players, true, isTeamPlay, truncateName(getUsername()));
    }
    else {
        startButton.disabled = true;
    }
}

// Seleccionar puntos torneo
function selectTournamentPoints(points) {
    let teamPlayersButtons = document.querySelectorAll('.tour-points-btn-group')
    teamPlayersButtons.forEach(button => button.classList.remove('button-selected'));

    let selectedButton;
    if (points === 5){
        selectedButton = teamPlayersButtons[0]; // Selecciona el boton de 1 jugador por equipo
    } else if (points === 10) {
        selectedButton = teamPlayersButtons[1]; // Selecciona el boton de 2 jugador por equipo
    } else if (points === 15) {
        selectedButton = teamPlayersButtons[2]; // Selecciona el boton de 3 jugador por equipo
    } 
    else {
        points = 10;
        selectedButton = teamPlayersButtons[0]; // Selecciona el boton de 1 jugador por equipo
    }

    pointsToWin = points;
    selectedButton.classList.add('button-selected');
}

// Empezar torneos
function startTournament() {
    //1. Obtener y validar información del torneo
    let tournamentData = getFormData("tournamentForm", "game-tournament-error")
    if (!tournamentData) {
        return; // Datos inválidos
    }
    
    // 2. Desahbilitar botones
    disableTournamentSelectionButtons();

    // 4. Ocultar registro
    hideElement(document.getElementById("gameRegister"));

    // 3. Generar peleas
    fights = generateFights(tournamentData);
    
    // 4. Mostramos peleas
    updateGraph(numplayers, fights.fights);

    // 5. Tournament loop
    startFights(fights['fights']);
}

// Recargar torneo
function reloadingGameTournament() {
    // Disable button (selection needed)
    const button = document.getElementById("tournamentButton");
    button.disabled = true;

    /* Mobile mode */
    if (window.innerWidth <= 768) {
        
        // Enable player selection
        let teamPlayersButtons = document.querySelectorAll('.tour-players-btn-group');
        teamPlayersButtons.forEach(button => button.disabled = false);
    }

    /* PC mode */
    else {
        // Remove selected plauers (mode 1, 2 per team)
        let playersButtons = document.querySelectorAll('.team-players-btn-group');
        playersButtons.forEach(button => button.classList.remove('button-selected'));

        // Enable selection buttons
        let playerButtons = document.querySelectorAll('.team-players-btn-group');
        let teamPlayersButtons = document.querySelectorAll('.tour-players-btn-group');
        
        playerButtons.forEach(button => button.disabled = false);
        teamPlayersButtons.forEach(button => button.disabled = true);
    }
    
    /*  Common */

    // Remove registration process
    const popupContainer = document.getElementById("gameRegister");
    popupContainer.innerHTML = "";

    // Remove error msg
    const error_msg = document.getElementById("game-tournament-error");
    if (error_msg)
        hideElement(error_msg);
    
    // Remove selected players
    let totalPlayersButtons = document.querySelectorAll('.tour-players-btn-group');
    totalPlayersButtons.forEach(button => button.classList.remove('button-selected'));

    // Hide graph
    const tournamentGraph = document.getElementById("tournamentGraph")
    tournamentGraph.style.display = "none";

    // Hide player info
    const gameBoosts = document.getElementById("gameBoosts");
    gameBoosts.style.display = "none";

    // Update score position
    const score = document.getElementById("score");
    score.style.top = "10px";
    
    // Seleccion de puntos habilitar
    let pointsButtons = document.querySelectorAll('.tour-points-btn-group');
    pointsButtons.forEach(button => button.disabled = false);

    // Reset num playeers
    numplayers = null

    // Remove winner
    let winner = document.getElementById(`round-3-1`);
    winner.innerHTML = "";
    winner.classList.remove('ready');
    let winner2 = document.getElementById(`round-3-2`);
    winner2.innerHTML = "";
    winner2.classList.remove('ready');
}

// Lógica de enfrentamientos
async function startFights(matches) {
    let winners = [];

    while (matches.length >= 1) {
        winners = [];

        // Usamos for...of para poder await cada partida
        for (const match of matches) {
            highlightMatch(match.player1, match.player2); // Resaltar jugadores en combate
            
            console.log(match);
            
            // Mostrar info del jugador
            displayPlayerInfoTour(match);

            // Iniciar el juego
            started = true;
            playSound('resume');
            debugMessage.textContent = truncateName(match.player1.username) + " vs " + truncateName(match.player2.username);
            
            // Espera a que el juego termine y obtén el ganador
            let gameWinner = await runGame();
            let winnerPlayer = gameWinner === 1 ? match.player1 : match.player2;
            winners.push(winnerPlayer);
            match.winner = winnerPlayer;  

            // Deshabilitamos botones boosts
            toggleBoostButtons(true);

            await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos antes del siguiente partido

            resetHighlight(match.player1, match.player2);
            
            reloadGame();
        }

        // Preparar los partidos de la siguiente ronda
        let nextRoundMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (winners[i + 1]) {
                nextRoundMatches.push({
                    player1: winners[i],
                    player2: winners[i + 1],
                    result: "pending",
                    winner: null
                });
            }
        }

        matches = nextRoundMatches;
        fillPlayers(matches);
    }

    const element1 = document.getElementById(`round-3-${winners[0].position}`);
    element1.classList.add('ready');
}

// Mostrar información jugadores
function displayPlayerInfoTour(playersData) {
    
    // 1. Establecemos nombres globales de jugadores
    player1 = playersData.player1.username;
    player2 = playersData.player2.username;

    const gameBoosts = document.getElementById("gameBoosts");
    const boostImages = {
        speed: "images/speed.png",
        power: "images/power.png",
        defense: "images/shield.png"
    };

    // 2. Mostramos los boost que corresponden por jugador
    let playerContainer1 = gameBoosts.children[0];
    let playerContainer2 = gameBoosts.children[1];
    if (playerContainer1) {
        let nameElement = playerContainer1.querySelector("p, span");
        let button = playerContainer1.querySelector("button");

        if (nameElement) {
            nameElement.textContent = truncateName(playersData.player1.username);
            nameElement.title = playersData.player1.username;
        }
        if (button) {
            button.title = translations[document.documentElement.lang]?.[playersData.player1.boost]
            button.innerHTML = `
                <div style="display: flex; align-items: center; gap: 5px;">
                    <img src="${boostImages[playersData.player1.boost]}" alt="${playersData.player1.boost}" width="30">
                    <span style="
                        font-family: 'retro';
                        color: #161618; 
                        text-transform: uppercase;">
                        E
                    </span>
                </div>
            `;
            // Asegurar que no haya eventos previos duplicados
            button.replaceWith(button.cloneNode(true));
            button = playerContainer1.querySelector("button");

            // Asignar la función del boost correspondiente
            button.addEventListener("click", () => activateBoost(playersData.player1.boost, playersData.player1.username, 0, button));

            // Deshabilitar boton
            button.disabled = true;
        }
    }
    if (playerContainer2) {
        let nameElement = playerContainer2.querySelector("p, span");
        let button = playerContainer2.querySelector("button");

        if (nameElement) {
            nameElement.textContent = truncateName(playersData.player2.username);
            nameElement.title = playersData.player2.username;
        }
        if (button) {
            button.title = translations[document.documentElement.lang]?.[playersData.player2.boost]
            button.innerHTML = `
                <div style="display: flex; align-items: center; gap: 5px;">
                    <img src="${boostImages[playersData.player2.boost]}" alt="${playersData.player2.boost}" width="30">
                    <span style="
                        font-family: 'retro';
                        color: #161618; 
                        text-transform: uppercase;">
                        >
                    </span>
                </div>
            `;
            // Asegurar que no haya eventos previos duplicados
            button.replaceWith(button.cloneNode(true));
            button = playerContainer2.querySelector("button");

            // Asignar la función del boost correspondiente
            button.addEventListener("click", () => activateBoost(playersData.player2.boost, playersData.player2.username, 1, button));
            
            // Deshabilitar boton
            button.disabled = true;
        }
    }

    // 3. Actualizamos css de componentes
    gameBoosts.style.display = "flex";
    gameBoosts.style.visibility = "visible";
    const score = document.getElementById("score");
    score.style.top = "105px";
}

// Deshabilitar botones de selección
function disableTournamentSelectionButtons()
{
    let teamplayerButtons = document.querySelectorAll('.team-players-btn-group');
    let tournamentPlayersButtons = document.querySelectorAll('.tour-players-btn-group');
    let pointsButtons = document.querySelectorAll('.tour-points-btn-group');
    const startButton = document.getElementById('tournamentButton');
    
    teamplayerButtons.forEach(button => button.disabled = true);
    tournamentPlayersButtons.forEach(button => button.disabled = true);
    pointsButtons.forEach(button => button.disabled = true);
    startButton.disabled = true;
}

// Matchmaking
function generateFights(players) {
    let fights = [];
    
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            fights.push({
                player1: players[i],
                player2: players[i + 1],
                result: "pending"
            });
        }
    }
    
    return { fights };
}

// Actualización de gráficos
function updateGraph(players, fights)
{
    const tournamentGraph = document.getElementById("tournamentGraph")
    
    switch (players) {
        case 4:
            showRoundsFourPlayers();
            fillPlayers(fights, 4);
            break;
        case 8:
            showRoundsEightPlayers();
            fillPlayers(fights, 8);
            break;
        case 2:
        default:
            showRoundsTwoPlayers();
            fillPlayers(fights, 2);
            break;
    }

    showElement(tournamentGraph);
    tournamentGraph.style.display = "flex";
    return fights;
}

function showRoundsTwoPlayers() {
    const roundThree = document.querySelectorAll("#round-3");
    const roundTwo1 = document.querySelectorAll("#round-2-1");
    const roundTwo2 = document.querySelectorAll("#round-2-2");
    const roundOne1 = document.querySelectorAll("#round-1-1");
    const roundOne2 = document.querySelectorAll("#round-1-2");

    // Hide 1st round
    roundOne1.forEach(round => {
        hideElement(round)
    });
    roundOne2.forEach(round => {
        hideElement(round)
    });
    
    // Hide 2nd round
    roundTwo1.forEach(round => {
        round.style.display = "flex";
        round.style.visibility = "hidden";
    });
    roundTwo2.forEach(round => {
        round.style.display = "flex";
        round.style.visibility = "hidden";
    });

    // Show 3rd round
    roundThree.forEach(round => {
        showElement(round);
        round.style.display = "flex";
    });
}

function showRoundsFourPlayers() {
    const roundThree = document.querySelectorAll("#round-3");
    const roundTwo1 = document.querySelectorAll("#round-2-1");
    const roundTwo2 = document.querySelectorAll("#round-2-2");
    const roundOne1 = document.querySelectorAll("#round-1-1");
    const roundOne2 = document.querySelectorAll("#round-1-2");

    // Hide 1st round
    roundOne1.forEach(round => {
        hideElement(round)
    });
    roundOne2.forEach(round => {
        hideElement(round)
    });

    // Show 2nd round
    roundTwo1.forEach(round => {
        showElement(round)
        round.style.display = "flex";
    });
    roundTwo2.forEach(round => {
        showElement(round)
        round.style.display = "flex";
    });

    // Show 3rd round
    roundThree.forEach(round => {
        showElement(round);
        round.style.display = "flex";
    });
}

function showRoundsEightPlayers() {
    const roundThree = document.querySelectorAll("#round-3");
    const roundTwo1 = document.querySelectorAll("#round-2-1");
    const roundTwo2 = document.querySelectorAll("#round-2-2");
    const roundOne1 = document.querySelectorAll("#round-1-1");
    const roundOne2 = document.querySelectorAll("#round-1-2");

    // Show 1st round
    roundOne1.forEach(round => {
        showElement(round)
        round.style.display = "flex";
    });
    roundOne2.forEach(round => {
        showElement(round)
        round.style.display = "flex";
    });

    // Show 2nd round
    roundTwo1.forEach(round => {
        showElement(round)
        round.style.display = "flex";
    });
    roundTwo2.forEach(round => {
        showElement(round)
        round.style.display = "flex";
    });

    // Show 3rd round
    roundThree.forEach(round => {
        showElement(round);
        round.style.display = "flex";
    });
}

function fillPlayers(fights) {
    const rounds = { 2: 3, 4: 2, 8: 1 }; // Mapeo de número de jugadores a ronda
    const players = fights.length * 2; // Doble de peleas = jugadores
    const round = rounds[players] || 1; // Determina la ronda, por defecto 1 si no está en el objeto

    fights.forEach((fight, index) => {
        let position1 = getPosition(players, index * 2 + 1);
        let position2 = getPosition(players, index * 2 + 2);

        fight.player1.round = round;
        fight.player1.position = position1;

        fight.player2.round = round;
        fight.player2.position = position2;

        const playerElement1 = document.getElementById(`round-${round}-${position1}`);
        const playerElement2 = document.getElementById(`round-${round}-${position2}`);

        if (playerElement1) {
            playerElement1.innerHTML = truncateName(fight.player1.username);
            playerElement1.title = fight.player1.username;
        }

        if (playerElement2) {
            playerElement2.innerHTML = truncateName(fight.player2.username);
            playerElement2.title = fight.player2.username;
        }
    });
}

function getPosition(players, index) {
    if (players === 4 || players === 8) {
        const half = players / 2;
        const group = index <= half ? 1 : 2;
        const posInGroup = index - (group - 1) * half;
        return `${group}-${posInGroup}`;
    }
    return index;
}

function highlightMatch(player1, player2) {
    const element1 = document.getElementById(getPlayerId(player1));
    const element2 = document.getElementById(getPlayerId(player2));
    if (element1) element1.classList.add('ready');
        
    if (element2) element2.classList.add('ready');
}

function resetHighlight(player1, player2) {
    const element1 = document.getElementById(getPlayerId(player1));
    const element2 = document.getElementById(getPlayerId(player2));
    if (element1) element1.classList.remove('ready');
    if (element2) element2.classList.remove('ready');
}

function getPlayerId(player) {
    return `round-${player.round}-${player.position}`;
}
