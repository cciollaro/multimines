var express = require('express');
var http    = require('http');
var path    = require('path');
var io      = require('socket.io');
var app     = express();

var PORT = process.env.PORT || 3000;
var HOST = process.env.HOST || 'localhost';

var EXPRESS_SID_KEY = 'express.sid';
var COOKIE_SECRET   = 'minesman';

var cookieParser = express.cookieParser(COOKIE_SECRET);
var sessionStore = new express.session.MemoryStore();

// Configure Express app with :
// * Cookie Parser created above
// * Configure Session Store
app.configure(function () {
    app.use(cookieParser);
    app.use(express.session({
        store: sessionStore,
        cookie: { 
            httpOnly: true
        },
        key: EXPRESS_SID_KEY
    }));
    app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

var server = http.createServer(app);
var io = require('socket.io').listen(server);

//BEGIN MINES STUFF
var number_of_players = 0;

app.get('/', function(req,res){
	req.session.playerId = number_of_players++;
	res.render('index');
});

app.get('/difficulty', function(req,res){
	res.render('difficulty');
});

var board_stuff = require('./lib/board_stuff.js');

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

Game.prototype.initBoards = function(data){
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

Player.prototype.board = function(){
	return this.game.boards[this.id];
};

var gr = new GameRouter();

//can be expanded to take parameters such as difficulty
GameRouter.prototype.findGame = function(player){
	this.currentGame.addPlayer(player);
	
	if(this.currentGame.isFull()){
		this.currentGame = new Game(this.gameID++);
	}
};

//to invoke, moves should be []
function floodfill(player, x, y, moves){
	var board = player.board();
	var n = board.length; //probably should be passed in
	
	var surrounding = board[x][y].surrounding;
	board[x][y].flipped = true;
	if(surrounding > 0){
		moves.push({x: x, y: y, display: surrounding});
	} else if(surrounding == 0) {
		board[x][y].flipped = true;
		moves.push({x: x, y: y, display: 0});
        var dirs = [-1, 0, 1];
		
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1) continue; //don't do the same one again.
				if(x + dirs[i] >= 0 && x + dirs[i] < n && y + dirs[j] >= 0 && y + dirs[j] < n && !board[x+dirs[i]][y+dirs[j]].flipped){
					floodfill(player, x+dirs[i], y+dirs[j], moves);
				}
			}
		}
	}
	return JSON.stringify(moves);
}

//SOCKET STUFF BELOW HERE
io.set('authorization', function (data, callback) {
    console.log(data);
    
    if(!data.headers.cookie) {
        return callback('No cookie transmitted.', false);
    }
    
    cookieParser(data, {}, function(parseErr) {
        if(parseErr) { return callback('Error parsing cookies.', false); }
        var sidCookie = (data.secureCookies && data.secureCookies[EXPRESS_SID_KEY]) ||
                        (data.signedCookies && data.signedCookies[EXPRESS_SID_KEY]) ||
                        (data.cookies && data.cookies[EXPRESS_SID_KEY]);
        sessionStore.load(sidCookie, function(err, session) {
            if (err || !session) {
                callback('Error', false);
            } else {
                data.session = session;
                callback(null, true);
            }
        });
    });
});

io.sockets.on('connection', function(socket){	
	var player = new Player(socket);
	gr.findGame(player);
	
	//should ideally send other people in the game too
	//for now client can assume that they are the most recent person to join
	//e.g. if player.id == 4, draw 0,1,2,3 as well
	player.socket.emit('gameInit', {yourId: player.id});
	player.broadcast('playerJoined', {id: player.id});
              
	if(player.game.isFull()){
		player.everyone('gameStart', {});
	}
    	
	socket.on('reveal', function(data){
              
		if(player.game.firstClick){
			player.game.initBoards(data);
			player.game.firstClick = false;
		}
		
		var board = player.board();
		
		if(board[data.x][data.y].mine){
			player.everyone('updateBoard', {board: player.id, x: data.x, y: data.y, display: -2});
		} else if(board[data.x][data.y].flag) {
			//do nothing?
		} else {
			var moves = floodfill(player, data.x, data.y, []);
			
			var signal = JSON.parse(moves);
			
			for(var i = 0; i < signal.length; i++){
				signal[i].board = player.id;
			}
			player.everyone('updateBoard', signal);
		}
	});
	
	socket.on('flag', function(data){
		
		if(player.game.firstClick){
			player.game.initBoards(data);
			player.game.firstClick = false;
		}
		
		var board = player.board();
		
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

server.listen(PORT, HOST, null, function() {
    console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env);
});
