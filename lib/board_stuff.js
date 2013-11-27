//x1, y1 : player0's starting position.
//x2, y2 : player1's starting position.
//mines  : number of mines to put in.
//n      : will make nxn board.
//returns a JSON string of a board.
exports.newBoard = function(x1, y1, mines, n){
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
		while(board[potentialX][potentialY].mine || potentialX == x1 || potentialY == y1){
			potentialX = Math.floor(Math.random()*n);
			potentialY = Math.floor(Math.random()*n);
		}
		
		board[potentialX][potentialY].mine = true;
	}
	
	return JSON.stringify(board);
}
