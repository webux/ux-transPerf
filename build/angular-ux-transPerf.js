/*
* uxTransPerf v.0.1.0
* (c) 2013, WebUX
* License: MIT.
*/
(function(exports, global) {
    global["ux"] = exports;
    var transform = {
        "": "transform",
        webkit: "webkitTransform",
        Moz: "MozTransform",
        O: "OTransform",
        ms: "msTransform"
    }, transforms = {
        webkitTransform: "-webkit-transform",
        OTransform: "-o-transform",
        msTransform: "-ms-transform",
        MozTransform: "-moz-transform",
        transform: "transform"
    }, vendor = function() {
        var vendors = [ "t", "webkitT", "MozT", "msT", "OT" ], t, i, l = vendors.length, dummyStyle = document.createElement("div").style;
        for (i = 0; i < l; i += 1) {
            t = vendors[i] + "ransform";
            if (t in dummyStyle) {
                return vendors[i].substr(0, vendors[i].length - 1);
            }
        }
        return false;
    }(), tests = [ {
        id: "trans",
        name: "translate",
        supported: false,
        run: function(style, x, y) {
            style[transform[vendor]] = "translate(" + x + "px, " + y + "px)";
        }
    }, {
        id: "transXY",
        name: "translate X/Y",
        supported: false,
        run: function(style, x, y) {
            style[transform[vendor]] = "translateX(" + x + "px) translateY(" + y + "px)";
        }
    }, {
        id: "transXYZ",
        name: "translate X/Y/Z",
        supported: false,
        run: function(style, x, y) {
            style[transform[vendor]] = "translateX(" + x + "px) translateY(" + y + "px) translateZ(0)";
        }
    }, {
        id: "transXYZ1",
        name: "translate x/y/z with z not zero",
        supported: false,
        run: function(style, x, y) {
            style[transform[vendor]] = "translateX(" + x + "px) translateY(" + y + "px) translateZ(0.1px)";
        }
    }, {
        id: "transTransZ",
        name: "translate, translateZ",
        supported: false,
        run: function(style, x, y) {
            style[transform[vendor]] = "translate(" + x + "px, " + y + "px) translateZ(0)";
        }
    }, {
        id: "posLT",
        name: "position left/top",
        supported: false,
        run: function(style, x, y) {
            style.left = x + "px";
            style.top = y + "px";
        }
    }, {
        id: "trans3d",
        name: "translate3d",
        supported: false,
        run: function(style, x, y) {
            style[transform[vendor]] = "translate3d(" + x + "px, " + y + "px, 0px)";
        }
    }, {
        id: "trans3dZ1",
        name: "translate3d with Z not zero",
        supported: false,
        run: function(style, x, y) {
            style[transform[vendor]] = "translate3d(" + x + "px, " + y + "px, 0.1px)";
        }
    } ];
    function transPerf() {
        var bench = [], api = {}, timeLimit = 20, storageKey = "ux-transform-perf", index = 0, percent = 0, intv = 0, item, origOffset, elm, statusCallback, onComplete, iterations;
        function best(style, x, y, omit) {
            var index = 0;
            if (!bench.length) {
                throw new Error("benchmark must be executed first.");
            }
            if (omit) {
                if (typeof omit === "string") {
                    if (omit === bench[0].name) {
                        index += 1;
                    }
                } else {
                    while (omit.indexOf(bench[index].name) !== -1) {
                        index += 1;
                    }
                }
            }
            return tests[bench[index].index].run(style, x, y);
        }
        function benchmark(statusUpdateCallback, onCompleteHandler, count, force) {
            if (!force && bench.length) {
                statusUpdateCallback(bench, 1);
                onCompleteHandler();
                return;
            }
            elm = document.createElement("p");
            document.body.insertBefore(elm, null);
            iterations = count || 1e4;
            statusCallback = statusUpdateCallback;
            onComplete = onCompleteHandler;
            bench = !force && getStoredValue() || [];
            origOffset = elm.offsetTop;
            if (bench.length) {
                statusCallback(bench, 1);
                onComplete();
                return;
            }
            elm.style.position = "absolute";
            elm.style.top = "0px";
            elm.style.left = "0px";
            checkSupport();
        }
        function clear(elm) {
            elm.style[transform[vendor]] = "";
            elm.style.left = "0px";
            elm.style.top = "0px";
            elm.style.marginLeft = "0px";
            elm.style.marginTop = "0px";
        }
        function checkSupport() {
            if (tests[index]) {
                isSupported(tests[index]);
                return;
            }
            index = 0;
            intv = setTimeout(run);
        }
        function isSupported(test) {
            var box, strundef = "undefined";
            test.run(elm.style, 1, 1);
            if (typeof elm.getBoundingClientRect !== strundef) {
                box = elm.getBoundingClientRect();
                test.supported = !!box.top;
            }
            if (!test.supported) {
                tests.splice(index, 1);
                api.log("%s is not supported", test.id);
            } else {
                index += 1;
            }
            clear(elm);
            setTimeout(checkSupport);
        }
        function run() {
            var len = tests.length;
            if (tests[index].supported) {
                item = {
                    id: tests[index].id,
                    name: tests[index].name,
                    index: index,
                    iterations: 0
                };
                exec(item, elm, tests[index], timeLimit, item.iterations);
                item.end = Date.now();
                bench[index] = item;
                index += 1;
                percent = index / len;
                statusCallback(bench, percent);
                if (index < len) {
                    clearTimeout(intv);
                    intv = setTimeout(run);
                } else {
                    compileResults(bench);
                    document.getElementsByTagName("body")[0].className += " " + bench[0].id;
                    onComplete();
                    if (!getStoredValue()) {
                        setStoredValue(bench);
                    }
                    document.body.removeChild(elm);
                    elm = null;
                    statusCallback = null;
                    onComplete = null;
                }
            } else {
                api.log("%s NOT SUPPORTED", tests[index].id);
            }
        }
        function exec(item, elm, test, time, amount) {
            var i = 0, x = 0, y = 0, then;
            if (time) {
                item.timeLimit = time;
                then = Date.now() + time;
                while (Date.now() < then) {
                    x = y += 1;
                    test.run(elm.style, x, y);
                    i += 1;
                }
                item.iterations = i;
            } else {
                item.start = Date.now();
                while (i < amount) {
                    x = y += 1;
                    test.run(elm.style, x, y);
                    i += 1;
                }
                item.end = Date.now();
                item.iterations = amount;
            }
            clear(elm);
            return item;
        }
        function getResults() {
            var i = 0, len = bench.length, item, result = [], pattern, test;
            while (i < len) {
                item = bench[i];
                pattern = {};
                test = tests[item.index];
                if (item.supported) {
                    test.run(pattern, "%x", "%y");
                } else {
                    pattern = "NOT SUPPORTED";
                }
                result.push({
                    name: item.name,
                    time: item.total,
                    count: item.iterations,
                    pattern: pattern
                });
                i += 1;
            }
            return result;
        }
        function isLocalStorageSupported() {
            try {
                return "localStorage" in window && window.localStorage !== null;
            } catch (e) {
                api.log(e.Description);
                return false;
            }
        }
        function getStoredValue() {
            if (!isLocalStorageSupported()) {
                return undefined;
            }
            var item = localStorage.getItem(storageKey), diff, result = item && JSON.parse(item) || undefined;
            if (result) {
                diff = api.expire - (Date.now() - result.expire);
                if (diff > 0) {
                    api.log("stored value found. %ss left till expire. Delete transPerf local storage to clear now.", Math.round(diff / 1e3));
                    return result.value;
                }
            }
            return undefined;
        }
        function setStoredValue(value) {
            if (!isLocalStorageSupported()) {
                return undefined;
            }
            try {
                localStorage.setItem(storageKey, JSON.stringify({
                    expire: Date.now(),
                    value: value
                }));
            } catch (e) {
                return false;
            }
            return true;
        }
        function compileResults(bench) {
            var i = 0, len = bench.length, item;
            while (i < len) {
                item = bench[i];
                if (item.timeLimit) {
                    item.total = item.iterations;
                } else {
                    item.total = item.end - item.start;
                }
                i += 1;
            }
            sort(bench, function(a, b) {
                if (a.timeLimit) {
                    return b.total - a.total;
                }
                return a.total - b.total;
            });
            return bench;
        }
        function logResults(bench) {
            var str = "", i = 0, len = bench.length, item;
            while (i < len) {
                item = bench[i];
                str += item.name + ": " + (item.timeLimit ? "count = " + item.total + " in " + item.timeLimit + "ms\n" : "time = " + item.total + "ms\n");
                i += 1;
            }
            return str;
        }
        function sort(ary, compareFn) {
            var c = 0, len = ary.length, v = 0, rlen = ary.length - 1, holder;
            if (!compareFn) {
                compareFn = function(a, b) {
                    return a > b ? 1 : a < b ? -1 : 0;
                };
            }
            while (c < len) {
                v = 0;
                rlen = ary.length - 1;
                while (v < rlen) {
                    if (compareFn(ary[v], ary[v + 1]) > 0) {
                        holder = ary[v + 1];
                        ary[v + 1] = ary[v];
                        ary[v] = holder;
                    }
                    v += 1;
                }
                c += 1;
            }
            return ary;
        }
        api.best = best;
        api.benchmark = benchmark;
        api.getResults = getResults;
        api.log = function() {};
        api.getLog = function() {
            return logResults(bench);
        };
        return api;
    }
    exports.transPerf = transPerf();
    var module;
    try {
        module = angular.module("ux");
    } catch (e) {
        module = angular.module("ux", []);
    }
    ux.transPerf.events = {
        ON_UPDATE: "transPerf:onUpdate",
        ON_COMPLETE: "transPerf:onComplete"
    };
    module.directive("uxTransPerf", [ "$rootScope", function($rootScope) {
        return {
            restrict: "A",
            template: "<div></div><div>{{percent}}</div>",
            scope: {},
            link: function(scope, element, attr) {
                ux.transPerf.expire = ux.transPerf.expire || parseInt(attr.expire || 0, 10) || 60 * 1e3;
                setTimeout(function() {
                    ux.transPerf.benchmark(function(bench, percent) {
                        $rootScope.$broadcast(ux.transPerf.events.ON_UPDATE, percent);
                    }, function() {
                        ux.transPerf.best(element.children()[0].style, 100, 100);
                        $rootScope.$broadcast(ux.transPerf.events.ON_COMPLETE);
                        scope.$destroy();
                        element.remove();
                        $rootScope.$apply();
                    }, attr.uxTransPerf || 1e4);
                });
            }
        };
    } ]);
})({}, function() {
    return this;
}());