var socket = io();
socket.on('message', function(data) {
  console.log(data);
});

socket.on('name', function(data) {
    // data is a parameter containing whatever data was sent
});

let movement = {
    up: false,
    down: false,
    left: false,
    right: false
}

document.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
      case 65: // A
        movement.left = true;
        break;
      case 87: // W
        movement.up = true;
        break;
      case 68: // D
        movement.right = true;
        break;
      case 83: // S
        movement.down = true;
        break;
      case 32:
        socket.emit('shoot');
        break;
    }
});

document.addEventListener('keyup', function(event) {
    switch (event.keyCode) {
      case 65: // A
        movement.left = false;
        break;
      case 87: // W
        movement.up = false;
        break;
      case 68: // D
        movement.right = false;
        break;
      case 83: // S
        movement.down = false;
        break;        
    }
}); 

socket.emit('new player');
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

function drawTank(player){
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  context.fillStyle = 'green';
  context.translate(player.x + player.width/2, player.y + player.height/2);
  context.rotate(player.rotate);
  context.translate(-(player.x + player.width/2), -(player.y + player.height/2));
  context.fillRect(player.x, player.y, player.width, player.height);
  context.fillStyle = 'black';
  context.fillRect(player.x + player.width/2 + 5, player.y + player.height/2 - 2.5, 30, 5);
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

var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext('2d');
socket.on('state', function(state) {
  context.clearRect(0, 0, 800, 600);
  for (var id in state.players) {
    var player = state.players[id];
    context.beginPath();
    context.save();
    drawTank(player);
    context.restore();
    context.save();
    drawTankStats(player);
  }

  for(var id in state.shots){
    var shot = state.shots[id];
    context.beginPath();
    context.fillRect(shot.x, shot.y, 5, 5);
  }
});
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
      x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
      y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

