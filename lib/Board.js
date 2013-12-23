//x1, y1 : player0's starting position.
//mines  : number of mines to put in.
//n, m   : will make nxm board.
var Board = function(x1, y1, mines, n, m){
	if(arguments.length===0) return; //used for cloning
	
	this.matrix = [];
	this.mines = mines;
	this.n = n;
	this.m = m;
		
	for(var i = 0; i < n; i++){
		this.matrix[i] = [];
		for(var j = 0; j < n; j++){
			this.matrix[i][j] = {x: i, y: j, surrounding: 0};
		}
	}
	
	//add mines
	for(var g = 0; g < mines; g++){
		var potentialX = Math.floor(Math.random()*n);
		var potentialY = Math.floor(Math.random()*n);
        
		while(this.matrix[potentialX][potentialY].mine || potentialX == x1 || potentialY == y1){
			potentialX = Math.floor(Math.random()*n);
			potentialY = Math.floor(Math.random()*n);
		}
		var x = potentialX;
		var y = potentialY;

		this.matrix[x][y].mine = true;
        
		//increment surrounding count of cells around current mine
		var dirs = [-1, 0, 1];
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1) continue; //don't do the same one again.
				if(x + dirs[i] >= 0 && x + dirs[i] < n && y + dirs[j] >= 0 && y + dirs[j] < n){
					this.matrix[x + dirs[i]][y + dirs[j]].surrounding++;
				}
			}
		}
	}
};

Board.prototype.clone = function(){
	var newBoard = new this.constructor();
	newBoard.matrix = JSON.parse(JSON.stringify(this.matrix));
	newBoard.mines = this.mines;
	newBoard.n = this.n;
	newBoard.m = this.m;
	return newBoard;
};

Board.prototype.floodfill = function(x, y, moves){
	moves = moves || [];
    console.log(moves);
	var surrounding = this.matrix[x][y].surrounding;
	
	this.matrix[x][y].flipped = true;
	if(surrounding > 0){
		moves.push({x: x, y: y, display: surrounding});
	} else if(surrounding == 0) {
		this.matrix[x][y].flipped = true;
		moves.push({x: x, y: y, display: 0});
        
        var dirs = [-1, 0, 1];
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1) continue; //don't do the same one again.
				if((x+dirs[i] >= 0) && (x+dirs[i] < this.n) && (y+dirs[j] >= 0) && (y+dirs[j] < this.m) && (!this.matrix[x+dirs[i]][y+dirs[j]].flipped)){
					this.floodfill(x+dirs[i], y+dirs[j], moves);
				}
			}
		}
	}
	return moves;
}

module.exports = Board;
