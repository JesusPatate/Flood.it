var PORT = 1337;
var R = 100;
var K = 5;
var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var fs = require('fs');
var Document = require('./document').Document;

var documents = {};
var connections = [];

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
			var documentTitle;

			switch(obj.type){
				case 'JOIN_REQ':
					documentTitle = obj.data.documentTitle;
	
					if(documentTitle in documents){
						document = documents[documentTitle];
					}
					else{
						document = new Document(documentTitle, R, K);
						documents[documentTitle] = document;
					}
					
					connections.push({connection: connection, documentTitle: documentTitle});
					document.addUser({userName: obj.data.userName}, connection);
					break;
					
				case 'MSG':
					var connectionIndex = getConnectionIndexFromConnection(connection);
					documentTitle = connections[connectionIndex].documentTitle;
					document = documents[documentTitle];
					document.receive(obj.data, connection);
					break;
					
				default:
			}
		}
	});

	connection.on('close', function(msg){
		var connectionIndex = getConnectionIndexFromConnection(connection);
		var documentTitle = connections[connectionIndex].documentTitle;
		var document = documents[documentTitle];
		document.removeUser(connection);
		connections.splice(connectionIndex, 1);
		
		if(document.nbUsers() == 0){
			delete documents[documentTitle];
		}
	});
}

function getConnectionIndexFromConnection(connection){
	var i = 0;
	var found = false;
                
    while(i < connections.length && !found){
		found = (connections[i].connection == connection);
		i++;
	}
    
	return i - 1;
};
	
var server = http.createServer(handleHttpRequest).listen(PORT);
var wsServer = new WebSocketServer({httpServer: server})
	.on('request', handleWebSocketRequest);
console.log('Server running at http://127.0.0.1:' + PORT);
