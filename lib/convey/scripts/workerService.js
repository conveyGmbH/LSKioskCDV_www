// Collection of String utility functions
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/appbar.js" />

/**
 * Use the functions in this namespace to access Windows resource loader interface.
 * @namespace WorkerService
 */


(function () {
    "use strict";

    WinJS.Utilities._require([
        "WinJS/Core/_Global",
        "WinJS/Core/_Base"
    ], function workerServiceInit(_Global, _Base) {
        /**
        * @function include
        * @param {string} filename - The path to a JavaScript file or a module name to include
        * @param {string} [name] - An optional global name for the imported module
        * @description Call this function to include JavaScript files or modules to your source code.
        */
        _Global.include = function include(filename, key) {
            var start = filename.lastIndexOf("/") + 1;
            var stop = filename.indexOf(".", start);
            if (!key) {
                if (stop > start) {
                    key = filename.substr(start, stop - start);
                } else {
                    key = filename.substr(start);
                }
            }
            _Global[key] = require(filename);
        }
    });

    include("http");

    WinJS.Namespace.define("WorkerService", {
        /**
        * @readonly
        * @enum {string} statusId - Enum for worker service state ids
        * @memberof WorkerService
        */
        statusId: {
            /**
            * The stopped state
            */
            stopped: "stopped",
            /**
            * The started state
            */
            started: "started",
            /**
            * The paused state
            */
            paused: "paused",
            /**
            * The busy state
            */
            busy: "busy"
        },

        description: {
            get: function() {
                return "Usage: /<command> [/<worker-name>]\n\n<command>:\n\nstart - Starts service or worker\nstop -  Stops service or worker\npause - Pauses service or worker\n\n<worker-name>:\n\nName of worker module\n\n";
            }    
        },

        /**
        * @class WorkDispatcher
        * @memberof WorkerService
        * @param {string} name - The name of the worker loop
        * @description This class implements the class for a worker service object
        */
        WorkDispatcher: WinJS.Class.define(function workDispatcher(name) {
            Log.call(Log.l.trace, "WorkerService.WorkDispatcher.", "name=" + name);
            this._promise = WinJS.Promise.as();
            this._name = name;
            this._status = WorkerService.statusId.stopped;
            Log.ret(Log.l.trace);
        }, {
            _module: null,
            _name: null,
            _info: null,
            _nextStatus: null,

            _promise: null,
            _waitTimeMs: 1000,
            _runLoop: function () {
                Log.call(Log.l.trace, "WorkerService.WorkDispatcher.");
                if (this.status === WorkerService.statusId.started) {
                    this._status = WorkerService.statusId.busy;
                    this._promise = this.activity();
                    if (!this._promise || typeof this._promise.then !== "function") {
                        this._promise = this._defaultActivity();
                    }
                    var that = this;
                    this._promise.then(function () {
                        if (that._nextStatus) {
                            Log.print(Log.l.info, "now switch to status=" + that._nextStatus);
                            that._status = that._nextStatus;
                            that._nextStatus = null;
                        } else if (that._status === WorkerService.statusId.busy) {
                            that._status = WorkerService.statusId.started;
                            that._promise = WinJS.Promise.timeout(that._waitTimeMs).then(function () {
                                that._runLoop();
                            });
                        }
                    });
                }
                Log.ret(Log.l.trace);
            },


            name: {
                get: function () {
                    return this._name;
                }
            },

            /**
            * @property {string} status - the status of the work dispatcher
            * @memberof WorkerService.WorkDispatcher
            * @description Read-only. 
            *  Use this property to retrieve the current status of the work dispatcher object.
            */
            _status: null,
            status: {
                get: function () {
                    return this._status;
                }
            },

            _activity: null,
            _defaultActivity: function () {
                Log.Print(Log.l.trace, "use WorkerService.WorkLoop._defaultActivity");
                return new WinJS.Promise.as();
            },
            activity: {
                get: function () {
                    return this._activity || this._defaultActivity;
                },
                set: function (newActivity) {
                    this._activity = newActivity;
                }
            },

            _dispose: null,
            _defaultDispose: function () {
                Log.Print(Log.l.trace, "use WorkerService.WorkLoop._defaultDispose");
                return new WinJS.Promise.as();
            },
            dispose: {
                get: function () {
                    return this._dispose || this._defaultDispose;
                },
                set: function (newDispose) {
                    this._dispose = newDispose;
                }
            },

            info: {
                get: function() {
                    return this._info && this._info() || "";
                }
            },

            start: function () {
                var curPromise = null;
                Log.call(Log.l.trace, "WorkerService.WorkDispatcher.");
                if (this.status === WorkerService.statusId.stopped) {
                    if (!this._module) {
                        var filename = "../../../worker/" + this.name + "/" + this.name + ".js";
                        this._module = require(filename);
                        if (this._module.waitTimeMs > 0) {
                            this._waitTimeMs = this._module.waitTimeMs;
                        }
                        if (typeof this._module.info === "function") {
                            this._info = this._module.info;
                        }
                    }
                    this._status = WorkerService.statusId.started;
                    if (typeof this._module.startup === "function") {
                        curPromise = this._module.startup();
                    }
                    if (!curPromise) {
                        curPromise = WinJS.Promise.as();
                    }
                } else if (this._status !== WorkerService.statusId.started) {
                    this._status = WorkerService.statusId.started;
                    curPromise = WinJS.Promise.as();
                }
                if (this._module && curPromise) {
                    var that = this;
                    curPromise.then(function () {
                        if (typeof that._module.activity === "function") {
                            that.activity = that._module.activity;
                        }
                        if (typeof that._module.dispose === "function") {
                            that.dispose = that._module.dispose;
                        }
                        that._runLoop();
                    });
                }
                Log.ret(Log.l.trace);
            },

            pause: function () {
                Log.call(Log.l.trace, "WorkerService.WorkDispatcher.");
                this._nextStatus = WorkerService.statusId.paused;
                Log.ret(Log.l.trace);
            },

            stop: function () {
                Log.call(Log.l.trace, "WorkerService.WorkDispatcher.");
                this._nextStatus = WorkerService.statusId.stopped;
                if (this._promise) {
                    this._promise.cancel();
                }
                this._runLoop();
                Log.ret(Log.l.trace);
            }
        }),

        /**
        * @class WorkLoop
        * @memberof WorkerService
        * @param {string[]} dispatcherNames - An array of names of dispatchers to load
        * @param {number} [port] - An optional port to create http listener
        * @description This class implements the class for a worker service object
        *  If a port is specified, a http server will be created to listen for service management requests (start, pause, stop)
        */
        WorkLoop: WinJS.Class.define(function workLoop(dispatcherNames, port) {
            Log.call(Log.l.trace, "WorkerService.WorkLoop.");
            this._status = WorkerService.statusId.stopped;
            this._dispatcher = [];
            if (dispatcherNames && dispatcherNames.length > 0) {
                for (var i = 0; i < dispatcherNames.length; i++) {
                    var newDispatcher = new WorkerService.WorkDispatcher(dispatcherNames[i]);
                    this._dispatcher.push(newDispatcher);
                }
            }
            this._promise = WinJS.Promise.as();
            this._listening = false;
            this._port = port;
            if (port) {
                var requestHandler = this._requestHandler.bind(this);
                this._server = http.createServer(requestHandler);
            }
            Log.ret(Log.l.trace);
        }, {
            _server: null,
            _port: null,
            _listening: false,
            _status: null,
            _dispatcher: [],
            _startDispatcher: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.");
                for (var i = 0; i < this.dispatcherCount; i++) {
                    var curDispatcher = this.getDispatcher(i);
                    if (curDispatcher) {
                        Log.print(Log.l.trace, "dispatcher[" + i + "].name=" + curDispatcher.name + " status=" + curDispatcher.status);
                        if (curDispatcher.status !== WorkerService.statusId.busy &&
                            curDispatcher.status !== WorkerService.statusId.started) {
                            Log.print(Log.l.trace, "Start now!");
                            curDispatcher.start();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            },
            _pauseDispatcher: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.");
                for (var i = 0; i < this.dispatcherCount; i++) {
                    var curDispatcher = this.getDispatcher(i);
                    if (curDispatcher) {
                        Log.print(Log.l.trace, "dispatcher[" + i + "].name=" + curDispatcher.name + " status=" + curDispatcher.status);
                        if (curDispatcher.status !== WorkerService.statusId.paused &&
                            curDispatcher.status !== WorkerService.statusId.stopped) {
                            Log.print(Log.l.trace, "Pause now!");
                            curDispatcher.pause();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            },
            _stopDispatcher: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.");
                for (var i = 0; i < this.dispatcherCount; i++) {
                    var curDispatcher = this.getDispatcher(i);
                    if (curDispatcher) {
                        Log.print(Log.l.trace, "dispatcher[" + i + "].name=" + curDispatcher.name + " status=" + curDispatcher.status);
                        if (curDispatcher.status !== WorkerService.statusId.stopped) {
                            Log.print(Log.l.trace, "stop now!");
                            curDispatcher.stop();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            },
            _checkActivities: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.", "status=" + this.status);
                for (var i = 0; i < this.dispatcherCount; i++) {
                    var curDispatcher = this.getDispatcher(i);
                    if (curDispatcher) {
                        Log.print(Log.l.trace, "dispatcher[" + i + "].name=" + curDispatcher.name + " status=" + curDispatcher.status);
                    }
                }
                Log.ret(Log.l.trace);
            },
            _promise: null,
            _waitTimeMs: 30000,
            _runLoop: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.");
                this._checkActivities();
                var that = this;
                this._promise = WinJS.Promise.timeout(this._waitTimeMs).then(function () {
                    that._runLoop();
                });
                Log.ret(Log.l.trace);
            },

            _requestHandler: function (req, res) {
                var bodyText = "";
                Log.call(Log.l.info, "WorkerService.WorkLoop.", "request received: url=" + req.url);
                res.writeHead(200, { "Content-Type": "text/plain" });
                var paramPos = req.url.indexOf("/", 1);
                var command = null;
                var param = null;
                if (paramPos > 0) {
                    command = req.url.substr(1, paramPos - 1);
                    param = req.url.substr(paramPos + 1);
                } else {
                    command = req.url.substr(1);
                    param = null;
                }
                if (command && command.length > 0) {
                    bodyText += "command: " + command + "\n";
                    if (param && param.length > 0) {
                        bodyText += "param: " + param + "\n";
                    }
                    // check for dispatcher by name or main loop
                    var object;
                    if (param) {
                        object = this.getDispatcherByName(param);
                    } else {
                        object = this;
                    }
                    // do known command
                    if (object) {
                        switch (command) {
                            case "start":
                                object.start();
                                break;
                            case "stop":
                                object.stop();
                                break;
                            case "pause":
                                object.pause();
                                break;
                            default:
                                bodyText += "\n" + WorkerService.description;
                        }
                    } else {
                        bodyText += "\n" + WorkerService.description;
                    }
                }

                bodyText += "\nService status:\n(" + this.status + ")\n\nDispatcher status:";
                for (var i = 0; i < this.dispatcherCount; i++) {
                    var curDispatcher = this.getDispatcher(i);
                    bodyText += "\n---------- [" + i + "] " + curDispatcher.name + " (" + curDispatcher.status + ") ----------";
                    bodyText += "\n" + curDispatcher.info + "\n";
                }

                res.end(bodyText);
                Log.ret(Log.l.info, "request finished!");
            },

            /**
            * @property {WorkerService.statusId} status - the status of the worker service. Independent from the status of called dispatchers
            * @memberof WorkerService.WorkLoop
            * @description Read-only. 
            *  Use this property to retrieve the current status of the worker service object.
            */
            status: {
                get: function () {
                    return this._status;
                }
            },

            /**
            * @property {number} dispatcherCount - the count of loadable dispatchers
            * @memberof WorkerService.WorkLoop
            * @description Read-only. 
            *  Use this property to retrieve the current count of loadable dispatchers of the worker service object.
            */
            dispatcherCount: {
                get: function () {
                    return this._dispatcher && this._dispatcher.length;
                }
            },

            /**
            * @function getDispatcher
            * @param {number} index - The index of the dispatcher object in the dispatcher list of the WorkLoop object
            * @returns {WorkerService.WorkDispatcher} The dispatcher object a given index.
            * @memberof WorkerService.WorkLoop
            * @description Call this function to retrieve a dispatcher object a given index.
            */
            getDispatcher: function (index) {
                return this._dispatcher && this._dispatcher[index];
            },

            /**
            * @function getDispatcherByName
            * @param {number} index - The index of the dispatcher object in the dispatcher list of the WorkLoop object
            * @returns {WorkerService.WorkDispatcher} The dispatcher object a given index.
            * @memberof WorkerService.WorkLoop
            * @description Call this function to retrieve a dispatcher object a given index.
            */
            getDispatcherByName: function (name) {
                if (this._dispatcher) {
                    for (var i = 0; i < this._dispatcher.length; i++) {
                        if (this._dispatcher[i] && this._dispatcher[i].name === name) {
                            return this._dispatcher[i];
                        }
                    }
                }
                return null;
            },

            /**
            * @function getDispatcherName
            * @param {number} index - The index of the dispatcher object in the dispatcher list of the WorkLoop object
            * @returns {string} The dispatcher object a given index.
            * @memberof WorkerService.WorkLoop
            * @description Call this function to retrieve a dispatcher object a given index.
            */
            getDispatcherName: function (index) {
                return this.getDispatcher(index) && this.getDispatcher(index).name;
            },

            /**
            * @function getDispatcher
            * @param {number} index - The index of the dispatcher object in the dispatcher list of the WorkLoop object
            * @returns {WorkerService.WorkDispatcher} The dispatcher object a given index.
            * @memberof WorkerService.WorkLoop
            * @description Call this function to retrieve a dispatcher object a given index.
            */
            getDispatcherStatus: function (index) {
                return this.getDispatcher(index) && this.getDispatcher(index).status;
            },

            /**
            * @function start
            * @memberof WorkerService.WorkLoop
            * @description Call this function to start a WorkLoop object.
            */
            start: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.");
                if (this._status !== WorkerService.statusId.started) {
                    this._status = WorkerService.statusId.started;
                    this._startDispatcher();
                    this._runLoop();
                }
                if (this._server && this._port && !this._listening) {
                    this._listening = true;
                    this._server.listen(this._port);
                }
                Log.ret(Log.l.trace);
            },

            /**
            * @function start
            * @memberof WorkerService.WorkLoop
            * @description Call this function to pause a WorkLoop object.
            */
            pause: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.");
                this._pauseDispatcher();
                this._status = WorkerService.statusId.paused;
                Log.ret(Log.l.trace);
            },

            /**
            * @function start
            * @memberof WorkerService.WorkLoop
            * @description Call this function to stop a WorkLoop object.
            */
            stop: function () {
                Log.call(Log.l.trace, "WorkerService.WorkLoop.");
                this._stopDispatcher();
                this._status = WorkerService.statusId.stopped;
                Log.ret(Log.l.trace);
            }
        })
    });
})();
