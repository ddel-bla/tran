let players = [];
const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');
const player1Score = document.getElementById('player1Score');
const player2Score = document.getElementById('player2Score');
const debugMessage = document.getElementById('debugMessage');

// # SECCIÓN DE Juego
let started = false;
let paused = true;                                      // Guarda si el juego está pausado
let winner = 0;                                         // Guarda si hay un ganador (0:No, 1:Jugador1, 2:Jugador2)
let lastTime = performance.now();                       // Contadores de tiempo
let pauseTime = 0.0;                                    // Tiempo transcurrido desde la pausa
let animationTime;                                      // Tiempo transcurrido desde el inicio de la animación
let animation = false;                                  // Guarda si se está actualmente en una animación
let animationColor;                                     // Color del jugador que provocó la animación
let UIColor = '#fff';                                   // Color actual de la interfaz
let pointsToWin = 10;                                   // Puntos para ganar
let playersToPlay = null;                               // Numero de jugadores
let boostEnable = false;                                 // Activación boosts

// # SECCIÓN DE JUGADOR
let paddleWidth = 10, paddleHeight = 100;               // Dimensiones de los rectángulos
let paddleWidth2 = 10, paddleHeight2 = 100;             // Dimensiones de los rectángulos
let paddleSpeed = 600;                                  // Velocidad de los jugadores (1 y 3)
let paddleSpeed2 = 600;                                 // Velocidad de los jugadores (2 y 4)
let player1Y = canvas.height / 2 - paddleHeight / 2;    // Posiciones de ambos jugadores (1 y 3)
let player2Y = canvas.height / 2 - paddleHeight2 / 2;   // Posiciones de ambos jugadores (2 y 4)
let player3Y = player1Y;
let player4Y = player2Y;
let playerDistance = 100;
let wPressed = false, sPressed = false;                 // Controla si se están pulsando las teclas W/S
let upPressed = false, downPressed = false;             // Controla si se están pulsando las teclas Arriba/Abajo
let iPressed = false, kPressed = false;                 // Controla si se están pulsando las teclas I/K
let np8Pressed = false, np5Pressed = false;             // Controla si se están pulsando las teclas np8/np5
let boostPressedPlayer1 = false;
let boostPressedPlayer2 = false;
let player1 = "PLAYER 1";
let player2 = "PLAYER 2";

// # SECCIÓN DE PELOTA
let ballSize = 10;                                    // Dimensiones de la pelota
let ballBSpeed = 500;                                 // Velocidad base de la pelota
let ballX = canvas.width / 2 - ballSize / 2;            // Posición de la pelota
let ballY = canvas.height / 2 - ballSize / 2;
let ballSpeedX = Math.random() < 0.5 ? ballBSpeed : -ballBSpeed;       // Velocidad de la pelota
let ballSpeedY = Math.random() < 0.5 ? ballBSpeed : -ballBSpeed; 
let ballColor = '#fff';
let activeBoosts = {};

function moveBall(time) {
    // Incrementar velocidad
    let deltaX = ballSpeedX * time;
    let deltaY = ballSpeedY * time;
    ballX += deltaX;
    ballY += deltaY;

    // Rebote superior
    if (ballY <= 0) {
        ballY = 0;
        ballSpeedY = -ballSpeedY;
        playSound('bounce');
    }

    // Rebote inferior
    else if (ballY + ballSize >= canvas.height) {
        ballY = canvas.height - ballSize;
        ballSpeedY = -ballSpeedY;
        playSound('bounce');
    }

    if (playersToPlay == 4) {
        // Zona del equipo 1
        if (deltaX < 0 && ballX <= playerDistance + paddleWidth) {
            // Gol del equipo 1
            if (ballX + ballSize <= 0)
                playerScore(2);

            // Colisi贸n con el jugador 3
            else if (ballX >= playerDistance && ballY + ballSize >= player3Y && ballY <= player3Y + paddleHeight) {
                ballX = playerDistance + paddleWidth;
                ballSpeedX = -ballSpeedX * (Math.random() * 0.05 + 0.98);
                ballSpeedY = ballSpeedY * (Math.random() * 0.05 + 0.98);
                playSound('bounce');
            }

            // Colisi贸n con el jugador 1
            else if (ballX <= paddleWidth && ballY + ballSize >= player1Y && ballY <= player1Y + paddleHeight) {
                ballX = paddleWidth;
                ballSpeedX = -ballSpeedX * (Math.random() * 0.05 + 0.98);
                ballSpeedY = ballSpeedY * (Math.random() * 0.05 + 0.98);
                playSound('bounce');
            }

        // Zona del equipo 2 
        } else if (deltaX > 0 && ballX + ballSize >= canvas.width - playerDistance - paddleWidth) {
            // Gol del equipo 2
            if (ballX >= canvas.width)
                playerScore(1);

            // Colisi贸n con el jugador 4
            else if (ballX + ballSize <= canvas.width - playerDistance && ballY + ballSize >= player4Y && ballY <= player4Y + paddleHeight2) {
                ballX = canvas.width - playerDistance - paddleWidth - ballSize;
                ballSpeedX = -ballSpeedX * (Math.random() * 0.05 + 0.98);
                ballSpeedY = ballSpeedY * (Math.random() * 0.05 + 0.98);
                playSound('bounce');
            }

            // Colisi贸n con el jugador 2
            else if (ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize >= player2Y && ballY <= player2Y + paddleHeight2) {
                ballX = canvas.width - paddleWidth - ballSize;
                ballSpeedX = -ballSpeedX * (Math.random() * 0.05 + 0.98);
                ballSpeedY = ballSpeedY * (Math.random() * 0.05 + 0.98);
                playSound('bounce');
            }
        }
    } else {
        // Zona del jugador 1
        if (ballX <= paddleWidth) {
            // Gol
            if (ballX + ballSize <= 0)
                playerScore(2);

            // Rebote
            else if (ballY + ballSize >= player1Y && ballY <= player1Y + paddleHeight) {
                ballX = paddleWidth;
                ballSpeedX = -ballSpeedX * (Math.random() * 0.05 + 0.98);
                ballSpeedY = ballSpeedY * (Math.random() * 0.05 + 0.98);
                playSound('bounce');
            }
        }

        // Zona del jugador 2
        if (ballX + ballSize >= canvas.width - paddleWidth) {
            // Gol
            if (ballX >= canvas.width)
                playerScore(1);

            // Rebote
            else if (ballY + ballSize >= player2Y && ballY <= player2Y + paddleHeight2) {
                ballX = canvas.width - paddleWidth - ballSize;
                ballSpeedX = -ballSpeedX * (Math.random() * 0.05 + 0.98);
                ballSpeedY = ballSpeedY * (Math.random() * 0.05 + 0.98);
                playSound('bounce');
            }
        }
    }
}

function playerScore(player) {
    // Comprobar victoria
    if (player == 1) {
        player1Score.textContent = parseInt(player1Score.textContent) + 1;
        animationColor = "#8BB9F7";
        if (parseInt(player1Score.textContent) >= pointsToWin) {
            winner = 1;
            debugMessage.textContent = truncateName(player1) + " WINS!";
            debugMessage.style.color = 'blue';
        }
    }
    else {
        player2Score.textContent = parseInt(player2Score.textContent) + 1;
        animationColor = "#DA5C5C";
        if (parseInt(player2Score.textContent) >= pointsToWin) {
            winner = 2;
            debugMessage.textContent = truncateName(player2) + " WINS!";
            debugMessage.style.color = 'red';
        }
    }

    // Reiniciar pelota
    if (winner == 0) {
        ballX = canvas.width / 2 - ballSize / 2;
        ballY = canvas.height / 2 - ballSize / 2;
        ballSpeedX = -ballSpeedX;
        playSound('score');
    } else {
        playSound('gameover');
    }

    // Iniciar animación
    animationTime = performance.now();
    animation = true;
}


function movePlayers(time) {
    player1Y = Math.min(canvas.height - paddleHeight, Math.max(0, player1Y + paddleSpeed * time * (sPressed - wPressed)));
    if (playersToPlay == 1) {
		
		// Reducimos la velocidad de la IA
		let iaSpeedFactor = 0.8; // IA un 20% más lenta
		let iaTime = time * iaSpeedFactor;

		// Control de precisión de la IA
		let errorFactor = 0.2; // Entre 0 (precisa) y 1 (muy imprecisa)
		let BallError = (Math.random() * errorFactor - errorFactor / 2);
		let targetY = ballY + BallError; // Posición objetivo con imprecisión  

		// Movimiento de la IA más lento que el jugador
		if (player2Y < targetY)
			player2Y = Math.min(canvas.height - paddleHeight2, player2Y + paddleSpeed2 * iaTime);
		else if (player2Y > targetY)
			player2Y = Math.max(0, player2Y - paddleSpeed2 * iaTime);
	}
	else {
		player2Y = Math.min(canvas.height - paddleHeight2, Math.max(0, player2Y + paddleSpeed2 * time * (downPressed - upPressed)));
	}	
	if (playersToPlay == 4) {
	    player3Y = Math.min(canvas.height - paddleHeight, Math.max(0, player3Y + paddleSpeed * time * (kPressed - iPressed)));
        player4Y = Math.min(canvas.height - paddleHeight2, Math.max(0, player4Y + paddleSpeed2 * time * (np5Pressed - np8Pressed)));
    }
}

function drawGameBoard() {
    // Dibujar tablero limpio
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Jugador 1
    context.fillStyle = "#4C6A90";
    context.fillRect(0, player1Y, paddleWidth, paddleHeight);
    // Dibujar Jugador 2
    context.fillStyle = "#DA5C5C";
    context.fillRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight2);
    
    if (playersToPlay == 4) {
        // Dibujar Jugador 3
        context.fillStyle = "#625286";
        context.fillRect(playerDistance, player3Y, paddleWidth, paddleHeight);
        // Dibujar Jugador 4
        context.fillStyle = "#BE4F8A";
        context.fillRect(canvas.width - playerDistance - paddleWidth, player4Y, paddleWidth, paddleHeight2);
    }

    // Dibujar línea discontinua en el centro
    context.setLineDash([7, 7]);
    context.beginPath();
    context.moveTo(canvas.width / 2, 0);
    context.lineTo(canvas.width / 2, canvas.height);
    context.strokeStyle = UIColor;
    context.lineWidth = 2;
    context.stroke();
    context.setLineDash([]);

    // Dibujar perlota
    context.fillStyle = ballColor;
    context.beginPath();
    context.arc(ballX + ballSize / 2, ballY + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
    context.fill(); 
}

function runGame() {
    return new Promise((resolve) => {
        function loop() {
            // Controlar pausa
            if (paused) {
                requestAnimationFrame(loop);
                lastTime = performance.now();
                return;
            }

            // Medir diferencias de tiempo
            let currentTime = performance.now();
            let time = (currentTime - lastTime) * 0.001;
            lastTime = currentTime;

            // Controlar animación
            if (animation) {
                let animationTimeDiff = currentTime - animationTime - pauseTime;
                UIColor = (Math.floor((animationTimeDiff) * 0.0075) % 2 == 1) ? animationColor : '#fff';
                if (winner == 0 && animationTimeDiff * 0.001 >= 1.25) {
                    UIColor = '#fff';
                    animation = false;
                }
                player1Score.style.color = UIColor;
                player2Score.style.color = UIColor;
                canvas.style.border = '2px solid ' + UIColor;
            }

            // Dibujar tablero limpio
            drawGameBoard();

            if (winner === 0) {
                // Mover pelota y jugadores según el tiempo transcurrido
                moveBall(time);
                movePlayers(time);
            } else {
                // Si hay ganador, resolvemos la promesa devolviendo el ganador (1 o 2)
                resolve(winner);
                return;
            }

            // Reajustar el momento de pausa
            pauseTime = 0.0;

            // Continuar el ciclo de juego
            requestAnimationFrame(loop);
        }
        loop();
    });
}

function reloadGame(page) {
    // Pause game
    started = false;
    paused = true;
    winner = 0;
    pauseTime = 0.0;                                    // Tiempo transcurrido desde la pausa
    debugMessage.textContent = "";
    debugMessage.style.color = 'white';
    player1Score.textContent = 0;
    player2Score.textContent = 0;
    
    const savedSpeed = localStorage.getItem("ballSpeed");
    if (allowedSpeeds.includes(savedSpeed)) {
        updateBallSpeed(savedSpeed)
        ballBSpeed = 500;
    } else {
        ballSpeedX = 500, ballSpeedY = 500;
        ballBSpeed = 500;
    }

    ballX = canvas.width / 2 - ballSize / 2;            // Posición de la pelota
    ballY = canvas.height / 2 - ballSize / 2;

    player1Y = (canvas.height / 2) - (paddleHeight / 2);    // Posicion palas
    player2Y = (canvas.height / 2) - (paddleHeight2 / 2);
    
    if (playersToPlay == 4) {
        player3Y = (canvas.height / 2) - (paddleHeight / 2);
        player4Y = (canvas.height / 2) - (paddleHeight2 / 2);
    }
    
    UIColor = "#fff";                   // Resetear color animación
    animation = false;
    player1Score.style.color = UIColor;
    player2Score.style.color = UIColor;
    canvas.style.border = '2px solid ' + UIColor;

    drawGameBoard();

    if (page == "game")
        reloadingGamePage();
    else if (page == "tournament")
        reloadingGameTournament();

    // Botones de boost todavía no pulsados
    boostPressedPlayer1 = false;
    boostPressedPlayer2 = false;
}

// Activat el boost
function activateBoost(boostType, playerName, index, button) {
    // No activar si el juego está en pausa
    if (paused) return;
    
    button.classList.add("active-boost");
    let boostDuration = boostType === "speed" ? 150 : 2000;
    let startTime = performance.now();

    // Aplicamos el efecto inmediatamente
    applyBoost(boostType, playerName, index);

    // Función que se ejecutará al finalizar el boost (para remover su efecto)
    let removalFn = function() {
        removeBoost(boostType, index);
        button.classList.remove("active-boost");
        // Eliminamos el boost de la lista de activos
        delete activeBoosts[index];
    };

    // Iniciamos el temporizador
    let timeoutId = setTimeout(removalFn, boostDuration);

    // Guardamos la información del boost activo
    activeBoosts[index] = {
        boostType: boostType,
        playerName: playerName,
        button: button,
        duration: boostDuration,
        remaining: boostDuration, // Tiempo restante (inicialmente la duración completa)
        startTime: startTime,
        timeoutId: timeoutId,
        removalFn: removalFn
    };

    if (index % 2 === 0) {
        boostPressedPlayer1 = true;
    } else {
        boostPressedPlayer2 = true;
    }
    button.disabled = true;
}

// Aplicar el boost
function applyBoost(boostType, playerName, index) {
    switch (boostType) {
        case "speed":
            ballSpeedX *= 5;
            ballSpeedY *= 5;
            break;
        case "power":
            if (index % 2 === 0) {
                paddleSpeed *= 2;
            } else {
                paddleSpeed2 *= 2;
            }
            drawGameBoard();   
            break;
        case "defense":
            if (index % 2 === 0) {
                paddleHeight = 150;
            } else {
                paddleHeight2 = 150;
            }
            drawGameBoard();   
            break;
        default:
            break;
    }
}

// Elimnar el efecto del boost
function removeBoost(boostType, index) {
    switch (boostType) {
        case "speed":
            ballSpeedX /= 5;
            ballSpeedY /= 5;
            break;
        case "power":
            if (index % 2 === 0) {
                paddleSpeed /= 2;
            } else {
                paddleSpeed2 /= 2;
            }
            drawGameBoard();
            break;
        case "defense":
            if (index % 2 === 0) {
                paddleHeight = 100;
            } else {
                paddleHeight2 = 100;
            }
            drawGameBoard();
            break;
        default:
            break;
    }
}

// Pausar boosts en caso de pausa del juego
function pauseBoosts() {
    for (let key in activeBoosts) {
        let boost = activeBoosts[key];

        // Detenemos el temporizador
        clearTimeout(boost.timeoutId);

        // Calculamos el tiempo transcurrido
        let elapsed = performance.now() - boost.startTime;

        // Guardamos el tiempo restante
        boost.remaining -= elapsed;

        // Pausar animación del botón si existe
        if (boost.button) {
            boost.button.classList.remove("active-boost");
            boost.button.classList.add("paused-boost"); 
        }
    }
}

// Reanudar boost en caso de reanudación del juego
function resumeBoosts() {
    for (let key in activeBoosts) {
        let boost = activeBoosts[key];

        // Reiniciamos el temporizador con el tiempo restante
        boost.startTime = performance.now();
        boost.timeoutId = setTimeout(() => {
            boost.button.classList.remove("active-boost", "paused-boost"); // Quita animaciones cuando termine
            boost.removalFn(); // Aplica la eliminación del boost
            delete activeBoosts[key];
        }, boost.remaining);

        // Reanudar la animación del botón si sigue activo
        if (boost.button) {
            boost.button.classList.remove("paused-boost");
            boost.button.classList.add("active-boost");
        }
    }
}

// Activar/Desactivar boost en función del momento del juego
function toggleBoostButtons(enable) {
    const gameBoosts = document.getElementById("gameBoosts");

    if (!gameBoosts) return;

    const playerContainers = gameBoosts.children;

    Array.from(playerContainers).forEach(playerContainer => {
        let buttons = playerContainer.querySelectorAll("button");

        buttons.forEach(button => {
            button.disabled = enable;
        });
    });
}
