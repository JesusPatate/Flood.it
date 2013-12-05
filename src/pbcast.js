define(['peer', 'EventEmitter', 'utils', 'entrieshash'], function(peer, EventEmitter, utilsRef, entriesHashRef){
    var pbcast = function(){
		var self = this;
        var name = 'pbcast';
        
        var utils = new utilsRef();
        var entriesHash = new entriesHashRef();
        
        this.name = function(){
            return name;
        }
        
        /*Interface fournie :
		  - send(message);
		  - getId();
		  - id;
		  - ready;
		  - on('ready', function(id){});
		  - on('deliver', function(message){});
		***********************************************/


		// TODO: comment transmettre les données d'initialisation, le document
		// TODO: commenter
		// TODO: gestion erreurs -> on error ??
		// TODO: que transmettre dans le message on deliver (local ou non) ?


		/**
		 * \class QVC
		 * \brief An object that represents a quasi vector clocks.
		 */
		this.QVC = function(clocks, entries){
			this._clocks = clocks;
			this._entries = entries;
		}

		/**
		 * \brief Constructs a qvc from a litteral object.
		 *
		 * \param object
		 * 		litteral object containing the attributes of a qvc.
		 */
		this.QVC.fromLitteralObject = function(object){
			return new self.QVC(object.clocks, object.entries);
		};

		/**
		 * \brief Return a copy of the clocks.
		 */
		this.QVC.prototype.clocks = function(){
			return this._clocks.slice();
		};

		/**
		 * \brief Increments the qvc.
		 */
		this.QVC.prototype.increment = function(){
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
		this.QVC.prototype.incrementFrom = function(qvc){
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
		this.QVC.prototype.isCausallyReady = function(reference){
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
		this.QVC.prototype.isInferior = function(qvc){
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
		this.QVC.prototype.isInferiorOrEqual = function(qvc){
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
		this.QVC.prototype.toLitteralObject = function(){		
			return {clocks: this.clocks(), entries: this._entries};
		};



		/**
		 * \class PBCast
		 * \brief ...
		 */
		this.PBCast = function(){
			var selfPBcast = this;
			EventEmitter.EventEmitter.call(this);
			this._peer;
			this._connections = new utils.Map();
			this._qvc;
			this._entriesHash;
			this._notDelivered = [];
			this._delivered = new utils.Queue();
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
				key: '5g9qpwrh59v34n29',
				host: peerServer.host,
				port: peerServer.port
			};
			
			this._peer = new Peer(options);
			this._peer.on('open', handleOpen);
			this._peer.on('connection', handleNewConnection);
			
			function handleOpen(id){		
				// We join the group of the joinId peer.
				if(joinId != undefined){
					var connection = selfPBcast._peer.connect(joinId);
					connection.on('open', handleOpenedConnection(connection));
				}
				// We create a new group.
				else{
					var generator = new entriesHash.EntriesHashGenerator();
					selfPBcast._entriesHash = generator.generate(r, k);
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
							break;
					}
				};
			}
			
			function handleQuit(connection){
				return function(){			
					selfPBcast._connections.remove(connection.peer);
				};
			}
			
			function handleOpenedConnection(connection){
				return function(){
					connection.on('data', handleData(connection));
					connection.on('close', handleQuit(connection));
					selfPBcast._connections.put(connection.peer, connection);			
					
					if(!self.ready){
						if(connection.peer == joinId){
							connection.send({type: PBCast.JOIN_REQ});
						}
						else{
							selfPBcast._groupPeerJoined++;
						
							if(selfPBcast._groupPeerJoined == selfPBcast._groupPeerToJoin){
								initialize();
							}
						}
					}
				};
			}
			
			function handleNewConnection(connection){
				console.log('Nouvelle connexion: ' + connection.peer);
				
				if(!selfPBcast._connections.hasKey(connection.peer)){
					handleOpenedConnection(connection)();
				}
			}
			
			function handleInitializationRequest(requestConnection){
				var knownIds = [];
							
				for(var i in selfPBcast._connections.iterator()){
					if(i[1] != requestConnection){
						knownIds.push(i[0]);
					}
				}
							
				requestConnection.send({type: PBCast.JOIN_RESP, data: {ids: knownIds, entriesHash: selfPBcast._entriesHash.toLitteralObject()}});
			}
			
			// attendre que les connexions avec tous les ids reçu soit open avant d'être dans l'état ready
			function handleInitializationResponse(data){
				// Set ids of the group.
				selfPBcast._groupPeerToJoin = data.ids.length;
				
				for(var i = 0; i < data.ids.length; i++){
					var connection = selfPBcast._peer.connect(data.ids[i]);
					connection.on('open', handleOpenedConnection(connection));
				}
							
				// Set hash function of the group.
				selfPBcast._entriesHash = EntriesHash.fromLitteralObject(data.entrieshash);
				
				if(selfPBcast._groupPeerToJoin == 0){
					initialize();
				}
			}
			
			function initialize(){
				var clocks = initializeClocks(selfPBcast._entriesHash.m());
				var entries = self._entriesHash.hash(selfPBcast._peer.id);
				selfPBcast._qvc = new self.QVC(clocks, entries);
				selfPBcast.ready = true;
				emptyLocalCache();
				emptyCache();
				selfPBcast.emit('ready', selfPBcast._peer.id);
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
					var message = self._cache.shift();
					selfPBcast.send(message);
				}
			}
			
			function emptyLocalCache(){
				while(selfPBcast._cache.length > 0){
					var message = selfPBcast._cache.shift();
					selfPBcast.localSend(message);
				}
			}
			
			// TODO: id ???
			function handleMessage(message, id){
				var qvc = self.QVC.fromLitteralObject(message.qvc);
			
				if(qvc.isCausallyReady(selfPBcast._qvc)){
					selfPBcast._qvc.incrementFrom(qvc);
					var error = detectError(qvc);
					selfPBcast.emit('deliver', {error: error, local: false, msg: message.msg});
					selfPBcast._delivered.add({qvc: qvc});
					checkNoDelivered();
				}
				else{
					selfPBcast._notDelivered.push({id: id, msg: message});
				}
			}

			function checkNoDelivered(){
				var i = 0;
				
				while(i < selfPBcast._notDelivered.length){
					var message = notDelivered[i];
					var qvc = new self.QVC(message.clocks, message.entries);
					
					if(qvc.isCausallyReady(selfPBcast._qvc)){
						selfPBcast._notDelivered.splice(i, 1);
						selfPBcast._qvc.incrementFrom(qvc);
						var error = detectError(qvc);
						selfPBcast.emit('deliver', {error: error, local: false, msg: message.msg.msg});
						selfPBcast._delivered.add({qvc: qvc});
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
						var deliveredQvc = it.next()[1];
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

		this.PBCast.DEFAULT_HOST = '0.peerjs.com';
		this.PBCast.DEFAULT_PORT = 9000;
		this.PBCast.JOIN_REQ = 0;
		this.PBCast.JOIN_RESP = 1;
		this.PBCast.MSG = 2;
		this.PBCast.QUIT = 3;

		/**
		 * \brief ...
		 */
		this.PBCast.prototype.id = function(){
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
		this.PBCast.prototype.send = function(message){
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
		this.PBCast.prototype._broadcast = function(message){
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
		this.PBCast.prototype.localSend = function(message){
			if(this.ready){
				this._qvc.increment();
				this.emit('deliver', {error: false, clocks: this._qvc.clocks(), id: this._peer.id, local: true, msg: message});
			}
			else{
				this._localCache.push(message);
			}
		};

    };
 
    return pbcast;
});
