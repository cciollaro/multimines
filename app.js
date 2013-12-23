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
var GameRouter = require('./lib/GameRouter.js');
var Player = require('./lib/Player.js');

var number_of_players = 0;

app.get('/', function(req,res){
	req.session.playerId = number_of_players++;
	res.render('difficulty');
});

var gr = new GameRouter();

//SOCKET STUFF BELOW HERE
io.set('authorization', function (data, callback) {    
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
	var player = new Player(socket.handshake.session.playerId, socket);
    
    socket.on('joinGame', function(data){
		var game = gr.findGame(data.difficulty);
		game.addPlayer(player);
		
		player.socket.emit('initGame', {html: game.html(), id: player.index});
		player.broadcast('playerJoined', {id: player.index});
		
		if(game.isFull()){
			setTimeout(function(){
				game.started = true;
				player.everyone('start', {});			
			}, 1000);
		}
	});
    
	socket.on('reveal', function(data){
        if(player.frozen || !player.game.started){
			return;
		}
		
        var game = player.game;
        
		if(game.firstClick){
			game.initBoards(data);
			game.firstClick = false;
		}
		
		var board = player.board;
		
		if(board[data.x][data.y].mine){
			player.frozen = true;
			player.everyone('updateBoard', {board: player.index, x: data.x, y: data.y, display: -1});
			//freeze em for 3 seconds
			setTimeout(function(){
				player.frozen = false;
				player.everyone('updateBoard', {board: player.index, x: data.x, y: data.y, display: 11});
			}, 3000);
		} else if(board[data.x][data.y].flag) {
			return;
		} else {
			var signal = board.floodfill(data.x, data.y);
			
			for(var i = 0; i < signal.length; i++){
				signal[i].board = player.index;
			}
			
			player.everyone('updateBoard', signal);
		}
	});
	
	socket.on('flag', function(data){
		 if(player.frozen || !player.game.started){
			return;
		}
		
		if(game.firstClick){
			game.initBoards(data);
			game.firstClick = false;
		}
		
		var board = player.board;
		
		if(board[data.x][data.y].flagged){
			board[data.x][data.y].flagged = false;
			var display = 9; //unflag
		} else {
			board[data.x][data.y].flagged = true;
			var display = 10; //flag
		}
		player.everyone('updateBoard', {board: player.index, x: data.x, y: data.y, display: display});
	});
});

server.listen(PORT, HOST, null, function() {
    console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env);
});
