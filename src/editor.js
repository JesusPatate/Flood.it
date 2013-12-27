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
 */
function Editor(contentEditableId){
	var self = this;
	EventEmitter.call(this);
	// Wether the last edit was remote
	this._external = false;
	this._editor = ace.edit(contentEditableId);
    
    this._editor.getSession().on('change', onEdition);
    
    function onEdition(e){
		if(!self._external){
			var startOffset = self._editor.getSession().getDocument().positionToIndex(e.data.range.start);
			var endOffset = self._editor.getSession().getDocument().positionToIndex(e.data.range.end);
            
			if(startOffset == endOffset) {
				++endOffset;
			}
			
			switch(e.data.action){
				case 'insertText' :
					var j = 0;
					for(var i = startOffset ; i < endOffset ; ++i) {
						self.emit("edit", {type: 'insert', value: e.data.text[j], offset: i});
						++j;
					}
					break;
                
				case 'removeText' :
					for(var i = startOffset ; i < endOffset ; ++i) {
						self.emit("edit", {type: 'delete', offset: (startOffset + 1)});
					}
					break;

                case 'insertLines' :
                	console.log("DBG " + e.data);
                    break;

                case 'removeLines' :
                	var lines = e.data.lines;
                    var nbLines = e.data.lines.length;
                    var offset = startOffset;
                    
                    for(var i = 0 ; i < nbLines ; ++i) {
                    	for(var j = 0 ; j < lines[i].length + 1 ; ++j) {
                        	self.emit("edit", {type: 'delete', offset: (startOffset + 1)});
                        }
                    }
                    break;
                    
				default :
			}
		}
	}
}

Editor.prototype = Object.create( EventEmitter.prototype);
Editor.prototype.constructor = Editor;

/**
 * \brief Inserts a character.
 *
 * \param value
 		Character to insert.
 * \param offset
 		Offset at which the character must be inserted.
 */
Editor.prototype.insert = function(value, offset){
	var self = this;
	var delta = this._asDelta('insertText', offset, value);
	this._offAir(function(){
		self._editor.getSession().getDocument().applyDeltas([delta]);
	});
};

/**
 * \brief Deletes a character.
 *
 * \param offset
 		Offset at which the character must be deleted.
 */
Editor.prototype.delete = function(offset){
	var self = this;
	var delta = this._asDelta('removeText', offset);
	this._offAir(function(){
		self._editor.getSession().getDocument().applyDeltas([delta]);
	});
};

/**
 * \brief Builds an Ace delta from LSEQ data.
 *
 * \param type
 *		Type of the operation
 * \param idx
 * 		Offset at which the operation must executed
 * \param text
 * 		Text to insert (useless for deletion)
 */
Editor.prototype._asDelta = function(type, offset, text){
  return {
	action: type,
	range: {
	  start: this._editor.getSession().getDocument().indexToPosition(offset),
	  end: this._editor.getSession().getDocument().indexToPosition(offset+1)
	},
	text: text
  };
};

/**
 * \brief Executes a block without broadcasting the change
 *
 * \param block
 *		Instructions block
 */
Editor.prototype._offAir = function(block){
  var was = this._external;
  this._external = true;
  block();
  this._external = was;
};
