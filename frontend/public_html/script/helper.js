function hexToRgb(hex) {
    // Elimina el "#" si está presente
    hex = hex.replace(/^#/, '');
    
    // Convierte a RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${r}, ${g}, ${b})`;
}

function showElement(element) {
    element.style.display = "block";
    element.style.visibility = "visible";
}

function hideElement(element) {
    element.style.display = "none";
    element.style.visibility = "hidden";
}

// Construir nombre de equipo en ingles
function formatPossessive(username) {
    if (!username) return "";  
    return username.endsWith("s") ? `${username}'` : `${username}'s`;
}

// Truncar nombre
function truncateName(name, maxLength = 10) {
    return name.length > maxLength ? name.substring(0, maxLength) + "..." : name;
}

function isMobile() {
    return window.innerWidth <= 768;
}
