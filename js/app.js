"use strict";

(function() {
  var app = angular.module('floodit', ['ui.bootstrap','ui.ace']);

  app.run(function(server, editorService) {
    editorService.addListener('insertion', server.insert, server);
    editorService.addListener('deletion', server.remove, server);
    server.addListener('remoteInsertion', editorService.applyInsertion, editorService);
    server.addListener('remoteDeletion', editorService.applyDeletion, editorService);
  });

  app.controller('MainCtrl', [
    '$scope', '$timeout', 'sharedData',
    function($scope, $timeout, sharedData) {
      $scope.doc = sharedData;

      sharedData.addListener(function() {
        // XXX $applyAsinc not available within this version of angular (<1.3.0) :(
        $timeout(function() {
          $scope.$apply();
        }, 100);
      });
    }
  ]);

  // Server controller

  app.controller('ServerCtrl', [
    '$scope', '$modal', '$log', 'server', 'sharedData', 'alerts',
    function($scope, $modal, $log, server, sharedData, alerts) {

    var scope = $scope;
    var mainScope = scope.$parent;

    scope.button = {
      active: false,
      text: 'Connect',
      activeText: 'Connecting...'
    };

    var userInputs = {};

    scope.register = function(inputs) {
      userInputs = inputs;

      var registerPromise = server.register(inputs.address, inputs.port);
      registerPromise.then(registerSuccess, registerFailure);
    };

    scope.modalDismissed = function() {
      // Modal closed while the form was not submitted
      $log.error('Connection modal dismissed at: ' + new Date());
      scope.button.active = false;
    };

    function registerSuccess(id) {
      sharedData.setDocumentTitle(userInputs.title);
      sharedData.setAlias(userInputs.alias);

      if (userInputs.action === 'join') {
        join();
      } else {
        connected();
      }
    }

    function registerFailure(err) {
      scope.button.active = false;
    }

    function join() {
      var joinPromise = server.join(userInputs.remoteID);
      joinPromise.then(connected, joinFailure);
    }

    function connected() {
      alerts.showSuccess('You successfully connected.');
      mainScope.connected = true;
    }

    function joinFailure() {
      scope.button.active = false;
    }
  }]);

  // Editor controller

  app.controller('EditorCtrl', [
    '$scope', 'editorService',
    function($scope, editorService) {

    $scope.aceLoaded = function(_editor) {
      editorService.init(_editor);
      _editor.setBehavioursEnabled(false);
      _editor.setShowPrintMargin(false);
      _editor.getSession().setUseWrapMode(true);
      _editor.getSession().setUseSoftTabs(false);
    };

    $scope.aceChanged = function(event) {
      editorService.handle(event);
    };
  }]);

  app.directive('fiToggle', function() {
    return {
      scope: {
        active: '=fiToggle',
        activeText: '='
      },
      link: function($scope, element, attrs) {
        var oldValue;

        $scope.$watch("active", function(value) {
          if (value) {
            oldValue = element.text();
            element.text($scope.activeText);
          } else {
            element.text(oldValue);
          }

          element.attr("disabled", value);
        });

        element.bind('click', function() {
          $scope.$apply(function() {
            $scope.active = !$scope.active;
          });
        });
      }
    };
  });

  app.directive('fiResizeOnLoad', function($window) {

    return function(scope, element, attrs) {

      var getWindowHeight = function() {
        return {h: $window.innerHeight, w: $window.innerWidth};
      }

      angular.element($window).bind('load', function () {
        var windowSize = getWindowHeight();
        var divHeight = windowSize.h - 240;

        scope.style = function () {
          return {
            'height': divHeight + 'px'
          };
        };

        scope.$apply();
      });
    };
  });
})();
