//was used in floodfill, is no longer.

var Stack = function(size){
	if(size){
		this.arr = new Array(size);	
	} else {
		this.arr = [];
	}
	this.ptr = 0;
}

Stack.prototype.isEmpty = function(){
	return (this.ptr === 0);
};

Stack.prototype.push = function(obj){
	this.arr[this.ptr] = obj;
	this.ptr++;
};

Stack.prototype.pop = function(){
	if(!this.isEmpty()){
		return this.arr[--this.ptr];
	} else {
		return null;
	}
};

module.exports = Stack;
