/*global angular, ux */
var module;
try {
    module = angular.module('ux');
} catch (e) {
    module = angular.module('ux', []);
}
// add some events for angular.
ux.transPerf.events = {
    ON_UPDATE: 'transPerf:onUpdate',
    ON_COMPLETE: 'transPerf:onComplete'
};
module.directive('uxTransPerf', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'A',
        template: '<div></div><div>{{percent}}</div>',
        scope: {},
        link: function (scope, element, attr) {
            // wait for the first digest to have been completed to get offset.
            ux.transPerf.expire = ux.transPerf.expire || parseInt(attr.expire || 0, 10) || 60 * 1000; // expire every minute.
            setTimeout(function () {
                ux.transPerf.benchmark(
                    function (bench, percent) {
                        $rootScope.$broadcast(ux.transPerf.events.ON_UPDATE, percent);
                    },
                    function () {
                        ux.transPerf.best(element.children()[0].style, 100, 100);
                        $rootScope.$broadcast(ux.transPerf.events.ON_COMPLETE);
                        scope.$destroy();
                        element.remove();
                        $rootScope.$apply();
                    },
                    attr.uxTransPerf || 10000
                );
            });
        }
    };
}]);