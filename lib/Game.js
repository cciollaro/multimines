var Board = require('./Board.js');

var Game = function(id){
	this.id = id;
	this.roomName = 'room' + this.id;
	this.players = [];
	this.firstClick = true;
}

Game.prototype.addPlayer = function(player){
	//TODO: check to make sure a player with the same id isn't already in the game
	
	player.game = this;
	player.index = this.players.length;
	this.players.push(player);
	player.socket.join(this.roomName);
};

Game.prototype.isFull = function(){
	return this.playerCount === 2;
};

Game.prototype.initBoards = function(data){
	var b;
	for(var i = 0; i < this.players.length; i++){
		b = (b && b.clone()) || new Board(data.x, data.y, 35, 15);
		this.players[i].board = b;
	}
};

Game.prototype.html = function(){
	return "<p>This is your board and the other player's boards yo!</p>";
};

module.exports = Game;
