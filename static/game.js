var socket = io();

let currentPlayer = {};

socket.on('message', function (data) {
    console.log(data);
});

socket.on('name', function (data) {
    // data is a parameter containing whatever data was sent
});

let movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

document.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 37: // left arrow
            movement.left = true;
            event.preventDefault();
            break;
        case 38: // up arrow
            movement.up = true;
            event.preventDefault();
            break;
        case 39: // right arrow
            movement.right = true;
            event.preventDefault();
            break;
        case 40: // down arrow
            movement.down = true;
            event.preventDefault();
            break;
        case 32:
            socket.emit('shoot');
            event.preventDefault();
            break;
    }
});

document.addEventListener('keyup', function (event) {
    switch (event.keyCode) {
        case 37: // left arrow
            movement.left = false;
            break;
        case 38: // up arrow
            movement.up = false;
            break;
        case 39: // right arrow
            movement.right = false;
            break;
        case 40: // down arrow
            movement.down = false;
            break;
    }
});

// Play again button
document.getElementById("play-again").addEventListener("click", () => {

    if (currentPlayer) {
        console.log(currentPlayer);

        // TODO: wrap-up game logic
        setTimeout(() => { // TEMP
            location.reload();
        }, 1500);
    }
});

// Add to Slack button
document.getElementById("slack-button").addEventListener("click", () => {

    if (currentPlayer) {
        let username = currentPlayer.name;
        let score = currentPlayer.kills;

        if (username != null
            && username != undefined
            && score != null
            && score != undefined) {
            let xhttp = new XMLHttpRequest();
            xhttp.open("POST", "/social_media/postslack", true);
            xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhttp.send(`username=${username}&score=${score}`);
        }
    }
});

socket.emit('new player');
setInterval(function () {
    socket.emit('movement', movement);
}, 1000 / 60);

function drawTank(player) {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    context.fillStyle = 'green';
    context.translate(player.x + player.width / 2, player.y + player.height / 2);
    context.rotate(player.rotate);
    context.translate(-(player.x + player.width / 2), -(player.y + player.height / 2));
    context.fillRect(player.x, player.y, player.width, player.height);
    context.fillStyle = 'black';
    context.fillRect(player.x + player.width / 2 + 5, player.y + player.height / 2 - 2.5, 30, 5);
}

function drawTankStats(player) {
    // Draw Hp
    let currentHp = player.hp / 3;
    context.fillStyle = 'red';
    context.fillRect(player.x, player.y + player.height + 12, player.width, 5);
    context.fillStyle = 'LightGreen';
    context.fillRect(player.x, player.y + player.height + 12, player.width * currentHp, 5);

    // Draw Player Name
    context.fillStyle = 'black'
    context.font = '12px Arial';
    context.textAlign = 'center';
    context.fillText(player.name, player.x + 15, player.y - 12);
}

// Set canvas dimensions
var canvas = document.getElementById('canvas');
canvas.width = 1000;
canvas.height = 600;
var context = canvas.getContext('2d');

// Set modal areas
var modal = document.getElementById('myModal');
var span = document.getElementsByClassName("close")[0];

socket.on('state', function (state) {
    context.clearRect(0, 0, 1000, 600);
    for (var id in state.players) {
        var player = state.players[id];
        context.beginPath();
        context.save();
        drawTank(player);
        context.restore();
        context.save();
        drawTankStats(player);
    }

    for (var id in state.shots) {
        var shot = state.shots[id];
        context.beginPath();
        context.fillRect(shot.x, shot.y, 5, 5);
    }
    socket.emit('move shot');
});

socket.on('player state', function (player) {
    currentPlayer = player;
    console.log("player state");
});

function die() {
    socket.emit('died');
    modal.style.display = "block";
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}
