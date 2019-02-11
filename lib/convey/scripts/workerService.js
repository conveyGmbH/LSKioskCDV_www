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
            get: function () {
                return "Usage: /<command> [/<worker-name>]\n\n<command>:\n\nstart - Starts service or worker\nstop -  Stops service or worker\npause - Pauses service or worker\n\n<worker-name>:\n\nName of worker module\n\n";
            }
        },

        DispatcherModule: WinJS.Class.define(function dispatcherModule(filename) {
            var factory = require(filename);
            if (factory) {
                for (var prop in factory) {
                    if (factory.hasOwnProperty(prop)) {
                        this[prop] = factory[prop];
                    }
                }
            }
            this._filename = filename;
            this._factory = factory;
        }, {
                _filename: null,
                _factory: null
            }),
        /**
        * @class WorkDispatcher
        * @memberof WorkerService
        * @param {string} name - The name of the worker loop
        * @description This class implements the class for a worker service object
        */
        WorkDispatcher: WinJS.Class.define(function workDispatcher(name, instance) {
            Log.call(Log.l.trace, "WorkerService.WorkDispatcher.", "name=" + name);
            this._promise = new WinJS.Promise.as();
            this._name = name;
            if (typeof instance === "number") {
                this._instance = instance;
            }
            this._status = WorkerService.statusId.stopped;
            Log.ret(Log.l.trace);
        }, {
            _module: null,
            _name: null,
            _instance: null,
            _info: null,
            _nextStatus: null,

            _promise: null,
            _waitTimeMs: 1000,
            _runLoop: function () {
                var startSuccessCount = (this._module && this._module.successCount) || 0;
                Log.call(Log.l.trace, "WorkerService.WorkDispatcher.", "startSuccessCount=" + startSuccessCount);
                var that = this;
                this._promise.then(function () {
                    if (that.status === WorkerService.statusId.started) {
                        that._status = WorkerService.statusId.busy;
                        var ret = that.activity();
                        if (ret && typeof ret.then === "function") {
                            return ret;
                        }
                    }
                    return WinJS.Promise.as();
                }).then(function () {
                    Log.print(Log.l.trace, "status=" + that.status + " nextStatus=" + that._nextStatus);
                    if (that._nextStatus) {
                        Log.print(Log.l.info, "now switch to status=" + that._nextStatus);
                        that._status = that._nextStatus;
                        that._nextStatus = null;
                        if (that._status === WorkerService.statusId.stopped) {
                            return that.dispose();
                        }
                    } else if (that._status === WorkerService.statusId.busy) {
                        var waitTimeMs = that.waitTimeMs;
                        var returnedSuccessCount = (that._module && that._module.successCount) || 0;
                        that._status = WorkerService.statusId.started;
                        if (returnedSuccessCount > startSuccessCount) {
                            Log.print(Log.l.trace, "returnedSuccessCount=" + returnedSuccessCount + " so continue immediately");
                            waitTimeMs = 0;
                        }
                        Log.print(Log.l.trace, "waitTimeMs=" + waitTimeMs);
                        return WinJS.Promise.timeout(waitTimeMs).then(function () {
                            that._runLoop();
                        });
                    }
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
            },


            name: {
                get: function () {
                    return this._name;
                }
            },

            instance: {
                get: function () {
                    return this._instance;
                }
            },

            waitTimeMs: {
                get: function () {
                    if (this._module && this._module.waitTimeMs) {
                        return this._module.waitTimeMs;
                    }
                    return this._waitTimeMs;
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
            activity: function () {
                var ret;
                if (this._activity && this._module) {
                    ret = this._activity.call(this._module);
                } else {
                    ret = this._defaultActivity;
                }
                return ret;
            },
            _dispose: null,
            _defaultDispose: function () {
                Log.Print(Log.l.trace, "use WorkerService.WorkLoop._defaultDispose");
                return new WinJS.Promise.as();
            },
            dispose: function () {
                var ret;
                if (this._dispose && this._module) {
                    ret = this._dispose.call(this._module);
                } else {
                    ret = this._defaultDispose;
                }
                this._module = null;
                return ret;
            },

            info: {
                get: function () {
                    return this._info && this._module && this._info.call(this._module) || "";
                }
            },

            start: function () {
                Log.call(Log.l.trace, "WorkerService.WorkDispatcher.");
                var that = this;
                this._promise.then(function () {
                    if (that.status === WorkerService.statusId.stopped) {
                        var filename = "../../../worker/" + that.name + "/" + that.name + ".js";
                        that._module = new WorkerService.DispatcherModule(filename);
                        if (typeof that._module.info === "function") {
                            that._info = that._module.info.bind(that._module);;
                        }
                        if (typeof that._module.activity === "function") {
                            that._activity = that._module.activity.bind(that._module);
                        }
                        if (typeof that._module.dispose === "function") {
                            that._dispose = that._module.dispose.bind(that._module);
                        }
                        if (typeof that._module.startup === "function") {
                            var ret = that._module.startup.call(that._module);
                            if (ret && typeof ret.then === "function") {
                                return ret;
                            }
                        }
                    }
                    return WinJS.Promise.as();
                }).then(function () {
                    if (that._status !== WorkerService.statusId.started) {
                        that._status = WorkerService.statusId.started;
                        WinJS.Promise.timeout(0).then(function() {
                            that._runLoop();
                        });
                    }
                });
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
            AppData.persistentStatesDefaults = copyMissingMembersByValue(AppData.persistentStatesDefaults, AppData._persistentStatesDefaults);
            AppData._persistentStates = copyMissingMembersByValue(AppData._persistentStates, AppData.persistentStatesDefaults);

            this._status = WorkerService.statusId.stopped;
            this._dispatcher = [];
            if (dispatcherNames && dispatcherNames.length > 0) {
                for (var i = 0; i < dispatcherNames.length; i++) {
                    var count = 1;
                    var dispatcherName = null;
                    var dispatcher = dispatcherNames[i];
                    if (dispatcher) {
                        if (typeof dispatcher === "string") {
                            dispatcherName = dispatcher;
                        } else if (typeof dispatcher === "object" && typeof dispatcher.name === "string") {
                            dispatcherName = dispatcher.name;
                            if (typeof dispatcher.count === "number" && dispatcher.count > 1) {
                                count = dispatcher.count;
                                if (count > 1000) {
                                    count = 1000;
                                }
                            }
                        }
                    }
                    if (dispatcherName) {
                        for (var j = 0; j < count; j++) {
                            var newDispatcher = new WorkerService.WorkDispatcher(dispatcherName, j);
                            this._dispatcher.push(newDispatcher);
                        }
                    }
                }
            }
            this._promise = new WinJS.Promise.as();
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
                var i;
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
                    var objects = [];
                    if (param) {
                        var commaPos = param.indexOf("/");
                        var name;
                        var instance;
                        if (commaPos > 0) {
                            name = param.substr(0, commaPos);
                            instance = parseInt(param.substr(commaPos + 1));
                        } else {
                            name = param;
                        }
                        objects = this.getDispatchersByName(name, instance);
                    } else {
                        objects[0] = this;
                    }
                    // do known command
                    if (objects.length > 0) {
                        for (i = 0; i < objects.length; i++) {
                            var object = objects[i];
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
                        }
                    } else {
                        bodyText += "\n" + WorkerService.description;
                    }
                }

                bodyText += "\nService status:\n(" + this.status + ")\n\nDispatcher status:";
                for (i = 0; i < this.dispatcherCount; i++) {
                    var curDispatcher = this.getDispatcher(i);
                    var curInstance = curDispatcher.instance;
                    bodyText += "\n---------- [" + i + "] " + curDispatcher.name;
                    if (typeof curInstance === "number") {
                        bodyText += "[" + curInstance + "]";
                    }
                    bodyText += " (" + curDispatcher.status + ") ----------";
                    bodyText += "\n" + curDispatcher.info + "\n" + " waitTimeMs:" + curDispatcher.waitTimeMs + "\n";
                }
                bodyText += "\n--\nrunning on node.js version " + process.versions.node + "\n";
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
            * @function getDispatchersByName
            * @param {number} index - The index of the dispatcher object in the dispatcher list of the WorkLoop object
            * @returns {WorkerService.WorkDispatcher} The dispatcher object a given index.
            * @memberof WorkerService.WorkLoop
            * @description Call this function to retrieve a dispatcher object a given index.
            */
            getDispatchersByName: function (name, instance) {
                var ret = [];
                if (this._dispatcher) {
                    for (var i = 0; i < this._dispatcher.length; i++) {
                        if (this._dispatcher[i] && this._dispatcher[i].name === name &&
                            (typeof instance === "undefined" || this._dispatcher[i].instance === instance)) {
                            ret.push(this._dispatcher[i]);
                        }
                    }
                }
                return ret;
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