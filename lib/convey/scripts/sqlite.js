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
            }, priority, null, "SQLite.xsql");
        }

        function lock(o) {
            var isLocked = false;
            o.db.transaction(function (tx) {
                var query = "SELECT * FROM \"ConnectionProperties\" WHERE \"Key\" IN (?,?)";
                var prop = ["connectionType", "connectionBusy"];
                tx.executeSql(query, prop, function (tx2, res2) {
                    Log.print(Log.l.info, "lock: result count=" + res2.rows.length);
                    var connectionType = null;
                    var connectionBusy = null;
                    for (var i = 0; i < res2.rows.length; i++) {
                        var row = res2.rows.item(i);
                        if (row) {
                            switch (row.Key) {
                                case "connectionType":
                                    connectionType = row.Value;
                                    break;
                                case "connectionBusy":
                                    connectionBusy = row.Value;
                                    break;
                            }
                        }
                    }
                    Log.print(Log.l.info, "lock: connectionType=" + connectionType + " connectionBusy=" + connectionBusy);
                    if (connectionType !== o.connectionType && connectionBusy > 0) {
                        isLocked = true;
                    } else {
                        var stmt = "UPDATE \"ConnectionProperties\" SET \"Value\" = ? WHERE \"Key\" = ?";
                        var values;
                        if (connectionType !== o.connectionType) {
                            values = [o.connectionType, "connectionType"];
                            Log.print(Log.l.info, "lock: " + [stmt, values]);
                            tx2.executeSql(stmt, values, function (tx3, res3) {
                                Log.print(Log.l.info, "lock: connectionType=" + connectionType + " success!");
                            }, function (tx3, err) {
                                Log.print(Log.l.error, "lock: UPDATE connectionType error!");
                                schedule(o.e, err, o.priority);
                            });
                        }
                        connectionBusy++;
                        values = [connectionBusy, "connectionBusy"];
                        Log.print(Log.l.info, "lock: " + [stmt, values]);
                        tx2.executeSql(stmt, values, function (tx3, res3) {
                            Log.print(Log.l.info, "lock: connectionBusy=" + connectionBusy + " success!");
                        }, function (tx3, err) {
                            Log.print(Log.l.error, "lock: UPDATE connectionBusy error!");
                            schedule(o.e, err, o.priority);
                        });
                    }
                }, function (tx2, err) {
                    Log.print(Log.l.error, "lock: SELECT ConnectionProperties error!");
                    schedule(o.e, err, o.priority);
                });
            }, function (err) {
                Log.print(Log.l.error, "lock: ConnectionProperties transaction error!");
                schedule(o.e, err, o.priority);
            }, function (res) {
                Log.print(Log.l.info, "lock: isLocked=" + isLocked);
                if (isLocked) {
                    schedule(lock, o, o.priority);
                } else {
                    Log.print(Log.l.info, "lock: completed!");
                    schedule(o.c, o.res, o.priority);
                }
            });
        }

        function unlock(o) {
            o.db.transaction(function (tx) {
                var query = "SELECT * FROM \"ConnectionProperties\" WHERE \"Key\" IN (?,?)";
                var prop = ["connectionType", "connectionBusy"];
                tx.executeSql(query, prop, function (tx2, res2) {
                    Log.print(Log.l.info, "unlock: result count=" + res2.rows.length);
                    var connectionType = null;
                    var connectionBusy = null;
                    for (var i = 0; i < res2.rows.length; i++) {
                        var row = res2.rows.item(i);
                        if (row) {
                            switch (row.Key) {
                                case "connectionType":
                                    connectionType = row.Value;
                                    break;
                                case "connectionBusy":
                                    connectionBusy = row.Value;
                                    break;
                            }
                        }
                    }
                    Log.print(Log.l.info, "unlock: connectionType=" + connectionType + " connectionBusy=" + connectionBusy);
                    if (connectionType === o.connectionType && connectionBusy > 0) {
                        var stmt = "UPDATE \"ConnectionProperties\" SET \"Value\" = ? WHERE \"Key\" = ?";
                        connectionBusy--;
                        var values = [connectionBusy, "connectionBusy"];
                        Log.print(Log.l.info, "unlock: " + [stmt, values]);
                        tx2.executeSql(stmt, values, function (tx3, res3) {
                            Log.print(Log.l.info, "unlock: connectionBusy=" + connectionBusy + " success!");
                        }, function (tx3, err) {
                            Log.print(Log.l.error, "unlock: UPDATE connectionBusy error!");
                            schedule(o.e, err, o.priority);
                        });
                    }
                }, function (tx2, err) {
                    schedule(o.e, err, o.priority);
                });
            }, function (err) {
                Log.print(Log.l.error, "unlock: ConnectionProperties transaction error!");
                schedule(o.e, err, o.priority);
            }, function (res) {
                Log.print(Log.l.info, "unlock: completed!");
                schedule(o.c, o.res, o.priority);
            });
        }

        /**
         * @function open
         * @memberof SQLite
         * @param {Object} options - SQLite database connection options. 
         * @returns {Object} A {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object that returns the response object when it completes.
         * @description Use this function to wrap calls to {@link https://github.com/litehelpers/Cordova-sqlite-storage openDatabase} in a promise. This function openes a SQLite database access handle object.
         */
        function open(options) {
            /// <signature helpKeyword="SQLite.open">
            /// <summary locid="SQLite.open">
            /// Wraps calls to openDatabase in a promise.
            /// </summary>
            /// <param name="options" type="Object" locid="SQLite.xsql_p:options">
            /// The db that is applied to the executeSql.
            /// </param>
            /// <returns type="WinJS.Promise" locid="SQLite.open_returnValue">
            /// A promise that returns the response object when it completes.
            /// </returns>
            /// </signature>
            var run;
            return new Promise(
                function (c, e, p) {
                    /// <returns value="c(response)" locid="SQLite.xsql.constructor._returnValue" />
                    var priority = Scheduler.currentPriority;
                    run = function (that) {
                        var db;
                        if (!window.sqlitePlugin) {
                            var err = { status: 501, statusText: "no SQLite plugin support" }
                            schedule(e, err, priority);
                        } else {
                            db = window.sqlitePlugin.openDatabase(options, function () {
                                schedule(c, db, priority);
                            }, function (err) {
                                schedule(e, err, priority);
                            });
                        }
                    }
                    schedule(run, this, priority);
                }
            );
        }

        /**
         * @function xsql
         * @memberof SQLite
         * @param {Object} db - SQLite database connection handle. 
         * @param {string} stmt - SQL statement to execute. 
         * @param {Array} values - An array of values to bind to the current SQL statement. 
         * @param {number} connectionType - Connection type identifier. 
         * @param {boolean} bNoLock - The current statement need not to be blocked by semaphore. 
         * @returns {Object} A {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object that returns the response object when it completes.
         * @description Use this function to wrap calls to {@link https://github.com/litehelpers/Cordova-sqlite-storage executeSql} in a promise.
         *  This function executes an SQL statement with the given database connection handle.
         *  By providing a connectionType value the execution of statements of concurring connections can be blocked and executed sequentially.
         *  The current statement is delayed if a statemant of another connection type is already executing. 
         *  Calls of the same connection type like the currently executed connection type do increase the lock count.
         */
        function xsql(db, stmt, values, connectionType, bNoLock) {
            /// <signature helpKeyword="SQLite.xsql">
            /// <summary locid="SQLite.xsql">
            /// Wraps calls to executeSql in a promise.
            /// </summary>
            /// <param name="db" type="Object" locid="SQLite.xsql_p:db">
            /// The db that is applied to the executeSql.
            /// </param>
            /// <returns type="WinJS.Promise" locid="SQLite.xsql_returnValue">
            /// A promise that returns the response object when it completes.
            /// </returns>
            /// </signature>
            var run;
            return new Promise(
                function (c, e, p) {
                    /// <returns value="c(response)" locid="SQLite.xsql.constructor._returnValue" />
                    var priority = Scheduler.currentPriority;
                    var isDml;
                    if (bNoLock) {
                        isDml = false;
                    } else {
                        var verb = stmt.substr(0, 6);
                        switch (verb) {
                            case "INSERT":
                            case "UPDATE":
                            case "DELETE":
                                isDml = true;
                                break;
                            default:
                                isDml = false;
                        }
                        Log.print(Log.l.trace, "xsql: isDml=" + isDml);
                    }
                    run = function (that) {
                        db.executeSql(stmt, values, function (res) {
                            if (isDml) {
                                unlock({
                                    db: db,
                                    c: c,
                                    e: e,
                                    p: p,
                                    priority: priority,
                                    connectionType: connectionType,
                                    res: res
                                });
                            } else {
                                schedule(c, res, priority);
                            }
                        }, function (err) {
                            if (isDml) {
                                unlock({
                                    db: db,
                                    c: e,
                                    e: e,
                                    p: p,
                                    priority: priority,
                                    connectionType: connectionType,
                                    res: err
                                });
                            } else {
                                schedule(e, err, priority);
                            }
                        });
                    }
                    if (isDml) {
                        if (!connectionType) {
                            connectionType = 0;
                        }
                        Log.print(Log.l.info, "QSLite.xsql: use lock for " + stmt);
                        lock({
                            db: db,
                            c: run,
                            e: e,
                            p: p,
                            priority: priority,
                            connectionType: connectionType,
                            res: this
                        });
                    } else {
                        schedule(run, this, priority);
                    }
                }
            );
        }

        /**
         * @function tx
         * @memberof SQLite
         * @param {Object} db - SQLite database connection handle. 
         * @param {function} work - SQLite function to execute. 
         * @returns {Object} A {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object that returns the response object when it completes.
         * @description Use this function to wrap calls to a {@link https://github.com/litehelpers/Cordova-sqlite-storage SQLite transaction handle} in a promise.
         *  This function executes a given SQLite function in a transaction.
         */
        function tx(db, work) {
            /// <signature helpKeyword="SQLite.tx">
            /// <summary locid="SQLite.tx">
            /// Wraps calls to transaction in a promise.
            /// </summary>
            /// <param name="db" type="Object" locid="SQLite.tx_p:db">
            /// The db that is applied to the transaction.
            /// </param>
            /// <returns type="WinJS.Promise" locid="SQLite.tx">
            /// A promise that returns the response object when it completes.
            /// </returns>
            /// </signature>
            var run;
            return new Promise(
                function (c, e, p) {
                    /// <returns value="c(response)" locid="SQLite.tx.constructor._returnValue" />
                    var priority = Scheduler.currentPriority;
                    run = function (that) {
                        db.transaction(function (tx) {
                            work(tx);
                            schedule(p, tx, priority);
                        }, function (err) {
                            schedule(e, err, priority);
                        }, function (res) {
                            schedule(c, res, priority);
                        });
                    }
                    schedule(run, this, priority);
                }
            );
        }

        WinJS.Namespace.define("SQLite", {
            open: open,
            xsql: xsql,
            tx: tx
        });
    });

})();