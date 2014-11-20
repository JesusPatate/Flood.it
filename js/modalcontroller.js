"use strict";

(function() {
  var app = angular.module('floodit');

  app.controller('ModalCtrl', [
    '$scope', '$modal', '$log', function($scope, $modal, $log) {
      
    var scope = $scope;
    var mainScope = scope.$parent;

    scope.$log = $log;
    scope.inputs = {};

    scope.openModal = function (success, failure) {
      
      var modalInstance = $modal.open({
        templateUrl: 'myModalContent.html',
        controller: 'ModalInstanceCtrl',
        backdrop: true,
        keyboard: false,
        scope: scope
      });

      modalInstance.result.then(
        function (inputs) { success(inputs) }, failure
      );
    };
  }]);

  app.controller('ModalInstanceCtrl',
    ['$scope', '$modalInstance', function ($scope, $modalInstance) {
      
    $scope.ok = function () {
      if($scope.connectionForm.$valid) {
        $modalInstance.close($scope.inputs);
      }
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }]);

})();

