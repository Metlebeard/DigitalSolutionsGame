//INCLUDE EXTERNAL LIBRARIES - - -
const path = require('path'); //re-routing library
const http = require('http'); //server creating library
const fs = require('fs'); //file reader library
const express = require('express'); //server running library
const socketIO = require('socket.io'); //client input/output library

//SERVER SET UP - - -
const publicPath = path.join(__dirname, '/../public'); //link public folder
const port = process.env.PORT || 2244; //set port to 2244
let app = express(); //create server functionality
let server = http.createServer(app); //create server
let io = socketIO(server); //allow client connections
app.use(express.static(publicPath)); //redirect clients to index.html in public

//ROOMS - - -
//room reference: [0]Host Socket, [1]Room Code, [2]Player Arrays, [3]Map Array
let rooms = []; //create 

//CLIENT CONNECTION - - -
io.on('connection', (socket) => {
    console.log('A new user just connected'); //log user connections

    //runs if client selects "Host" option
    socket.on('hostRoom', () => {
        var room = []; //create room variable
        room.push(socket); //attach host's connection to room

        var roomCode = ''; //create room's code variable
        //create a random 6 digit code
        for (var i = 0; i < 6; i++)
        {
            roomCode += randInt(0, 9);
        }
        room.push(roomCode); //attach room code to room

        var players = []; //create playerList variable
        room.push(players); //attach playerlist to room

        var mapData = []; //create map variable
        //create a 7x7 vector map (mapData[x][y])
        for (var x = 0; x < 7; x++)
        {
            var xRow = [];
            for (var y = 0; y < 7; y++)
            {
                var tile = [];
                xRow.push(tile);
            }
            mapData.push(xRow);
        }
        room.push(mapData); //attach map to room
        rooms.push(room); //attach the room to the room list
        console.log('room created'); //log that room has been created

        //send the code to the host
        socket.emit('hostCode', {
            code: roomCode
        });
        console.log('code sent') //log that code has been sent
    });    

    //when client tries to join room see if room exists
    socket.on('checkCode', (code) => {
        var roomFound = false; //set roomFound to false
        //check all rooms and see if the code matches
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

    //runs if client selects "Join" option and submits valid code and name
    socket.on('joinRoom', (data) => {
        //player reference :\\: [0]name [1]KOs [2]lives [3]socket
        var player = []; //create player variable
        player.push(data.name); //attach submitted name to player
        player.push(0); //set KOs to 0
        player.push(3); //set lives to 3
        player.push(socket); //attach client's connection

        //check for room and see if name is available
        for (var i = 0; i < rooms.length; i++)
        {
            if (data.code === rooms[i][1])
            {

                for (var j = 0; j < rooms[i][2].length; j++)
                {
                    if (data.name === rooms[i][2][j][0])
                    {
                        console.log('player tried to join with the same name');
                        socket.emit('nameError');
                        return;
                    }
                }
                socket.emit('nameSuccessful');
                
                rooms[i][2].push(player);
                var xPos = randInt(0, 7);
                var yPos = randInt(0, 7);
                rooms[i][3][xPos][yPos].push(data.name);
                rooms[i][0].emit('setPlayerPos', {
                    name: data.name,
                    x: xPos,
                    y: yPos
                });
                socket.emit('localPosition', {
                    x: xPos,
                    y: yPos
                });
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
        var text = fs.readFileSync('public/src/questions.txt', 'utf-8');
        var questions = text.split('\n');

        var chosenQuestion = randInt(0, questions.length-1);
        var question = "";
        var answer = "";
        var questionToAnswer = false;
        console.log(chosenQuestion);
        console.log(questions[chosenQuestion]);
        for (var i = 0; i < questions[chosenQuestion].length; i++)
        {
            if (!questionToAnswer)
            {
                if (questions[chosenQuestion][i] === "=")
                {
                    questionToAnswer = true;
                }
                else
                {
                    question += questions[chosenQuestion][i];
                }
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

    socket.on('moveUp', () => {
        for (var i = 0; i < rooms.length; i++)
        {
            for (var j = 0; j < rooms[i][2].length; j++)
            {
                if (rooms[i][2][j][3] === socket)
                {
                    for (var x = 0; x < rooms[i][3].length; x++)
                    {
                        for (var y = 0; y < rooms[i][3][x].length; y++)
                        {
                            if (rooms[i][3][x][y].includes(rooms[i][2][j][0]))
                            {
                                for (var k = 0; k < rooms[i][3][x][y].length; k++)
                                {
                                    if (rooms[i][3][x][y][k] === rooms[i][2][j][0])
                                    {
                                        rooms[i][3][x][y].splice(k, 1);
                                        rooms[i][3][x][y-1].push(rooms[i][2][j][0]);
                                        rooms[i][0].emit('setPlayerPos', {
                                            name: rooms[i][2][j][0],
                                            x: x,
                                            y: y-1
                                        });
                                        socket.emit('localPosition', {
                                            x: x,
                                            y: y-1
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    socket.on('moveDown', () => {
        for (var i = 0; i < rooms.length; i++)
        {
            for (var j = 0; j < rooms[i][2].length; j++)
            {
                if (rooms[i][2][j][3] === socket)
                {
                    for (var x = 0; x < rooms[i][3].length; x++)
                    {
                        for (var y = 0; y < rooms[i][3][x].length; y++)
                        {
                            if (rooms[i][3][x][y].includes(rooms[i][2][j][0]))
                            {
                                for (var k = 0; k < rooms[i][3][x][y].length; k++)
                                {
                                    if (rooms[i][3][x][y][k] === rooms[i][2][j][0])
                                    {
                                        rooms[i][3][x][y].splice(k, 1);
                                        rooms[i][3][x][y+1].push(rooms[i][2][j][0]);
                                        rooms[i][0].emit('setPlayerPos', {
                                            name: rooms[i][2][j][0],
                                            x: x,
                                            y: y+1
                                        });
                                        socket.emit('localPosition', {
                                            x: x,
                                            y: y+1
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    socket.on('moveRight', () => {
        for (var i = 0; i < rooms.length; i++)
        {
            for (var j = 0; j < rooms[i][2].length; j++)
            {
                if (rooms[i][2][j][3] === socket)
                {
                    for (var x = 0; x < rooms[i][3].length; x++)
                    {
                        for (var y = 0; y < rooms[i][3][x].length; y++)
                        {
                            if (rooms[i][3][x][y].includes(rooms[i][2][j][0]))
                            {
                                for (var k = 0; k < rooms[i][3][x][y].length; k++)
                                {
                                    if (rooms[i][3][x][y][k] === rooms[i][2][j][0])
                                    {
                                        rooms[i][3][x][y].splice(k, 1);
                                        rooms[i][3][x+1][y].push(rooms[i][2][j][0]);
                                        rooms[i][0].emit('setPlayerPos', {
                                            name: rooms[i][2][j][0],
                                            x: x+1,
                                            y: y
                                        });
                                        socket.emit('localPosition', {
                                            x: x+1,
                                            y: y
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    socket.on('moveLeft', () => {
        for (var i = 0; i < rooms.length; i++)
        {
            for (var j = 0; j < rooms[i][2].length; j++)
            {
                if (rooms[i][2][j][3] === socket)
                {
                    for (var x = 0; x < rooms[i][3].length; x++)
                    {
                        for (var y = 0; y < rooms[i][3][x].length; y++)
                        {
                            if (rooms[i][3][x][y].includes(rooms[i][2][j][0]))
                            {
                                for (var k = 0; k < rooms[i][3][x][y].length; k++)
                                {
                                    if (rooms[i][3][x][y][k] === rooms[i][2][j][0])
                                    {
                                        rooms[i][3][x][y].splice(k, 1);
                                        rooms[i][3][x-1][y].push(rooms[i][2][j][0]);
                                        rooms[i][0].emit('setPlayerPos', {
                                            name: rooms[i][2][j][0],
                                            x: x-1,
                                            y: y
                                        });
                                        socket.emit('localPosition', {
                                            x: x-1,
                                            y: y
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
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