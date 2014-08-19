// Including libraries

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    static = require('node-static'); // for serving files

// This will make all the files in the current folder
// accessible from the web
var fileServer = new static.Server('./');

// This is the port for our web server.
// you will need to go to http://localhost:1337 to see it
app.listen(1337);

var clients = [],
    lastPlayer;

var words = ['penis', 'banana', 'sausage', 'rocket', 'car', 'cat', 'computer', 'ninja', 'giraffe', 'glasses', 'dog', 'alien', 'monster'];

// If the URL of the socket server is opened in a browser
function handler (request, response) {

    request.addListener('end', function () {
        fileServer.serve(request, response); // this will return the correct file
    });
}

// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

    var user = Math.floor(Math.random()*10001);
    socket.broadcast.emit('user_connected', user);

    console.info('New client connected (id=' + socket.id + ').');
    clients.push(socket);

    // Start listening for mouse move events
    socket.on('mousemove', function (data) {

        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
        socket.broadcast.emit('moving', data);
    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('user_disconnected', user);

        var index = clients.indexOf(socket);
        if (index != -1) {
            clients.splice(index, 1);
            console.info('Client gone (id=' + socket.id + ').');
        }
    });
});

// Give word to random user every 70 seconds
setInterval(function(socket){
    var randomClient;
    if (clients.length > 0) {
        randomClient = Math.floor(Math.random() * clients.length);

        // Dont have same player have two rounds in a row, BROKEN =(
        /*if(clients[randomClient] == lastPlayer) {
            if(randomClient == 0) {
                randomClient = randomClient-1;
            } else if(randomClient == clients.length) {
                randomClient = randomClient+1;
            }
        }*/

        lastPlayer = clients[randomClient];

        // Get a word randomly
        randomWord = Math.floor(Math.random() * words.length);

        clients[randomClient].emit('new_word', words[randomWord]);
        io.sockets.emit('the_word', words[randomWord]);
    }
}, 70000);