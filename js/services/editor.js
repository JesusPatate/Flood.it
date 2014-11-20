"use strict";

(function() {
  angular.module('floodit').service('editorService', ['lseq', 'messageHandler', function(lseq, messageHandler) {
    var self = this;
    var remoteUpdate = false;
    var editor;
    
    this.init = function(edt) {
      editor = edt;
    };
    
    this.handle = function(evt) {
      var event = evt[0];
      
      if (!remoteUpdate) {
        var msg = {type: event.data.action, data: []};
        var pos = getStartPosition(event);
        
        switch(event.data.action) {
          case 'insertText':
            insertText(pos, event.data.text);
            break;

          case 'removeText':
            removeText(pos, event.data.text, msg);
            break;
          
          case 'insertLines':
            insertLines(pos, event.data.lines, msg);
            break; 

          case 'removeLines':
            removeLines(pos, event.data.lines, msg);
            break;

          default:
        }
      }
    };
    
    this.applyInsertion = function(array) {
      var old, delta;
      
      for(var idx in array) {
        old = remoteUpdate;
        delta = asDelta('insertText', array[idx].index, array[idx].element);
        
        remoteUpdate = true;
        editor.getSession().getDocument().applyDeltas([delta]);
        remoteUpdate = old;
      }
    };
    
    this.applyDeletion = function(array) {
      var old, delta;
      
      for(var idx in array) {
        old = remoteUpdate;
        delta = asDelta('removeText', array[idx]);
        
        remoteUpdate = true;
        editor.getSession().getDocument().applyDeltas([delta]);
        remoteUpdate = old;
      }
    };

    function insertText(position, text) {
      var array = [];
      
      for (var idx in text) {
        array.push({index: position, element: text[idx]});
        ++position;
      }

      lseq.insert(array);
    }

    function insertLines(position, lines, msg) {
      var array = [];
      
      for (var idxLine in lines) {
        var line = lines[idxLine] + '\n';

        for (var idxElt in line) {
          array.push({index: position, element: line[idxElt]});
          ++position;
        }

        lseq.insert(array);
      }
    }

    function removeText(position, text, msg) {
      var array = [];
      
      for (var i = 0 ; i < text.length ; ++i) {
        array.push(position + i);
      }

      lseq.remove(array);
    }

    function removeLines(position, lines, msg) {
      var array = [];
      var p = position;
      var line;

      for (var idxLine in lines) {
        line = lines[idxLine];
        
        for (var idxElt in line) {
          array.push(p);
          ++p;
        }

        // Ending newline
        array.push(p);
        ++p;
      }

      lseq.remove(array);
    }
    
    function getStartPosition(evt) {
      return editor.getSession().getDocument().positionToIndex(evt.data.range.start);
    }
    
    function getEndPosition(evt) {
      return editor.getSession().getDocument().positionToIndex(evt.data.range.end) - 1;
    }

    function asDelta(type, position, text) {
      return {
        action: type,
        range: {
          start: editor.getSession().getDocument().indexToPosition(position),
          end: editor.getSession().getDocument().indexToPosition(position + 1)
        },
        text: text
      };
    }
  }]);
})();

