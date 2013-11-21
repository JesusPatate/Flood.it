/******************************************
Dependences : 
* eventemitter.js,
* utils.js,
* pbcast.js
*******************************************/

/**
 * \class PBCast
 * \brief ...
 */
function PBCast(serverLocation){
	var self = this;
	EventEmitter.call(this);
	this._websocket = new WebSocket(serverLocation);
    this._id;
    this._qvc;
    this._notDelivered = [];
    this._delivered = new Queue();
    this.ready = false;
    this._cache = [];
    this._localCache = [];
    
    this._websocket.onopen = function(evt){
		console.log("CONNECTED TO " + serverLocation);
		self._websocket.send(JSON.stringify({type: 'JOIN_REQ'}));
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
		self._id = data.id;
		var clocks = initializeClocks(data.r);
		self._qvc = new QVC(clocks, data.entries);
		self.ready = true;
		emptyLocalCache();
		emptyCache();
		self.emit('ready', self._id);
	}
	
	function initializeClocks(r){
		var clocks = [];
      
		for(var i = 0; i < r; i++){
			clocks.push(0);
		}
      
		return clocks;
	}
	
	function emptyCache(){
		while(self._cache.length > 0){
			var message = self._cache.shift();
			self.send(message);
		}
	}
	
	function emptyLocalCache(){
		while(self._cache.length > 0){
			var message = self._cache.shift();
			self.localSend(message);
		}
	}
	
	function handleMessage(message){
		var qvc = QVC.fromLitteralObject(message.qvc);
	
		if(qvc.isCausallyReady(self._qvc)){
			self._qvc.incrementFrom(qvc);
			var error = detectError(qvc);
			self.emit('deliver', {error: error, clocks: qvc._clocks, id: message.id, local: false, msg: message.msg});
			self._delivered.add({qvc: message.qvc});
			checkNoDelivered();
		}
		else{
			self._notDelivered.push(message);
		}
	}

	function checkNoDelivered(){
		var i = 0;
		
		while(i < self._notDelivered.length){
			var message = notDelivered[i];
			var qvc = new QVC(message.clocks, message.entries);
			
			if(qvc.isCausallyReady(self._qvc)){
				self._notDelivered.splice(i, 1);
				self._qvc.incrementFrom(qvc);
				var error = detectError(qvc);
				self.emit('deliver', {error: error, clocks: qvc._clocks, id: message.id, local: false, msg: message.msg});
				self._delivered.add({qvc: message.msg.qvc});
			}
			else{
				i++;
			}
		}
	}
	
	function detectError(qvc){
		var inferiorToCurrent = qvc.isInferior(self._qvc);
		var inferiorOrEqualToDelivered = true;
		var it = self._delivered.iterator();
		var end = false;	
		
		while(inferiorToCurrent && inferiorOrEqualToDelivered && !end){
			try{
				var deliveredQvc = QVC.fromLitteralObject(it.next()[1]);
				inferiorOrEqualToDelivered = qvc.isInferiorOrEqual(deliveredQvc);
			}
			catch(e){
				end = true;
			}
		}
		
		return inferiorToCurrent && inferiorOrEqualToDelivered;
	}
}


PBCast.prototype = Object.create(EventEmitter.prototype);
PBCast.prototype.constructor = PBCast;

/**
 * \brief ...
 */
PBCast.prototype.getId = function(){
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
PBCast.prototype.send = function(message){
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
PBCast.prototype.localSend = function(message){
	if(this.ready){
		this._qvc.increment();
		this.emit('deliver', {error: false, clocks: this._qvc._clocks, id: this._id, local: true, msg: message});
	}
	else{
		this._localCache.push(message);
	}
};
