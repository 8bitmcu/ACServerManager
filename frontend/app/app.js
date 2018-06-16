'use strict';

angular
	.module('acServerManager', ['acServerManager.services', 'ui.bootstrap', 'ui.bootstrap.showErrors', 'toggle-switch'])
	
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

.filter('distance', function() {
  var km = true;
  return function(input) {
    var num = parseInt(input || '');
    var out;

    if(isNaN(num)) {
      out = '';
    } else if(km) {
      out = Math.round(input / 10) / 100 + " KM";
    } else {
      out = Math.round(input / 16.09) / 100 + " MI";
    }

    return out;
  };
});
