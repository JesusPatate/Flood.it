( // dependancy : jQuery 
	function( $ ) {

		// editing should not be allowed until a local peerID is not set 
		$( '#editor' ).attr( 'contenteditable', 'false'); 
		
		var bDefaultNobodyKnown = true; 

		

		var knownPeersID = []; 
		var peerIDToConnections = []; 

		// new peer connecting to PeerJS server 
		var peer = new Peer( 
			{ 
				host: 'localhost', 
				port: 9000
			} 
		); // if no user-side peer ID, peer server generates a "random" one (WHAT RANDOM ??!!!) ) 

		peer.on( 
			'open', 
			function( id ) {
				
				/////////////////////////////
				// init working editor 
				/////////////////////////////

				// display local peerJS id 
				$( '#localpeerid' ).html( id ); 

				// init logger 
				var logger = new EditorLogger( 'logger' ); 

				// init editor 
    		var editor = new Editor( 'editor', id, logger );
    		
    		// allow content editing (default) 
    		$( '#editor' ).attr( 'contenteditable', 'true').focus(); 



    		/////////////////////////////////////
    		// init editor interface listeners 
    		/////////////////////////////////////

    		// listen for new peers added manualy 
    		$( '#addremoteid' ).on(
					'click',
					function( event ) {
						event.preventDefault(); 
						addNewKnownPeer( $( '#remotepeerid' ).val() ); 
					}
				);

    		// done with the interface listeners 

			}
		); // listen once for the peer ID from the server 

		

		//////////////////////////////
		// we have the server role 
		//////////////////////////////
		peer.on(
			'connection', 
			function( connection ){

				var bFirstMet = true; 

				connection.on(
					'data', 
					function( data ) {

						if ( bFirstMet ) {
							addNewKnownPeer( data ); 
							bFirstMet = false; 
							console.log( 'first met ' + data ); 
						} else {
							console.log( 'hello ' + data ); 
						}

					}
				); 

			}
		); 



		// Make sure things clean up properly.
		window.onunload = window.onbeforeunload = function(e) {
		  if (!!peer && !peer.destroyed) {
		    peer.destroy();
		  }
		};



		// add peerid to the list + connect or do nothing 
		function addNewKnownPeer( otherPeerID ) {
			var peerID = ( otherPeerID )? otherPeerID.toString() : ''; 
			if ( ( peerID.length > 0 ) && ( knownPeersID.indexOf( peerID ) < 0 ) ) { // add new id 
				
				// model 
				knownPeersID.push( peerID ); 
				
				// log 
				console.log( knownPeersID.toString() ); 
				
				// display 
				$( '#remotelist' ).append( '<li id="' + peerID + '">' + peerID + '</li>' ); 
				$( '#remotepeerid' ).val( '' ); 
				if ( bDefaultNobodyKnown ) { // once 
					$( '#listisempty' ).remove(); 
					bDefaultNobodyKnown = false; 
				}

				// add connection@peerID 
				peerIDToConnections[ peerID ] = peer.connect( peerID ); 

				// add listener for this connection 
				peerIDToConnections[ peerID ].on(  
					'open', 
					function() { 
						peerIDToConnections[ peerID ].send( $( '#localpeerid' ).val() ); // welcome by sending our id to the new peer 
					} 
				); 

			}
			$( '#remotepeerid' ).focus(); 
		}
	}
)( jQuery ); 




