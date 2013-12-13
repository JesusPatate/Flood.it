/******************************************
Dependences : 
* peer.js,
* eventemitter.js,
* utils.js,
* entrieshash.js
*******************************************/

// TODO: commenter


/**
 * \class QVC
 * \brief An object that represents a quasi vector clocks.
 */
function QVC(clocks, entries){
	this._clocks = clocks;
	this._entries = entries;
}

/**
 * \brief Constructs a qvc from a litteral object.
 *
 * \param object
 * 		litteral object containing the attributes of a qvc.
 */
QVC.fromLitteralObject = function(object){
	return new QVC(object.clocks, object.entries);
};

/**
* \brief Return a copy of the clocks.
*/
QVC.prototype.clocks = function(){
	return this._clocks.slice();
};

/**
* \brief Return a copy of the entries.
*/
QVC.prototype.entries = function(){
	var entriesCopy = {};
	
	for(var entry in this._entries){
		entriesCopy[entry] = entry;
	}
	
	return entriesCopy;
};

/**
 * \brief Increments the qvc.
 */
QVC.prototype.increment = function(){
	for(var entry in this._entries){
		this._clocks[entry]++;
    }
};

/**
 * \brief Increments the qvc in fonction of an other qvc.
 *
 * \param qvc
 *      
 */
QVC.prototype.incrementFrom = function(qvc){
	for(var entry in qvc._entries){
		this._clocks[entry]++;
    }
};

/**
 * \brief Returns true if the qvc is causally ready in relation to a
 * referential qvc.
 *
 * \param reference
 *      the referencial qvc.
 */
QVC.prototype.isCausallyReady = function(reference){
	var ready = true;
	var i = 0;
	
	while(ready && i < this._clocks.length){
		if(i in this._entries){
			ready = (this._clocks[i] - 1 <= reference._clocks[i]);
		}
		else{
			ready = (this._clocks[i] <= reference._clocks[i]);
		}
		
		i++;
	}
	
	return ready;
};

/**
 * \brief ...
 *
 * \param qvc
 *      ...
 */
QVC.prototype.isInferior = function(qvc){
	var inferior = true;
	var it = new LitteralObjectIterator(this._entries, true);	
		
	while(inferior && it.hasNext()){
		var entry = it.next();
		inferior = (this._clocks[entry] < qvc._clocks[entry]);
	}
	
	return inferior;
};

/**
 * \brief ...
 *
 * \param qvc
 *      ...
 */
QVC.prototype.isInferiorOrEqual = function(qvc){
	var inferior = true;
	var it = new LitteralObjectIterator(this._entries, true);	
		
	while(inferior && it.hasNext()){
		var entry = it.next();
		inferior = (this._clocks[entry] <= qvc._clocks[entry]);
	}
	
	return inferior;
};

/**
 * \brief Returns the litteral object reprensentation of a qvc.
 */
QVC.prototype.toLitteralObject = function(){		
	return {clocks: this.clocks(), entries: this._entries};
};



/**
 * \class PBCast
 * \brief ...
 */
function PBCast(){
	var self = this;
	EventEmitter.call(this);
	this._peer;
	this._connections = new Map();
	this._qvc;
	this._entriesHash;
	this._notDelivered = [];
	this._delivered = new Queue();
	this.ready = false;
	this._cache = [];
	this._localCache = [];
	this._groupPeerJoined = 0;
	this._groupPeerToJoin;
	
	var peerServer, r, k, joinId;
	
	// PBCast(peerServer, r, k) 
	if(arguments.length == 3){
		peerServer = arguments[0];
		r = arguments[1];
		k = arguments[2];
	}

	// PBCast(peerServer, joinId)
	else if(arguments.length == 2){
		peerServer = arguments[0];
		joinId = arguments[1];
	}
	else{
		throw new Error('Invalid constructor');
	}

	var options = {
		host: peerServer.host,
		port: peerServer.port
	};

	this._peer = new Peer(options);
	this._peer.on('open', handleOpen);
	this._peer.on('connection', handleNewConnection);

	function handleOpen(id){
		// We join the group of the joinId peer.
		if(joinId != undefined){
			var connection = self._peer.connect(joinId);
			connection.on('open', handleOpenedConnection(connection));
		}
		// We create a new group.
		else{
			var generator = new EntriesHashGenerator();
			self._entriesHash = generator.generate(r, k);
			initialize([]);
		}
	}

	function handleData(connection){
		return function(data){			 
			switch(data.type){
				case PBCast.JOIN_REQ:
					handleInitializationRequest(connection);
					break;

				case PBCast.JOIN_RESP:
					handleInitializationResponse(data.data);
					break;

				case PBCast.MSG:
					console.log('Message reçu');
					handleMessage(data.data);
					break;
					
				case PBCast.JOINED:
					break;
				
				case PBCast.QUIT:
					handleQuit(connection)();
					break;

				default:
					break;
			}
		};
	}
	
	function handleQuit(connection){
		return function(){			
			self._connections.remove(connection.peer);
			self.emit('disconnectedUser', connection.peer);
		};
	}
	
	function handleOpenedConnection(connection){
		return function(){
			connection.on('data', handleData(connection));
			connection.on('close', handleQuit(connection));
			self._connections.put(connection.peer, connection);      

			if(!self.ready){
				if(connection.peer == joinId){
					connection.send({type: PBCast.JOIN_REQ});
				}
				else{
					self._groupPeerJoined++;

					if(self._groupPeerJoined == self._groupPeerToJoin.length){
						var knownIds = self._groupPeerToJoin.concat([joinId]);
						initialize(knownIds);
					}
				}
			}
		};
	}
	
	function handleNewConnection(connection){
		self.emit('connectedUser', connection.peer);
		if(!self._connections.hasKey(connection.peer)){
			handleOpenedConnection(connection)();
		}
	}
	
	function handleInitializationRequest(requestConnection){
		var knownIds = [];
		var it = self._connections.iterator();
		
		while(it.hasNext()){
			var connection = it.next();
			
			if(connection[1] != requestConnection){
				knownIds.push(connection[0]);
			}
		}
					
		requestConnection.send({type: PBCast.JOIN_RESP, data: {ids: knownIds, entriesHash: self._entriesHash.toLitteralObject()}});
	}
	
	function handleInitializationResponse(data){
		// Get ids of the group.
		self._groupPeerToJoin = data.ids;
		
		for(var i = 0; i < data.ids.length; i++){
			var connection = self._peer.connect(data.ids[i]);
			connection.on('open', handleOpenedConnection(connection));
		}
					
		// Get hash function of the group.
		self._entriesHash = EntriesHash.fromLitteralObject(data.entriesHash);
		
		if(self._groupPeerToJoin == 0){
			var knownIds = self._groupPeerToJoin.concat([joinId]);
			initialize(knownIds);
		}
	}
	
	function initialize(knownIds){
		var clocks = initializeClocks(self._entriesHash.m());
		var entries = self._entriesHash.hash(self._peer.id);
		self._qvc = new QVC(clocks, entries);
		self.ready = true;
		emptyLocalCache();
		emptyCache();
		self.emit('ready', {id: self._peer.id, knownIds: knownIds});
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
			self.emit('deliver', {error: error, local: false, msg: message.msg});
			self._delivered.add({qvc: qvc});
			checkNoDelivered();
		}
		else{
			console.log('Non prêt causalement: ' + JSON.stringify(message));
			self._notDelivered.push({msg: message});
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
				self.emit('deliver', {error: error, local: false, msg: message.msg.msg});
				self._delivered.add({qvc: qvc});
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
		
		while(inferiorToCurrent && inferiorOrEqualToDelivered && it.hasNext()){
			var deliveredQvc = it.next()[1];
			inferiorOrEqualToDelivered = qvc.isInferiorOrEqual(deliveredQvc);
		}
		
		return inferiorToCurrent && inferiorOrEqualToDelivered;
	}
}

PBCast.prototype = Object.create(EventEmitter.prototype);
PBCast.prototype.constructor = PBCast;

PBCast.JOIN_REQ = 0;
PBCast.JOIN_RESP = 1;
PBCast.MSG = 2;
PBCast.JOINED = 3;
PBCast.QUIT = 4;

/**
 * \brief ...
 */
PBCast.prototype.id = function(){
	var id;
	
	if(this.ready){
		id = this._peer.id;
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
		this._broadcast({type: PBCast.MSG, data: {qvc: this._qvc.toLitteralObject(), msg: message}});
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
PBCast.prototype._broadcast = function(message){
	var it = this._connections.iterator();
		
	while(it.hasNext()){
		it.next()[1].send(message);
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
		this.emit('deliver', {error: false, entries: this._qvc.entries(), id: this._peer.id, local: true, msg: message});
	}
	else{
		this._localCache.push(message);
	}
};
