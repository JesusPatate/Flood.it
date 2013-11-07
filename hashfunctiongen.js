/****************************************
 * Dependences : seedrandom.js, md5.js
 ***************************************/
 
 
function HashFunctionGenerator(keySize){
	this._keySize = keySize || 32;
}

HashFunctionGenerator.prototype.generate = function(r, k){
	var self = this;
	var aa = [];
	var i;
	
	for(i = 0; i < k; i++){
		var a = [];
		
		while(a.length < this._keySize){
			Math.seedrandom();
			var n = Math.floor(Math.random() * (r - 1));
			a.unshift(n);
		}
		
		aa.push(a);
	}
	
	var hashEntryFunctions = [];
	
	for(i = 0; i < k; i++){
		hashEntryFunctions[i] = function(hash){
			var result = 0;
		
			for(var n = 0; n < hash.length; n++){
				result += aa[i][n] * hash.charCodeAt(n);
			}
			
			return result % r;
		};
	}
	
	
	return function(id){
		var hash = md5(id);
		var entries = [];
		
		for(i = 0; i < k; i++){
			entries.push(hashEntryFunctions[i](hash));
		}
		
		return entries;
	};
};
