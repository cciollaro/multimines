var Board = require('./Board.js');

var Game = function(id){
	this.id = id;
	this.roomName = 'room' + this.id;
	this.players = [];
	this.firstClick = true;
	this.started = true;
    this.startTime = null;
}

Game.prototype.addPlayer = function(player){
	//TODO: check to make sure a player with the same id isn't already in the game

	player.game = this;
	player.index = this.players.length;
	this.players.push(player);

	// join this player to our game's room
	player.socket.join(this.roomName);
};

Game.prototype.isFull = function(){
	return this.playerCount === 2;
};

Game.prototype.initBoards = function(data){
	var b;
	for(var i = 0; i < this.players.length; i++){
		b = (b && b.clone()) || new Board(data.x, data.y, 35, 15, 15);
		this.players[i].board = b;
	}
    this.startTime = new Date().getTime();
};

Game.prototype.html = function(){
    //TODO: use this, instead of not

	var html = "";
	for(var i = 0; i < this.players.length; i++){
		html += "<canvas id=board" + this.players[i].index +"></canvas>";
	}
	return html;
};

Game.prototype.getTimeOfGame = function(){
    var millis = new Date().getTime();

    return millis - this.startTime;
}

module.exports = Game;
