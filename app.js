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

app.get('/', function(req,res){
	res.render('index');
});

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

var boards = [];
var first_click = true;
var players = 0;


//player is 0 or 1
//to invoke, moves should be ""
function floodfill(player, x, y, moves){
	var board = boards[player]; 
	var n = board.length;
	if(board[x][y].surrounding > 0){
		board[x][y].flipped = true;
		
	} else if(board[x][y] == 0) {
		board[x][y].flipped = true; //and tell clients to do it
		
		var dirs = [-1, 0, 1];
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1) continue; //don't do the same one again.
				if(x + dirs[i] >= 0 && x + dirs[i] < n && y + dirs[j] >= 0 && y + dirs[j] < n){
					floodfill(x+dirs[i], y+dirs[j]);
				}
			}
		}
	}
	return moves;
}


io.sockets.on('connection', function(socket){
	socket.player = players;
	players++;
	
	socket.on('click', function(data){
		console.log('I got click: ' + data.action);
		
		if(first_click){
			var c = board_stuff.newBoard(data.x, data.y, 35, 15);
			boards[0] = JSON.parse(c);
			boards[1] = JSON.parse(c);
			first_click = false;
		}
		
		var board = boards[socket.player];
		
		if(data.action == 'flip'){
			if(board[data.x][data.y].mine){
				var mySignal = {board: 0, x: data.x, y: data.y, display: -2};
				var yourSignal = {board: 1, x: data.x, y: data.y, display: 10};	
				socket.emit('updateBoard', mySignal);
				socket.broadcast.emit('updateBoard', yourSignal);
			} else if(board[data.x][data.y].flag) {
				//do nothing?
			} else {
				//
			}
		} else if(data.action == 'flag'){			
			console.log('I got flag');
			
			
			if(board[data.x][data.y].flagged){
				board[data.x][data.y] = false;
				var display = 11; //hidden, no flag
			} else {
				board[data.x][data.y] = true;
				var display = 9; //flag
			}
			
			var mySignal = [{board: 0, x: data.x, y: data.y, display: display}];
			var yourSignal = [{board: 1, x: data.x, y: data.y, display: display}];
			
			console.log('hfdshkagj');
			
			socket.emit('updateBoard', mySignal);
			//socket.broadcast.emit('updateBoard', yourSignal);
		}
	});
});
