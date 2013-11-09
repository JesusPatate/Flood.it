/******************************************
Dependences : 
* peer.js,
* eventemitter.js,
* utils.js,
* hashfunctiongen.js
*******************************************/

/*Interface fournie :
  - send(message);
  - getId();
  - ready;
  - on('ready', function(id){});
  - on('deliver', function(message){});
***********************************************/


// TODO: transférer la fonction de hashage
// TODO: faire fonctionner la fonction hashage à partir du rapport de l'année dernière
// TODO: comment transmettre les données d'initialisation, le document
// TODO: améliorer le constructeur avec les paramètres optionnels
// TODO: détecter les erreurs de causalité
// TODO: commenter
// TODO: tester la mise en cache


/**
 * \class QVC
 * \brief ...
 */
function QVC(clocks, entries){
	this._clocks = clocks;
	this._entries = entries;
}

/**
 * \brief ...
 */
QVC.prototype.increment = function(){
	for(var entry in this._entries){
		this._clocks[entry]++;
    }
};

/**
 * \brief ...
 *
 * \param qvc
 *      ...
 */
QVC.prototype.incrementFrom = function(qvc){
	for(var entry in qvc._entries){
		this._clocks[entry]++;
    }
};

/**
 * \brief ...
 *
 * \param reference
 *      ...
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
 * \class PBCast
 * \brief ...
 */
function PBCast(r, k, peerServer, joinId){
	var self = this;
	EventEmitter.call(this);
    this._peer;
    this._connections = new Map();
    this._qvc;
    this._hashEntriesFunction;
    this._notDelivered = [];
    this._delivered = [];
    this.ready = false;
    this._cache = [];
	
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
			connection.on('open', function(){
				handleOpenedConnection(connection);
				connection.send({type: PBCast.JOIN_REQ});
			});
		}
		
		// On crée un nouveau groupe.
		else{
			var generator = new HashFunctionGenerator();
			self._hashEntriesFunction = generator.generate(r || PBCast.DEFAULT_R, k || PBCast.DEFAULT_K);
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
					handleMessage(data.data);
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
			self._connections.delete(connection.peer);
		};
	}
	
	function handleOpenedConnection(connection){
		connection.on('data', handleData(connection));
		connection.on('close', handleQuit(connection));
		self._connections.put(connection.peer, connection);
	}
	
	function handleNewConnection(connection){
		var peerId = connection.peer;
		console.log('Nouvelle connexion: ' + peerId);
		
		if(!self._connections.hasKey(connection.peer)){
			handleOpenedConnection(connection);
		}
	}
	
	function handleInitializationRequest(requestConnection){
		var knownIds = [];
					
		for(var i in self._connections.iterator()){
			if(i[1] != requestConnection){
				knownIds.push(i[0]);
			}
		}
					
		//requestConnection.send({type: PBCast.JOIN_RESP, data: {ids: ids, hashFunction: self._hashEntriesFunction}});
		requestConnection.send({type: PBCast.JOIN_RESP, data: {ids: knownIds, hashFunction: ''}});
		// renvoyer les données d'initialisation
	}
	
	function handleInitializationResponse(data){
		// Get ids of the group.
		for(var i = 0; i < data.ids.length; i++){
			var connection = self._peer.connect(data.ids[i]);
			connection.on('open', function(){
				handleOpenedConnection(connection);
			});
		}
			
		// TODO: voir comment transférer la fonction de hash		
		// Get hash function of the group.
		//self._hashEntriesFunction = data.hashFunction;
		
		var generator = new HashFunctionGenerator();
		self._hashEntriesFunction = generator.generate(r || PBCast.DEFAULT_R, k || PBCast.DEFAULT_K);
					
		// Get other initialization data
					
					
		initialize();
	}
	
	function initialize(){
		var clocks = initializeClocks(r || PBCast.DEFAULT_R);
		var entries = self._hashEntriesFunction(self._peer.id);
		self._qvc = new QVC(clocks, entries);
		self.ready = true;
		emptyCache();
		self.emit('ready', self._peer.id);
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
	
	function handleMessage(message){
		var qvc = new QVC(message.clocks, message.entries);
	
		if(qvc.isCausallyReady(self._qvc)){
			self._qvc.incrementFrom(qvc);
			self.emit('deliver', {error: false, msg: message.msg});
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
				self.emit('deliver', {error: false, msg: message.msg.msg});
			}
			else{
				i++;
			}
		}
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
	return this._peer.id;
};

/**
 * \brief ...
 *
 * \param message
 *      ...
 */
PBCast.prototype.send = function(message){
	if(this.ready){
		console.log('envoyé');
		this._qvc.increment();
		this._broadcast({type: PBCast.MSG, data: {clocks: this._qvc._clocks, entries: this._qvc._entries, msg: message}});
	}
	else{
		console.log('mis en cache');
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
		connEntry[1].send(message);
	}
};
