// implements logging feature
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/WinJS/scripts/ui.js" />

(function() {
    "use strict";

    WinJS.Namespace.define("Log", {
        dummy: function () {
        },
        targets: {
            none: 0,
            console: 1,
            file: 2
        },
        l: {
            none: 0,
            error: 1,
            warn: 2,
            info: 3,
            trace: 4,
            u1: 5,
            u2: 6
        }
    });
    WinJS.Namespace.define("Log", {

        // define a class for the logging
        Logging: WinJS.Class.define(
            // Define the constructor function for the ListViewClass.
            function Logging() {
                this._names = new Array();
                this._groups = new Array();
                Log._logging = this;
                if (console && typeof console.clear === "function") {
                    console.clear();
                }
            }, {
                _names: null,
                _groups: null,
                getTimeString: function () {
                    var currentTime = new Date();
                    var ms = currentTime.getMilliseconds();
                    var str = currentTime.toLocaleString();
                    if (ms < 10) {
                        str += ".00";
                    } else if (ms < 100) {
                        str += ".0";
                    } else {
                        str += ".";
                    }
                    str += ms.toString();
                    return str;
                },
                getSourceInfo: function() {
                    function getErrorObject() {
                        try {
                            throw Error("");
                        } catch (error) {
                            return error;
                        }
                    }
                    var err = getErrorObject(),
                        caller;
                    if (typeof $ !== "undefined" && $.browser && $.browser.mozilla) {
                        caller = err.stack.split("\n")[3];
                    } else if (typeof window !== "undefined" &&
                                window.navigator && window.navigator.appVersion &&
                               (window.navigator.appVersion.indexOf("Trident") >= 0 ||
                                window.navigator.appVersion.indexOf("Chrome") >= 0)) {
                        caller = err.stack.split("\n")[4];
                    } else if (typeof window !== "undefined" &&
                               window.navigator && window.navigator.appVersion &&
                               window.navigator.appVersion.indexOf("AppleWebKit") >= 0) {
                        caller = err.stack.split("\n")[3];
                    } else {
                        caller = err.stack.split("\n")[5];
                    }
                    var index = caller.indexOf("at ");
                    var str;
                    if (index >= 0) {
                        str = caller.substr(index + 3, caller.indexOf(" ", index + 3) - (index + 3));
                        index = str.lastIndexOf(".");
                        if (index >= 0) {
                            str = str.substr(index + 1, str.length - (index + 1));
                        }
                    } else {
                        str = "";
                    }
                    var name = str;

                    index = caller.indexOf(".js");
                    str = caller.substr(0, index + 3);
                    index = str.lastIndexOf("/");
                    str = str.substr(index + 1, str.length);

                    var file = str;
                    if (typeof $ !== "undefined" && $.browser && $.browser.mozilla) {
                        str = caller;
                    } else {
                        index = caller.lastIndexOf(":");
                        str = caller.substr(0, index);
                    }
                    index = str.lastIndexOf(":");
                    var line = str.substr(index + 1, str.length);
                    return {
                        name: name,
                        file: file,
                        line: line
                    };
                },
                push: function (logLevel, name, info, message) {
                    var str = "";
                    if (!Log._group && this._names.length > 0) {
                        for (var i = 0; i < this._names.length; i++) {
                            str += "  ";
                        }
                    }
                    if (info.name) {
                        str += name + info.name;
                    }
                    if (Log._group) {
                        var hasGroup;
                        if (logLevel <= Log._level && typeof console.group === "function") {
                            console.group(str);
                            hasGroup = true;
                        } else {
                            hasGroup = false;
                        }
                        this._groups.push(hasGroup);
                    }
                    this._names.push(str + "\t");
                    this.out(logLevel, info, "called: " + message);
                },
                pop: function (logLevel, info, message) {
                    this.out(logLevel, info, "returned:" + message);
                    if (Log._group) {
                        if (this._names.length > 0 && this._groups[this._names.length-1] && typeof console.groupEnd === "function") {
                            console.groupEnd();
                        }
                        this._groups.pop();
                    }
                    this._names.pop();
                },
                out: function (logLevel, info, message) {
                    if (logLevel > Log._level) {
                        return;
                    }
                    if (Log._target === Log.targets.console) {
                        var str = "[" + this.getTimeString() + "] ";
                        var fileNameAdd = "                                ";
                        if (info.file) {
                            var fileString = info.file + ": " + info.line;
                            str += fileString;
                            if (fileString.length < 32) {
                                str += fileNameAdd.substr(fileString.length);
                            }
                        } else {
                            str += fileNameAdd;
                        }
                        if (this._names && this._names.length > 0) {
                            str += this._names[this._names.length - 1];
                        }
                        str += message;
                        if (console) {
                            if (logLevel === Log.l.error && typeof console.error === "function") {
                                console.error("*" + str);
                            } else if (logLevel === Log.l.warn && typeof console.warn === "function") {
                                console.warn("!" + str);
                            } else if (logLevel === Log.l.info && typeof console.info === "function") {
                                console.info("^" + str);
                            } else {
                                console.log(" " + str);
                            }
                        }
                    }
                }
            }
        ),
        _call: function (logLevel, functionName, message) {
            if ((logLevel > Log._level) && Log._noStack) {
                return;
            }
            if (!Log._logging) {
                return;
            }
            var info = Log._logging.getSourceInfo();
            Log._logging.push(logLevel, functionName || "", info, message || "");{}
        },
        _print: function (logLevel, message) {
            if (logLevel > Log._level) {
                return;
            }
            if (!Log._logging) {
                return;
            }
            var info = Log._logging.getSourceInfo();
            Log._logging.out(logLevel, info, message || "");
        },
        _ret: function (logLevel, message) {
            if ((logLevel > Log._level) && Log._noStack) {
                return;
            }
            if (!Log._logging) {
                return;
            }
            var info = Log._logging.getSourceInfo();
            Log._logging.pop(logLevel, info, message || "");
        },
        _defAction: function(message, tag, type) {
            var spaceR = /\s+/g;
            var typeR = /^(error|warn|info|log)$/;

            type = (type === "warning") ? "warn" : type;

            function format(message, tag, type) {
                var m = message;
                if (typeof (m) === "function") { m = m(); }
                return ((type && typeR.test(type)) ? ("") : (type ? (type + ": ") : "")) +
                    (tag ? tag.replace(spaceR, ":") + ": " : "") +
                    m;
            }
            function logLevel(type) {
                if (Log.l[type]) {
                    return Log.l[type];
                } else {
                    return Log.l.trace;
                }
            }
            var level = logLevel(type);
            if (Log._level >= level) {
                var m = format(message, tag, type);
                Log.print(level, m);
            }
        },
        disable: function() {
            if (Log._logWinJS) {
                WinJS.Utilities.stopLog();
                Log._logWinJS = false;
            }
            Log.call = Log.dummy;
            Log.print = Log.dummy;
            Log.ret = Log.dummy;
            Log._logging = null;
            return null;
        },
        enable: function (settings) {
            var ret;
            Log.call = Log._call;
            Log.print = Log._print;
            Log.ret = Log._ret;
            if (settings.target) {
                Log._target = settings.target;
            }
            Log._level = Log.l.info;
            if (Log._logging) {
                ret = Log._logging;
                Log.print(Log.l.info, "Logging changed");
            } else {
                ret = new Log.Logging();
                Log.print(Log.l.info, "Logging started WinJS v." + WinJS.Utilities._version + " on platform: " + navigator.appVersion);
            }
            if (settings.group === true) {
                Log._group = true;
            } else {
                Log._group = false;
            }
            Log._level = settings.level;
            if (settings.noStack) {
                Log._noStack = true;
            } else {
                Log._noStack = false;
            }
            if (settings.logWinJS) {
                var options = {
                    type: "",
                    action: Log._defAction
                }
                if (Log._level >= Log.l.error) {
                    options.type = "error";
                    if (Log._level >= Log.l.warn) {
                        options.type += " warn";
                        if (Log._level >= Log.l.info) {
                            options.type += " info";
                            if (Log._level >= Log.l.trace) {
                                options.type += " perf listviewprofiler flipviewdebug itemcontainerprofiler pivotprofiler hubprofiler navbarcontainerprofiler";
                                if (Log._level >= Log.l.u2) {
                                    options.type += " log";
                                }
                            }
                        }
                    }
                }
                WinJS.Utilities.startLog(options);
                Log._logWinJS = true;
            } else {
                WinJS.Utilities.stopLog();
                Log._logWinJS = false;
            }
            Log.print(Log.l.error, "Logging errors");
            Log.print(Log.l.warn, "Logging warnings");
            Log.print(Log.l.info, "Logging infos");
            Log.print(Log.l.trace, "Logging trace");
            Log.print(Log.l.u1, "Logging user1");
            Log.print(Log.l.u2, "Logging user2");
            return ret;
        },
        init: function (settings) {
            if (settings && settings.level &&
                settings.level !== Log.l.none) {
                return Log.enable(settings);
            } else {
                return Log.disable();
            }
        },
        call: Log.dummy,
        print: Log.dummy,
        ret: Log.dummy,
        _logging: null,
        _target: Log.targets.none,
        _level: Log.l.none,
        _group: false,
        _noStack: false,
        _logWinJS: false
    });

})();

