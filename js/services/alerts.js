(function() {
  angular.module('floodit').service('alerts', [
    '$log', function($log) {
      
    var alerts = [];
    var callbacks = [];

    this.showSuccess = function(msg, title) {
      alerts.push({type: 'success', title: title, message: msg});
      notify();
    };

    this.showDanger = function(msg, title) {
      $log.warn('Error (' + title + ') - ' + msg);
      alerts.push({type: 'danger', title: title, message: msg});
      notify();
    };

    this.hide = function(index) {
      alerts.splice(index, 1);
      notify();
    };

    this.addListener = function(callback) {
      callbacks.push(callback);
    };

    function notify() {
      for(var idx in callbacks) {
        callbacks[idx](alerts);
      }
    }
  }]);
})();
