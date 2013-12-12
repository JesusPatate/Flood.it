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

	// Get Value and connect to LogootEditor.
	var serverAddress = ($('#registerAddress').val().length > 0) ?
		$('#registerAddress').val() : '127.0.0.1';
	var serverPort = ($('#registerPort').val().length > 0) ?
		$('#registerPort').val() : '1337';
	var userName = ($('#registerName').val().length > 0) ? 
		$('#registerName').val() : 'NoName';
	var documentTitle = ( $('#registerFile').val().length > 0 ) && ( !$('#registerFile').prop( 'disabled' ) )? 
		$('#registerFile').val() : 'Untitled'; 

	$('#documenttitle').html( documentTitle ); 

	bNewDocument = $('#bNewDocument1').attr( 'checked' ); 
	if ( bNewDocument ) {
		pbcast = new PBCast({port: serverPort, host: serverAddress}, 10, 3);
	} else {
		var joinId = $( '#joinID' ).val(); 
		pbcast = new PBCast({port: serverPort, host: serverAddress}, joinId);
	}
	
	pbcast.on(
		'ready', 
		function( ids ) {
			
			var userid = ids.id; 
			var theothers = ids.knownIds; 
			$('#registerModal').modal('hide');

			$(
				'<div class="addon">' + userName + ' (' + userid + ')</div>'
			).hide().appendTo( '#collaborators' ).fadeIn( 300 ); 

			for ( var collabo in theothers ) {
				$(
					'<div class="addon">' + "" + ' (' + theothers[collabo] + ')</div>'
				).hide().appendTo( '#collaborators' ).fadeIn( 300 ); 
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
		}
	);
}

$(document).ready(
	function() {
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
		$('#bNewDocument1').click(
			function(){
				$('#bNewDocument1').prop( 'checked', true ); 
				// $('#bNewDocument0').prop( 'checked', false ); 
				$('#registerFile').prop( 'disabled', false ).focus();
				$('#joinID').prop( 'disabled', true );
				statenow = 1; 
			}
		);
		$('#bNewDocument0').click(
			function(){
				// $('#bNewDocument1').prop( 'checked', false ); 
				$('#bNewDocument0').prop( 'checked', true ); 
				$('#registerFile').prop( 'disabled', true );
				$('#joinID').prop( 'disabled', false ).focus(); 
				statenow = 0; 
			}
		);

		// initial focus 
		$('#registerAddress').focus(); 
	}
); 


