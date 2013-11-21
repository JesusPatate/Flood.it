/******************************************
* Dependences : 
* 	None 
* 	( Later ) eventemitter.js -> dynamic on/off switch logging ?! 
*******************************************/

/**
 * \class EditorLogger 
 * \brief ...
 */
function EditorLogger( displayBoardId, maxLogLines ){
	var self = this; 

	var display = displayBoardId ? displayBoardId.toString() : false; // optional && displayBoardId must be a string 
		var displayBoard = display ? document.getElementById( display ) : false; 
	

	var MAX_LOG_LINES = ( maxLogLines >= 0 )? ( maxLogLines + 0 ) : 3; // optional && maxLogLines must be a >= 0 integer 


	var logs = []; 
		// begin testing with initial content in logs 
		logs.push( Number(new Date) + ' Logger ready.' ); 
		logs.push( Number(new Date) + ' Flood.it !' ); 
		// end test 


	var displayInitialState = true; 



	this.displayUpdate = function() {
		if ( display ) {
			if ( displayInitialState ) {
				var i = false; // will be an integer 
				for ( i = logs.length - 1 ; i >= 0 ; i-- ) {
					displayBoard.innerHTML = logs[i] + '<br />' + displayBoard.innerHTML; 
				};
				displayInitialState = false; // display is up-to-date 
			} else {
				displayBoard.innerHTML = logs[ logs.length - 1 ] + '<br />' + displayBoard.innerHTML; 
			}
		}
	}; 



	this.comment = function( customText ) {
		logs.push( Number(new Date) + ' Custom comment: ' + customText + "\n" ); 
		if ( MAX_LOG_LINES >= 0 ) {
			if ( logs.length > MAX_LOG_LINES ) {
				logs.shift()
			}
		}
		self.displayUpdate(); 
		console.log( logs.toString() ); 
		// TODO: save log into file 
	}; 

	this.emit = function( charstruct ) {
		logs.push( 
			Number(new Date) + ' emit( "edit", { ' + 
			( ( charstruct.eventtype == 'insert' )? 'value: "' + charstruct.character + '", ' : '' ) + 
			' type: "' + charstruct.eventtype + '", offset: "' + charstruct.offset + '", author: "' + charstruct.author + '"} );' + "\n" 
		); 
		if ( MAX_LOG_LINES >= 0 ) {
			if ( logs.length > MAX_LOG_LINES ) {
				logs.shift(); 
			}
		}
		self.displayUpdate(); 
		console.log( logs.toString() ); 
		// TODO: save log into file 
	}; 

	this.charstructState = function( charstruct ) {
		logs.push( 
			Number(new Date) + ' charstructState : { value: "' + charstruct.character + '", offset: "' + charstruct.offset + '", author: "' + charstruct.author + '"} );' + "\n" 
		); 
		if ( MAX_LOG_LINES >= 0 ) {
			if ( logs.length > MAX_LOG_LINES ) {
				logs.shift()
			}
		}
		self.displayUpdate(); 
		console.log( logs.toString() ); 
		// TODO: save log into file 
	}; 



	// one last thing 
	this.displayUpdate(); 

};


