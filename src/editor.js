/******************************************
* Dependences : 
* 	eventemitter.js,
*       ace.js 
*******************************************/

/***********************
* TODO :
* - suppression d'une ligne vide non détectée
************************/

/**
 * \class Editor
 * \brief ...
 */
function Editor(contentEditableId){
	var self = this;
	EventEmitter.call(this);
	// Wether the last edit was remote
	this._external = false;
	this._editor = ace.edit(contentEditableId);
    
    this._editor.getSession().on('change', onEdition);
    
    function onEdition(e){
    var offset = self._editor.getSession().getDocument().positionToIndex(e.data.range.start);
		
		if(!self._external){
			switch(e.data.action){
				case 'insertText' :
					self.emit("edit", {type: 'insert', value: e.data.text, offset: offset});
					break;
                                        
				case 'removeText' :
					self.emit("edit", {type: 'delete', offset: offset + 1}); // We send the offset of the cursor before the removal
					break;
                                        
				default :
			}
		}
	}
}

Editor.prototype = Object.create( EventEmitter.prototype);
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
	var self = this;
	var delta = this._asDelta('insertText', offset, value);
	this._offAir(function(){
		self._editor.getSession().getDocument().applyDeltas([delta]);
	});
};

/**
 * \brief ...
 *
 * \param offset
 * 		...
 */
Editor.prototype.delete = function(offset){
	var self = this;
	var delta = this._asDelta('removeText', offset - 1); // We receive the offset of the cursor before the removal
	this._offAir(function(){
		self._editor.getSession().getDocument().applyDeltas([delta]);
	});
};

Editor.prototype._asDelta = function(op, idx, text){
  return {
	action: op,
	range: {
	  start: this._editor.getSession().getDocument().indexToPosition(idx),
	  end: this._editor.getSession().getDocument().indexToPosition(idx+1)
	},
	text: text
  };
};

// Execute a block without broadcasting the change
Editor.prototype._offAir = function(block){
  var was = this._external;
  this._external = true;
  block();
  this._external = was;
};
