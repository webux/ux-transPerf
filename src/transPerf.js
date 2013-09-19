//http://jsperf.com/translate3d-vs-xy/63
var transform = {
        '': 'transform',
        'webkit': 'webkitTransform',
        'Moz': 'MozTransform',
        'O': 'OTransform',
        'ms': 'msTransform'
    },
    transforms = {
        'webkitTransform': '-webkit-transform',
        'OTransform': '-o-transform',
        'msTransform': '-ms-transform',
        'MozTransform': '-moz-transform',
        'transform': 'transform'
    },
    vendor = (function () {
        var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
            t,
            i,
            l = vendors.length,
            dummyStyle = document.createElement('div').style;

        for (i = 0; i < l; i += 1) {
            t = vendors[i] + 'ransform';
            if (t in dummyStyle) { // must use in. Do not use hasOwnProperty. It needs to check for inherited properties.
                return vendors[i].substr(0, vendors[i].length - 1);
            }
        }

        return false;
    }()),
    tests = [
        {
            id: "trans",
            name: 'translate',
            supported: false,
            run: function (style, x, y) {
                style[transform[vendor]] = "translate(" + x + "px, " + y + "px)";
            }
        },
        {
            id: "transXY",
            name: 'translate X/Y',
            supported: false,
            run: function (style, x, y) {
                style[transform[vendor]] = "translateX(" + x + "px) translateY(" + y + "px)";
            }
        },
        {
            id: "transXYZ",
            name: 'translate X/Y/Z',
            supported: false,
            run: function (style, x, y) {
                style[transform[vendor]] = "translateX(" + x + "px) translateY(" + y + "px) translateZ(0)";
            }
        },
        {
            id: "transXYZ1",
            name: 'translate x/y/z with z not zero',
            supported: false,
            run: function (style, x, y) {
                style[transform[vendor]] = "translateX(" + x + "px) translateY(" + y + "px) translateZ(0.1px)";
            }
        },
        {
            id: "transTransZ",
            name: 'translate, translateZ',
            supported: false,
            run: function (style, x, y) {
                style[transform[vendor]] = "translate(" + x + "px, " + y + "px) translateZ(0)";
            }
        },
        {
            id: "posLT",
            name: 'position left/top',
            supported: false,
            run: function (style, x, y) {
                style.left = x + 'px';
                style.top = y + 'px';
            }
        },
//        {
//            id: "marginLT",
//            name: 'margin left/top',
//            supported: false,
//            run: function (style, x, y) {
//                style.marginLeft = x + 'px';
//                style.marginTop = y + 'px';
//            }
//        },
        {
            id: "trans3d",
            name: 'translate3d',
            supported: false,
            run: function (style, x, y) {
                style[transform[vendor]] = "translate3d(" + x + "px, " + y + "px, 0px)";
            }
        },
        {
            id: "trans3dZ1",
            name: 'translate3d with Z not zero',
            supported: false,
            run: function (style, x, y) {
                style[transform[vendor]] = "translate3d(" + x + "px, " + y + "px, 0.1px)";
            }
        }
    ];

function transPerf() {
    var bench = [],
        api = {},
        timeLimit = 20,
        storageKey = 'ux-transform-perf',
        index = 0,
        percent = 0,
        intv = 0,
        item,
        origOffset,
        elm,
        statusCallback,
        onComplete,
        iterations;

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
            } else {// expect an array
                while (omit.indexOf(bench[index].name) !== -1) {
                    index += 1;
                }
            }
        }

        return tests[bench[index].index].run(style, x, y);
    }

//TODO: add a class name on the body tag that will allow you to have all transitions in the css and use the best with css only.
    function benchmark(statusUpdateCallback, onCompleteHandler, count, force) {
//TODO: need to automatically add element to body. document.body.insertBefore(el, null); https://gist.github.com/lorenzopolidori/3794226 remove it too.
        if (!force && bench.length) { // if we already have in memory.
            statusUpdateCallback(bench, 1);
            onCompleteHandler();
            return;
        }
        elm = document.createElement('p');
        document.body.insertBefore(elm, null);
        iterations = count || 10000;
        statusCallback = statusUpdateCallback;
        onComplete = onCompleteHandler;
        bench = (!force && getStoredValue()) || [];
        origOffset = elm.offsetTop;
        if (bench.length) { // if it got it from local storage.
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
        elm.style[transform[vendor]] = ""; // clear it out.
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
        // if it doesn't pass this then the css must be wrong or it doesn't support that method.
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
                //TODO: Make sure to tell about this in the readme file.
                document.getElementsByTagName('body')[0].className += " " + bench[0].id;
                onComplete();
                // don't update it unless it has expired.
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
                test.run(pattern, '%x', '%y');
            } else {
                pattern = "NOT SUPPORTED";
            }
            result.push({name: item.name, time: item.total, count: item.iterations, pattern: pattern});
            i += 1;
        }
        return result;
    }

    function isLocalStorageSupported() {
        try {
            return (window.hasOwnProperty('localStorage') && window.localStorage !== null);
        } catch (e) {
            api.log(e.Description);
            return false;
        }
    }

    function getStoredValue() {
        if (!isLocalStorageSupported()) {
            return undefined;
        }
        var item = localStorage.getItem(storageKey), diff,
            result = (item && JSON.parse(item)) || undefined;
        if (result) {
            diff = api.expire - (Date.now() - result.expire);
            if (diff > 0) {
                api.log("stored value found. %ss left till expire. Delete transPerf local storage to clear now.", Math.round(diff / 1000));
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
            localStorage.setItem(storageKey, JSON.stringify({expire: Date.now(), value: value}));
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
        sort(bench, function (a, b) {
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
        if (!compareFn) { // default compare function.
            compareFn = function (a, b) {
                return a > b ? 1 : (a < b ? -1 : 0);
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
    api.log = function () {};
    api.getLog = function () {
        return logResults(bench);
    };

    return api;
}

exports.transPerf = transPerf();
