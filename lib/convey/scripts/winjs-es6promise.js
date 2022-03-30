// Collection of String utility functions
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />

/**
 * Use the functions in this namespace to convert between WinJS.Promise and ES6 Promise.
 * @namespace Promise
 */

(function () {
    "use strict";

    WinJS.Utilities._require([
        'WinJS/Core/_Global',
        'WinJS/Core/_Base'
    ], function es6PromiseInit(_Global, _Base) {
        function nop(v) {
            return v;
        }
        _Global.toES6Promise = function (winjsPromise) {
            Log.call(Log.l.trace);
            var resolve = nop;
            var reject = nop;
            var promise = new _Global.Promise(function (c, e) {
                if (c && typeof c === "function") resolve = c;
                if (e && typeof e === "function") reject = e;
            });
            var value;
            winjsPromise.then(function Promise_then(aValue) {
                value = aValue;
                return WinJS.Promise.timeout(0);
            }).then(function Promise_then() {
                Log.call(Log.l.trace, "WinJS.Promise.", "value=" + value);
                var ret = resolve(value);
                if (!ret) {
                    ret = value;
                }
                if (ret.then) {
                    ret = toWinJSPromise(ret);
                }
                Log.ret(Log.l.trace, "value=" + ret);
                return ret;
            },
            function Promise_error(error) {
                Log.call(Log.l.error, "WinJS.Promise.", "error=" + error);
                reject(error);
                Log.ret(Log.l.trace);
            });
            Log.ret(Log.l.trace);
            return promise;
        };

        _Global.toWinJSPromise = function (es6Promise) {
            Log.call(Log.l.trace);
            var signal = new WinJS._Signal();
            if (typeof es6Promise.catch === "function") {
                var oncatch = es6Promise.catch;
                es6Promise.catch = function (err) {
                    Log.print(Log.l.trace, "toWinJSPromise: catched => calling error");
                    var ret = oncatch(err);
                    signal.error(err);
                    return ret;
                }
            }
            WinJS.Promise.timeout(0).then(function() {
                es6Promise.then(function Promise_then(value) {
                    Log.call(Log.l.trace, "Promise.", "value=" + value);
                    signal.complete(value);
                    Log.ret(Log.l.trace);
                }, function (err) {
                    Log.call(Log.l.trace, "Promise.", "error=" + error);
                    signal.error(err);
                    Log.ret(Log.l.trace);
                });
            });
            var ret = signal.promise;
            Log.ret(Log.l.trace);
            return ret;
        };

        if (typeof _Global.Promise === "undefined") {
            _Global.Promise = _Base.Class.define(function Promise_ctor(stateFunction) {
                Log.call(Log.l.trace, "Promise.");
                var signal = new WinJS._Signal();
                this._promise = signal.promise;
                this._onError = nop;

                var that = this;
                this.then = function Promise_then(onComplete, onError) {
                    Log.call(Log.l.trace, "Promise.");
                    var promise = signal.promise.then(function Promise_completed(value) {
                        var ret = null;
                        Log.call(Log.l.trace, "Promise.", "value=" + value);
                        if (typeof onComplete === "function") {
                            ret = onComplete(value);
                        }
                        if (!ret) {
                            ret = value;
                        }
                        Log.ret(Log.l.trace, "value=" + ret);
                        return ret;
                    }, function Promise_error(error) {
                        Log.call(Log.l.error, "Promise.", "error=" + error);
                        if (typeof onError === "function") {
                            onError(error);
                        }
                    });
                    var ret = toES6Promise(promise);
                    Log.ret(Log.l.trace);
                    return ret;
                };

                this.catch = function Promise_catch(onRejected) {
                    Log.call(Log.l.error, "Promise.", "exception");
                    if (typeof onRejected === "function") {
                        signal.promise.onerror = onRejected;
                    }
                    Log.ret(Log.l.trace);
                    return that;
                };

                this.finally = function Promise_finally(onFinally) {
                    Log.call(Log.l.trace, "Promise.", "finally");
                    signal.promise.done(onFinally, onFinally);
                    Log.ret(Log.l.trace);
                    return that;
                };

                stateFunction(function Promise_resolved(value) {
                    Log.call(Log.l.trace, "Promise.", "value=" + value);
                    signal.complete(value);
                    Log.ret(Log.l.trace);
                    return value;
                }, function Promise_rejected(error) {
                    Log.call(Log.l.error, "Promise.", "error=" + error);
                    signal.error(error);
                    Log.ret(Log.l.trace);
                    return error;
                });
                Log.ret(Log.l.trace);
            }, {
                _promise: null
            }, {
                all: function Promise_all(promises) {
                    var promise;
                    Log.call(Log.l.trace, "Promise.");
                    if (!promises || !promises.length) {
                        Log.print(Log.l.trace, "null param");
                        promise = WinJS.Promise.as();
                    } else {
                        var valuePromises = {}
                        for (var i = 0; i < promises.length; i++) {
                            if (typeof promises[i] === "object" && typeof promises[i].then === "function") {
                                Log.print(Log.l.trace, "adding join promise[" + i + "]");
                                valuePromises[i.toString()] = toWinJSPromise(promises[i]);
                            }
                        }
                        promise = WinJS.Promise.join(valuePromises).then(function (values) {
                            var valueArray = [];
                            for (var prop in values) {
                                if (values.hasOwnProperty(prop)) {
                                    valueArray.push(values[prop]);
                                }
                            }
                            return new WinJS.Promise.as(valueArray);
                        });
                    }
                    var ret = toES6Promise(promise);
                    Log.ret(Log.l.trace);
                    return ret;
                },
                race: function Promise_race(promises) {
                    var promise;
                    Log.call(Log.l.trace, "Promise.");
                    if (!promises || !promises.length) {
                        Log.print(Log.l.trace, "null param");
                        promise = WinJS.Promise.as();
                    } else {
                        var valuePromises = [];
                        for (var i = 0; i < promises.length; i++) {
                            if (typeof promises[i] === "object" && typeof promises[i].then === "function") {
                                Log.print(Log.l.trace, "addind any promise[" + i + "]");
                                valuePromises.push(toWinJSPromise(promises[i]));
                            }
                        }
                        promise = WinJS.Promise.any(valuePromises).then(function (value) {
                            return new WinJS.Promise.as(value);
                        });
                    }
                    var ret = toES6Promise(promise);
                    Log.ret(Log.l.trace);
                    return ret;
                },
                resolve: function Promise_resolve(result) {
                    Log.call(Log.l.trace, "Promise.", "result=" + result);
                    var promise = new WinJS.Promise.as(result);
                    var ret = toES6Promise(promise);
                    Log.ret(Log.l.trace);
                    return ret;
                },
                reject: function Promise_reject(error) {
                    Log.call(Log.l.trace, "Promise.", "error=" + error);
                    var promise = WinJS.Promise.wrapError(error);
                    var ret = toES6Promise(promise);
                    Log.ret(Log.l.trace);
                    return ret;
                }
            });
        }
    });
})();


