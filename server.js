var express = require("express");
var http = require("http");
var favicon = require("serve-favicon");
var path = require("path");
var bodyParser = require("body-parser");
var socketIO = require("socket.io");
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var mongo = require("mongodb").MongoClient;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import Module
const User = require("./database/models/User");
const Achievement = require("./database/models/Achievement");
const Player = require("./src/Player");
const Leaderboard = require("./src/Leaderboard");

const collectionUser = "users";
const collectionAchievements = "achievements";
const FPS = 60;
const CANVAS_HEIGHT = 600 - 15;
const CANVAS_WIDTH = 1000 - 15;
const CANVAS_MIN = -15;

// Set development port
const port = process.argv[2] == "-development" ? 8888 : 80;

// App constants
app.set("PORT", port);
app.set("DB", "test");
app.set("DB_ADMIN", "tank_admin");
app.set("DB_ADMIN_PASSWORD", "yEUgZtyWAy4QC9Tc");

app.use(favicon(path.join(__dirname, "static/assets/images", "favicon.ico")));
app.use("/static", express.static(__dirname + "/static"));

// Generate Leaderboard Instance
const leaderboard = new Leaderboard();

// Register API routes
const socials = require("./routes/social_media_routes");
const users = require("./routes/user_routes");

app.use("/social_media", socials);
app.use("/user", users);

// Routing - GUEST
app.get("/", function(request, response) {
  response.sendFile(path.join(__dirname, "./static/index.html"));
});

// Routing - CORE APP
app.post("/", function(request, response) {
  let id = request.body.id;
  let name = request.body.username;

  // Validate Fields
  if (id == null || name == null || id == "" || name == "") {
    response.status(500).send("ERROR: Unable to Create New User.");
    return;
  }

  // Check If User Already Exists
  let searchUser = {
    id: id,
    name: name
  };

  // Find User in Database
  request.app
    .get("DBO")
    .collection(collectionUser)
    .findOne(searchUser, function(err, result) {
      if (result == null) {
        const newUser = new User(id, name, 0);
        request.app
          .get("DBO")
          .collection(collectionUser)
          .insertOne(newUser, (err, result) => {
            if (err) {
              response.status(500).send(err);
            } else {
              response.cookie("userID", id);
              response.sendFile(path.join(__dirname, "./static/index.html"));
            }
          });
      } else {
        response.cookie("userID", id);
        response.sendFile(path.join(__dirname, "./static/index.html"));
      }
    });
});

// Set db connection options
let options = {
  useNewUrlParser: true,
  reconnectTries: 60,
  reconnectInterval: 1000
};

// Establish db connection
mongo.connect(
  `mongodb+srv://${app.get("DB_ADMIN")}:${app.get(
    "DB_ADMIN_PASSWORD"
  )}@cluster0-3rcql.mongodb.net/${app.get(
    "DB"
  )}?retryWrites=true&authMechanism=SCRAM-SHA-1&authSource=admin`,
  options,
  (err, client) => {
    if (err) {
      console.log(err.stack);
      process.exit(1);
    }

    // Set DB Object
    app.set("DBO", client.db(app.get("DB")));

    app
      .get("DBO")
      .listCollections()
      .toArray(function(err, collections) {
        //collections = [{"name": "coll1"}, {"name": "coll2"}]
        let found = false;

        if (collections.length > 0) {
          for (var i = 0; i < collections.length; i++) {
            if (collections[i].name === "achievements") {
              found = true;
            }
          }
        }

        // Create Achievement Collection if Not Found
        if (!found) {
          achievements = [];

          // Achievement 5 Kill
          achievement = new Achievement(
            "Bounty Hunter",
            "Destroying 5 Tanks on Call of Tanks",
            5
            //imageURL
          );
          achievements.push(achievement);

          // Achievment 10 Kill
          achievement = new Achievement(
            "Executioner",
            "Destroying 10 Tanks on Call of Tanks",
            10
            //imageURL
          );
          achievements.push(achievement);

          // Achivement 20 Kill
          achievement = new Achievement(
            "Collosus",
            "Destroying 20 Tanks on Call of Tanks",
            20
            //imageURL
          );
          achievements.push(achievement);

          // Achievement 50 Kill
          achievement = new Achievement(
            "Terminator",
            "Destroying 50 Tanks on Call of Tanks",
            50
            //imageURL
          );
          achievements.push(achievement);

          // Achievement 100 Kill
          achievement = new Achievement(
            "Big Daddy",
            "Destroying 100 Tanks on Call of Tanks",
            100
            //imageURL
          );
          achievements.push(achievement);

          // Achievement 500 Kill
          achievement = new Achievement(
            "Godlike",
            "Destroying 500 Tanks on Call of Tanks",
            500
            //imageURL
          );
          achievements.push(achievement);

          app
            .get("DBO")
            .collection(collectionAchievements)
            .insertMany(achievements, (err, result) => {
              if (err) {
                console.log(err);
              }
            });
        }
      });

    // example
    // app.get('DBO').collection('scores').insertOne({ name: 'kevin', score: 42 }, (err, result) => {
    //     if (err) {
    //         console.log(err);
    //     }
    // });
  }
);

// Starts the server
server.listen(app.get("PORT"), function() {
  console.log(`Starting server on port ${app.get("PORT")}...`);
});

// setInterval(function() {
//     io.sockets.emit('message', 'hi!');
//   }, 1000);

var players = {};
var projectiles = {};

io.on("connection", function(socket) {
  socket.on("new player", function(name) {
    players[socket.id] = Player.createNewPlayer(socket.id, name);
    leaderboard.addPlayer(players[socket.id]);
    leaderboard.sortPlayers();
    io.sockets.emit("update scoreboard", leaderboard.getPlayers());
  });

  socket.on("remove player", function(id) {
    if (leaderboard.playerExists(id)) {
      leaderboard.removePlayer(players[id]);
      leaderboard.sortPlayers();
      io.sockets.emit("update scoreboard", leaderboard.getPlayers());
    }
    delete players[id];
  });

  socket.on("disconnect", function() {
    if (leaderboard.playerExists(socket.id)) {
      leaderboard.removePlayer(players[socket.id]);
      leaderboard.sortPlayers();
      io.sockets.emit("update scoreboard", leaderboard.getPlayers());
    }
    delete players[socket.id];
  });

  // Tank movement and life status
  socket.on('update tank', function(data) {
    var player = players[socket.id] || {};

    if (data.left) {
      // player.x -= 5;
      player.rotate -= (player.speed * Math.PI) / 180;
    }
    if (data.right) {
      // player.x += 5;
      player.rotate += (player.speed * Math.PI) / 180;
    }

    if (data.up) {
      player.x += player.speed * Math.cos(player.rotate);
      player.y += player.speed * Math.sin(player.rotate);
      checkInBounds(player.x, player.y, player.id);
    }

    if (data.down) {
      player.x -= player.speed * Math.cos(player.rotate);
      player.y -= player.speed * Math.sin(player.rotate);
      checkInBounds(player.x, player.y, player.id);
    }

    if (data.shoot) {
      if (!projectiles[socket.id]) {
        projectiles[socket.id] = {
          player: socket.id,
          hitbox: 10,
          x: player.x + player.width / 2,
          y: player.y + player.height / 2 - 2.5,
          xvel: player.shot_speed * Math.cos(player.rotate),
          yvel: player.shot_speed * Math.sin(player.rotate),
          distance: 0,
          max_distance: player.range
        };
      }
    }

    // Check if the player has died
    if(player.hp <= 0) {
      // Remove Player and update leaderboard
      if (leaderboard.playerExists(socket.id)) {
        leaderboard.removePlayer(players[socket.id]);
        leaderboard.sortPlayers();
        io.sockets.emit("update scoreboard", leaderboard.getPlayers());
      }
      socket.emit('show dead modal', player);
      delete players[socket.id];
    }

    if(projectiles[socket.id] != undefined) {
      let projectile = projectiles[socket.id];

      for(let playerId in players) {
        if(playerId != socket.id) { // Ignore if it is the current player
          let player = players[playerId];
          if(projectile.id != playerId &&
            checkCollision(player.x, player.y, player.hitbox,
                          projectile.x, projectile.y, projectile.hitbox)) {
            tankHit(playerId, socket.id);
          }
        }
      }

      if(projectiles[socket.id]) {
        if(projectile.distance < projectile.max_distance){
          projectile.x += projectile.xvel;
          projectile.y += projectile.yvel;
          projectile.distance += Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel);
        } else {
          delete projectiles[projectile.player];
        }
      }
    }
  });

  // Projectile
  socket.on('shoot', function() {

  });

  socket.on('update projectile', function() {
    
      // for(let projectileId in projectiles){
      //   let projectile = projectiles[projectileId];

      //   if(projectile.distance < projectile.max_distance){
      //     projectile.x += projectile.xvel;
      //     projectile.y += projectile.yvel;
      //     projectile.distance += Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel);
      //   } else {
      //     delete projectiles[projectile.player];
      //     continue;
      //   }

      //   for(let playerId in players) {
      //     let player = players[playerId];
      //     if(projectileId != playerId &&
      //       checkCollision(player.x, player.y, player.hitbox,
      //                     projectile.x, projectile.y, projectile.hitbox)) {
      //       tankHit(playerId, projectileId);
      //     }
      //   }
      //   // console.log(Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel))
      // }

        // console.log(projectiles[socket.id]);
        if(projectiles[socket.id] != undefined) {
          let projectile = projectiles[socket.id];

          for(let playerId in players) {
            if(playerId != socket.id) { // Ignore if it is the current player
              let player = players[playerId];
              if(projectile.id != playerId &&
                checkCollision(player.x, player.y, player.hitbox,
                              projectile.x, projectile.y, projectile.hitbox)) {
                tankHit(playerId, socket.id);
              }
            }
          }

          if(projectiles[socket.id]) {
            if(projectile.distance < projectile.max_distance){
              projectile.x += projectile.xvel;
              projectile.y += projectile.yvel;
              projectile.distance += Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel);
            } else {
              delete projectiles[projectile.player];
            }
          }
        }
        // console.log(Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel))

  });

  // socket.on('update dead players', function() {
  //   for(let playerId in players) {

  //     if(playerId === socket.id) {
  //       if(players[playerId].hp <= 0) {

  //         delete players[playerId];
  //         socket.emit('show dead modal');
  //       }
  //     }
  //   }
  // })

  // Delete player and show dead modal
  socket.on("player died", function(deadPlayerId) {
    if (socket.id === deadPlayerId) {
      let playerCopy = players[deadPlayerId];
      socket.emit("show dead modal", playerCopy);

      // Remove Player and update leaderboard
      if (leaderboard.playerExists(deadPlayerId)) {
        leaderboard.removePlayer(players[deadPlayerId]);
        leaderboard.sortPlayers();
        io.sockets.emit("update scoreboard", leaderboard.getPlayers());
      }
      delete players[deadPlayerId];
    }
  });
});

/* Game updates the state of all players at a rate of FPS */
setInterval(function() {
  io.sockets.emit("state", { players, projectiles });
}, 1000 / FPS);


/*              Helper Functions                */
/*                                              */

/**
 * Updates the damage done to a tank and checks increments kill count if dead
 * @param {*} playerId Id of the player who was hit by a projectile
 * @param {*} projectileId Id of the projectile's player
 */
function tankHit(playerId, projectileId) {
  delete projectiles[projectileId]; // Delete Projectile
  console.log(playerId + " was hit!");
  console.log("projectId:" + projectileId);
  // If target exists, they take damage
  if(players[playerId]){ 
    players[playerId].hp -= 1;
    // console.log("Damage done: " + 1);
    // If target died from damage, increment shooter's kill counter
    if(players[playerId].hp == 0) {
      players[projectileId].kills += 1;
      leaderboard.updatePlayer(players[projectileId]);
    }
  }
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
function checkCollision(playerX, playerY, playerHitBox,
  shotX, shotY, shotHitBox) {
let minDist = playerHitBox + shotHitBox;
return getEuclideanDist(playerX, playerY, shotX, shotY) < (minDist * minDist);
};

/**
* Returns the Euclidean distance between 2 x and y coordinates.
* @param {*} x1 x coordinate of the 1st point
* @param {*} y1 y coordinate of the 1st point
* @param {*} x2 x coordinate of the 2nd point
* @param {*} y2 y coordinate of the 2nd point
*/
function getEuclideanDist(x1, y1, x2, y2,) {
return ((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2));
}

/**
 * Checks if a player's position is within bounds.
 * @param {*} x coordinate of the tank's x
 * @param {*} y coordinate of the tank's y
 * @param {*} playerId SocketId of the player
 */
function checkInBounds(x, y, playerId) {
  if(x < CANVAS_MIN) {
    players[playerId].x = CANVAS_MIN;
  }
  if(x > CANVAS_WIDTH) {
    players[playerId].x = CANVAS_WIDTH;
  }
  if(y < CANVAS_MIN) {
    players[playerId].y = CANVAS_MIN;
  }
  if(y > CANVAS_HEIGHT) {
    players[playerId].y = CANVAS_HEIGHT;
  }
}