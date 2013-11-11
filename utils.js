/**********************************************
Dependences :
**********************************************/


/**
 * \class Map
 * \brief An object that maps keys to values. A map cannot contain
 *  duplicate keys; each key can map to at most one value.
 */
function Map(){
	this._elements = {};
	this._size = 0;
}

/**
 * \brief Associates the specified value with the specified key in this
 *  map.
 *
 * \param key
 * 		key with which the specified value is to be associated.
 * 
 * \param value
 * 		value to be associated with the specified key.
 */
Map.prototype.put = function(key, value){
	if(!(key in this._elements)){
		this._size++;
	}
	
	this._elements[key] = value;
};

/**
 * \brief Returns the value to which the specified key is mapped, or
 *  undefined if this map contains no mapping for the key.
 *
 * \param key
 *      key whose associated value is to be returned.
 */
Map.prototype.get = function(key){
	return this._elements[key];
};

/**
 * \brief Removes the mapping for a key from this map if it is present.
 *
 * \param key
 *      key whose mapping is to be removed from the map.
 */
Map.prototype.remove = function(key){
	if(key in this._elements){
		delete this._elements[key];
		this._size--;
	}	
};

/**
 * \brief Returns true if this map contains a mapping for the specified
 *  key.
 *
 * \param key
 *      key whose presence in this map is to be tested.
 */
Map.prototype.hasKey = function(key){
	return key in this._elements;
};

/**
 * \brief Removes all of the mappings from this map.
 */
Map.prototype.clear = function(){
	this._elements = {};
	this._size = 0;
};

/**
 * \brief Returns the number of key-value mappings in this map.
 */
Map.prototype.size = function(){
	return this._size;
};

/**
 * \brief Returns an iterator over the elements (key, value) in this
 *  map.
 */
Map.prototype.iterator = function(){
	return Iterator(this._elements);
};
