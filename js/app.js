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

      sharedData.setAlias(userInputs.alias);
      sharedData.setDocumentTitle(userInputs.title);

      var promise = server.connect(inputs.address, inputs.port, inputs.remoteID);

      promise.then(
        function() {
          alerts.showSuccess('Connected');
          mainScope.connected = true;
        },
        function(err) {
          alerts.showDanger(err.message, err.title);
          scope.button.active = false;
      });
    };

    scope.modalDismissed = function() {
      // Modal closed while the form was not submitted
      $log.error('Connection modal dismissed at: ' + new Date());
      scope.button.active = false;
    };
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
        var divHeight = 0;

        if(windowSize.w >= 768) {
          divHeight = windowSize.h - 240;
        }
        else {
          divHeight = windowSize.h - 220;
        }

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
