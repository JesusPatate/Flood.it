define(['EventEmitter', 'utils', 'pbcast'], function(EventEmitter, utilsRef, pbcastRef){
    var pbcastws = function(){
		var self = this;
        var name = 'pbcastws';
        var utils = new utilsRef();
        var pbcast = new pbcastRef();
        
        this.name = function(){
            return name;
        }
        
		/**
		 * \class PBCast
		 * \brief ...
		 */
		this.PBCast = function(serverLocation){
			var selfPBcast = this;
			EventEmitter.EventEmitter.call(this);
			this._websocket = new WebSocket(serverLocation);
			this._id;
			this._qvc;
			this._notDelivered = [];
			this._delivered = new utils.Queue();
			this.ready = false;
			this._cache = [];
			this._localCache = [];
			
			this._websocket.onopen = function(evt){
				console.log("CONNECTED TO " + serverLocation);
				selfPBcast._websocket.send(JSON.stringify({type: 'JOIN_REQ'}));
			};
			
			this._websocket.onclose = function(event){
				console.log("DISCONNECTED FROM " + serverLocation);
			};
			
			this._websocket.onerror = function(event){
				console.log("ERROR FROM " + serverLocation + '['+ event.data +']');
			};
			
			this._websocket.onmessage = function(event){
				console.log("WEBSOCKET MSG: " + event.data);
				var obj = JSON.parse(event.data);

				switch(obj.type){
					case 'JOIN_RESP':
						initialize(obj.data);
						break;
					
					case 'MSG':
						handleMessage(obj.data);
						break;
						
					default:
						break;
				}
			};
			
			function initialize(data){
				selfPBcast._id = data.id;
				var clocks = initializeClocks(data.r);
				selfPBcast._qvc = new pbcast.QVC(clocks, data.entries);
				selfPBcast.ready = true;
				emptyLocalCache();
				emptyCache();
				selfPBcast.emit('ready', selfPBcast._id);
			}
			
			function initializeClocks(r){
				var clocks = [];
			  
				for(var i = 0; i < r; i++){
					clocks.push(0);
				}
			  
				return clocks;
			}
			
			function emptyCache(){
				while(selfPBcast._cache.length > 0){
					var message = selfPBcast._cache.shift();
					selfPBcast.send(message);
				}
			}
			
			function emptyLocalCache(){
				while(selfPBcast._cache.length > 0){
					var message = selfPBcast._cache.shift();
					selfPBcast.localSend(message);
				}
			}
			
			function handleMessage(message){
				var qvc = pbcast.QVC.fromLitteralObject(message.qvc);
			
				if(qvc.isCausallyReady(self._qvc)){
					selfPBcast._qvc.incrementFrom(qvc);
					var error = detectError(qvc);
					selfPBcast.emit('deliver', {error: error, clocks: qvc.clocks(), id: message.id, local: false, msg: message.msg});
					selfPBcast._delivered.add({qvc: message.qvc});
					checkNoDelivered();
				}
				else{
					selfPBcast._notDelivered.push(message);
				}
			}

			function checkNoDelivered(){
				var i = 0;
				
				while(i < selfPBcast._notDelivered.length){
					var message = notDelivered[i];
					var qvc = new pbcast.QVC(message.clocks, message.entries);
					
					if(qvc.isCausallyReady(selfPBcast._qvc)){
						selfPBcast._notDelivered.splice(i, 1);
						selfPBcast._qvc.incrementFrom(qvc);
						var error = detectError(qvc);
						selfPBcast.emit('deliver', {error: error, clocks: qvc.clocks(), id: message.id, local: false, msg: message.msg});
						selfPBcast._delivered.add({qvc: message.msg.qvc});
					}
					else{
						i++;
					}
				}
			}
			
			function detectError(qvc){
				var inferiorToCurrent = qvc.isInferior(selfPBcast._qvc);
				var inferiorOrEqualToDelivered = true;
				var it = selfPBcast._delivered.iterator();
				var end = false;	
				
				while(inferiorToCurrent && inferiorOrEqualToDelivered && !end){
					try{
						var deliveredQvc = pbcast.QVC.fromLitteralObject(it.next()[1]);
						inferiorOrEqualToDelivered = qvc.isInferiorOrEqual(deliveredQvc);
					}
					catch(e){
						end = true;
					}
				}
				
				return inferiorToCurrent && inferiorOrEqualToDelivered;
			}
		}


		this.PBCast.prototype = Object.create(EventEmitter.EventEmitter.prototype);
		this.PBCast.prototype.constructor = this.PBCast;

		/**
		 * \brief ...
		 */
		this.PBCast.prototype.id = function(){
			var id;
			
			if(this.ready){
				id = this._id;
			}
			
			return id;
		};

		/**
		 * \brief ...
		 *
		 * \param message
		 *      ...
		 */
		this.PBCast.prototype.send = function(message){
			if(this.ready){
				var msg = JSON.stringify({type: 'MSG', data: {qvc: this._qvc.toLitteralObject(), id: this._id, msg: message}});
				this._websocket.send(msg);
			}
			else{
				this._cache.push(message);
			}
		};

		/**
		 * \brief ...
		 *
		 * \param message
		 *      ...
		 */
		this.PBCast.prototype.localSend = function(message){
			if(this.ready){
				this._qvc.increment();
				this.emit('deliver', {error: false, clocks: this._qvc.clocks(), id: this._id, local: true, msg: message});
			}
			else{
				this._localCache.push(message);
			}
		};       
    };
 
    return pbcastws;
});
