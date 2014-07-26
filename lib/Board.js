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
		for(var j = 0; j < m; j++){
			this.matrix[i][j] = {x: i, y: j, surrounding: 0};
		}
	}
	
	//add mines
	var dirs = [-1, 0, 1];
	for(var g = 0; g < mines; g++){     
		var x, y;
		do {
			x = Math.floor(Math.random()*n);
			y = Math.floor(Math.random()*m);
		} while(this.matrix[x][y].mine || x == x1 || y == y1);

		this.matrix[x][y].mine = true;
        
		//increment surrounding count of cells around current mine
		for(var i = 0; i < 3; i++){
			for(var j = 0; j < 3; j++){
				if(i == 1 && j == 1) continue; //don't do the same one again.
				if(x + dirs[i] >= 0 && x + dirs[i] < n && y + dirs[j] >= 0 && y + dirs[j] < m){
					this.matrix[x + dirs[i]][y + dirs[j]].surrounding++;
				}
			}
		}
	}
};

Board.prototype.clone = function(){
	var newBoard = new Board();
	newBoard.matrix = JSON.parse(JSON.stringify(this.matrix));
	newBoard.mines = this.mines;
	newBoard.n = this.n;
	newBoard.m = this.m;
	return newBoard;
};

//we could potentially pre-process the floodfills to save time?
Board.prototype.floodfill = function(x, y, moves){
	moves = moves || [];
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
				if((x+dirs[i] >= 0) && (x+dirs[i] < this.n) && (y+dirs[j] >= 0) && (y+dirs[j] < this.m) && (!this.matrix[x+dirs[i]][y+dirs[j]].flipped)){
					this.floodfill(x+dirs[i], y+dirs[j], moves);
				}
			}
		}
	}
	return moves;
};

Board.prototype.floodfillCached = function(x,y){
	return this.floodfills[x][y];
};

module.exports = Board;
