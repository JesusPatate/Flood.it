/****************************************
 Dependences : 
 * seedrandom.js,
 * md5.js
 * utils.js
 ***************************************/

// TODO : tester
// TODO : commenter

/**
 * \class EntriesHash
 * \brief ...
 */
function EntriesHash(aa, k, m){
	this._aa = aa;
	this._k = k;
	this._m = m;
}

/**
 * \brief ...
 *
 * \param object
 * 		...
 */
EntriesHash.fromLitteralObject = function(object){
	return new EntriesHash(object.aa, object.k, object.m);
};

/**
 * \brief ...
 *
 * \param id
 * 		...
 */
EntriesHash.prototype.hash = function(id){
	var hash = md5(id);
	var entries = {};
	var i = 0;
	var j = 0;
		
	while(i < this._k){
		var entry = this._entryHash(hash, j);
			
		if(!(entry in entries)){
			entries[entry] = entry;
			i++;
		}
			
		j++;
	}
		
	return entries;
};

/**
 * \brief ...
 *
 * \param hash
 * 		...
 * \param i
 * 		...
 */
EntriesHash.prototype._entryHash = function(hash, i){
	var result = 0;
		
	for(var n = 0; n < hash.length; n++){
		result += this._aa[i][n] * hash.charCodeAt(n);
	}
			
	return result % this._m;
};

EntriesHash.prototype.toLitteralObject = function(){		
	return {aa: this._aa, k: this._k, m: this._m};
};


/**
 * \class EntriesHashGenerator
 * \brief ...
 */
function EntriesHashGenerator(keySize){
	this._keySize = keySize || 32;
}

/**
 * \brief ...
 *
 * \param r
 * 		...
 * \param k
 * 		...
 */
EntriesHashGenerator.prototype.generate = function(r, k){
	var K = 2 * k
	var aa = [];
	var i;
	var m = PrimeCalculator.getNextPrime(r);
	
	for(i = 0; i < K; i++){
		var a = [];
		
		while(a.length < this._keySize){
			Math.seedrandom();
			var n = Math.floor(Math.random() * m);
			a.unshift(n);
		}
		
		aa.push(a);
	}
	
	return new EntriesHash(aa, k, m);
};

EntriesHash.prototype.m = function(){
	return this._m;
};

EntriesHash.prototype.k = function(){
	return this._k;
};
