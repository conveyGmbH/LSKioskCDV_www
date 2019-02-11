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
            var promise = new _Global.Promise(function(resolve, reject) {
                winjsPromise.then(function (value) {
                    Log.print(Log.l.trace, "toES6Promise: complete => calling resolve");
                    resolve(value);
                }, function (err) {
                    Log.print(Log.l.error, "toES6Promise: error => calling reject");
                    reject(err);
                });
            });
            return promise;
        };

        _Global.toWinJSPromise = function (es6Promise) {
            var signal = new WinJS._Signal();

            if (typeof es6Promise.catch === "function") {
                var oncatch = es6Promise.catch;
                es6Promise.catch = function (err) {
                    Log.print(Log.l.trace, "toWinJSPromise: catched => calling error");
                    oncatch(err);
                    signal.error(err);
                }
            }
            es6Promise.then(function (value) {
                Log.print(Log.l.trace, "toWinJSPromise: resolved => calling complete");
                signal.complete(value);
            }, function (err) {
                Log.print(Log.l.trace, "toWinJSPromise: rejected => calling error");
                signal.error(err);
            });
            return signal.promise;
        };

        if (typeof _Global.Promise === "undefined") {
            _Global.Promise = _Base.Class.define(function Promise_ctor(resolve, reject) {
                Log.call(Log.l.trace, "Promise.");
                this._promise = new WinJS.Promise.as().then(function oncomplete(value) {
                    Log.call(Log.l.trace, "Promise.");
                    var ret = (typeof resolve === "function") ? resolve(value) : nop(value);
                    Log.ret(Log.l.trace);
                    return ret._promise ? ret._promise : ret;
                },
                function onerror(err) {
                    Log.call(Log.l.error, "Promise.");
                    var ret = (typeof reject === "function") ? reject(err) : nop(err);
                    Log.ret(Log.l.error);
                    return ret;
                });   
                Log.ret(Log.l.trace);
            }, {
                _promise: null,
                then: function Promise_then(onComplete, onError) {
                    Log.call(Log.l.trace, "Promise.");
                    var ret = this._promise._state.then(this._promise, onComplete, onError);
                    Log.ret(Log.l.trace);
                    return toES6Promise(ret);
                },
                catch: function Promise_catch(onRejected) {
                    Log.call(Log.l.error, "Promise.");
                    if (typeof onRejected === "function") {
                        this._promise.onerror = onRejected;
                    }
                    Log.ret(Log.l.error);
                },
                finally: function Promise_finally(onFinally) {
                    Log.call(Log.l.error, "Promise.");
                    var ret = this._promise._state.done(this._promise, onFinally, onFinally);
                    Log.ret(Log.l.error);
                    return ret;
                }
            }, {
                all: function Promise_all() {
                    Log.call(Log.l.error, "Promise.");
                    var values = {}
                    for (var i = 0; i < arguments.length; i++) {
                        if (typeof arguments[i] === "object" && typeof arguments[i].then === "function") {
                            Log.print(Log.l.trace, "adding join promise[" + i + "]");
                            values[i.toString()] = toWinJSPromise(arguments[i]);
                        }
                    }
                    Log.ret(Log.l.error);
                    return toES6Promise(WinJS.Promise.join(values));
                },
                race: function Promise_race() {
                    Log.call(Log.l.error, "Promise.");
                    var values = [];
                    for (var i = 0; i < arguments.length; i++) {
                        if (typeof arguments[i] === "object" && typeof arguments[i].then === "function") {
                            Log.print(Log.l.trace, "addind any promise[" + i + "]");
                            values.push(toWinJSPromise(arguments[i]));
                        }
                    }
                    Log.ret(Log.l.error);
                    return toES6Promise(WinJS.Promise.any(values));
                },
                resolve: function Promise_resolve(result) {
                    Log.call(Log.l.error, "Promise.", "result=" + result);
                    var promise = new Promise();
                    if (promise._promise) {
                        promise._promise.then(function() {
                            promise._promise._completed(result);
                        });
                    }
                    Log.ret(Log.l.error);
                    return promise;
                },
                reject: function Promise_reject(error) {
                    Log.call(Log.l.error, "Promise.", "error=" + error);
                    var promise = new Promise();
                    if (promise._promise) {
                        promise._promise.then(function () {
                            promise._promise._error(error);
                        });
                    }
                    Log.ret(Log.l.error);
                    return promise;
                }
            });
        }
    });
})();


