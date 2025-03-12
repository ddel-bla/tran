// ACTUALIZAR TAMAÑO BOLA
function updateBallSize(value) {

    ballSize = parseInt(value);
    ballX = canvas.width / 2 - ballSize / 2;
    ballY = canvas.height / 2 - ballSize / 2;
    localStorage.setItem("ballSize", ballSize);

    drawGameBoard();
}

// ACTUALIZAR VELOCIDAD
function updateBallSpeed(value) {

    ballSpeedX = value, ballSpeedY = value;
    localStorage.setItem("ballSpeed", value);

    drawGameBoard();
}

// ACTUALIZAR COLOR
function updateBallColor(value) {

    ballColor = value;
    localStorage.setItem("ballColor", ballColor);

    drawGameBoard();

    // Update selected color
    updateColorSelection(value);
}

function updateColorSelection(value) {
    const buttons = document.querySelectorAll('.color-option');
    
    buttons.forEach(button => {
        button.classList.remove('selected');
    });
    
    const selectedButton = Array.from(buttons).find(button => 
        button.style.backgroundColor === value || button.style.backgroundColor === hexToRgb(value)
    );
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
}

// ACTUALIZAR FONDO
function updateBackground(value) {

    ballColor = value;
    localStorage.setItem("ballColor", ballColor);

    drawGameBoard();

    // Update selected color
    updateColorSelection(value);
}

// ACTUALIZAR MODO
function updateMode(value) {
    if (value == "disabled")
    {
        document.body.classList.remove("light-mode");
        
        let canvasBorders = document.querySelectorAll('.canvas-border');
        canvasBorders.forEach(function(element) {
            element.classList.remove("light-mode");
        });
        let navbar = document.querySelectorAll('.navbar');
        navbar.forEach(function(element) {
            element.classList.remove("light-mode");
        });
    }
    else
    {
        document.body.classList.add("light-mode");

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