var express = require('express');
var http = require('http');
var favicon = require('serve-favicon')
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


// Import Module
const User = require("./database/models/User");
const Achievement = require("./database/models/Achievement");
const collectionUser = "users";
const collectionAchievements = "achievements";
const FPS = 60;

// Set development port
const port = process.argv[2] == "-development" ? 8888 : 80;

// App constants
app.set('PORT', port);
app.set('DB', 'test');
app.set('DB_ADMIN', 'tank_admin');
app.set('DB_ADMIN_PASSWORD', 'yEUgZtyWAy4QC9Tc');

app.use(favicon(path.join(__dirname, 'static/images', 'favicon.ico')))
app.use('/static', express.static(__dirname + '/static'));

// Register API routes
const socials = require("./routes/social_media_routes");
const users = require("./routes/user_routes");

app.use("/social_media", socials);
app.use("/user", users);

// Routing - GUEST
app.get("/", function (request, response) {
    response.sendFile(path.join(__dirname, "./static/index.html"));
});

// Routing - CORE APP
app.post("/", function (request, response) {
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
        .findOne(searchUser, function (err, result) {
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
mongo.connect(`mongodb+srv://${app.get('DB_ADMIN')}:${app.get('DB_ADMIN_PASSWORD')}@cluster0-3rcql.mongodb.net/${app.get('DB')}?retryWrites=true&authMechanism=SCRAM-SHA-1&authSource=admin`, options, (err, client) => {

    if (err) {
        console.log(err.stack);
        process.exit(1);
    }

    // Set DB Object
    app.set("DBO", client.db(app.get("DB")));

    app
        .get("DBO")
        .listCollections()
        .toArray(function (err, collections) {
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
                    "Big Daddy",
                    "Destroying 50 Tanks on Call of Tanks",
                    50
                    //imageURL
                );
                achievements.push(achievement);

                // Achievement 100 Kill
                achievement = new Achievement(
                    "Jesus",
                    "Destroying 100 Tanks on Call of Tanks",
                    100
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
server.listen(app.get("PORT"), function () {
    console.log(`Starting server on port ${app.get("PORT")}...`);
});

// setInterval(function() {
//     io.sockets.emit('message', 'hi!');
//   }, 1000);

var players = {};
var projectiles = {};

io.on('connection', function (socket) {
    socket.on('new player', function () {
        players[socket.id] = Player.createNewPlayer(socket.id, socket.id);
    });

    socket.on('disconnect', function () {
        delete players[socket.id];
    });

    socket.on('movement', function (data) {
        var player = players[socket.id] || {};

        if (data.left) {
            // player.x -= 5;
            player.rotate -= player.speed * Math.PI / 180;
        }
        if (data.right) {
            // player.x += 5;
            player.rotate += player.speed * Math.PI / 180;
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

    socket.on('shoot', function () {
        var player = players[socket.id] || {};
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
            }
        }
    });

    socket.on('move projectile', function () {
        for (let id in projectiles) {
            let projectile = projectiles[id];
            // console.log(Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel))
            if (projectile.distance < projectile.max_distance) {
                projectile.x += projectile.xvel;
                projectile.y += projectile.yvel;
                projectile.distance += Math.sqrt(projectile.xvel * projectile.xvel + projectile.yvel * projectile.yvel);
            } else {
                delete projectiles[projectile.player];
            }
        }
    })

    // @param data.projectileId - Socket Id of the player who shot the projectile
    // @param data.targetId     - Socket Id of the player hit by the projectile
    socket.on('tank hit', function (data) {
        delete projectiles[data.projectileId]; // Delete Projectile

        // If target exists, they take damage
        if (players[data.targetId]) {
            if(players[data.targetId].hp >= 0){
                players[data.targetId].hp -= 0.5;
            }

            // If target died from damage, increment shooter's kill counter
            if (players[data.targetId].hp == 0) {
                players[data.projectileId].kills += 1;
            }
        }

    });

    // Delete player and show dead modal
    socket.on('player died', function (deadPlayerId) {
        if (socket.id === deadPlayerId) {
            let playerCopy = players[deadPlayerId];
            socket.emit('show dead modal', playerCopy);
            delete players[deadPlayerId];
        }
    });
});

/* Game updates the state of all players at a rate of FPS */
setInterval(function () {
    io.sockets.emit('state', { players, projectiles });
}, 1000 / FPS);
