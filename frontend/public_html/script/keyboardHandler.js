// Eventos para teclas
document.addEventListener('keydown', (event) => {
    if (started) {
        // Prevenir el comportamiento predeterminado del teclado para evitar el desplazamiento
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
        }
        // Controles de movimiento...
        if (event.key === 'w' || event.key === 'W') wPressed = true;
        if (event.key === 's' || event.key === 'S') sPressed = true;
        if (event.key === 'ArrowUp') upPressed = true;
        if (event.key === 'ArrowDown') downPressed = true;
        if (playersToPlay == 4) {
            if (event.key === 'i' || event.key === 'I') iPressed = true;
            if (event.key === 'k' || event.key === 'K') kPressed = true;
            if (event.code === 'Numpad8') np8Pressed = true;
            if (event.code === 'Numpad5') np5Pressed = true;
        }
        
        // Lanzar boosts (solo si no está en pausa)
        if (!paused) {
            if (event.key === "e" || event.key === "E") pressedBoostButton("e");
            if (event.key === "ArrowRight") pressedBoostButton("right");
        }

        // PAUSA / REANUDAR con la barra espaciadora
        if (event.key === ' ' && winner == 0) {
            paused = !paused;
            if (paused) {
                // Al pausar, guardamos el momento y detenemos los boosts
                pauseTime = performance.now();
                pauseBoosts(); // Detiene los temporizadores de los boosts activos

                playSound('pause');
                debugMessage.textContent = translations[document.documentElement.lang]?.["paused"];
                debugMessage.classList.add('paused');

                // Deshabilitamos los botones de boost
                toggleBoostButtons(true);
            } else {
                // Al reanudar, volvemos a activar los temporizadores de los boosts activos
                resumeBoosts();

                playSound('resume');
                debugMessage.textContent = "";
                debugMessage.classList.remove('paused');
                
                // Habilitamos los botones de boost si aún no se han usado
                if (boostPressedPlayer1 == false) {
                    const gameBoosts = document.getElementById("gameBoosts");
                    if (!gameBoosts) return;
                    let playerContainer = gameBoosts.children[0];
                    let button = playerContainer.querySelector("button");
                    button.disabled = false;
                } 
                if (boostPressedPlayer2 == false) {
                    const gameBoosts = document.getElementById("gameBoosts");
                    if (!gameBoosts) return;
                    let playerContainer = gameBoosts.children[1];
                    let button = playerContainer.querySelector("button");
                    button.disabled = false;
                } 
            }
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (started) {
        if (event.key === 'w' || event.key === 'W') wPressed = false;
        if (event.key === 's' || event.key === 'S') sPressed = false;
        if (event.key === 'ArrowUp') upPressed = false;
        if (event.key === 'ArrowDown') downPressed = false;
        if (playersToPlay == 4) {
            if (event.key === 'i' || event.key === 'I') iPressed = false;
            if (event.key === 'k' || event.key === 'K') kPressed = false;
            if (event.code === 'Numpad8') np8Pressed = false;
            if (event.code === 'Numpad5') np5Pressed = false;
        }
    }
});

// Evento teclas boosts e/>
function pressedBoostButton(letter) {
    const gameBoosts = document.getElementById("gameBoosts");
    
    if (!gameBoosts) return;

    const button1 = gameBoosts.children[0].querySelector("button");
    const button2 = gameBoosts.children[1].querySelector("button");
	if (playersToPlay == 1 && letter == "e" && button1.disabled == false) 
	{
		button1.click();
        button2.click();
	} else if (letter == "e" && button1.disabled == false) {
        button1.click();
    } else if (letter = "right" && button2.disabled == false) {
        button2.click();
    }
}