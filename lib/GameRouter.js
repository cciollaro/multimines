var Game = require('./Game.js');

var GameRouter = function(){
	this.gameID = 0;
	this.openGames = {
		easy: new Game(this.gameID++),
		medium: new Game(this.gameID++),
		hard: new Game(this.gameID++)
	};
}

GameRouter.prototype.findGame = function(difficulty){		
	if(this.openGames[difficulty].isFull()){
		this.openGames[difficulty] = new Game(this.gameID++);
	}
	
	return this.openGames[difficulty];
};

module.exports = GameRouter;
