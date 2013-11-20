var PORT = 1337;
var R = 100;
var K = 5;
var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var fs = require('fs');
var entriesHash = require('./entrieshash');

/*!
 * \brief Currently connected users.
 *
 * Each user has the following form:
 \verbatim
  {
    id          : <USER UNIQUE ID>,
    name        : <USER NAME>,
    connection  : <WEBSOCKET CONNECTION OBJECT>
  }
 \endverbatim
 */
var users = [];

//! Context is all transmited patchs from server start.
var messages = [];

var hashGenerator = new entriesHash.EntriesHashGenerator();
var entriesHashFunction = hashGenerator.generate(R, K);

//! Unique identifier of user.
function UUID(){}
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

function sendContext(user){
	// Send existing messages.
	for (var i = 0; i < messages.length; i++){
		var msg = JSON.stringify({type: 'MSG', data: messages[i]});
		user.connection.sendUTF(msg);
	}
}

function sendJoinAttributes(user){
	var msg = JSON.stringify({type: 'JOIN_RESP', data: {id: user.id, r: entriesHashFunction._m, entries: entriesHashFunction.hash(user.id)}});
	user.connection.sendUTF(msg);
}	

/*!
 * \brief Send new message to all connections.
 *
 * Send via websocket a new patch to all connections. The message is formated in
 * json with the following form:
 \verbatim
 {
    type  : 'MSG',
    data : <PATCH OBJECT>
 }
 \endverbatim
 *
 * \param message   The message to send to all user.
 * \param except  The connection to not send.
 */
function sendMessage(message, except){
	var msg = JSON.stringify(message);

	for(var i = 0; i < users.length; i++){ 
		if(users[i].connection != except){
			users[i].connection.sendUTF(msg);
		}
	}
}

/*!
 * \brief Http Request listener.
 *
 * \param req   The user request.
 * \param res   The response send to user.
 */
function onHttpRequest(req, res){
	var route = url.parse(req.url).pathname

	// Ugly url routing ...
	switch(route){
		case '/bootstrap.min.css':
			res.writeHeader(200, {'Content-Type': 'text/css'});  
			res.end(fs.readFileSync('./bootstrap.min.css','utf8'));  
			break;
		
		case '/bootstrap.min.js':
			res.writeHeader(200, {'Content-Type': 'application/javascript'});  
			res.end(fs.readFileSync('./bootstrap.min.js','utf8'));  
			break;
    
		case '/logoot.js':
			res.writeHeader(200, {'Content-Type': 'application/javascript'});  
			res.end(fs.readFileSync('./logoot.js','utf8'));  
			break;
    
		case '/logootEditor.js':
			res.writeHeader(200, {'Content-Type': 'application/javascript'});  
			res.end(fs.readFileSync('./logootEditor.js','utf8'));  
			break;
    
		case '/index.html':
		case '/':
		default:
			res.writeHeader(200, {'Content-Type': 'text/html'});  
			res.end(fs.readFileSync('./logoot.html','utf8'));  
			break;
	}
}

/*!
 * \brief WebSocket Request Listener.
 *
 * Listen on a new user connect to WebSocket Server. A new user is store in
 * users after user identification. Each user is an object with following
 * format :
 \verbatim
  {
    id          : <USER UNIQUE ID>,
    connection  : <WEBSOCKET CONNECTION OBJECT>
  }
 \endverbatim
 *
 * \param req   The user request.
 */
function onWsRequest(req){
	var connection = req.accept(null, req.origin);
	var user;
	var index = false;

	// Each user send a message event, message is broadcasted to all users.
	connection.on('message', function(message){
		if(message.type == 'utf8'){
			var obj = JSON.parse(message.utf8Data);

			switch(obj.type){
				case 'JOIN_REQ':
					user = {id: UUID.gen(), connection: connection};
					index = users.push(user) - 1;
					sendJoinAttributes(user);
					sendContext(user);
					break;
					
				case 'MSG':
					sendMessage(obj, connection);
					messages.push(obj.data);
					break;
					
				default:
			}
		}
	});

	// At user disconection, he is remove from broadcast groupe.
	connection.on('close', function(connection){
		if(index !== false){
			users.splice(index, 1); 
		}
	});
}

//! Http Server.
var server = http.createServer(onHttpRequest).listen(PORT);

//! WebSocket Server.
var wsServer = new WebSocketServer({httpServer: server})
	.on('request', onWsRequest);

console.log('Server running at http://127.0.0.1:' + PORT);
