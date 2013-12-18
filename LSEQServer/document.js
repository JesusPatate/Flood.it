var entriesHash = require('./entrieshash');

function Document(title, r, k){
	this._title = title;
	this._users = [];
	this._messages = [];
	var hashGenerator = new entriesHash.EntriesHashGenerator();
	this._entriesHashFunction = hashGenerator.generate(r, k);
}

Document.prototype.receive = function(message, connection){
	this._broadcast({type: 'MSG', data: message}, connection);
	this._messages.push(message);
};

Document.prototype.addUser = function(message, connection){
	var user = {id: UUID.gen(), name: message.userName, connection: connection};
	this._sendInitializationAttributes(user);
	this._users.push(user);
	this._sendContext(connection);
	this._broadcast({type: 'USER_CONNECTED', data: {id: user.id,
		name: user.name}}, connection);
};

Document.prototype._sendInitializationAttributes = function(user){
	var msg = JSON.stringify({type: 'JOIN_RESP', data: {id: user.id,
		name: user.name, knownUsers: this._getKnownUsers(),
		r: this._entriesHashFunction._m,
		entries: this._entriesHashFunction.hash(user.id), documentTitle: this._title}});
	user.connection.sendUTF(msg);
};

Document.prototype._getKnownUsers = function(){
	var knownUsers = [];

	for(var i = 0; i < this._users.length; i++){
		var user = this._users[i];
		knownUsers.push({id: user.id, name: user.name});
	}
	
	return knownUsers;
};	

Document.prototype._sendContext = function(connection){
	for(var i = 0; i < this._messages.length; i++){
		var msg = JSON.stringify({type: 'MSG', data: this._messages[i]});
		connection.sendUTF(msg);
	}
};

Document.prototype._broadcast = function(message, except){
	var msg = JSON.stringify(message);

	for(var i = 0; i < this._users.length; i++){
		var user = this._users[i];
		 
		if(user.connection != except){
			user.connection.sendUTF(msg);
		}
	}
};

Document.prototype.removeUser = function(connection){
	var index = this._getUserIndexFromConnection(connection);
	var user = this._users[index];
	this._users.splice(index, 1);
	this._broadcast({type: 'USER_DISCONNECTED', data: {id: user.id}},
		connection);
};

Document.prototype._getUserIndexFromConnection = function(connection){
	var i = 0;
	var found = false;
                
    while(i < this._users.length && !found){
		var user = this._users[i];
		found = (connection == user.connection);
		i++;
	}
    
	return i - 1;
};

Document.prototype.nbUsers = function(){
	return this._users.length;
};

function UUID(){
}

UUID.millisOld = 0;
UUID.counter = 0;

UUID.gen = function(){
	var millis = new Date().getTime() - 1262304000000;

	if(millis == UUID.millisOld){
		++ UUID.counter;
	}
	else{
		UUID.counter = 0;
		UUID.millisOld = millis;
	}

	return (millis * Math.pow(2, 12)) + UUID.counter;
}

exports.Document = Document;
