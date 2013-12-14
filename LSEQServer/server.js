var PORT = 1337;
var R = 100;
var K = 5;
var DEFAULT_DOCUMENT = 'untitled';
var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var fs = require('fs');
var document = require('./document');

var documents = {};

/*!
 * \brief Http Request listener.
 *
 * \param req   The user request.
 * \param res   The response send to user.
 */
function handleHttpRequest(request, response){
	var route = url.parse(request.url).pathname

	switch(route){
		case '/bootstrap.min.css':
			response.writeHeader(200, {'Content-Type': 'text/css'});  
			response.end(fs.readFileSync('public/css/bootstrap.min.css', 'utf8'));  
			break;
		
		case '/bootstrap.min.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/bootstrap.min.js', 'utf8'));  
			break;
    
		case '/lseq.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/lseq.js', 'utf8'));  
			break;
			
		case '/pbcastws.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/pbcastws.js', 'utf8'));  
			break;
		
		case '/pbcast.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/pbcast.js', 'utf8'));  
			break;
		
		case '/main.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/main.js', 'utf8'));  
			break;
    
		case '/editor.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/editor.js', 'utf8'));  
			break;
		
		case '/ace.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/ace.js', 'utf8'));  
			break;
			
		case '/utils.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/utils.js', 'utf8'));  
			break;
		
		case '/eventemitter.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/eventemitter.js', 'utf8'));  
			break;
			
		case '/seedrandom.js':
			response.writeHeader(200, {'Content-Type': 'application/javascript'});  
			response.end(fs.readFileSync('public/js/seedrandom.js', 'utf8'));  
			break;
    
		case '/index.css':
			response.writeHeader(200, {'Content-Type': 'text/css'});  
			response.end(fs.readFileSync('public/css/index.css', 'utf8'));  
			break;
    
		case '/index.html':
		case '/':
		default:
			response.writeHeader(200, {'Content-Type': 'text/html'});  
			response.end(fs.readFileSync('./index.html', 'utf8'));
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
function handleWebSocketRequest(request){
	var connection = request.accept(null, request.origin);	
	
	connection.on('message', function(message){
		if(message.type == 'utf8'){
			var obj = JSON.parse(message.utf8Data);
			var document;

			switch(obj.type){
				case 'JOIN_REQ':
					document = documents[DEFAULT_DOCUMENT];
					document.addUser(obj.data, connection);
					break;
					
				case 'MSG':
					document = documents[DEFAULT_DOCUMENT];
					document.receive(obj.data, connection);
					break;
					
				default:
			}
		}
	});

	connection.on('close', function(msg){
		var document = documents[DEFAULT_DOCUMENT];
		documents.removeUser(connection);
	});
}

documents[DEFAULT_DOCUMENT] = new document.Document(R, K);
var server = http.createServer(handleHttpRequest).listen(PORT);
var wsServer = new WebSocketServer({httpServer: server})
	.on('request', handleWebSocketRequest);
console.log('Server running at http://127.0.0.1:' + PORT);
