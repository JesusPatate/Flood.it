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
	var documentTitle = ($('#documentTitleAsked').val().length > 0) ? 
		$('#documentTitleAsked').val() : 'untitled';
	var isNewDocument = $('#newDocument').attr('checked') == 'checked';

	var serverLocation = 'ws://' + serverAddress + ':' + serverPort;
	pbcast = new PBCast(serverLocation, {userName: userName, isNewDocument: isNewDocument, documentTitle: documentTitle});
	pbcast.on('ready', function(data){
		$('#registerModal').modal('hide');
		$('<div class="addon pouet" id="' + data.id + '">' + data.name + '</div>')
			.hide().appendTo('#collaborators').fadeIn(300);

		for(var i = 0; i < data.knownUsers.length; i++){
			$('<div class="addon" id="' + data.knownUsers[i].id + '">' + data.knownUsers[i].name + '</div>')
				.hide().appendTo('#collaborators').fadeIn(300); 
		}
		
		$('#documentTitle').text(data.documentTitle);

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

		pbcast.on('connectedUser', function(newUser){
			if($('#' + newUser.id).length < 1){
				$('<div class="addon" id="' + newUser.id + '">' + newUser.name + '</div>'
					).hide().appendTo('#collaborators').fadeIn(300); 
			}
		});

		pbcast.on('disconnectedUser', function(oldUser){
			if($('#' + oldUser.id).length > 0){
				$('#' + oldUser.id).fadeOut(300, function(){ 
					$(this).remove(); 
				}); 
			}
		});
	});
}

$(document).ready(function(){
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

	// initial focus 
	$('#registerAddress').focus(); 
});

