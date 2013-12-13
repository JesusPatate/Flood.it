/**********************************************
Dependences :
**********************************************/


/**
 * \class ArrayIterator
 * \brief ...
 */
function ArrayIterator(iterable, one){
	this._iterable = iterable;
	this._one = one || false;
	this._index = -1;
}

ArrayIterator.prototype.next = function(){
	var value;
	var index = ++this._index;
	
	
	if(this._one){
		value = this._iterable[index];
	}
	else{
		value = [index, this._iterable[index]];
	}

	return value;
};

ArrayIterator.prototype.hasNext = function(){
	return this._index + 1 < this._iterable.length;
};


/**
 * \class LitteralObjectIterator
 * \brief ...
 */
function LitteralObjectIterator(iterable, one){
	this._iterable = iterable;
	this._one = one || false;
	this._keys = [];
	
	for(var key in this._iterable){
		this._keys.push(key);
	}
	
	this._index = -1;
}

LitteralObjectIterator.prototype.next = function(){
	var value;
	var index = ++this._index;
	var key = this._keys[index];
	
	if(this._one){
		value = this._iterable[key];
	}
	else{
		value = [key, this._iterable[key]];
	}

	return value;
};

LitteralObjectIterator.prototype.hasNext = function(){
	return this._index + 1 < this._keys.length;
};


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
	return new LitteralObjectIterator(this._elements);
};


/**
 * \class Queue
 * \brief A collection designed for holding elements prior to processing. 
 */
function Queue(capacity){
	this._capacity = capacity;
	this._elements = [];
}

/**
 * \brief Retrieves, but does not remove, the head of this queue, or
 *  returns undefined if this queue is empty.
 */
Queue.prototype.peek = function(){
	return this._elements[0];
};

/**
 * \brief Retrieves and removes the head of this queue, or returns 
 * undefined if this queue is empty.
 */
Queue.prototype.poll = function(){
	return this._elements.shift();
};

/**
 * \brief Inserts the specified element into this queue, if capacity is
 *  reached the first element is removed.
 */
Queue.prototype.add = function(element){
	if(this._capacity != undefined && this._elements.length == this._capacity){
		this._elements.shift();
	}
	
	this._elements.push(element);
};

/**
 * \brief Returns the number of element in this queue.
 */
Queue.prototype.size = function(){
	return this._elements.length;
};

/**
 * \brief Returns an iterator over the elements (index, value) in this queue.
 */
Queue.prototype.iterator = function(){
	return new ArrayIterator(this._elements);
};


/**
 * \class PrimeCalculator
 * \brief ...
 */
function PrimeCalculator(){
}

/**
 * \brief ...
 *
 * \param bound
 *      ...
 */
PrimeCalculator.getNextPrime = function(bound){
	var sieve = [];
	var i = 2;
	var j;
	var primes = [1];

	while(primes[primes.length - 1] < bound){
		if(!sieve[i]){
			// i has not been marked, so it is prime.
			primes.push(i);
			
			for(j = i << 1; j <= bound; j += i){
				sieve[j] = true;
			}
		}
				
		i++;
	}
	
	return primes[primes.length - 1];
};
