/******************************************
Dependences : 
* peer.js,
* eventemitter.js,
* utils.js,
* entrieshash.js
*******************************************/

/*Interface fournie :
  - send(message);
  - getId();
  - id;
  - ready;
  - on('ready', function(id){});
  - on('deliver', function(message){});
***********************************************/


// TODO: comment transmettre les données d'initialisation, le document
// TODO: améliorer le constructeur avec les paramètres optionnels
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
	var it = Iterator(this._entries, false);
	var end = false;	
		
	while(inferior && !end){
		try{
			var entry = it.next();
			inferior = (this._clocks[entry] < qvc._clocks[entry]);
		}
		catch(e){
			end = true;
		}
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
	var it = Iterator(this._entries, false);
	var end = false;	
		
	while(inferior && !end){
		try{
			var entry = it.next();
			inferior = (this._clocks[entry] <= qvc._clocks[entry]);
		}
		catch(e){
			end = true;
		}
	}
	
	return inferior;
};

/**
 * \brief Returns the litteral object reprensentation of a qvc.
 */
QVC.prototype.toLitteralObject = function(){		
	return {clocks: this._clocks, entries: this._entries};
};

/**
 * \class PBCast
 * \brief ...
 */
function PBCast(r, k, peerServer, joinId){
	var self = this;
	EventEmitter.call(this);
    this._peer;
    this.id;
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
	
	var options = {
		key: '5g9qpwrh59v34n29',
		host: peerServer && peerServer.host || PBCast.DEFAULT_HOST,
		port: peerServer && peerServer.port || PBCast.DEFAULT_PORT
    };
    
    this._peer = new Peer(options);
	this._peer.on('open', handleOpen);
	this._peer.on('connection', handleNewConnection);
	
	function handleOpen(id){		
		// On rejoint le groupe dont le peer qui a l'id joinId fait partie.
		if(joinId != undefined){
			var connection = self._peer.connect(joinId);
			connection.on('open', handleOpenedConnection(connection));
		}
		
		// On crée un nouveau groupe.
		else{
			var generator = new EntriesHashGenerator();
			self._entriesHash = generator.generate(r || PBCast.DEFAULT_R, k || PBCast.DEFAULT_K);
			initialize();
		}
	}
	
    function handleData(connection){
		return function(data){
			console.log(JSON.stringify(data));
			
			switch(data.type){
				case PBCast.JOIN_REQ:
					handleInitializationRequest(connection);
					break;
			
				case PBCast.JOIN_RESP:
					handleInitializationResponse(data.data);
					break;
				case PBCast.MSG:
					handleMessage(data.data, connection.peer);
					break;
				
				case PBCast.QUIT:
					handleQuit(connection)();
					break;
					
				default:
					throw new Error('Unrecognized message');
					break;
			}
		};
	}
	
	function handleQuit(connection){
		return function(){			
			self._connections.remove(connection.peer);
		};
	}
	
	function handleOpenedConnection(connection){
		return function(){
			connection.on('data', handleData(connection));
			connection.on('close', handleQuit(connection));
			self._connections.put(connection.peer, connection);			
			
			if(!self.ready && joinId != undefined && connection.peer == joinId){
				connection.send({type: PBCast.JOIN_REQ});
			}
			
			if(!self.ready && joinId != undefined && connection.peer != joinId){
				self._groupPeerJoined++;
				
				if(self._groupPeerJoined == self._groupPeerToJoin){
					initialize();
				}
			}
		};
	}
	
	function handleNewConnection(connection){
		var peerId = connection.peer;
		console.log('Nouvelle connexion: ' + peerId);
		
		if(!self._connections.hasKey(connection.peer)){
			handleOpenedConnection(connection)();
		}
	}
	
	function handleInitializationRequest(requestConnection){
		var knownIds = [];
					
		for(var i in self._connections.iterator()){
			if(i[1] != requestConnection){
				knownIds.push(i[0]);
			}
		}
					
		requestConnection.send({type: PBCast.JOIN_RESP, data: {ids: knownIds, entriesHash: self._entriesHash.toLitteralObject()}});
		// renvoyer les données d'initialisation
	}
	
	// attendre que les connexions avec tous les ids reçu soit open avant d'être dans l'état ready
	function handleInitializationResponse(data){
		// Get ids of the group.
		self._groupPeerToJoin = data.ids.length;
		
		for(var i = 0; i < data.ids.length; i++){
			var connection = self._peer.connect(data.ids[i]);
			connection.on('open', handleOpenedConnection(connection));
		}
					
		// Get hash function of the group.
		//self._entriesHash = EntriesHash.fromLitteralObject(data.entrieshash);
		
		var generator = new EntriesHashGenerator();
		self._entriesHash = generator.generate(r || PBCast.DEFAULT_R, k || PBCast.DEFAULT_K);
					
		// Get other initialization data
		
		if(self._groupPeerToJoin == 0){
			initialize();
		}
	}
	
	function initialize(){
		var clocks = initializeClocks(r || PBCast.DEFAULT_R);
		var entries = self._entriesHash.hash(self._peer.id);
		self._qvc = new QVC(clocks, entries);
		self.ready = true;
		emptyLocalCache();
		emptyCache();
		self.id = self._peer.id;
		self.emit('ready', self.id);
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
	
	function handleMessage(message, id){
		var qvc = QVC.fromLitteralObject(message.qvc);
	
		if(qvc.isCausallyReady(self._qvc)){
			self._qvc.incrementFrom(qvc);
			var error = detectError(qvc);
			self.emit('deliver', {error: error, local: false, msg: message.msg});
			self._delivered.add({qvc: message.qvc});
			checkNoDelivered();
		}
		else{
			self._notDelivered.push({id: id, msg: message});
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

PBCast.DEFAULT_HOST = '0.peerjs.com';
PBCast.DEFAULT_PORT = 9000;
PBCast.DEFAULT_R = 100;
PBCast.DEFAULT_K = 5;
PBCast.JOIN_REQ = 0;
PBCast.JOIN_RESP = 1;
PBCast.MSG = 2;
PBCast.QUIT = 3;

/**
 * \brief ...
 */
PBCast.prototype.getId = function(){
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
	for(var connEntry in this._connections.iterator()){
		console.log(connEntry[0]);
		connEntry[1].send(message);
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
		this.emit('deliver', {error: false, clocks: this._qvc._clocks, id: this._peer.id, local: true, msg: message});
	}
	else{
		this._localCache.push(message);
	}
};
