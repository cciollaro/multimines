var app            = require('express')();
var server         = require('http').Server(app);
var io             = require('socket.io')(server);
var expressSession = require('express-session');
var morgan         = require('morgan');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var serveStatic    = require('serve-static');
var cookieParser   = require('cookie-parser');
var sharedSession  = require("express-socket.io-session")
var path           = require('path');

var pid_count = 0;

var PORT = process.env.PORT || 3000;
var HOST = process.env.HOST || 'localhost';

var EXPRESS_SID_KEY = 'express.sid';
var COOKIE_SECRET   = 'minesman';

var cookieParser = cookieParser(COOKIE_SECRET);
var sessionStore = new expressSession.MemoryStore();

app.use(cookieParser);
app.use(expressSession({
    store: sessionStore,
    cookie: {
        httpOnly: true
    },
    key: EXPRESS_SID_KEY
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(serveStatic(path.join(__dirname, 'public')));

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
// io.use(sharedSession(expressSession, {
//     autoSave:true
// }));

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
io.on('connection', function(socket){
  console.log("got connect event");

	var player = new Player(pid_count, socket);
  pid_count ++;

    socket.on('joinGame', function(data){
      console.log("got join game event");
		var game = gr.findGame(data.difficulty);
		game.addPlayer(player);

		player.socket.emit('initGame', {html: game.html(), id: player.index});
		player.broadcast('playerJoined', {id: player.index});

		if(game.isFull()){
			setTimeout(function(){
				game.start();
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
		if(board.matrix[data.x][data.y].flag || board.matrix[data.x][data.y].permaflag) {
			return;
		} else if(board.matrix[data.x][data.y].mine){
			player.frozen = true;
            player.everyone('updateBoard', {board: player.index, x: data.x, y: data.y, display: -1, time: player.game.getTimeOfGame()});
			board.matrix[data.x][data.y].permaflag = true;

			//freeze em for 3 seconds
			setTimeout(function(){
				player.frozen = false;
				player.everyone('updateBoard', {board: player.index, x: data.x, y: data.y, display: 11});
			}, 3000);
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

        var game = player.game;

		if(game.firstClick){
			game.initBoards(data);
			game.firstClick = false;
		}

		var board = player.board;

		if(board.matrix[data.x][data.y].flagged){
			board.matrix[data.x][data.y].flagged = false;
			var display = 9; //unflag
		} else {
			board.matrix[data.x][data.y].flagged = true;
			var display = 10; //flag
		}
		player.everyone('updateBoard', {board: player.index, x: data.x, y: data.y, display: display});
	});
});

server.listen(PORT, HOST, null, function() {
    console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env);
});
