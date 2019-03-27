var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var mongo = require('mongodb').MongoClient;

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
    response.sendFile(path.join(__dirname, 'index.html'));
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

io.on('connection', function (socket) {
    socket.on('new player', function () {
        console.log(socket.id);
        players[socket.id] = {
            x: 300,
            y: 300
        };
    });

    socket.on('disconnect', function () {
        delete players[socket.id];
    });

    socket.on('movement', function (data) {
        var player = players[socket.id] || {};
        if (data.left) {
            player.x -= 5;
        }
        if (data.up) {
            player.y -= 5;
        }
        if (data.right) {
            player.x += 5;
        }
        if (data.down) {
            player.y += 5;
        }
    });
});

setInterval(function () {
    io.sockets.emit('state', players);
}, 1000 / 60);
