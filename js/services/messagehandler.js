(function() {
  angular.module('floodit').service('messageHandler', [
    '$log', 'VersionVector', 'connections', 'doc', 'lseq',
    function($log, VersionVector, connections, doc, lseq) {
      
    var msgTypesEnum = {
      JREQ: 0,
      JRES: 1,
      DATA: 2,
      DISC: 3,
      READY: 4,
      ACK_READY: 5
    };

    var networkManager;
    var versionVector;
    
    var callbacks = {};

    this.init = function(id) {
      versionVector = new VersionVector(id);
    };
    
    this.handle = function(message, sender) {
      var data = message.data;
      
      $log.info('Received from ' + sender + ': ' + JSON.stringify(message));
      
      switch(data.key) {
        case msgTypesEnum.JREQ:
          $log.info(sender + ' (' + data.param.alias + ') requested to join the document');
          handleJoinRequest(sender);
          break;
          
        case msgTypesEnum.JRES:
          handleJoinResponse(data.param, sender);
          break;
        
        case msgTypesEnum.READY:
          handleReady(data.param, sender, true);
          break;
        
        case msgTypesEnum.ACK_READY:
          handleReady(data.param, sender, false);
          break;
        
        case msgTypesEnum.DATA:
          handleData(data.key, data.param, sender);
          break;
          
        case msgTypesEnum.DISC:
      }
    };
    
    this.sendJoin = function(recipient) {
      sendMessage(recipient, msgTypesEnum.JREQ, {alias: doc.getAlias()});
    };
    
    this.sendReady = function() {
      var neighbours = connections.getNeighbours();

      for (var idx in neighbours) {
        sendMessage(neighbours[idx], msgTypesEnum.READY, {alias: doc.getAlias()});
      }
    };
    
    this.sendInsertion = function(couples) {
      var neighbours = connections.getNeighbours();

      for (idx in neighbours) {
        sendMessage(neighbours[idx], msgTypesEnum.DATA, {type: 'insertion', data: JSON.stringify(couples)});
      }
    };
    
    this.sendDeletion = function(ids) {
      var neighbours = connections.getNeighbours();

      for (idx in neighbours) {
        sendMessage(neighbours[idx], msgTypesEnum.DATA, {type: 'deletion', data: JSON.stringify(ids)});
      }
    };

    this.addListener = function(event, callback) {
      if (!callbacks[event]) {
        callbacks[event] = [];
      }

      callbacks[event].push(callback);
    };
    
    function handleJoinRequest(requester) {
      var param = {
        title: doc.getTitle(),
        alias: doc.getAlias(),
        doc: JSON.stringify(doc.getModel()),
        vv: JSON.stringify(versionVector),
        participants: []
      };
      
      var neighbours = connections.getNeighbours();
      
      for (var idx in neighbours) {
        if (neighbours[idx] != requester) {
          param.participants.push(neighbours[idx]);
        }
      }
      
      sendMessage(requester, msgTypesEnum.JRES, param);
    }
    
    function handleJoinResponse(data, sender) {
      doc.setTitle(data.title);
      doc.addParticipant(sender, data.alias);

      lseq.join(data.doc);
      
      notify('buildConnections', data.participants);
    }
    
    function handleReady(data, sender, ack) {
      doc.addParticipant(sender, data.alias);
      connections.setReady(sender);

      if (ack) {
        sendMessage(sender, msgTypesEnum.ACK_READY, {alias: doc.getAlias()});
      }
    }

    function handleData(event, data, sender) {
      lseq.handle(data);
    }
    
    function sendMessage(recipient, key, param) {
      var msg = {
        error: null,
        data: {
          key: key,
          param: param
        }
      };

      if (key === msgTypesEnum.DATA) {
        versionVector.increment();
      }
      
      var connection = connections.get(recipient);
      connection.send(msg);

      $log.info("Sent to " + recipient + ": " + JSON.stringify(msg));
    }
    
    function sendErrorMessage(recipient, key, desc) {
      var msg = {
        error: {
          key: key,
          description: desc
        },
        data: null
      };

      $log.info("Sent to " + recipient + ": " + JSON.stringify(msg));

      var connection = connections.get(recipient);
      connection.send(msg);
    }

    function notify(event) {
      var argumentsArray = Array.prototype.slice.apply(arguments);
      argumentsArray.splice(0,1);
      
      if (callbacks[event]) {
        for (var idx in callbacks[event]) {
          callbacks[event][idx].apply(null, argumentsArray);
        }
      }
    };
  }]);
})();
