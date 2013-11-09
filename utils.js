/**********************************************
Dependences :
**********************************************/


// TODO: à tester
function Set(){
	this._elements = {};
	this._size = 0;
}

Set.prototype.add = function(element){
	this._elements[element] = element;
	this._size++;
};

Set.prototype.delete = function(element){
	if(element in this._elements){
		delete this._elements[element];
		this._size--;
	}	
};

Set.prototype.has = function(element){
	return element in this._elements;
};

Set.prototype.clear = function(){
	this._elements = {};
	this._size = 0;
};

Set.prototype.size = function(){
	return this._size;
};

Set.prototype.iterator = function(){
	return Iterator(this._elements, true);
};


function Map(){
	this._elements = {};
	this._size = 0;
}

Map.prototype.put = function(key, value){
	this._elements[key] = value;
	this._size++;
};

Map.prototype.get = function(key){
	return this._elements[key];
};

Map.prototype.delete = function(key){
	if(key in this._elements){
		delete this._elements[key];
		this._size--;
	}	
};

Map.prototype.hasKey = function(key){
	return key in this._elements;
};

Map.prototype.clear = function(){
	this._elements = {};
	this._size = 0;
};

Map.prototype.size = function(){
	return this._size;
};

Map.prototype.iterator = function(){
	return Iterator(this._elements);
};
