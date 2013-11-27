var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var partials = require('express-partials');
var app = module.exports = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

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
	res.render('index.html');
});

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

var boards = [];

function newBoard(x1, y1, x2, y2, mines, n){
	var board = [];
	
	//make it with x's and y's
	for(var i = 0; i < n; i++){
		board[i] = [];
		for(var j = 0; j < n; j++){
			board[i][j] = {x: i, y: j};
		}
	}
	
	//add mine mines
	for(var i = 0; i < mines; i++){
		var potentialX = Math.floor(Math.random()*n);
		var potentialY = Math.floor(Math.random()*n);
		//while mine or one of them are is the initial click of player.
		while(board[potentialX][potentialY].mine || potentialX == x1 || potentialY == y1 || potentialX == x2 || potentialY == y2){
			potentialX = Math.floor(Math.random()*n);
			potentialY = Math.floor(Math.random()*n);
		}
		
		board[potentialX][potentialY].mine = true;
		
		//update surroundings' surrounding attribute
		var dirs = [-1, 0, 1];
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){				
				if(potentialX + dirs[i] >= 0 && potentialX + dirs[i] < n && potentialY + dirs[j] >= 0 && potentialY + dirs[j] < n){
					board[potentialX + dirs[i]][potentialY + dirs[j]].surrounding = board[potentialX + dirs[i]][potentialY + dirs[j]].surrounding || 0;
					board[potentialX + dirs[i]][potentialY + dirs[j]].surrounding++;
				}
			}
		}
		
		
	}
	
	return JSON.stringify(board);
}

function floodfill(user, x, y){
	var board = (user==0 ? boards[0] : boards[1]);
	var n = board.length;
	if(board[x][y].surrounding > 0){
		board[x][y].flipped = true; //and tell clients to do it
	} else if(board[x][y] == 0){
		board[x][y].flipped = true; //and tell clients to do it
		
		var dirs = [-1, 0, 1];
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1)continue; //don't do the same one again.		
				if(x + dirs[i] >= 0 && x + dirs[i] < n && y + dirs[j] >= 0 && y + dirs[j] < n){
					floodfill(x+dirs[i], y+dirs[j]);
				}
			}
		}
		
	}
}

function process(board, x, y){
	
}

io.sockets.on('connection', function(socket){
	socket.player = //0 or 1
	socket.on('click', function(data){
		
		var id = 0; //get this dynamically though.
		if(data.action == 'flip'){
			//
		} else if(data.action == 'flag'){
			//tell both players that the player flagged that one
		}
	});
});
