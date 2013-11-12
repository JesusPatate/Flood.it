/******************************************
Dependences : 
* eventemitter.js,
*******************************************/

/**
 * \class Editor
 * \brief ...
 */
function Editor(contentEditableId){
	var self = this;
	EventEmitter.call(this);
	this._document = document.getElementById(contentEditableId);
	this._document.contentEditable = true;
	this._startDoc = document.createElement('span');
	this._startDoc.id = 'start';
	this._endDoc = document.createElement('span');
	this._endDoc.id = 'end';
	this._document.appendChild(this._startDoc);
	this._document.appendChild(this._endDoc);
	
	this._document.addEventListener('keypress', keypressHandler, false);
	this._document.addEventListener('keydown', keydownHandler, false);
	this._document.addEventListener('paste', pasteHandler, false);
	this._document.addEventListener('cut', cutHandler, false);
	
	function keypressHandler(event){
		event.preventDefault();
		var offset = self._getCaretCharacterOffset();
		var character = self._fromASCIITCodeToString(event.charCode);
		var nextNode = self._getNextSelectionNode();	
		var newChar = document.createElement('span');
		newChar.innerHTML = self._fromStringToHTML(character);
		self._document.insertBefore(newChar, nextNode);
		// remettre le curseur au bon endroit
		self.emit('insertion', {value: character, offset: offset});
	}
	
	function keydownHandler(event){
		// <- or del
		if(event.charCode == 8 || event.charCode == 46){
			event.preventDefault();
			var offset = self._getCaretCharacterOffset();
			
			// del
			if(event.keyCode == 46){
				offset++;
			}
			
			var removedNode = self._getSelectionNode();
			self._document.removeChild(removedNode);
			// remettre le curseur au bon endroit	
			self.emit('deletion', offset);
		}	
	}
	
	function pasteHandler(event){
		event.preventDefault();
		alert("Paste not supported.");
		console.error("Paste not supported.");
	}
	
	function cutHandler(event){
		event.preventDefault();
		alert("Paste not supported.");
		console.error("Paste not supported.");
	}
}

Editor.prototype = Object.create(EventEmitter.prototype);
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
Editor.prototype._fromASCIITCodeToString = function(charCode){
	var character = String.fromCharCode(charCode);
	
	// new line
	if(charCode == 13){
		character = '\n';
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
