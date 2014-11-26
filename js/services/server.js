(function() {
  var app = angular.module('floodit');

  app.run(function(server, network, messageHandler, lseq) {
    network.addListener('join', messageHandler.sendJoin, messageHandler);
    network.addListener('handleMessage', messageHandler.handle, messageHandler);
    messageHandler.addListener('buildConnections', network.buildConnections, network);
    messageHandler.addListener('remoteInsertion', server.applyInsertion, server);
    messageHandler.addListener('remoteDeletion', server.applyDeletion, server);
  });

  app.service('server', [
    '$q', 'network', 'messageHandler', 'lseq', 'sharedData', 'alerts',
    function($q, network, messageHandler, lseq, sharedData, alerts) {

    var callbacks = {};

    this.connect = function(address, port, joinID) {
      var deferred = $q.defer();

      network.register(address, port).then(
        function(id) {
          sharedData.setLocalID(id);
          sharedData.setDocumentModel(lseq);

          messageHandler.init(id);
          lseq.init(id);

          if(joinID) {
            network.join(joinID).then(
              function() {
                network.acceptNewConnections();
                messageHandler.sendReady();
                deferred.resolve();
              },
              function(err) { // join failed
                deferred.reject(err);
            });
          }
          else { // No peer to join
            network.acceptNewConnections();
            deferred.resolve();
          }
        },
        function(err) { // register failed
          deferred.reject(err);
      });

      return deferred.promise;
    };

    /**
     * \brief Inserts text at a given index into the LSEQ document.
     * \param index an index in the document at which the text must be inserted
     * \param text a string to insert into the document
     */
    this.insert = function(index, text) {
      var couples = lseq.insert(index, text);
      messageHandler.sendInsertion(couples);
    };

    /*!
     * \brief Deletes text from the LSEQ document at a given index
     * \param index an index at which text must be deleted
     * \param nb number of characters to be deleted
     */
    this.remove = function(index, nb) {
      var ids = lseq.remove(index, nb);
      messageHandler.sendDeletion(ids);
    };

    this.applyInsertion = function(data) {
      var couples = lseq.integrateInsertion(data);
      notify('remoteInsertion', couples);
    };

    this.applyDeletion = function(data) {
      var ids = lseq.integrateDeletion(data);
      notify('remoteDeletion', ids);
    };

    this.addListener = function(event, callback, obj) {
      if(!callbacks[event]) {
        callbacks[event] = [];
      }

      callbacks[event].push({obj: obj, callback: callback});
    };

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

  }]);
})();
