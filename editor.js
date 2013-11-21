/******************************************
* Dependences : 
* 	eventemitter.js, jQuery 
* 	(optional) editor_logger.js -> using logs for display, interruption recovery, ... 
*******************************************/



/**
 * \class Editor
 * \brief ...
 */
function Editor( contentEditableId, username, logger ){
	var self = this;
	var logs = logger || false; // optional ; no type check, logger is an object... 
	
	var author = username ? username.toString() : Math.random().toString(); 
	
	

	EventEmitter.call( this );

	this._document = document.getElementById( contentEditableId );
	this._jDocument = jQuery( '#' + contentEditableId );
		this._document.contentEditable = true;

	this._startDoc = document.createElement('span');
		this._startDoc.id = 'start';

	this._endDoc = document.createElement('span');
		this._endDoc.id = 'end';

	this._document.appendChild( this._startDoc );
	this._document.appendChild( this._endDoc );
	


	var internal = []; 
	// init internal representation with existing content 
	var existingContent = this._document.textContent.toString(); 
	for ( character in existingContent ) {
		var charstruct = {};

		charstruct.character = existingContent[character]; 
		charstruct.offset = internal.length; 
		charstruct.author = 'System'; 

		if ( logs ) { 
			logs.charstructState( charstruct ); 
		}

		internal.push( charstruct ); 
	};
	


	// var focusCampo = function( id ) {
	// 	var inputField = document.getElementById( id );
	// 	if ( inputField != null && inputField.innerHTML.length != 0 ){
	// 		if ( inputField.createTextRange ) {
	// 			var FieldRange = inputField.createTextRange();
	// 			FieldRange.moveStart( 'character', inputField.innerHTML.length );
	// 			FieldRange.collapse();
	// 			FieldRange.select();
	// 		} else if ( inputField.selectionStart || inputField.selectionStart == '0' ) {
	// 			var elemLen = inputField.innerHTML.length;
	// 			inputField.selectionStart = elemLen;
	// 			inputField.selectionEnd = elemLen;
	// 			inputField.focus();
	// 		}
	// 	} else {
	// 		inputField.focus();
	// 	}
	// };

	function moveCaretToEnd(el) {
    if ( typeof el.selectionStart == 'number' ) {
        el.selectionStart = el.selectionEnd = el.innerHTML.length;
    } else if ( typeof el.createTextRange != 'undefined' ) {
        el.focus();
        var range = el.createTextRange();
        range.collapse( false );
        range.select();
    }
	}

	var fieldcarret = moveCaretToEnd( contentEditableId );

	// event handling part  

	function keypressHandler( event ){
		event.preventDefault();

		// if ( logs ) { 
		// 	logs.comment( 'Key pressed: ' + event.charCode + ' (' + self._fromASCIITCodeToString( event.charCode ) + ')' ); 
		// }

		var charstruct = {}; 
		
		charstruct.character = self._fromASCIITCodeToString( event.charCode ); 
		charstruct.eventtype = 'insert'; 
		charstruct.offset = internal.length; 
		charstruct.author = author; 
		
		internal.push( charstruct ); 

		// self.emit( 'edit', charstruct ); 

		if ( logs ) { 
			logs.emit( charstruct ); 
		}

		self._jDocument.append( ( self._fromStringToHTML( charstruct.character ) == '<br />' )? '<br />' : '<span id="' + 
			charstruct.offset + '" class="' + charstruct.author + '">' + 
			self._fromStringToHTML( charstruct.character ) + '</span>' 
		); 

		// carret update 
		self.fieldcarret = moveCaretToEnd( contentEditableId ); 

		// var offset = self._getCaretCharacterOffset();
		// var character = self._fromASCIITCodeToString( event.charCode );
		// var nextNode = self._getNextSelectionNode();	

		// var newChar = document.createElement( 'span' );

		// newChar.innerHTML = self._fromStringToHTML( character );

		// self._document.insertBefore( newChar, nextNode );
		// // remettre le curseur au bon endroit
		// self.emit( 'insertion', { value: character, offset: offset } );
	}
	
	function keydownHandler(event){
		// <- or del
		if(event.charCode == 8 || event.charCode == 46){
			event.preventDefault();

			if ( logs ) { 
				logs.emit( charstruct, 'delete' ); 
			}



			// var offset = self._getCaretCharacterOffset();
			
			// // del
			// if(event.keyCode == 46){
			// 	offset++;
			// }
			
			// var removedNode = self._getSelectionNode();
			// self._document.removeChild(removedNode);
			// // remettre le curseur au bon endroit	
			// self.emit('deletion', offset);
		}	
	}
	
	function pasteHandler( event ){
		event.preventDefault();
		if ( logs ) { 
			logs.comment( 'Paste not implemented !' ); 
		}
	}
	
	function cutHandler( event ){
		event.preventDefault();
		if ( logs ) { 
			logs.comment( 'Cut not implemented !' ); 
		}
	}



	// event listeners part 

	this._document.addEventListener( 'keypress', keypressHandler, false );
	this._document.addEventListener( 'keydown', keydownHandler, false );
	this._document.addEventListener( 'paste', pasteHandler, false );
	this._document.addEventListener( 'cut', cutHandler, false );
}

Editor.prototype = Object.create( EventEmitter.prototype );
Editor.prototype.constructor = Editor;

/**
 * \brief ...
 *
 * \param value
 * 		...
 * \param offset
 * 		...
 */
Editor.prototype.insert = function(value, offset){
	var nextNode = self._getNodeFromOffset(offset); // peut être le noeud suivant ??	
	var newChar = document.createElement('span');
	newChar.innerHTML = self._fromStringToHTML(value);
	self._document.insertBefore(newChar, nextNode);
	// remettre le curseur au bon endroit
};

/**
 * \brief ...
 *
 * \param offset
 * 		...
 */
Editor.prototype.delete = function(offset){
	var removedNode = self._getNodeFromOffset(offset);
	self._document.removeChild(removedNode);
	// remettre le curseur au bon endroit
};

/**
 * \brief ...
 *
 */
Editor.prototype._getCaretCharacterOffset = function(){
	var selection = window.getSelection();
    var node = selection.anchorNode;
    var offset;
    
    if(node == this._document || node.parentNode == this._startDoc){
		offset = 0;
	}
	else if(node.parentNode == this._endDoc){
		offset = editor.childElementCount - 2;
	}
	else{
		offset = 1;
		node = node.parentNode.previousElementSibling;
		
		while(node != this._startDoc){
			offset++;
			node = node.previousElementSibling;
		}
		
		offset -= (1 - selection.anchorOffset);
	}
	
	return offset;
};

/**
 * \brief ...
 *
 * \param offset
 * 		...
 */
Editor.prototype._getNodeFromOffset = function(offset){
};

/**
 * \brief ...
 *
 * \param character
 * 		...
 */
Editor.prototype._fromStringToHTML = function(character){
	var html = character;
	
	if(character == '\n'){
		html = '<br />';
	}
	else if(character == ' '){
		html = '&nbsp;';
	}

	return html;
};

/**
 * \brief ...
 *
 * \param charCode
 * 		...
 */
Editor.prototype._fromASCIITCodeToString = function( charCode ){
	var character = '';
	
	// new line
	if( charCode == 13 ){
		character = '\n';
	} else {
		character = String.fromCharCode( charCode ); 
	}
	
	return character;
};

/**
 * \brief ...
 *
 */
Editor.prototype._getNextSelectionNode = function(){
	var selection = window.getSelection();
	var node = selection.anchorNode;
	var previous;
    
	if(node == self._document || node.parentNode == self._startDoc){
		previous = self._startDoc.previousElementSibling;
	}
	else if(node.parentNode == self._endDoc){
		previous = self._endDoc;
	}
	else{
		if(selection.anchorOffset == 0){
			previous = node.parentNode;
		}
		else{
			previous = node.parentNode.previousElementSibling;
		}
	}
	
	return previous.nextElementSibling;
};

/**
 * \brief ...
 *
 */
Editor.prototype._getSelectionNode = function(){
	var selection = window.getSelection();
	var selectedNode = selection.anchorNode;
	
	return selectedNode;
};

// end of Editor 
// end of $ = jQuery 