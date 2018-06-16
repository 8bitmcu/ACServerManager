'use strict';

angular
.module('acServerManager', ['acServerManager.services', 'ui.router', 'ui.bootstrap', 'ui.bootstrap.showErrors', 'toggle-switch'])
.directive('stringToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(value) {
        return '' + value;
      });
      ngModel.$formatters.push(function(value) {
        return parseFloat(value, 10);
      });
    }
  };
})
.config(function($stateProvider, $urlRouterProvider) {

	$urlRouterProvider.otherwise("/session");

	$stateProvider

      // PLAY
      .state('session', {
          url: "/session",
          controller: "ConfigCtrl",
          data: { title: "Current Session" },
          templateUrl: 'templates/session.html'
      })

      // CONTENT MANAGER
	    .state('modList', {
	        url: "/modList",
          data: { title: "Mod Manager" },
	        templateUrl: 'templates/modList.html'
	    })
	    .state('carList', {
	        url: "/carList",
          controller: "ConfigCtrl",
          data: { title: "Vehicle Classes" },
	        templateUrl: 'templates/carList.html'
	    })
	    .state('eventList', {
	        url: "/eventList",
          controller: "ConfigCtrl",
          data: { title: "Event Types" },
	        templateUrl: 'templates/eventList.html'
	    })
	    .state('diffList', {
	        url: "/diffList",
          controller: "ConfigCtrl",
          data: { title: "Difficulties" },
	        templateUrl: 'templates/diffList.html'
	    })
	    .state('weatherList', {
	        url: "/weatherList",
          controller: "ConfigCtrl",
          data: { title: "Current Session" },
	        templateUrl: 'templates/weatherList.html'
	    })

      // SERVER CONFIG
	    .state('status', {
	        url: "/status",
          controller: "StatusCtrl",
          data: { title: "Server Status" },
	        templateUrl: 'templates/status.html'
	    })
	    .state('config', {
	        url: "/config",
          controller: "ConfigCtrl",
          data: { title: "Configuration" },
	        templateUrl: 'templates/config.html'
	    })
	    .state('settings', {
	        url: "/settings",
          data: { title: "Server Manager Settings" },
	        templateUrl: 'templates/settings.html'
	    })

      // External Plugins (sTracker)
	    .state('plugin', {
	        url: "/:name",
          controller: "pluginCtrl",
	        template: '<div class="fs-iframe"><iframe ng-src="{{url}}"></iframe></div>'
	    })

})
// assume input are meters, format to KM //todo: format to miles
.filter('distance', function() {
  return function(input) {
    input = input || '';
    var out = Math.round(input / 10) / 100 + " KM";
    return out;
  };
})
.run(['$rootScope', '$state', '$stateParams',
  function ($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}])
