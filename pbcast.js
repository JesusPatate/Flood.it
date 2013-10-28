/*********************************************
Dépendances : PeerJS

Interface fournie :
  - addListener(listener);
  - send(message);
  - join(peerId);
   
Interface requise: 
  - messageDelivered(msg);
  
  
Pour l'instant peerjs server affecte les ids

***********************************************/

function PBCastBuilder(){
  function PBCast(id, r, k, server){  
    this._peer = this._initializePeer(id, server);
    this._connections = [];
    this._clocks = this._initializeClocks(r || this.DEFAULT_R);
    this._entries = this._getEntries(this._peer.id, this._clocks.length, k || this.DEFAULT_K);
    this._listeners = [];
    this._notDelivered = [];
    this._delivered = [];
  }

  PBCast.prototype.DEFAULT_HOST = '0.peerjs.com';

  PBCast.prototype.DEFAULT_PORT = 9000;

  PBCast.prototype.DEFAULT_R = 100;

  PBCast.prototype.DEFAULT_K = 5;

  PBCast.prototype._initializeClocks = function(r){
    var clks = [];
      
    for(var i=0; i<r; i++){
	clks.push(0);
    }
      
    return clks;
  };

  PBCast.prototype._initializePeer = function(id, server){
    var peer;
    
    var options = {
	key: '5g9qpwrh59v34n29',
	host: server && server.host || this.DEFAULT_HOST,
	port: server && server.port || this.DEFAULT_PORT
      };
    
    if(id === undefined){
      peer = new Peer(options);
    }else{
      peer = new Peer(id, options);
    }
    
    peer.on('open', function(id){

      });
    });
    
    peer.on('connection', function(connection){
      var peerId = connection.peer;
      
      if(this._peer.connections.peerId === undefined){
	this._connections.push(connection);
	// envoyer ids des peers que l'on connait
	connection.on('data', function(message){
	  //var peerEntries = getEntries(peerId, clocks.length, entries.length);
	  
	  if(true /*|| ready(message, peerId)*/){
	    // incrementClocks(peerEntries);
	    deliver({error: false, msg: message.msg});
	    // checkNoDelivered();
	  }else{
	    this._notDelivered.push({peerId: peerId, msg: msg});
	  }
	});
      }
    });
      
    return peer;
  };

  PBCast.prototype._checkNoDelivered = function (){
    var i = 0;
    
    while(i < this._notDelivered.length){
      var msg = notDelivered[i];
      var peerEntries = this._getEntries(msg.peerId, this._clocks.length, this._entries.length);
      
      if(ready(peerEntries, msg.msg.clks)){
	msg = this._notDelivered.shift().msg;
	this._incrementClocks(peerEntries);
	this._deliver({error: false, msg: msg});
      }else{
	i++;
      }
    }
  };

  PBCast.prototype._ready = function(peerEntries, clks){    
    return checkPeerEntries(peerEntries, clks) &&
      checkOtherEntries(peerEntries, clks);
  };

  PBCast.prototype._checkPeerEntries = function(peerEntries, msgClocks){
    var ready = false;
    var i = 0;
    
    while(!ready && i < peerEntries.length){
      ready = clocks[i] >= msgClocks[i] - 1;
      i++;
    }
      
    return ready;
  };

  PBCast.prototype._checkOtherEntries = function (peerEntries, msgClocks){
    var ready = false;
    var i = 0;
    var otherEntries = []; // TODO
      
    while(!ready && i < otherEntries.length){
      ready = clocks[i] >= msgClocks[i];
      i++;
    }
      
    return ready;
  };

  PBCast.prototype._deliver = function(message){
    for(var listener in this._listeners){
      this._listeners[listener].messageDelivered(message);
    }
    
    console.log(message.msg);
  };
    
  PBCast.prototype._getEntries = function(id, r, k){
    return []; // TODO
  };
    
  PBCast.prototype.addListener = function(listener){
    this._listeners.push(listener);
  };
    
  PBCast.prototype.send = function(msg){
    if(this._joined){
      this._incrementClocks(this._entries);
      this._broadcast({clks: this._clocks, msg: msg});
    }else{
      this._cacheMessage.push(msg);
    }
  };

  PBCast.prototype._incrementClocks = function(entries){
    for(var entry in entriesj){
	this._clocks[entry]++;
    }
  };

  PBCast.prototype._broadcast = function(msg){
    for(var connection in this._connections){
      this._connections[connection].send(msg);
    }
  };
}