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
io.on('connection', function(socket) {
  socket.on('new player', function() {
    // console.log(socket.id);
    players[socket.id] = {
      x: 300,
      y: 300,
      rotate: 0,
      speed: 3
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
});

setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);