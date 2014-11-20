(function() {
  var app = angular.module('floodit');
  
  app.controller('AlertCtrl', [
    '$scope', 'alerts', function($scope, alerts) {

    $scope.alerts = [];
    
    alerts.addListener(function(array) {
      $scope.alerts = array;
    });

    $scope.closeAlert = function(index) {
      alerts.hide(index);
    };
  }]);
})();
