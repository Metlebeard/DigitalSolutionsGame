//join server
let socket = io();
//declare empty room code variable
var PIN;
var yourName = "";

var question = "";
var answer = "";

//add options to join or host
loadStartScreen();

//log if server is connecting
socket.on('connect', function() {
    console.log('Connected to server');
});

//log if server is down
socket.on('disconnect', function() {
    console.log('Disconnected from server');
});

//host a game
function hostGame()
{
    socket.emit('hostRoom');
    clearScreen();
    loadHostScreen();
}

//join a game
function joinGame()
{
    clearScreen();
    loadJoinScreen();
}

//load first screen state
function loadStartScreen()
{
    //create title
    var title = document.createElement('h1');
    title.textContent = "Seff's Math Game";
    title.classList.add('title');
    title.setAttribute('id', 'title');
    //create host button
    var hostButton = document.createElement('button');
    hostButton.textContent = "HOST";
    hostButton.classList.add('host');
    hostButton.setAttribute('onclick', 'hostGame()');
    hostButton.setAttribute('id', 'hostButton');
    //create join button
    var joinButton = document.createElement('button');
    joinButton.textContent = "JOIN";
    joinButton.classList.add('join');
    joinButton.setAttribute('onclick', 'joinGame()');
    joinButton.setAttribute('id', 'joinButton');
    //add to body
    document.body.appendChild(title);
    document.body.appendChild(hostButton);
    document.body.appendChild(joinButton);
}

//load host's screen state
function loadHostScreen()
{
    //create some text
    var text = document.createElement('p');
    text.textContent = "Game PIN:";
    text.setAttribute('id', 'text');
    text.classList.add('text');
    //create code text
    var code = document.createElement('h1');
    code.textContent = "";
    code.setAttribute('id', 'code');
    code.classList.add('code');
    //create start button
    var startButton = document.createElement('button');
    startButton.textContent = "START";
    startButton.setAttribute('id', 'startButton');
    startButton.setAttribute('onclick', 'startGame()');
    startButton.classList.add('startButton');
    //create title
    var title = document.createElement('h1');
    title.textContent = "Seff's Math Game";
    title.setAttribute('id', 'title');
    title.classList.add('hostTitle');
    //create player area
    var playerArea = document.createElement('div');
    playerArea.setAttribute('id', 'playerArea');
    playerArea.classList.add('playerArea');
    //add to body
    document.body.appendChild(text);
    document.body.appendChild(code);
    document.body.appendChild(startButton);
    document.body.appendChild(title);
    document.body.appendChild(playerArea);
}

//prevent form from reloading on submission
//function handleForm(event) { event.preventDefault(); } 

//load client's screen state
function loadJoinScreen()
{
    //create title
    var title = document.createElement('h1');
    title.textContent = "Seff's Math Game";
    title.setAttribute('id', 'title');
    title.classList.add('joinTitle');

    //create form to allow enter key
    var joinForm = document.createElement('form');
    joinForm.setAttribute('onsubmit', 'checkCode(); return false');
    //create code input
    var codeInput = document.createElement('input');
    codeInput.setAttribute('placeholder', 'Enter Game PIN');
    codeInput.setAttribute('id', 'codeInput');
    codeInput.classList.add('codeInput');
    //create new line
    var newLine = document.createElement('br');
    newLine.setAttribute('id', 'newLine');
    //create join button
    var joinButton = document.createElement('button');
    joinButton.textContent = "ENTER PIN"
    joinButton.setAttribute('id', 'joinButton');
    joinButton.setAttribute('type', 'submit');
    joinButton.classList.add('joinButton');

    //add to body
    document.body.appendChild(title);
    document.body.appendChild(joinForm);
    joinForm.appendChild(codeInput);
    joinForm.appendChild(newLine);
    joinForm.appendChild(joinButton);
}

//add code to host's screen
socket.on('hostCode', function(data) {
    document.getElementById('code').textContent = data.code;
    PIN = data.code;
});

//send code to server to check if it exists
function checkCode()
{
    PIN = document.getElementById('codeInput').value;
    socket.emit('checkCode', {
        code: document.getElementById('codeInput').value
    });
}

//response to checking code for existence
socket.on('checkCodeResponse', function(response) {
    if (response.roomFound === true)
    {
        clearScreen();
        loadNameScreen();
    }
    else
    {
        alert("Code is incorrect or doesn't exist");
    }
});
 
//allowing client to enter a custom name
function loadNameScreen()
{
    //create title
    var title = document.createElement('h1');
    title.textContent = "Seff's Math Game";
    title.setAttribute('id', 'title');
    title.classList.add('joinTitle');
    //create form to allow enter key
    var joinForm = document.createElement('form');
    joinForm.setAttribute('onsubmit', 'enterName(); return false');
    //create name input
    var codeInput = document.createElement('input');
    codeInput.setAttribute('placeholder', 'Enter Name');
    codeInput.setAttribute('id', 'nameInput');
    codeInput.classList.add('codeInput');
    // create new line
    var newLine = document.createElement('br');
    newLine.setAttribute('id', 'newLine');
    //create join button
    var joinButton = document.createElement('button');
    joinButton.textContent = "JOIN"
    joinButton.setAttribute('id', 'joinButton');
    joinButton.setAttribute('type', 'submit');
    joinButton.classList.add('joinButton');
    //add to body
    document.body.appendChild(title);
    document.body.appendChild(joinForm);
    joinForm.appendChild(codeInput);
    joinForm.appendChild(newLine);
    joinForm.appendChild(joinButton);
}

//add player to host's screen when connected
socket.on('playerJoined', function(name) {
    var playerArea = document.getElementById('playerArea');
    var player = document.createElement('button');
    player.classList.add('lobbyPlayer');
    player.textContent = name.name;
    player.setAttribute('onclick', 'kick("' + name.name + '")');
    player.setAttribute('id', name.name);
    playerArea.appendChild(player);
});

//send name to server
function enterName()
{ 
    var name = document.getElementById('nameInput').value;
    if (name === '')
        return;
    console.log('Joining room ' + PIN + ' with the name ' + name);
    socket.emit('joinRoom', {
        name: name,
        code: PIN
    });
    yourName = name;
}

socket.on('nameError', function() {
    alert('There is an error with your name');
});

socket.on('nameSuccessful', function() {
    clearScreen();
    //add name to top of the screen
    var lobbyName = document.createElement('h1');
    lobbyName.textContent = yourName;
    lobbyName.classList.add('lobbyName');
    //add text to the center of the screen
    var lobbyText = document.createElement('h1');
    lobbyText.textContent = "Look for your name up on the screen!"
    lobbyText.classList.add('lobbyText');

    document.body.appendChild(lobbyName);
    document.body.appendChild(lobbyText);
});

//clear everything but the scripts
function clearScreen()
{
    var num = document.body.childNodes.length
    for (var i = 4; i < num; i++)
    {
        document.body.removeChild(document.body.lastChild);
    }
}

function kick(player)
{
    document.getElementById(player).remove();
    socket.emit('kickPlayer', {
        name: player,
        code: PIN
    });
}

socket.on('kicked', function() {
    console.log('kicked');
    PIN = "";
    clearScreen();
    loadStartScreen();
});

socket.on('playerLeave', function(data) {
    document.getElementById(data.name).remove();
});

function startGame()
{
    socket.emit('beginGame', {
        //ADD SETTINGS HERE
    });
    clearScreen();
    loadHostGameScreen();
}

socket.on('gameStarted', function() {
    clearScreen();
    loadGameScreen();
});

function loadGameScreen()
{
    var playerBoard = document.createElement('div');
    playerBoard.classList.add('playerBoard');
    playerBoard.setAttribute('id', 'playerBoard');
    var displayName = document.createElement('h1');
    displayName.textContent = yourName;
    displayName.classList.add('yourNameAboveBoard');

    var graphicBoard = document.createElement('canvas');
    graphicBoard.setAttribute('width', '200px');
    graphicBoard.setAttribute('height', '200px');
    graphicBoard.classList.add('graphicBoard');
    graphicBoard.setAttribute("id", "graphicBoard");


    //create form to allow enter key
    var joinForm = document.createElement('form');
    joinForm.setAttribute('onsubmit', 'answerQuestion(); return false');

    var questionBox = document.createElement('div');
    questionBox.classList.add('questionBox');
    questionBox.setAttribute('id', 'questionBox');
    var questionText = document.createElement('h1');
    questionText.classList.add('questionText');
    questionText.setAttribute('id', 'questionText');
    var answerBox = document.createElement('input');
    answerBox.setAttribute('placeholder', 'Put your answer here!');
    answerBox.classList.add('answerBox');
    answerBox.setAttribute('id', 'answerBox');
    var enterButton = document.createElement('button');
    enterButton.setAttribute('id', 'enterButton');
    enterButton.textContent = "Answer";
    enterButton.classList.add('enterButton');
    enterButton.setAttribute('type', 'submit');

    draw("../src/PurplePlayer.png", graphicBoard, 100, 100);
    //meow
    document.body.appendChild(playerBoard);
    playerBoard.appendChild(displayName);
    playerBoard.appendChild(graphicBoard);
    playerBoard.appendChild(questionBox);
    questionBox.appendChild(questionText);
    playerBoard.appendChild(joinForm);
    joinForm.appendChild(answerBox);
    joinForm.appendChild(enterButton);

    requestQuestion();
}

function loadHostGameScreen()
{
    var map = document.createElement('canvas');
    map.setAttribute('height', '500px');
    map.setAttribute('width', '500px');
    map.classList.add('hostMap');



    document.body.appendChild(map);
}

function draw(path, canvas, x, y){
    var img = new Image();
    img.src = path; 
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img,50,50);
}

function requestQuestion()
{
    socket.emit('requestQuestion');
}

socket.on('questionSent', function(data) {
    question = data.question;
    answer = data.answer;

    console.log('Question: ' + question);
    loadQuestion();
});

function loadQuestion()
{
    var questionText = document.getElementById('questionText');
    questionText.textContent = question;
    console.log('loaded');
}

function answerQuestion()
{
    var enteredAnswer = document.getElementById('answerBox').value;
    var questionText = document.getElementById('questionText');

    if (enteredAnswer == answer)
    {
        questionText.textContent = 'CORRECT';
        questionText.style.color = "#3CAEA3";
        enteredAnswer = "";
        questionCorrect();
    }
    else
    {
        questionText.textContent = 'INCORRECT';
        questionText.style.color = "#ED553B";
        enteredAnswer = "";
        questionIncorrect();
    }
}

function questionIncorrect()
{
    setTimeout('', 5000);
    requestQuestion();
}

function questionCorrect()
{
    var questionBox = document.getElementById('questionBox');
    var questionText = document.getElementById('questionText');
    var answerBox = document.getElementById('answerBox');
    var enterButton = document.getElementById('enterButton');

    var playerBoard = document.getElementById('playerBoard');

    questionBox.remove();
    questionText.remove();
    answerBox.remove();
    enterButton.remove();

    var moveUpButton = document.createElement('button');
    moveUpButton.setAttribute('onclick', 'moveUp()');
    moveUpButton.textContent = "Move Up";
    var moveDownButton = document.createElement('button');
    moveDownButton.setAttribute('onclick', 'moveDown()');
    moveUpButton.textContent = "Move Down";
    var moveLeftButton = document.createElement('button');
    moveLeftButton.setAttribute('onclick', 'moveLeft()');
    moveUpButton.textContent = "Move Left";
    var moveRightButton = document.createElement('button');
    moveRightButton.setAttribute('onclick', 'moveUp()');
    moveUpButton.textContent = "Move Right";
    var battleButton = document.createElement('button');
    battleButton.setAttribute('onclick', 'battle()');
    moveUpButton.textContent = "Battle";

    //append children
    playerBoard.appendChild(moveUpButton);
    playerBoard.appendChild(moveDownButton);
    playerBoard.appendChild(moveRightButton);
    playerBoard.appendChild(moveLeftButton);
    playerBoard.appendChild(battleButton);
}