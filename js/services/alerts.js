(function() {
  angular.module('floodit').service('alerts', [
    '$log', '$timeout', function($log, $timeout) {

    var self = this;

    var alerts = [];
    var callbacks = [];

    this.showSuccess = function(msg, title) {
      alerts.push({type: 'success', title: title, message: msg});

      $timeout(function() {
        self.hide(alerts.length - 1);
      }, 3000);

      notify();
    };

    this.showDanger = function(msg, title) {
      $log.warn('Error (' + title + ') - ' + msg);
      alerts.push({type: 'danger', title: title, message: msg});

      $timeout(function() {
        self.hide(alerts.length - 1);
      }, 10000);

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
