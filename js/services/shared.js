"use strict";

(function() {
  angular.module('floodit').service('sharedData', ['$log', function($log) {

    var callbacks = [];

    var localID;
    var title;
    var model;
    var alias;
    var participants = [];

    this.getLocalID = function() {
      return localID;
    };

    this.setLocalID = function(id) {
      localID = id;
    };

    this.getAlias = function() {
      return alias;
    };

    this.setAlias = function(a) {
      alias = a;

      notify();
    };

    this.getDocumentTitle = function() {
      return title;
    };

    this.setDocumentTitle = function(t) {
      title = t;

      notify();
    };

    this.getDocumentModel = function() {
      return model;
    };

    this.setDocumentModel = function(m) {
      model = m;

      notify();
    };

    this.getParticipants = function() {
      return participants;
    };

    this.addParticipant = function(id, alias) {
      var known = false;

      for(var idx in participants) {
        if(participants[idx].id === id) {
          known = true;
        }
      }

      if(!known) {
        participants.push({id: id, alias: alias});
        notify();
      }
    };

    this.removeParticipant = function(id) {
      var i = 0;
      var found = false;

      while(i < participants.length && !found) {
        if(participants[i].id === id) {
          found = true;
        }
        else {
          ++i;
        }
      }

      if(found) {
        participants.splice(i, 1);
        notify();
      }
      else {
        $log.error('Failed to remove participant ' + id
          + ' (known participants: ' + participants + ')');
      }
    };

    this.addListener = function(callback) {
      callbacks.push(callback);
    };

    function notify() {
      for(var i in callbacks) {
        callbacks[i]();
      }
    };
  }]);
})();
