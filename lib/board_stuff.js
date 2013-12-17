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
			board[i][j] = {x: i, y: j, surrounding: 0};
		}
	}
	
	//add mine mines
	for(var g = 0; g < mines; g++){
		var potentialX = Math.floor(Math.random()*n);
		var potentialY = Math.floor(Math.random()*n);
        
		//while mine or one of them are is the initial click of player.
		while(board[potentialX][potentialY].mine || potentialX == x1 || potentialY == y1){
			potentialX = Math.floor(Math.random()*n);
			potentialY = Math.floor(Math.random()*n);
//            console.log(board);
		}
		var x = potentialX;
		var y = potentialY;

		board[x][y].mine = true;
        
		//increment surrounding count of cells around current mine
		var dirs = [-1, 0, 1];
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1) continue; //don't do the same one again.
				if(x + dirs[i] >= 0 && x + dirs[i] < n && y + dirs[j] >= 0 && y + dirs[j] < n){
					board[x + dirs[i]][y + dirs[j]].surrounding++;
				}
			}
		}
	}
	
	return JSON.stringify(board);
}
