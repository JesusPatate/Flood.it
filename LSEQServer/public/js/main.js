function  adaptePaperToScreen(){
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

	var serverAddress = document.domain;
	var serverPort = window.location.port;
	var userName = ($('#registerName').val().length > 0) ? 
		$('#registerName').val() : 'NoName';

	var serverLocation = 'ws://' + serverAddress + ':' + serverPort;
	pbcast = new PBCast(serverLocation);
	pbcast.on('ready', function(data){
		$('#registerModal').modal('hide');
		$('<div class="addon" id="' + data.id + '">' + userName + ' (' + data.id + ')</div>')
			.hide().appendTo('#collaborators').fadeIn(300);

		for(var i = 0; i < data.knownIds.length; i++){
			$('<div class="addon" id="' + data.knownIds[i] + '">' + "" + '(' + data.knownIds[i] + ')</div>')
				.hide().appendTo('#collaborators').fadeIn(300); 
		}

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
		
		lseq.on('foreignInsert', function(msg)	{
			editor.insert(msg.value, msg.offset);
		});

		pbcast.on('connectedUser', function(newuserid){
			if($('#' + newuserid ).length < 1){
				$('<div class="addon" id="' + newuserid + '">' + "" + '(' + newuserid + ')</div>'
					).hide().appendTo('#collaborators').fadeIn(300); 
			}
		});

		pbcast.on('disconnectedUser', function(olduserid){
			if($('#' + olduserid ).length > 0){
				// remove from the list 
				$('#' + olduserid ).fadeOut(300, function(){ 
					$(this).remove(); 
				}); 
			}
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

	// modal switch handler 
	var statenow = 1;
	$('#bNewDocument1').click(function(){
		$('#bNewDocument1').prop('checked', true); 
		// $('#bNewDocument0').prop( 'checked', false ); 
		$('#registerFile').prop('disabled', false).focus();
		$('#joinID').prop('disabled', true);
		statenow = 1; 
	});
	
	$('#bNewDocument0').click(function(){
		// $('#bNewDocument1').prop( 'checked', false ); 
		$('#bNewDocument0').prop('checked', true); 
		$('#registerFile').prop('disabled', true);
		$('#joinID').prop('disabled', false).focus(); 
		statenow = 0; 
	});

	// initial focus 
	$('#registerAddress').focus(); 
});

