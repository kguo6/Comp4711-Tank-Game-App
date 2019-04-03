// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 8888);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(8888, function() {
  console.log('Starting server on port 8888');
});

// setInterval(function() {
//     io.sockets.emit('message', 'hi!');
//   }, 1000);

var players = {};
var shots = {};
io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = {
      name: socket.id, // Connect with userName
      hp: 1, 
      x: 300,
      y: 300,
      rotate: 0,
      speed: 3,
      shot_speed: 9,
      width: 40,
      height: 35,
      range: 500
    };
  });

  socket.on('disconnect', function() {
    delete players[socket.id];
  });

  socket.on('movement', function(data) {
    var player = players[socket.id] || {};

    if (data.left) {
      // player.x -= 5;
      player.rotate -= player.speed * Math.PI/180;
    }
    if (data.right) {
      // player.x += 5;
      player.rotate += player.speed * Math.PI/180;
    }

    if (data.up) {
      player.x += player.speed * Math.cos(player.rotate);
      player.y += player.speed * Math.sin(player.rotate);
    }

    if (data.down) {
      player.x -= player.speed * Math.cos(player.rotate);
      player.y -= player.speed * Math.sin(player.rotate);
    }
  });

  socket.on('shoot', function(){
    var player = players[socket.id] || {};
    var d = new Date();
    if(!shots[socket.id]){
      shots[socket.id] = {
        player: socket.id,
        x: player.x + player.width/2,
        y: player.y + player.height/2 - 2.5,
        xvel: player.shot_speed * Math.cos(player.rotate),
        yvel: player.shot_speed * Math.sin(player.rotate),
        distance: 0,
        max_distance: player.range
      } 
    }
  });

  socket.on('died', function(){
    let player = players[socket.id];
    socket.emit('player state', player);
  });

  socket.on('move shot', function(){
    for(let id in shots){
      let shot = shots[id]
      // console.log(Math.sqrt(shot.xvel * shot.xvel + shot.yvel * shot.yvel))
      if(shot.distance < shot.max_distance){
        shot.x += shot.xvel;
        shot.y += shot.yvel;
        shot.distance += Math.sqrt(shot.xvel * shot.xvel + shot.yvel * shot.yvel);
      } else{
        delete shots[shot.player];
      }
    }
  })
});


setInterval(function() {
  io.sockets.emit('state', { players, shots });
}, 1000 / 60);