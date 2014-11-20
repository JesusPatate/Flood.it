"use strict";

(function() {
  angular.module('floodit').service('editorService', function() {
    var callbacks = {};

    var remoteUpdate = false;
    var editor;

    this.init = function(edt) {
      editor = edt;
    };

    this.handle = function(evt) {
      var event = evt[0];

      if (!remoteUpdate) {
        var pos = getStartPosition(event);

        switch(event.data.action) {
          case 'insertText':
            insertText(pos, event.data.text);
            break;

          case 'removeText':
            removeText(pos, event.data.text);
            break;

          case 'insertLines':
            insertLines(pos, event.data.lines);
            break;

          case 'removeLines':
            removeLines(pos, event.data.lines);
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

    this.addListener = function(event, callback, obj) {
      if(!callbacks[event]) {
        callbacks[event] = [];
      }

      callbacks[event].push({obj: obj, callback: callback});
    };

    function insertText(position, text) {
      notify('insertion', position, text);
    }

    function insertLines(position, lines) {
      var text = "";

      for (var idxLine = 0 ; idxLine < lines.length ; ++idxLine) {
        text += lines[idxLine] + '\n';
      }

      notify('insertion', position, text);
    }

    function removeText(position, text) {
      notify('deletion', position, text.length);
    }

    function removeLines(position, lines) {
      var nb = 0;

      for (var idxLine = 0 ; idxLine < lines.length ; ++idxLine) {
        nb += lines[idxLine].length + 1;
      }

      notify('deletion', position, nb);
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

    function notify(event) {
      var argumentsArray = Array.prototype.slice.apply(arguments);
      argumentsArray.splice(0,1);

      if (callbacks[event]) {
        var entry;

        for (var idx in callbacks[event]) {
          entry = callbacks[event][idx];
          entry.callback.apply(entry.obj, argumentsArray);
        }
      }
    }

  });
})();

