var socket = io();

let currentPlayer = {};

socket.on("message", function(data) {
  console.log(data);
});

socket.on("name", function(data) {
  // data is a parameter containing whatever data was sent
});

let movement = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Get sound effects
let backgroundAudio = document.getElementById("background_audio");
let explosion = document.getElementById("explosion");
backgroundAudio.volume = 0.4;
explosion.volume = 0.4;

// Audio buttons
let muteButton = document.getElementById("mute-audio");
let playButton = document.getElementById("play-audio");

// Login/out btns
let loginModal = document.getElementById("loginModal");
let guestLoginBtn = document.getElementById("guest-login");
let logoutBtn = document.getElementById("logout");

// Loop background music
let playAudio = (() => {
  if (
    sessionStorage.getItem("muted") == 0 ||
    sessionStorage.getItem("muted") === null
  ) {
    playButton.style.display = "none";
    muteButton.style.display = "inline";
    backgroundAudio.loop = true;
    backgroundAudio.play();
  } else {
    playButton.style.display = "inline";
    muteButton.style.display = "none";
  }
})();

// Hide leaderboard and chat divs according to window size
window.onload = checkBrowserSize;
window.onresize = checkBrowserSize;

function checkBrowserSize() {
  if (getWidth() > 1400) {
    document.getElementById("leaderboard").style = "display: block;";
  }
  if (getWidth() > 1900) {
    document.getElementById("chat").style = "display: block;";
  }
  if (getWidth() < 1400) {
    document.getElementById("leaderboard").style = "display: none;";
  }
  if (getWidth() < 1900) {
    document.getElementById("chat").style = "display: none;";
  }
}

let showLogin = (() => {
  if (
    sessionStorage.getItem("logged") == 0 ||
    sessionStorage.getItem("logged") === null
  ) {
    loginModal.style.display = "inline";
    logoutBtn.style.display = "none";
  } else {
    loginModal.style.display = "none";
    logoutBtn.style.display = "inline";
  }
})();

// Guest login button
guestLoginBtn.addEventListener("click", () => {
  sessionStorage.setItem("logged", 1);
  name = document.getElementById("guest-username").value;
});

// Unsure as to why this cant be put into Guest Login Logic
socket.emit("new player", name);

// Logout button
logoutBtn.addEventListener("click", () => {
    sessionStorage.setItem("logged", 0);
    socket.emit('remove player', socket.id);
    loginModal.style.display = "inline";
    logoutBtn.style.display = "none";
});

document.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
        case 37: // left arrow
            movement.left = true;
            if (event.target == document.body) {
                event.preventDefault();
            }
            break;
        case 38: // up arrow
            movement.up = true;
            if (event.target == document.body) {
                event.preventDefault();
            }
            break;
        case 39: // right arrow
            movement.right = true;
            if (event.target == document.body) {
                event.preventDefault();
            }
            break;
        case 40: // down arrow
            movement.down = true;
            if (event.target == document.body) {
                event.preventDefault();
            }
            break;
        case 32:
            socket.emit('shoot');
            if (event.target == document.body) {
                event.preventDefault();
            }
            break;
    }
});

document.addEventListener("keyup", function(event) {
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
  // TODO: wrap-up game logic
  location.reload();
});

// Mute audio button
muteButton.addEventListener("click", () => {
  sessionStorage.setItem("muted", 1);
  muteButton.style.display = "none";
  playButton.style.display = "inline";
  backgroundAudio.muted = true;
  explosion.muted = true;
});

// Play audio button
playButton.addEventListener("click", () => {
  sessionStorage.setItem("muted", 0);
  playButton.style.display = "none";
  muteButton.style.display = "inline";
  backgroundAudio.muted = false;
  backgroundAudio.play();
  explosion.muted = false;
});

// Add to Slack button
document.getElementById("slack-button").addEventListener("click", () => {
  if (currentPlayer) {
    let username = currentPlayer.name;
    let score = currentPlayer.kills;

    if (
      username != null &&
      username != undefined &&
      score != null &&
      score != undefined
    ) {
      let xhttp = new XMLHttpRequest();
      xhttp.open("POST", "/social_media/postslack", true);
      xhttp.setRequestHeader(
        "Content-type",
        "application/x-www-form-urlencoded"
      );
      xhttp.send(`username=${username}&score=${score}`);
    }
  }
});

setInterval(function() {
  socket.emit("movement", movement);
}, 1000 / 60);

// Set canvas dimensions
var canvas = document.getElementById("canvas");
canvas.width = 1000;
canvas.height = 600;
var context = canvas.getContext("2d");

// Set modal areas
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];
let image = new Image();
image.src = "./assets/images/tank.png";

socket.on("state", function(state) {
  context.clearRect(0, 0, 1000, 600);

  /* Updates state of all players */
  for (var id in state.players) {
    var player = state.players[id];
    context.beginPath();
    context.save();
    drawTank(player);
    context.restore();
    context.save();
    drawTankStats(player);
    // Checks if the player is dead
    if (player.hp <= 0) {
      explosion.play();
      socket.emit("player died", player.id);
    }
  }

  /* Updates state of all Projectiles */
  for (var projId in state.projectiles) {
    var projectile = state.projectiles[projId];
    context.beginPath();
    context.fillRect(projectile.x, projectile.y, 5, 5);

    // Iterates through all players to check for collision with this projectile
    for (var id in state.players) {
      let player = state.players[id];
      if (
        projectile.player != player.id &&
        checkCollision(
          player.x,
          player.y,
          player.hitbox,
          projectile.x,
          projectile.y,
          projectile.hitbox
        )
      ) {
        let targetId = player.id;
        let projectileId = projectile.player;

        // This emit seems to fire twice, yet the logic
        // within this If block only runs once..?
        socket.emit("tank hit", { targetId, projectileId });
      } else {
        socket.emit("move projectile");
      }
    }
  }
});

socket.on("show dead modal", function(finishedPlayer) {
  currentPlayer = finishedPlayer;
  // TODO: sometimes this msg is displayed before currentPlayer is set, causing exception
  document.getElementById("modal-msg").innerHTML = `Better luck next time ${
    currentPlayer.name
  }! Your score was ${currentPlayer.kills}!`;
  modal.style.display = "block";
});

socket.on("update scoreboard", function(players) {
  let table = document.createElement("table");
  table.id = "scoreboard";

  // CONSTRUCT TABLE HEADER
  let tHeaderRow = document.createElement("tr");
  table.appendChild(tHeaderRow);

  // Rank Header
  let rankTableHeader = document.createElement("th");
  let rankTableHeaderNode = document.createTextNode("Rank");
  rankTableHeader.appendChild(rankTableHeaderNode);
  tHeaderRow.appendChild(rankTableHeader);

  // Name Header
  let nameTableHeader = document.createElement("th");
  let nameTableHeaderNode = document.createTextNode("Name");
  nameTableHeader.appendChild(nameTableHeaderNode);
  tHeaderRow.appendChild(nameTableHeader);

  // Score Header
  let scoreTableHeader = document.createElement("th");
  let scoreTableHeaderNode = document.createTextNode("Score");
  scoreTableHeader.appendChild(scoreTableHeaderNode);
  tHeaderRow.appendChild(scoreTableHeader);

  // CONSTRUCT TABLE BODY

  for (let i = 0; i < players.length; i++) {
    let tr = document.createElement("tr");

    let rankTableData = document.createElement("td");
    let rankTableDataNode = document.createTextNode(i + 1);
    rankTableData.appendChild(rankTableDataNode);
    tr.appendChild(rankTableData);

    let nameTableData = document.createElement("td");
    let nameTableDataNode = document.createTextNode(players[i].name);
    nameTableData.appendChild(nameTableDataNode);
    tr.appendChild(nameTableData);

    let scoreTableData = document.createElement("td");
    let scoreTableDataNode = document.createTextNode(players[i].kills);
    scoreTableData.appendChild(scoreTableDataNode);
    tr.appendChild(scoreTableData);

    table.appendChild(tr);
  }

  document.getElementById("scoreboard").replaceWith(table);
});

/*              Helper Functions                */
/*                                              */

/**
 * Displays the body of the tank on the canvas.
 * @param {*} player Socket Id of the client
 */
function drawTank(player) {
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.translate(player.x + player.width / 2, player.y + player.height / 2);
  context.rotate(player.rotate);
  context.translate(
    -(player.x + player.width / 2),
    -(player.y + player.height / 2)
  );
  context.drawImage(image, player.x, player.y, player.width, player.height);
}

/**
 * Displays the player's name and lifebar on the canvas.
 * @param {*} player Socket Id of the client
 */
function drawTankStats(player) {
  // Draw Hp bar
  let currentHp = player.hp / 3;
  context.fillStyle = "red";
  context.fillRect(player.x, player.y + player.height + 12, player.width, 5);
  context.fillStyle = "LightGreen";
  context.fillRect(
    player.x,
    player.y + player.height + 12,
    player.width * currentHp,
    5
  );

  // Draw Player Name
  context.fillStyle = "black";
  context.font = "12px Arial";
  context.textAlign = "center";
  context.fillText(player.name, player.x + 15, player.y - 12);
}

/**
 * Checks if a projectile's hitbox collides with a player tank's hitbox.
 * @param {*} playerX x coordinate of the player tank
 * @param {*} playerY y coordinate of the player tank
 * @param {*} playerHitBox hitbox(radius) of the player tank
 * @param {*} shotX x coordinate of the projectile
 * @param {*} shotY y coordinate of the projectile
 * @param {*} shotHitBox hitbox(radius) of the projectile
 */
function checkCollision(
  playerX,
  playerY,
  playerHitBox,
  shotX,
  shotY,
  shotHitBox
) {
  let minDist = playerHitBox + shotHitBox;
  return getEuclideanDist(playerX, playerY, shotX, shotY) < minDist * minDist;
}

/**
 * Returns the Euclidean distance between 2 x and y coordinates.
 * @param {*} x1 x coordinate of the 1st point
 * @param {*} y1 y coordinate of the 1st point
 * @param {*} x2 x coordinate of the 2nd point
 * @param {*} y2 y coordinate of the 2nd point
 */
function getEuclideanDist(x1, y1, x2, y2) {
  return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
    y: ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
  };
}

// Returns width of browser
function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}
