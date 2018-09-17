// SQLite capsulated in Promise
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />

/**
 * Use the functions in this namespace to access SQLite databases encapsulated in a WinJS Promise Object.
 * @namespace SQLite
 */

(function () {
    "use strict";


    WinJS.Utilities._require([
        'WinJS/Core/_Global',
        'WinJS/Core/_Base',
        'WinJS/Promise',
        'WinJS/Scheduler'
    ], function xsqlInit(_Global, _Base, Promise, Scheduler) {
        "use strict";

        function schedule(f, arg, priority) {
            Scheduler.schedule(function xsql_callback() {
                f(arg);
            }, priority, null, "ZlibP.unzip");
        }

        /**
         * @function unzip
         * @memberof ZlibP
         * @param {Array} buffer - Byte array to decompress. 
         * @returns {Object} A {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object that returns the response object when it completes.
         * @description Use this function to decompress a buffer.
         */
        function unzip(buffer) {
            var run;
            return new Promise(
                function (c, e, p) {
                    var priority = Scheduler.currentPriority;
                    run = function (that) {
                        if (!_Global.zlib) {
                            schedule(e, "no zlib plugin support", priority);
                        } else if (!_Global.zlib.unzip || typeof _Global.zlib.unzip !== "function") {
                            schedule(e, "no zlib.unzip support", priority);
                        } else {
                            _Global.zlib.unzip(buffer, function (err, result) {
                                if (!err) {
                                    schedule(c, result, priority);
                                } else {
                                    schedule(e, err, priority);
                                }
                            });
                        }
                    }
                    schedule(run, this, priority);
                }
            );
        }

        WinJS.Namespace.define("ZlibP", {
            unzip: unzip
        });
    });

})();