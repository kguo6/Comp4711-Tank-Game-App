var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var mongo = require('mongodb').MongoClient;

// App constants 
app.set('PORT', 8888);
app.set('DB', 'test');

app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Set db connection options
var options = {
    useNewUrlParser: true,
    reconnectTries: 60,
    reconnectInterval: 1000
};

// Establish db connection
mongo.connect(`mongodb://localhost:27017/${app.get('DB')}`, options, (err, client) => {
    
    if (err) {
        console.log(err.stack);
        process.exit(1);
    }

    // Set DB Object
    app.set('DBO', client.db(app.get('DB')));

    // example
    // app.get('DBO').collection('players').insertOne({ name: 'kevin' }, (err, result) => {
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
