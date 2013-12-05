require.config({
    paths: {
        'jQuery': 'jquery-2.0.3.min',
        'Ace': 'ace',
        'peer.js': 'peer',
        'EventEmitter': 'eventemitter',
        'md5': 'md5',
        'seedrandom': 'seedrandom'
    },
    shim: {
        'jQuery': {
            exports: '$'
        },
        'Ace': {
            exports: 'Ace'
        },
        'peer.js': {
            exports: 'peer'
        },
        'EventEmitter': {
            exports: 'EventEmitter'
        },
        'md5': {
            exports: 'md5'
        },
        'seedrandom': {
            exports: 'seedrandom'
        }
    }
});

require(['entrieshash'], function(entriesHashRef){
	var entriesHash = new entriesHashRef();
	var g = new entriesHash.EntriesHashGenerator();
	var f = g.generate(10, 3);
	console.log(f.hash('okddffdlldfdlfsldfkdfldfldlf'));
	
	//var eh = entriesHash.EntriesHash.fromLitteralObject({aa:[], k: 4, m: 45});
	//console.log('jQuery version:', $.fn.jquery);
});


/*function adaptePaperToScreen(){
	var MIN_HEIGHT = 200;
	var paper = document.getElementById('editor');
	var newHeight = window.innerHeight - paper.offsetTop - 60;
	paper.style.height = Math.max(MIN_HEIGHT, newHeight) + 'px';
}
    
window.addEventListener("load", adaptePaperToScreen, false);
window.addEventListener("resize", adaptePaperToScreen, false);
	
var editor;
var lseq;
var pbcast;


function register(){
	$('#registerSubmit').button('loading');
	// Get Value and connect to LogootEditor.
	var serverAddress = ($('#registerAddress').val().length > 0) ?
	$('#registerAddress').val() : '127.0.0.1';
	var serverPort = ($('#registerPort').val().length > 0) ?
	$('#registerPort').val() : '1337';
	var userName = ($('#registerName').val().length > 0) ? 
	$('#registerName').val() : 'NoName';
	var serverLocation = 'ws://' + serverAddress + ':' + serverPort;
	pbcast = new PBCast(serverLocation);
	pbcast.on('ready', function(id){
		$('#registerModal').modal('hide');
		editor = new Editor("editor");
		lseq = new LSEQ();
				
		pbcast.on('deliver', function(msg){
			lseq.onDelivery(msg);
		});
				
		lseq.on('edit', function(msg){
			pbcast.send(msg);
		});
				
		editor.on('edit', function(msg){
			pbcast.localSend(msg);
		});
				
		lseq.on('foreignDelete', function(msg){
			editor.delete(msg.offset);
		});
				
		lseq.on('foreignInsert', function(msg){
			editor.insert(msg.value, msg.offset);
		});
	});
}

$(document).ready(function(){
	$('#registerAddress').attr('placeholder', document.domain);
	$('#registerPort').attr('placeholder', window.location.port);
	$('#registerModal').modal({
		backdrop: 'static',
		keyboard: false,
		show: true 
	});
	$('#registerSubmit').click(register);
	$('#registerName').keyup(function(e){
		if(e.keyCode == 13){
			register(); 
		}
	});
});*/
