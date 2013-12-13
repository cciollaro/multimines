var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var partials = require('express-partials');
var app = module.exports = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var board_stuff = require('./lib/board_stuff.js');

// all environments
app.set('port', 3000);
app.use(express.favicon(__dirname + '/public/images/go.ico'));
app.use(partials());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: 'minesman'}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req,res){ //will switch this to /play
	res.render('index');
});

app.get('/difficulty', function(req,res){ //will switch this to /
	res.render('difficulty');
});

//might hold queues of games but for now just has one currentGame
function GameRouter(){
	this.gameID = 0;
	this.currentGame = new Game(this.gameID++); //returns then increments
}

function Game(id){
	this.id = id;
	this.roomName = 'room' + this.id;
	this.players = 0;
	this.boards = [];
	this.firstClick = true;
}

Game.prototype.addPlayer = function(player){
	player.game = this;
	player.id = this.players++;
	player.socket.join(this.roomName);
};

Game.prototype.isFull = function(){
	return this.players === 2;
};

Game.prototype.initBoards = function(){
	var b = board_stuff.newBoard(data.x, data.y, 35, 15);
	for(var i = 0; i < this.players; i++){
		this.boards[i] = JSON.parse(b);
	}
};

function Player(socket){
	this.socket = socket;
}

Player.prototype.broadcast = function(name, data){
	this.socket.broadcast.to(this.game.roomName).emit(name, data);
};

Player.prototype.everyone = function(name, data){
	io.sockets.in(this.game.roomName).emit(name, data);
};

var gr = new GameRouter();

//can be expanded to take parameters such as difficulty
GameRouter.prototype.findGame = function(player){
	this.currentGame.addPlayer(player);
	
	if(this.currentGame.isFull()){
		this.currentGame = new Game(this.gameID++);
	}
};

io.sockets.on('connection', function(socket){
	var player = new Player(socket);
	gr.findGame(player);
	
	//should ideally send other people in the game too
	//for now client can assume that they are the most recent person to join
	//e.g. if player.id == 4, draw 0,1,2,3 as well
	player.socket.emit('gameInit', {id: player.id});
	player.broadcast('playerJoined', {id: player.id});
	if(player.game.isFull()){
		player.everyone('gameStart', {});
	}
	
	socket.on('reveal', function(data){
		if(player.game.firstClick){
			player.game.initBoards();
			player.game.firstClick = false;
		}
		
		var board = player.game.boards[player.id];
		
		if(board[data.x][data.y].mine){
			player.everyone('updateBoard', {board: player.id, x: data.x, y: data.y, display: -1});
		} else if(board[data.x][data.y].flag) {
			//do nothing?
		} else {
			board[data.x][data.y].flipped = true;
			var moves = floodfill(socket.player, data.x, data.y, []);
			
			var signal = JSON.parse(moves);
			
			for(var i = 0; i < signal.length; i++){
				signal[i].board = player.id;
			}
			player.everyone('updateBoard', signal);
		}
	});
	
	socket.on('flag', function(data){
		if(board[data.x][data.y].flagged){
			board[data.x][data.y].flagged = false;
			var display = 11; //hidden, no flag
		} else {
			board[data.x][data.y].flagged = true;
			var display = 9; //flag
		}
		player.everyone('updateBoard', {board: player.id, x: data.x, y: data.y, display: display});		
	});
});

//to invoke, moves should be ""
function floodfill(player, x, y, moves){
	var board = boards[player]; 
	var n = board.length;
	var surrounding = board[x][y].surrounding;
	
	if(surrounding > 0){
		moves.push({x: x, y: y, display: surrounding}); //might need to be a front push.
	} else if(surrounding == 0) {
		board[x][y].flipped = true;
		moves.push({x: x, y: y, display: 0});
		
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1) continue; //don't do the same one again.
				if(x + dirs[i] >= 0 && x + dirs[i] < n && y + dirs[j] >= 0 && y + dirs[j] < n && !board[x+dirs[i]][y+dirs[i]].flipped){
					board[x+dirs[i]][y+dirs[j]].flipped = true;
					floodfill(player, x+dirs[i], y+dirs[j], moves);
				}
			}
		}
	}
	return JSON.stringify(moves);
}

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
