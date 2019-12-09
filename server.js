var express = require('express');
var app = express();
var server = require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path = require('path');
var ip = require('ip');
var mongo = require('mongodb').MongoClient;

// Connect to Mongo
mongo.connect('mongodb://localhost:27017/', function(err, clientObj) {
    if(err){
        throw err;
    }
    console.log("Connected to Mongo!");
    var db = clientObj.db('chatdb');
    // connect t socket.io
    client.on('connection', function(socket) {
        console.log("A new user is connected!");
        let chat = db.collection('chats');
        // Create function to send status
        SendStatus = function(s) {
            socket.emit('status', s);
        }

        // get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res) {
            if(err){
                throw err;
            }
            //Emit the messsages to the connected users
            socket.emit('output', res);
        });
        // Handle user inputs / events
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;
            if(name == '' || message == ''){
                // Send error status
                SendStatus('Please Enter a name and message !');
            }else{
                chat.insert( { name: name, message: message } , function() {
                    client.emit('output', [data]);
                    // send status objects
                    SendStatus({
                        message : 'Message Sent',
                        clear : true
                    })
                })
            }
        })
        // Handle Clear
        socket.on('clear', function(data) {
            // Remove all chats from collection
            chat.remove({}, function() {
                socket.emit('cleared')
            })
        })
        // Check for name and messages

        //insert messages
        
        socket.on('disconnect', function() {
            console.log("A user is disconnected!");
        })
    })
})
var port = 8080;
/*
var users = [];

io.on('connection', function(socket) {
    console.log("New Connection made!");
    socket.on('disconnect', function() {
        console.log("Client disconnected!")
    })
});
 */
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

server.listen(port, function() {
    console.log("Server is listening at http://" + ip.address() + ":" + port);
});
