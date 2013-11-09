/****************************************
 * Dependences : seedrandom.js, md5.js
 ***************************************/
 
 
function HashFunctionGenerator(keySize){
	this._keySize = keySize || 32;
}

HashFunctionGenerator.prototype.generate = function(r, k){
	var K = k * k * k;
	var aa = [];
	var i;
	
	for(i = 0; i < K; i++){
		var a = [];
		
		while(a.length < this._keySize){
			Math.seedrandom();
			var n = Math.floor(Math.random() * (r - 1));
			a.unshift(n);
		}
		
		aa.push(a);
	}
	
	var hashEntryFunctions = [];
	
	for(i = 0; i < K; i++){
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
		var entries = {};
		i = 0;
		var j = 0;
		
		while(i < k){
			var entry = hashEntryFunctions[j](hash);
			
			if(!(entry in entries)){
				entries[entry] = entry;
				i++;
			}
			
			j++;
		}
		
		return entries;
	};
};
