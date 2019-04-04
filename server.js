var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var mongo = require('mongodb').MongoClient;
var Player = require('./static/Player');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// App constants 
app.set('PORT', 8888);
app.set('DB', 'test');
app.set('DB_ADMIN', 'tank_admin');
app.set('DB_ADMIN_PASSWORD', 'yEUgZtyWAy4QC9Tc');

app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/index.html'));
});

const socials = require('./routes/social_media_routes');

// Register API routes
app.use('/social_media', socials);

// Set db connection options
let options = {
    useNewUrlParser: true,
    reconnectTries: 60,
    reconnectInterval: 1000
};

// Establish db connection
mongo.connect(`mongodb+srv://${app.get('DB_ADMIN')}:${app.get('DB_ADMIN_PASSWORD')}@cluster0-3rcql.mongodb.net/${app.get('DB')}?retryWrites=true&authMechanism=SCRAM-SHA-1&authSource=admin`, options, (err, client) => {
    
    if (err) {
        console.log(err.stack);
        process.exit(1);
    }

    // Set DB Object
    app.set('DBO', client.db(app.get('DB')));

    // example
    // app.get('DBO').collection('scores').insertOne({ name: 'kevin', score: 42 }, (err, result) => {
    //     if (err) {
    //         console.log(err);
    //     }
    // });
});

// Starts the server
server.listen(app.get('PORT'), function () {
    console.log(`Starting server on port ${app.get('PORT')}...`);
});

// setInterval(function() {
//     io.sockets.emit('message', 'hi!');
//   }, 1000);

var players = {};
var projectiles = {};

io.on('connection', function(socket) {
  socket.on('new player', function() {
  
    // players[socket.id] = {
    //   id: socket.id,
    //   name: socket.id, // Connect with userName later
    //   hp: 1, 
    //   hitBoxSize: 20,
    //   x: 300,
    //   y: 300,
    //   rotate: 0,
    //   speed: 3,
    //   shot_speed: 9,
    //   width: 40,
    //   height: 35,
    //   range: 500
    // };
    players[socket.id] = Player.createNewPlayer(socket.id, socket.id);
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
    if(!projectiles[socket.id]){
      projectiles[socket.id] = {
        player: socket.id,
        hitbox: 10,
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

  socket.on('move projectile', function(){
    for(let id in projectiles){
      let projectile = projectiles[id];
      // console.log(Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel))
      if(projectile.distance < projectile.max_distance){
        projectile.x += projectile.xvel;
        projectile.y += projectile.yvel;
        projectile.distance += Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel);
      } else {
        delete projectiles[projectile.player];
      }
    }
  })
  
  socket.on('tankHit', function(data){
    delete projectiles[data.projectileId];
    // console.log(data.projectileId);
    // console.log("Shot deleted");

    players[data.targetId].hp = players[data.targetId].hp - 0.5;
    // console.log(data.targetId);
    // console.log(players[data.targetId].hp);
    if(players[data.targetId].hp <= 0) {
      
    }
  });
});

setInterval(function() {
  io.sockets.emit('state', { players, projectiles });
}, 1000 / 60);