"use strict";

(function() {

  var statesEnum = {
    NOT_REGISTERED: 0, // Initial state
    REGISTERING: 1, // When trying to register with the broker server
    JOINING: 2, // When trying to join a document
    CONNECTED: 3 // When registered / connected to all other participants
  };
    
  angular.module('floodit').service('network', [
    '$log','$q','connections', 'alerts', 'doc',
    function($log, $q, connections, alerts, doc) {

    var self = this;

    var peer;
    var state = statesEnum.NOT_REGISTERED;
    
    var joinId;
    var joinDeferred;
    var registerDeferred;
    var peersToJoin = [];
    
    var callbacks = {};

    /**
     * \brief Logs on to the p2p netbork by registering with the broker server.
     * \param host address at which the broker server can be reached (IP or domain name)
     * \param port port at which the broker server can be reached
     * \return a promise
     */
    this.register = function(host, port) {
      registerDeferred = $q.defer();
      state = statesEnum.REGISTERING;

      if(peer && !peer.destroyed) {
        if(peer.disconnected === false) {
          // Already registered with broker server
          registerDeferred.resolve(peer.id);
        }
        else {
          // Disconnected from broker server earlier
          peer.reconnect();
        }
      }
      else {
        var options = {
          host: host,
          port: port,
          iceServers: [
            { url: 'stunserver.org' }
          ],
          debug: 1
        };
        
        peer = new Peer(options);
        
        peer.on('error', handlePeerError);

        peer.on('open', function(id) {
          $log.info('Connected to the broker server');
          $log.info('Local ID: ' + id);
          
          // TODO Complete handlers
          peer.on('disconnected', function() {});
          peer.on('close', function() {});

          state = statesEnum.CONNECTED;
          acceptNewConnections();
          
          registerDeferred.resolve(id);
        });
      }

      return registerDeferred.promise;
    };

    /**
     * \brief Joins a remote peer.
     * \param id remote peer's identifier
     * \return a promise
     */
    this.join = function(id) {
      joinId = id;
      
      state = statesEnum.JOINING;
      joinDeferred = $q.defer();

      var connection = peer.connect(joinId);
      
      connection.on('open', function() {
        handleConnectionOpen(connection);
        notify('join', joinId);
      });

      return joinDeferred.promise;
    };

    this.buildConnections = function(peers) {
      if(peers == undefined || peers.length === 0) {
        // No other peer to join
        acceptNewConnections();
        notify('ready');
        joinDeferred.resolve();
      }
      else {
        for(var idx in peers) {
          peersToJoin.push(peers[idx]);
          
          $log.info("Initiating connection with " + peers[idx] + ' (' + peers[idx] + ')');
          var connection = peer.connect(peers[idx]);
          
          connection.on('open', function() {
            handleConnectionOpen(connection);
            peersToJoin.splice(idx, 1);
            
            if(peersToJoin.length === 0) {
              acceptNewConnections();
              notify('ready');
              joinDeferred.resolve();
            }
          });
          
          connection.on('error', handleConnectionError(connection));
        }
      }
    };
    
    this.getLocalID = function() {
      return peer.id;
    };

    this.addListener = function(event, callback) {
      if(!callbacks[event]) {
        callbacks[event] = [];
      }

      callbacks[event].push(callback);
    };

    function acceptNewConnections() {
      peer.on('connection', function(connection) {
        connection.on('open', function() {
          handleConnectionOpen(connection);
        });
      });
    };

    function handlePeerError(err) {
      var title;
      var msg;

      // TODO Handle other error types
      switch(err.type) {
        case 'server-error':
          if (state === statesEnum.REGISTERING) {
            title = 'Unable to reach the broker server';
            msg = 'Please make sure it is actually launched. Also verify that you passed correct address and port.';
          }
          else {
            // FIXME
            title = err.type;
            msg = err.message;
          }
          
          break;
          
        case 'peer-unavailable':
          if(state === statesEnum.JOINING) {
            if(peersToJoin.length === 0) {
              // Failed to reach the peer to join
              title = 'Unable to reach the peer to join';
              msg = 'Please make sure the identifier you entered is correct.';
            }
            else {
              // Failed to reach an other participant
              title = 'Unable to reach a participant';
              msg = 'Try to join the document again.';
            }
          }
          else {
            // FIXME (Can this happen ?)
            title = err.type;
            msg = err.message;
          }
          
          break;
        
        default:
          title = err.type;
          msg = err.message;
      }

      if(registerDeferred) {
        registerDeferred.reject({title: title, message: msg});
      }
      
      if(joinDeferred) {
        joinDeferred.reject({title: title, message: msg});
      }
    }

    function handleConnectionOpen(connection) {
      var remoteID = connection.peer;
      connections.add(remoteID, connection);

      connection.on('data', function(data) {
        notify('handleMessage', data, remoteID);
      });

      connection.on('close', handleConnectionClose(connection));

      connection.on('error', handleConnectionError(connection));
    }
      
    function handleConnectionClose(connection) {
      return function() {
        connections.remove(connection.peer);
        doc.removeParticipant(connection.peer);
        $log.info("Connection with peer " + connection.peer + " closed");
      };
    }

    function handleConnectionError(connection) {
      return function(err) {
        $log.info("Connection with peer " + connection.peer + " encountered an error: " + JSON.stringify(err.type));
        alerts.showDanger(err.message, err.type);
        handleConnectionClose(connection);
        
        if(joinDeferred) {
          deferred.reject({title: err.type, message: err.message});
        }
      }
    }

    function notify(event) {
      var argumentsArray = Array.prototype.slice.apply(arguments);
      argumentsArray.splice(0,1);
      
      if(callbacks[event]) {
        for(var idx in callbacks[event]) {
          callbacks[event][idx].apply(null, argumentsArray);
        }
      }
    };

  }]);
})();
