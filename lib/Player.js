var Player = function(id, socket, io){
	this.id = id;
	this.socket = socket;
	this.frozen = false;
	this.started = false
}

Player.prototype.broadcast = function(name, data){
	this.socket.broadcast.to(this.game.roomName).emit(name, data);
};

Player.prototype.emit = function(name, data){
	this.socket.emit(name, data);
};

Player.prototype.everyone = function(name, data){
	this.socket.broadcast.to(this.game.roomName).emit(name, data);
	this.socket.emit(name, data);
};

module.exports = Player;
