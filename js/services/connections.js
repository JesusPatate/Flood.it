(function() {
  angular.module('floodit').service('connections', function() {
    var connections = {};
    var localID;
    
    this.get = function(id) {
      return connections[id].connection;
    };

    this.noConnection = function() {
      return connections === {};
    };

    this.add = function(id, connection, ready) {
      if(!connections[id]) {
        connections[id] = {};
      }

      connections[id].connection = connection;
      connections[id].ready = (ready != false);
    };

    this.remove = function(id) {
      delete connections[id];
    };

    this.getNeighbours = function() {
      return Object.keys(connections);
    };

    this.setReady = function(id) {
      if(connections[id]) {
        connections[id].ready = true;
      }
    };

    this.isReady = function(id) {
      var ready = false;

      if(connections[id]) {
        ready = connections[id].ready;
      }

      return (!!ready);
    };
  });
})();
