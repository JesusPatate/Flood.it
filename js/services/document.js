"use strict";

(function() {
  angular.module('floodit').service('doc', [
    '$log', 'lseq', function($log, lseq) {
    
    var title = null;
    var model = lseq;
    var alias = null;
    var participants = [];
    var callbacks = [];
    
    this.setModel = function() {
      return model;
      
      notify();
    };
    
    this.getModel = function() {
      return model;
    };
    
    this.getTitle = function() {
      return title;
    };
    
    this.setTitle = function(t) {
      title = t;
      
      notify();
    };
    
    this.getAlias = function() {
      return alias;
    };
    
    this.setAlias = function(a) {
      alias = a;
      
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
