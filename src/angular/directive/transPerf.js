/*
* (c) 2013, WebUX
* https://github.com/webux
* License: MIT
*/
/*global angular, ux */
// add some events for angular.
ux.transPerf.events = {
    UPDATED: 'transPerf:update',
    COMPLETED: 'transPerf:complete'
};
angular.module('ux').directive('uxTransPerf', ['$rootScope', function ($rootScope) {
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
                        $rootScope.$broadcast(ux.transPerf.events.UPDATED, percent);
                    },
                    function () {
                        ux.transPerf.best(element.children()[0].style, 100, 100);
                        $rootScope.$broadcast(ux.transPerf.events.COMPLETED);
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