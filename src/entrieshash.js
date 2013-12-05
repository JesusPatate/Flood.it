// TODO : tester
// TODO : commenter

define(['seedrandom', 'md5', 'utils'], function(seedrandom, md5, utilsRef){
    var entriesHash = function(){
		var self = this;
        var name = 'entriesHash';
        var utils = new utilsRef();
        
        this.name = function(){
            return name;
        }
        
		/**
		 * \class EntriesHash
		 * \brief ...
		 */
		this.EntriesHash = function(aa, k, m){
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
		this.EntriesHash.fromLitteralObject = function(object){
			return new self.EntriesHash(object.aa, object.k, object.m);
		};

		/**
		 * \brief ...
		 */
		this.EntriesHash.prototype.m = function(){
			return this._m;
		};

		/**
		 * \brief ...
		 */
		this.EntriesHash.prototype.k = function(){
			return this._k;
		};

		/**
		 * \brief ...
		 *
		 * \param id
		 * 		...
		 */
		this.EntriesHash.prototype.hash = function(id){
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
		this.EntriesHash.prototype._entryHash = function(hash, i){
			var result = 0;
				
			for(var n = 0; n < hash.length; n++){
				result += this._aa[i][n] * hash.charCodeAt(n);
			}
					
			return result % this._m;
		};

		this.EntriesHash.prototype.toLitteralObject = function(){		
			return {aa: this._aa, k: this._k, m: this._m};
		};


		/**
		 * \class EntriesHashGenerator
		 * \brief ...
		 */
		this.EntriesHashGenerator = function(keySize){
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
		this.EntriesHashGenerator.prototype.generate = function(r, k){
			var K = 2 * k
			var aa = [];
			var i;
			var m = utils.PrimeCalculator.getNextPrime(r);
			
			for(i = 0; i < K; i++){
				var a = [];
				
				while(a.length < this._keySize){
					//Math.seedrandom();
					var n = Math.floor(Math.random() * m);
					a.unshift(n);
				}
				
				aa.push(a);
			}
			
			return new self.EntriesHash(aa, k, m);
		};
    };
 
    return entriesHash;
});
