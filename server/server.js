//include external libraries
const path = require('path');
const http = require('http');
const fs = require('fs'); //file reader library
const express = require('express');
const socketIO = require('socket.io');

//link public folder
const publicPath = path.join(__dirname, '/../public');
//set port to 2244
const port = process.env.PORT || 2244;
//create server functionality
let app = express();
//create server
let server = http.createServer(app);
//allow client connections
let io = socketIO(server);

//rooms
//[0]Host Socket, [1]Room Code, [2]Player Arrays
let rooms = [];

//redirect clients to index.html in public/
app.use(express.static(publicPath));

//client connects
io.on('connection', (socket) => {
    //log user connections
    console.log('A new user just connected');
    //if client selects "Host" add the room to the rooms array and set a keycode
    socket.on('hostRoom', () => {
        var room = [];
        room.push(socket);

        var roomCode = '';
        for (var i = 0; i < 6; i++)
        {
            roomCode += randInt(0, 9);
        }
        room.push(roomCode);

        var players = [];
        room.push(players);

        rooms.push(room);

        console.log('room created');
        socket.emit('hostCode', {
            code: roomCode
        });
        console.log('code sent')
    });    

    //when client tries to join room see if room exists
    socket.on('checkCode', (code) => {
        var roomFound = false;
        for (var i = 0; i < rooms.length; i++)
        {
            if (!roomFound)
            {
                if (code.code === rooms[i][1])
                {
                    roomFound = true;
                }
            }
        }
        if (roomFound)
        {
            socket.emit('checkCodeResponse', {
                roomFound: true
            });
        }
        else
        {
            socket.emit('checkCodeResponse', {
                roomFound: false
            });
        }
    });

    //add players name and socket to the room with code they've used
    socket.on('joinRoom', (data) => {
        //player[name, points, lives, socket]
        var player = [];
        player.push(data.name);
        player.push(0);
        player.push(3);
        player.push(socket);
        for (var i = 0; i < rooms.length; i++)
        {
            if (data.code === rooms[i][1])
            {

                for (var j = 0; j < rooms[i][2].length; j++)
                {
                    if (data.name === rooms[i][2][j][0])
                    {
                        console.log('player tried to join with the same name')
                        socket.emit('nameError');
                        return;
                    }
                }
                socket.emit('nameSuccessful');
                

                rooms[i][2].push(player);
                console.log('player ' + data.name + ' has joined a room');

                rooms[i][0].emit('playerJoined', {
                    name: data.name
                });
            }
        }
    });

    socket.on('kickPlayer', (player) => {
        kickPlayer(player.name, player.code);
    });

    socket.on('beginGame', () => {
        for (var i = 0; i < rooms.length; i++)
        {
            if (rooms[i][0] === socket)
            {
                for (var j = 0; j < rooms[i][2].length; j++)
                {
                    rooms[i][2][j][3].emit('gameStarted');
                    for (var k = 0; k < rooms[i][2].length; k++)
                    {
                        rooms[i][2][j][3].emit('loadPlayerInGame', {
                            name: rooms[i][2][k][0]
                        })
                    }
                }
            }
        }
    });

    socket.on('requestQuestion', () => {
        var questions = [];
        fs.readFile('public/src/questions.txt', (err, data) => {
            if (err) throw err;
        
            console.log(data.toString());
            questions.push(data.toString());
        });

        return;

        var chosenQuestion = randInt(0, questions.length-1);
        var question = "";
        var answer = "";
        var questionToAnswer = false;
        console.log(chosenQuestion);
        console.log(questions[chosenQuestion]);
        for (var i = 0; i < questions[chosenQuestion].length; i++)
        {
            if (questions[chosenQuestion][i] == "=")
            {
                questionToAnswer = true;
            }
            if (!questionToAnswer)
            {
                question += questions[chosenQuestion][i];
            }
            else
            {
                answer += questions[chosenQuestion][i];
            }
        }

        socket.emit('questionSent', {
            question: question,
            answer: answer
        });
    });

    //client disconnects
    socket.on('disconnect', () => {
        console.log('User was disconnected');
        for (var i = 0; i < rooms.length; i++)
        {
            //if player is in a room leave it
            for (var j = 0; j < rooms[i][2].length; j++)
            {
                if (rooms[i][2][j][3] === socket)
                {
                    rooms[i][0].emit('playerLeave', {
                        name: rooms[i][2][j][0]
                    });
                    rooms[i][2].splice(j, 1);
                }
            }
            //if player leaving is a host, delete room
            if (rooms[i][0] === socket)
            {
                //kick all players connected
                for (var j = 0; j < rooms[i][2].length; j++)
                {
                    kickPlayer(rooms[i][2][j][0], rooms[i][1]);
                }
                console.log('deleted room');
                rooms.splice(i, 1);
            }
        }
    });
});

//open server on port (port is set at the top of the file)
server.listen(port, () => {
    console.log('Server is up on port ' + port);
});

//random number generator
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function kickPlayer(name, code)
{
    for (var i = 0; i < rooms.length; i++)
    {
        if (rooms[i][1] === code)
        {
            for (var j = 0; j < rooms[i][2].length; j++)
            {
                if (rooms[i][2][j][0] === name)
                {
                    rooms[i][2][j][3].emit('kicked');
                    console.log('user ' + name + ' was kicked from room ' + code);
                    rooms[i][2].splice(j, 1);
                }
            }
        }
    }
}




/*
Game Idea

Each player gets an option to choose (Search, Gather, Fight etc.)
After choosing the player must answer a math question
Getting it right will allow the player to attempt to succeed in the ction (for example getting it
    right then has a 80% chance of landing a hit etc.)
Getting it wrong will end with a consequence (Snake jumps out of aa bush and attacks)

The winner is the last person standing

SO GOOD


*/