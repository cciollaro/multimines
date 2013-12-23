var Player = function(id, socket){
	this.id = id;
	this.socket = socket;
	this.frozen = false;
}

Player.prototype.broadcast = function(name, data){
	this.socket.broadcast.to(this.game.roomName).emit(name, data);
};

Player.prototype.emit = function(name, data){
	this.socket.emit(name, data);
};

Player.prototype.everyone = function(name, data){
	this.socket.manager.sockets.in(this.game.roomName).emit(name, data);
};

module.exports = Player;
