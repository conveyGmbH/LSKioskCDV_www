// database initialization 
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/sqlite.js" />
/// <reference path="../../../lib/convey/scripts/strings.js" />
/// <reference path="../../../lib/convey/scripts/appbar.js" />
/// <reference path="../../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../../lib/convey/scripts/replService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("AppData", {
        /**
         * @class configViewData 
         * @memberof AppData
         * @param {string} relationName - Name of a database table.
         * @description This class is used by the framework to retrieve and store configuration metadata for the application 
         */
        configViewData: WinJS.Class.define(function configViewData(relationName) {
            Log.call(Log.l.trace, "AppData.", "relationName=" + relationName);
            this._relationName = relationName;
            Log.ret(Log.l.trace);
        }, {
            _relationName: null,
            _attribSpecs: null,
            relationName: {
                get: function() {
                    return this._relationName;
                }
            },
            /**
             * @property {Object[]} attribSpecs - Array of attribute spec data records.
             * @memberof AppData.configViewData
             * @description Read-only. Retrieves the attribute specs of the current database relation.
             */
            attribSpecs: {
                get: function() {
                    return this._attribSpecs;
                }
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "AppData.configViewData.");
                var url = null;
                if (response && response.d && response.d.__next) {
                    var pos = response.d.__next.indexOf("://");
                    if (pos > 0) {
                        var pos2 = response.d.__next.substr(pos + 3).indexOf("/");
                        if (pos2 > 0) {
                            var pos3 = response.d.__next.substr(pos + 3 + pos2 + 1).indexOf("/");
                            if (pos3 > 0) {
                                url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath +
                                    response.d.__next.substr(pos + 3 + pos2 + 1 + pos3);
                            }
                        }
                    }
                    Log.ret(Log.l.trace, "next=" + url);
                } else {
                    Log.ret(Log.l.trace, "finished");
                }
                return url;
            },
            fetchNextAttribSpecs: function (that, results, next, followFunction, complete, error, param) {
                Log.call(Log.l.trace, "AppData.configViewData.", "next=" + next);
                var user = AppData.getOnlineLogin();
                var password = AppData.getOnlinePassword();
                var options = {
                    type: "GET",
                    url: next,
                    user: user,
                    password: password,
                    customRequestInitializer: function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(user + ":" + password)
                    }
                };
                Log.print(Log.l.info, "calling xhr method=GET url=" + next);
                var ret = WinJS.xhr(options).then(function (response) {
                    Log.print(Log.l.trace, "success!");
                    try {
                        var obj = JSON.parse(response.responseText);
                        if (obj && obj.d) {
                            results = results.concat(obj.d.results);
                            var next = that.getNextUrl(obj);
                            if (next) {
                                return that.fetchNextAttribSpecs(that, results, next, followFunction, complete, error, param);
                            } else {
                                that._attribSpecs = results;
                                followFunction(that, complete, error, param);
                            }
                        } else {
                            var err = { status: 404, statusText: "no data found" };
                            error(err);
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                        error({ status: 500, statusText: "data parse error " + (exception && exception.message) });
                    }
                    return WinJS.Promise.as();
                }, function(errorResponse) {
                    Log.print(Log.l.error, "AttribSpec error: " + AppData.getErrorMsgFromResponse(errorResponse));
                    error(errorResponse);
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            fetchAllAttribSpecs: function(that, obj, followFunction, complete, error, param) {
                Log.call(Log.l.trace, "AppData.configViewData.", "");
                var retNext;
                var next = that.getNextUrl(obj);
                if (next) {
                    retNext = that.fetchNextAttribSpecs(that, obj.d.results, next, followFunction, complete, error, param);
                } else {
                    if (obj && obj.d) {
                        that._attribSpecs = obj.d.results;
                    }
                    followFunction(that, complete, error, param);
                    retNext = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return retNext;
            },
            getAttribSpecs: function(that, followFunction, complete, error, param) {
                Log.call(Log.l.trace, "AppData.configViewData.", "relationName=" + that.relationName);
                var ret;
                var loadAttribSpecs = function() {
                    var url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath;
                    url += "/AttribSpecExtView?$filter=(RelationName%20eq%20'" + that.relationName + "ExtView')&$format=json&$orderby=AttributeIDX";
                    var user = AppData.getOnlineLogin();
                    var password = AppData.getOnlinePassword();
                    var options = {
                        type: "GET",
                        url: url,
                        user: user,
                        password: password,
                        customRequestInitializer: function (req) {
                            if (typeof req.withCredentials !== "undefined") {
                                req.withCredentials = true;
                            }
                        },
                        headers: {
                            "Authorization": "Basic " + btoa(user + ":" + password)
                        }
                    };
                    Log.print(Log.l.info, "calling xhr method=GET url=" + url);
                    ret = WinJS.xhr(options).then(function (responseAttribSpec) {
                        Log.print(Log.l.trace, "AttribSpecExtView success!");
                        try {
                            var json = JSON.parse(responseAttribSpec.responseText);
                            return that.fetchAllAttribSpecs(that, json, followFunction, complete, error, param);
                            //if (json && json.d) {
                            //    that._attribSpecs = json.d.results;
                            //}
                            //return followFunction(that, complete, error, param);
                        } catch (exception) {
                            Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                            error({ status: 500, statusText: "AttribSpecExtView parse error " + (exception && exception.message) });
                            return WinJS.Promise.as();
                        }
                    }, function(errorResponse) {
                        Log.print(Log.l.error, "AttribSpecExtView error: " + AppData.getErrorMsgFromResponse(errorResponse));
                        error(errorResponse);
                    });
                };
                if (AppData._dbInit && AppData._dbInit.configLoaded) {
                    ret = AppData._dbInit.getAttribSpecs(AppData._dbInit, that.relationName, function(results) {
                        if (results.length === 0) {
                            return loadAttribSpecs();
                        } else {
                            that._attribSpecs = results;
                            return followFunction(that, complete, error, param);
                        }
                    }, function(err) {
                        error(err);
                    });
                } else {
                    ret = loadAttribSpecs();
                }
                Log.ret(Log.l.trace);
                return ret;
            },
            extractRestriction: function(that, complete, error, restriction) {
                var ret;
                Log.call(Log.l.trace, "AppData.configViewData.", "relationName=" + that.relationName);
                if (!that.attribSpecs) {
                    ret = that.getAttribSpecs(that, that.extractRestriction, complete, error, restriction);
                } else {
                    ret = new WinJS.Promise.as().then(function() {
                        if (that.attribSpecs && that.attribSpecs.length > 0) {
                            var filterString = "";
                            if (restriction) {
                                for (var i = 0; i < that.attribSpecs.length; i++) {
                                    if (that.attribSpecs[i].Name) {
                                        var viewAttributeName = that.attribSpecs[i].Name;
                                        if (typeof restriction[viewAttributeName] !== "undefined" &&
                                            !(restriction[viewAttributeName] === null) &&
                                            !(typeof restriction[viewAttributeName] === "string" && restriction[viewAttributeName].length === 0)) {
                                            Log.print(Log.l.trace, viewAttributeName + "=" + restriction[viewAttributeName]);
                                            if (filterString.length > 0) {
                                                filterString += "%20and%20";
                                            }
                                            if (that.attribSpecs[i].AttribTypeID === 3) {
                                                // string attribute: generate <attribute> = '<restriction>' query
                                                filterString += viewAttributeName + "%20eq%20'" + restriction[viewAttributeName] + "'";
                                            } else if (that.attribSpecs[i].AttribTypeID === 8) {
                                                // for timestamp as atttribute type
                                                var date = new Date(restriction[viewAttributeName]);
                                                var day = date.getDate();
                                                var month = date.getMonth() + 1;
                                                var year = date.getFullYear();
                                                // date attribute: generate year(<attribute>) = year(restriction) and month(<attribute>) = month(restriction) and ... query
                                                filterString +=
                                                    year.toString() + "%20eq%20year(" + viewAttributeName + ")%20and%20" +
                                                    month.toString() + "%20eq%20month(" + viewAttributeName + ")%20and%20" +
                                                    day.toString() + "%20eq%20day(" + viewAttributeName + ")";
                                            } else {
                                                // other attribute: generate <attribute> = <restriction> query
                                                filterString += viewAttributeName + "%20eq%20" + restriction[viewAttributeName];
                                            }
                                        }
                                    }
                                }
                            }
                            Log.print(Log.l.trace, filterString);
                            complete(filterString);
                        } else {
                            Log.print(Log.l.error, "no data in AttribSpecs");
                            var err = { status: 500, statusText: "no data in AttribSpecs" };
                            error(err);
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            },

            fetchNext: function(that, results, next, complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.configViewData.", "next=" + next);
                var user = AppData.getOnlineLogin();
                var password = AppData.getOnlinePassword();
                var options = {
                    type: "GET",
                    url: next,
                    user: user,
                    password: password,
                    customRequestInitializer: function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(user + ":" + password)
                    }
                };
                Log.print(Log.l.info, "calling xhr method=GET url=" + next);
                var ret = WinJS.xhr(options).then(function (response) {
                    Log.print(Log.l.trace, "success!");
                    try {
                        var obj = JSON.parse(response.responseText);
                        if (obj && obj.d) {
                            results = results.concat(obj.d.results);
                            var next = that.getNextUrl(obj);
                            if (next) {
                                return that.fetchNext(that, results, next, complete, error, recordId);
                            } else {
                                obj.d.results = results;
                                complete(obj);
                            }
                        } else {
                            var err = { status: 404, statusText: "no data found" };
                            error(err);
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                        error({ status: 500, statusText: "data parse error " + (exception && exception.message) });
                    }
                    return WinJS.Promise.as();
                }, function(errorResponse) {
                    Log.print(Log.l.error, "error: " + AppData.getErrorMsgFromResponse(errorResponse));
                    error(errorResponse);
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            fetchAll: function(that, obj, complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.configViewData.", "");
                var retNext;
                var next = that.getNextUrl(obj);
                if (next) {
                    retNext = that.fetchNext(that, obj.d.results, next, complete, error, recordId);
                } else {
                    complete(obj);
                    retNext = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return retNext;
            },
            selectAll: function(complete, error, restrictions, viewOptions) {
                Log.call(Log.l.trace, "AppData.configViewData.", "relationName=" + this.relationName);
                var url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath;
                url += "/" + this.relationName + "ExtView?$format=json";
                Log.print(Log.l.trace, "calling selectAll: relationName=" + this.relationName + "ExtView");
                var that = this;
                var ret = this.extractRestriction(this, function(filterString) {
                    if (filterString && filterString.length > 0) {
                        url += "&$filter=(" + filterString + ")";
                    }
                    if (viewOptions) {
                        // select all lines with order by
                        var orderBy = "&$orderby=";
                        if (viewOptions.ordered) {
                            if (viewOptions.orderAttribute) {
                                orderBy += viewOptions.orderAttribute;
                            } else {
                                orderBy += that.relationName + "VIEWID";
                            }
                            if (viewOptions.desc) {
                                orderBy += "%20desc";
                            }
                        }
                        url += orderBy;
                    }
                    var user = AppData.getOnlineLogin();
                    var password = AppData.getOnlinePassword();
                    var options = {
                        type: "GET",
                        url: url,
                        user: user,
                        password: password,
                        customRequestInitializer: function (req) {
                            if (typeof req.withCredentials !== "undefined") {
                                req.withCredentials = true;
                            }
                        },
                        headers: {
                            "Authorization": "Basic " + btoa(user + ":" + password)
                        }
                    };
                    Log.print(Log.l.info, "calling xhr method=GET url=" + url);
                    return WinJS.xhr(options).then(function (response) {
                        Log.print(Log.l.trace, "success!");
                        try {
                            var obj = JSON.parse(response.responseText);
                            return that.fetchAll(that, obj, complete, error);
                        } catch (exception) {
                            Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                            var err = { status: 500, statusText: "data parse error " + (exception && exception.message) };
                            error(err);
                            return WinJS.Promise.as();
                        }
                    }, function(errorResponse) {
                        error(errorResponse);
                    });
                }, error, restrictions);
                Log.ret(Log.l.trace);
                return ret;
            },
            dbInsert: function(that, complete, error, results) {
                Log.call(Log.l.trace, "AppData.configViewData.", "relationName=" + that.relationName);
                var ret;
                if (!that.attribSpecs) {
                    ret = that.getAttribSpecs(that, that.dbInsert, complete, error, results);
                } else {
                    ret = new WinJS.Promise.as().then(function() {
                        var stmt = "INSERT INTO \"" + that.relationName + "\"";
                        var stmtValues = null;
                        var i;
                        for (i = 0; i < that.attribSpecs.length; i++) {
                            if (that.attribSpecs[i].BaseAttributeName || that.attribSpecs[i].Name) {
                                if (!stmtValues) {
                                    stmt += "(";
                                    stmtValues = ") VALUES (";
                                } else {
                                    stmt += ",";
                                    stmtValues += ",";
                                }
                                stmt += "\"" + (that.attribSpecs[i].BaseAttributeName || that.attribSpecs[i].Name) + "\"";
                                stmtValues += "?";
                            }
                        }
                        if (stmtValues) {
                            stmtValues += ")";
                            stmt += stmtValues;
                        }
                        Log.print(Log.l.trace, "configViewData.dbInsert: " + stmt);
                        var batch = [];
                        for (var j = 0; j < results.length; j++) {
                            var values = [];
                            var row = results[j];
                            for (i = 0; i < that.attribSpecs.length; i++) {
                                if (that.attribSpecs[i].BaseAttributeName || that.attribSpecs[i].Name) {
                                    if (typeof row[that.attribSpecs[i].Name] !== "undefined") {
                                        values.push(row[that.attribSpecs[i].Name]);
                                    } else if (typeof row[that.attribSpecs[i].ODataAttributeName] !== "undefined") {
                                        values.push(row[that.attribSpecs[i].ODataAttributeName]);
                                    } else {
                                        values.push(null);
                                    }
                                }
                            }
                            Log.print(Log.l.trace, "configViewData.dbInsert: " + values);
                            var exec = [];
                            exec.push(stmt);
                            exec.push(values);
                            batch.push(exec);
                        }
                        AppData._db.sqlBatch(batch, function() {
                            Log.print(Log.l.trace, "configViewData.dbInsert: " + that.relationName + " success!");
                            complete();
                        }, function(curerr) {
                            Log.print(Log.l.error, "configViewData.dbInsert: sqlBatch " + curerr);
                            error(curerr);
                        });
                        return WinJS.Promise.as();
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
        }),
        /**
         * @callback AppData.DbInit~complete
         * @description This handler is called after the local database is created and loaded successfully.
         */
        /**
         * @callback AppData.DbInit~error
         * @param {Object} errorResponse - Response object, code number or string returned in case or error.
         * @description This handler is called if an error occurs while creation or load of the local database.
         */
        /**
         * @callback AppData.DbInit~progress
         * @param {Object} progress - Current progress of local database creation and loading.
         * @param {number} progress.percent - Progress value 0-100 in percent
         * @param {string} progress.statusText - Progress information message
         */
        /**
         * @class DbInit 
         * @memberof AppData
         * @param {AppData.DbInit~complete} complete - Success handler callback function.
         * @param {AppData.DbInit~error} error - Error handler callback function.
         * @param {AppData.DbInit~progress} error - Progress callback function.
         * @param {boolean} bReInit - True if an existing local SQLite database should be overwritten.
         * @description This class is used by the framework to initialize a local SQLite storage database based on the configuration metadata retrieved from the server database.
         */
        DbInit: WinJS.Class.define(function dbInit(complete, error, progress, bReInit) {
            Log.call(Log.l.trace, "AppData.");
            var that = this;
            that._percentSteps = [
                10, // createScriptForRelations
                10,  // createBaseRelations
                20, // loadConfigData
                10, // createScriptForRelations
                10, // createProjectRelations
                35, // loadProjectData
                5 // createProjectScripts
            ];
            that._percentStepsIdx = 0;
            that._percentBase = 0;
            that._percent = 0;
            that._progress = progress;
            that._configLoaded = false;
            that._allRelationTypes = [].concat(that._baseRelationTypes);
            that._allRelationIds = [].concat(that._baseRelationIds);
            that._allRelations = [].concat(that._baseRelations);
            that._userSpecIndex = 0;
            that._createScript = [];
            var followFunction;
            var i, replicationSpecRow;
            if (bReInit) {
                followFunction = function(res) {
                    var projectRelations = [];
                    if (res && res.rows) {
                        for (i = 0; i < res.rows.length; i++) {
                            replicationSpecRow = res.rows.item(i);
                            projectRelations.push(replicationSpecRow.RelationName);
                            if (replicationSpecRow.ContentDescr === "WORK" ||
                                replicationSpecRow.ContentDescr === "USERSPEC") {
                                projectRelations.push("RINF" + replicationSpecRow.RelationName);
                            }
                        }
                    }
                    that.reInitDB(that, complete, error, projectRelations);
                };
            } else {
                followFunction = function(res) {
                    if (res && res.rows) {
                        for (i = 0; i < res.rows.length; i++) {
                            replicationSpecRow = res.rows.item(i);
                            that.allRelations.push(replicationSpecRow.RelationName);
                            that.allRelationTypes.push(replicationSpecRow.ContentDescr);
                            if (replicationSpecRow.ContentDescr === "WORK" ||
                                replicationSpecRow.ContentDescr === "USERSPEC") {
                                if (replicationSpecRow.ContentDescr === "USERSPEC") {
                                    that._userSpecIndex = that.allRelations.length - 1;
                                }
                                that.allRelations.push("RINF" + replicationSpecRow.RelationName);
                                that.allRelationTypes.push("RINF");
                            }
                            var j = that.allRelations.indexOf(replicationSpecRow.RelationName);
                            that._allRelationIds[j] = replicationSpecRow.RelationID;
                        }
                    }
                    that._configLoaded = true;
                    // init replication
                    var repl = new AppRepl.DbReplicator();
                    complete({});
                };
            }
            that._promise = that.selectProjectRelations(that, complete, error).then(function(res) {
                followFunction(res);
            }, function(err) {
                error(err);
            });
            Log.ret(Log.l.trace);
        }, {
            selectProjectRelations: function(that, complete, error) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                var existsReplicationSpec = false;
                var stmt = "SELECT name FROM sqlite_master WHERE type=? AND name=?";
                var values = ["table", "ReplicationSpec"];
                Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                var ret = SQLite.xsql(AppData._db, stmt, values).then(function (res) {
                    if (res.rows && res.rows.length === 1) {
                        existsReplicationSpec = true;
                    }
                    return WinJS.Promise.as();
                }, function(err) {
                    error(err);
                }).then(function() {
                    if (existsReplicationSpec) {
                        // check for project tables
                        stmt = "SELECT * FROM \"ReplicationSpec\" ORDER BY \"ReplicationType\"";
                        values = [];
                        Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                        return SQLite.xsql(AppData._db, stmt, values);
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            reInitDB: function(that, complete, error, projectRelations) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                var prevRelations = that._baseRelations;
                if (projectRelations) {
                    prevRelations = prevRelations.concat(projectRelations);
                }
                // first drop previous tables in reverse order!
                for (var t = prevRelations.length - 1; t >= 0; t--) {
                    var dropLine = "DROP TABLE IF EXISTS \"" + prevRelations[t] + "\"";
                    Log.print(Log.l.info, dropLine);
                    that._createScript.push(dropLine);
                }
                // then create tables!
                that._createdCount = 0;
                that._toCreateCount = that._baseRelations.length;
                that._baseRelations.forEach(function(item, index) {
                    that.createScriptForRelations(that, item, index + prevRelations.length, that.createBaseRelations, complete, error);
                });
                Log.ret(Log.l.trace);
            },
            createScriptForRelations: function(that, item, index, followUp, complete, error) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                that.getAttribSpecs(that, item, function (results) {
                    var createLine = null;
                    // columns
                    var i;
                    for (i = 0; i < results.length; i++) {
                        if (!createLine) {
                            createLine = "CREATE TABLE \"" + item + "\"(";
                        } else {
                            createLine += ",";
                        }
                        createLine += that.columnFromAttribSpec(that, results[i].Name, results[i].Format, results[i].Function, results[i].Param, results[i].PParam, item);
                    }
                    if (createLine) {
                        // constraints
                        for (i = 0; i < results.length; i++) {
                            var constraint = that.constraintFromAttribSpec(that, results[i].Name, results[i].Format, results[i].Function, results[i].Param, results[i].PParam, item);
                            if (constraint) {
                                createLine += "," + constraint;
                            }
                        }
                        createLine += ")";
                        Log.print(Log.l.info, "[" + index + "]:" + createLine);
                        that._createScript[index] = createLine;
                    }
                    that._createdCount++;
                    if (that._createdCount === that._toCreateCount) {
                        that.incPercentBase();
                        that.setPercent(
                            that._percentBase,
                            getResourceText(that._percentBase ? "dbinit.loadConfig" : "dbinit.loadBaseConfig")
                        );
                        followUp(that, complete, error);
                    } else {
                        that.setPercent(
                            that._percentBase + that.getPercentStep() * that._createdCount / that._toCreateCount,
                            getResourceText(that._percentBase ? "dbinit.loadConfig" : "dbinit.loadBaseConfig")
                        );
                    }
                }, function(errorResponse) {
                    error(errorResponse);
                });
                Log.ret(Log.l.trace);
            },
            columnFromAttribSpec: function(that, attribName, attribFormat, attribFunction, attribParam, attribPParam, relationName) {
                var column = "\"" + attribName + "\"";
                switch (attribFormat) {
                    case 4: // SQL_C_LONG
                    case 5: // SQL_C_SHORT
                    case 10: // SQL_C_TIME
                    case 11: // SQL_C_TIMESTAMP
                        column += " INTEGER";
                        break;
                    case 1: // SQL_C_CHAR
                    case 12: // SQL_VARCHAR
                    case -1: //SQL_LONGVARCHAR
                    case 9: // SQL_C_DATE
                        column += " TEXT";
                        break;
                    case 7: // SQL_C_FLOAT
                        column += " REAL";
                        break;
                    case -2: // SQL_C_BINARY
                    case -3: // SQL_VARBINARY
                    case -4: // SQL_LONGVARBINARY
                        column += " BLOB";
                        break;
                }
                //if (!attribFunction & 1) {
                //    column += " NOT NULL";
                //}
                if (attribFunction & 16) {
                    column += " UNIQUE";
                }
                /*if (attribFunction & 2048) {
                    column += " PRIMARY KEY";
                }
                if (attribFunction & 4096) {
                    if (attribPParam) {
                        var refTable = null, refColumn = null;
                        var posColumn = attribPParam.lastIndexOf(".");
                        if (posColumn >= 0) {
                            refColumn = attribPParam.substr(posColumn + 1);
                            var posTable = attribPParam.substr(0, posColumn - 1).lastIndexOf(".");
                            if (posTable >= 0) {
                                refTable = attribPParam.substr(posTable + 1, posColumn - posTable - 1);
                            }
                            // ignore FK of base relations on not known relations!
                            if (relationName &&
                                that.allRelations.indexOf(relationName) >= 0 &&
                                that.allRelations.indexOf(refTable) < 0) {
                                refTable = null;
                                refColumn = null;
                            }
                        }
                        if (refTable && refColumn) {
                            column += " REFERENCES \"" + refTable + "\"(\"" + refColumn + "\")";
                            if (attribFunction & 128) {
                                column += " ON DELETE CASCADE";
                            }
                            if (attribFunction & 256) {
                                column += " ON UPDATE CASCADE";
                            }
                        }
                    }
                }*/
                return column;
            },
            constraintFromAttribSpec: function(that, attribName, attribFormat, attribFunction, attribParam, attribPParam, relationName) {
                var constraint = null;
                if (attribFunction & 2048) {
                    constraint = "PRIMARY KEY(\"" + attribName + "\")";
                }
                if (attribFunction & 4096) {
                    if (attribPParam) {
                        var refTable = null, refColumn = null;
                        var posColumn = attribPParam.lastIndexOf(".");
                        if (posColumn >= 0) {
                            refColumn = attribPParam.substr(posColumn + 1);
                            var posTable = attribPParam.substr(0, posColumn - 1).lastIndexOf(".");
                            if (posTable >= 0) {
                                refTable = attribPParam.substr(posTable + 1, posColumn - posTable - 1);
                            }
                            // ignore FK of base relations on not known relations!
                            if (relationName &&
                                that.allRelations.indexOf(relationName) >= 0 &&
                                that.allRelations.indexOf(refTable) < 0) {
                                refTable = null;
                                refColumn = null;
                            }
                        }
                        if (refTable && refColumn) {
                            if (!constraint) {
                                constraint = "";
                            } else {
                                constraint += ",";
                            }
                            constraint += "FOREIGN KEY(\"" + attribName + "\") REFERENCES \"" + refTable + "\"(\"" + refColumn + "\")";
                            if (attribFunction & 128) {
                                constraint += " ON DELETE CASCADE";
                            }
                            if (attribFunction & 256) {
                                constraint += " ON UPDATE CASCADE";
                            }
                        }
                    }
                }
                return constraint;
            },
            initProject: function(that, complete, error) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                that.incPercentBase();
                that.setPercent(
                    that._percentBase,
                    getResourceText("dbinit.loadConfig")
                );
                that._configLoaded = true;
                AppData.appSettings.odata.replPrevSelectMs = 0;
                AppData.appSettings.odata.replPrevPostMs = 0;
                AppData.appSettings.odata.replPrevFlowSpecId = 0;
                Application.pageframe.savePersistentStates();

                var insertLanguageSpec = function (followUp) {
                    Log.print(Log.l.info, "Loading LanguageSpec...");
                    var results;
                    var dbInsert = function (curres) {
                        that.languageSpec.dbInsert(that.languageSpec, function () {
                            Log.print(Log.l.info, "languageSpec.dbInsert:  success!");
                            followUp();
                        }, function (err) {
                            Log.print(Log.l.error, "languageSpec.dbInsert: " + err);
                            error(err);
                        }, curres);
                    };
                    that.languageSpec.selectAll(function (json) {
                        if (json && json.d && json.d.results) {
                            results = json.d.results;
                        } else {
                            Log.print(Log.l.error, "loadConfigData.languageSpec: no data found!");
                            //error({ status: 404, statusText: "loadConfigData.languageSpec: no data found!" });
                            results = AppData.getDefLanguages();
                        }
                        dbInsert(results);
                    }, function (errorResponse) {
                        Log.print(Log.l.error, "loadConfigData.languageSpec: " + AppData.getErrorMsgFromResponse(errorResponse));
                        //error(errorResponse);
                        results = AppData.getDefLanguages();
                        dbInsert(results);
                    });
                };
                insertLanguageSpec(function() {
                    Log.print(Log.l.info, "Creating project relations...");
                    AppData._formatViews = [];
                    AppData._lgntInits = [];
                    // check for project tables
                    that.selectProjectRelations(that, complete, error).then(function (res) {
                        var j;
                        if (res && res.rows) {
                            for (j = 0; j < res.rows.length; j++) {
                                var replicationSpecRow = res.rows.item(j);
                                that.allRelations.push(replicationSpecRow.RelationName);
                                that.allRelationTypes.push(replicationSpecRow.ContentDescr);
                                if (replicationSpecRow.ContentDescr === "WORK" ||
                                    replicationSpecRow.ContentDescr === "USERSPEC") {
                                    if (replicationSpecRow.ContentDescr === "USERSPEC") {
                                        that._userSpecIndex = that.allRelations.length - 1;
                                    }
                                    that.allRelations.push("RINF" + replicationSpecRow.RelationName);
                                    that.allRelationTypes.push("RINF");
                                }
                                var i = that.allRelations.indexOf(replicationSpecRow.RelationName);
                                that._allRelationIds[i] = replicationSpecRow.RelationID;
                            }
                        }
                        // then create tables!
                        that._createScript = [];
                        that._createdCount = 0;
                        that._toCreateCount = that.allRelations.length - that._baseRelations.length;
                        that.allRelations.forEach(function (item, index) {
                            if (that._baseRelations.indexOf(item) < 0) {
                                that.createScriptForRelations(that, item, index - that._baseRelations.length, that.createProjectRelations, complete, error);
                            }
                        });
                    }, function (err) {
                        error(err);
                    });
                });
                Log.ret(Log.l.trace);
            },
            loadConfigData: function(that, complete, error) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                var rinfRelationNames = [];
                var countRelations = 0;
                var doneAttribSpecs = 0;
                var doneRelationScripts = 0;
                var doneRinfAttribSpecs = 0;
                var doneRinfRelationScripts = 0;
                // forward decls!
                var insertRinfSpecs = null;
                var insertRelationScript = null;

                var insertAttribSpec = function(relationId, isScriptRelation, relationName) {
                    var isBaseRelation;
                    if (that._baseRelationIds.indexOf(relationId) >= 0) {
                        isBaseRelation = true;
                    } else {
                        isBaseRelation = false;
                    }
                    var restriction;
                    if (relationName) {
                        restriction = { RelationName: relationName };
                    } else {
                        restriction = { RelationSpecID: relationId };
                    }
                    that.attribSpec.selectAll(function(json) {
                        if (relationName) {
                            Log.print(Log.l.info, "loadConfigData.attribSpec: relationName=" + relationName + " fetch success!");
                        } else {
                            Log.print(Log.l.info, "loadConfigData.attribSpec: relationId=" + relationId + " fetch success!" +
                            (isScriptRelation ? " isScriptRelation" : "") + (isBaseRelation ? " isBaseRelation " : " "));
                        }
                        if (json && json.d && json.d.results) {
                            var results = json.d.results;
                            var dbInsert = function(curres) {
                                if (relationName) {
                                    Log.print(Log.l.info, "attribSpec.dbInsert: relationName=" + relationName + " calling");
                                } else {
                                    Log.print(Log.l.info, "attribSpec.dbInsert: relationId=" + relationId + " calling" +
                                    (isScriptRelation ? " isScriptRelation" : "") + (isBaseRelation ? " isBaseRelation " : " "));
                                }
                                that.attribSpec.dbInsert(that.attribSpec, function() {
                                    if (relationName) {
                                        doneRinfAttribSpecs++;
                                        Log.print(Log.l.info, "attribSpec.dbInsert: relationName=" + relationName +
                                            " success! doneRinfAttribSpecs=" + doneRinfAttribSpecs +
                                            " doneRinfRelationScripts=" + doneRinfRelationScripts +
                                            " rinfRelationNames.length=" + rinfRelationNames.length);
                                        if (doneRinfAttribSpecs === rinfRelationNames.length && doneRinfRelationScripts === rinfRelationNames.length) {
                                            that.initProject(that, complete, error);
                                        } else {
                                            that.setPercent(
                                                that._percentBase + that.getPercentStep() * (doneAttribSpecs + doneRelationScripts + doneRinfAttribSpecs + doneRinfRelationScripts) / (countRelations + rinfRelationNames.length) / 2,
                                                getResourceText("dbinit.loadConfig")
                                            );
                                        }
                                    } else if (!isScriptRelation && !isBaseRelation) {
                                        doneAttribSpecs++;
                                        Log.print(Log.l.info, "attribSpec.dbInsert: relationId=" + relationId +
                                            " success! doneAttribSpecs=" + doneAttribSpecs +
                                            " doneRelationScripts=" + doneRelationScripts +
                                            " countRelations=" + countRelations);
                                        if (doneAttribSpecs === countRelations && doneRelationScripts === countRelations) {
                                            insertRinfSpecs();
                                        } else {
                                            that.setPercent(
                                                that._percentBase + that.getPercentStep() * (doneAttribSpecs + doneRelationScripts + doneRinfAttribSpecs + doneRinfRelationScripts) / (countRelations + rinfRelationNames.length) / 2,
                                                getResourceText("dbinit.loadConfig")
                                            );
                                        }
                                    } else {
                                        Log.print(Log.l.info, "attribSpec.dbInsert: relationId=" + relationId +
                                            " success!" + (isScriptRelation ? " isScriptRelation" : "") + (isBaseRelation ? " isBaseRelation " : " "));
                                    }
                                }, function(err) {
                                    if (relationName) {
                                        Log.print(Log.l.error, "attribSpec.dbInsert: relationName=" + relationName + " " + err);
                                    } else {
                                        Log.print(Log.l.error, "attribSpec.dbInsert: relationId=" + relationId +
                                        (isScriptRelation ? " isScriptRelation " : " ") + (isBaseRelation ? " isBaseRelation " : " ") + err);
                                    }
                                    error(err);
                                }, curres);
                            };
                            if (relationName) {
                                var curres = results;
                                var row;
                                for (var i = 0; i < curres.length; i++) {
                                    row = curres[0];
                                    if (row.Function & 2048) {
                                        break;
                                    }
                                }
                                if (row) {
                                    var stmt = "INSERT INTO \"RelationSpec\"(\"RelationID\",\"Name\",\"Type\",\"PrimKeyFlags0\",\"PrimKeyFlags1\",\"ForeignKeyFlags0\",\"ForeignKeyFlags1\",\"LinkKeyFlags0\",\"LinkKeyFlags1\",\"CrossRelationIndex1\",\"CrossRelationIndex2\") VALUES(?,?,?,?,?,?,?,?,?,?,?)";
                                    var values = [row.RelationSpecID, row.RelationName, "RINF", 1, 0, 0, 0, 0, 0, row.RefParam, -1];
                                    Log.print(Log.l.info, "loadConfigData: " + stmt + " [" +
                                        row.RelationSpecID + "," +
                                        row.RelationName + "," +
                                        "RINF" + ",1,0,0,0,0,0," + row.RefParam + "]");
                                    SQLite.xsql(AppData._db, stmt, values, 0, true).then(function(res) {
                                        Log.print(Log.l.info, "INSERT INTO \"RelationSpec\"(\"RelationID\",\"Name\",... " + row.RelationSpecID + "," + row.RelationName + " success!");
                                        dbInsert(curres);
                                        insertRelationScript(row.RelationSpecID, true);
                                    }, error);
                                }
                            } else {
                                dbInsert(results);
                            }
                        } else {
                            error({ status: 404, statusText: "loadConfigData.attribSpec: no data found!" });
                        }
                    }, function(errorResponse) {
                        Log.print(Log.l.error, "loadConfigData.attribSpec: " + AppData.getErrorMsgFromResponse(errorResponse));
                        error(errorResponse);
                    }, restriction);
                };
                insertRinfSpecs = function () {
                    if (!rinfRelationNames.length) {
                        that.initProject(that, complete, error);
                    } else {
                        for (var i = 0; i < rinfRelationNames.length; i++) {
                            insertAttribSpec(0, false, rinfRelationNames[i]);
                        }
                    }
                };
                insertRelationScript = function(relationId, isRinfRelation) {
                    that.relationScript.selectAll(function(json) {
                        Log.print(Log.l.info, "loadConfigData.relationScript: relationId=" + relationId + " fetch success!");
                        var isBaseRelation;
                        if (that._baseRelationIds.indexOf(relationId) >= 0) {
                            isBaseRelation = true;
                        } else {
                            isBaseRelation = false;
                        }
                        if (json && json.d && json.d.results && json.d.results.length > 0) {
                            var results = json.d.results;
                            var stmt = "INSERT INTO \"RelationScript\"(\"RelationScriptID\",\"RelationID\",\"ScriptTypeID\",\"Title\",\"Script\",\"Status\") VALUES(?,?,?,?,?,?)";
                            var batch = [];
                            var relationScriptRow, values, exec, j;
                            for (j = 0; j < results.length; j++) {
                                relationScriptRow = results[j];
                                Log.print(Log.l.info, "loadConfigData: " + stmt + "," +
                                    (relationScriptRow.ScriptID || relationScriptRow.RelationScriptID) + "," +
                                    relationScriptRow.RelationSpecID + "," +
                                    relationScriptRow.ScriptTypeID + "," +
                                    relationScriptRow.Title + "," +
                                    relationScriptRow.Script.substr(0, 32) + "...");
                                values = [relationScriptRow.ScriptID || relationScriptRow.RelationScriptID, relationScriptRow.RelationSpecID, relationScriptRow.ScriptTypeID, relationScriptRow.Title, relationScriptRow.Script, relationScriptRow.ActualizationFlag];
                                exec = [];
                                exec.push(stmt);
                                exec.push(values);
                                batch.push(exec);
                            }
                            stmt = "INSERT INTO \"RelationSpec\"(\"RelationID\",\"Name\",\"Type\",\"PrimKeyFlags0\",\"PrimKeyFlags1\",\"ForeignKeyFlags0\",\"ForeignKeyFlags1\",\"LinkKeyFlags0\",\"LinkKeyFlags1\",\"CrossRelationIndex1\",\"CrossRelationIndex2\") VALUES(?,?,?,?,?,?,?,?,?,?,?)";
                            for (j = 0; j < results.length; j++) {
                                relationScriptRow = results[j];
                                if (relationScriptRow.ScriptRelationID) {
                                    Log.print(Log.l.info, "loadConfigData: " + stmt + "," +
                                        relationScriptRow.ScriptRelationID + "," +
                                        relationScriptRow.Title + "," +
                                        "VIEW" + ",1,0,0,0,0,0," + relationScriptRow.RelationSpecID);
                                    values = [relationScriptRow.ScriptRelationID, relationScriptRow.Title, "VIEW", 1, 0, 0, 0, 0, 0, relationScriptRow.RelationSpecID, -1];
                                    exec = [];
                                    exec.push(stmt);
                                    exec.push(values);
                                    batch.push(exec);
                                }
                            }
                            AppData._db.sqlBatch(batch, function() {
                                Log.print(Log.l.info, "loadConfigData.relationScript sqlBatch: relationId=" + relationId + " success!");
                                for (j = 0; j < results.length; j++) {
                                    relationScriptRow = results[j];
                                    if (relationScriptRow.ScriptRelationID) {
                                        insertAttribSpec(relationScriptRow.ScriptRelationID, true);
                                    }
                                }
                                if (isRinfRelation) {
                                    doneRinfRelationScripts++;
                                    Log.print(Log.l.info, "loadConfigData.relationScript sqlBatch relationId=" + relationId +
                                        " success! doneRinfAttribSpecs=" + doneRinfAttribSpecs +
                                        " doneRinfRelationScripts=" + doneRinfRelationScripts +
                                        " rinfRelationNames.length=" + rinfRelationNames.length);
                                    if (doneRinfAttribSpecs === rinfRelationNames.length && doneRinfRelationScripts === rinfRelationNames.length) {
                                        that.initProject(that, complete, error);
                                    } else {
                                        that.setPercent(
                                            that._percentBase + that.getPercentStep() * (doneAttribSpecs + doneRelationScripts + doneRinfAttribSpecs + doneRinfRelationScripts) / (countRelations + rinfRelationNames.length) / 2,
                                            getResourceText("dbinit.loadConfig")
                                        );
                                    }
                                } else if (!isBaseRelation) {
                                    doneRelationScripts++;
                                    Log.print(Log.l.info, "loadConfigData.relationScript sqlBatch relationId=" + relationId +
                                        " success! doneAttribSpecs=" + doneAttribSpecs +
                                        " doneRelationScripts=" + doneRelationScripts +
                                        " countRelations=" + countRelations);
                                    if (doneAttribSpecs === countRelations && doneRelationScripts === countRelations) {
                                        insertRinfSpecs();
                                    } else {
                                        that.setPercent(
                                            that._percentBase + that.getPercentStep() * (doneAttribSpecs + doneRelationScripts + doneRinfAttribSpecs + doneRinfRelationScripts) / (countRelations + rinfRelationNames.length) / 2,
                                            getResourceText("dbinit.loadConfig")
                                        );
                                    }
                                }
                            }, function(err) {
                                Log.print(Log.l.error, "loadConfigData.relationSpec: sqlBatch " + err);
                                error(err);
                            });
                        } else {
                            if (isRinfRelation) {
                                doneRinfRelationScripts++;
                                Log.print(Log.l.info, "loadConfigData.relationScript: no script for relationId=" + relationId +
                                    " success! doneRinfAttribSpecs=" + doneRinfAttribSpecs +
                                    " doneRinfRelationScripts=" + doneRinfRelationScripts +
                                    " rinfRelationNames.length=" + rinfRelationNames.length);
                                if (doneRinfAttribSpecs === rinfRelationNames.length && doneRinfRelationScripts === rinfRelationNames.length) {
                                    that.initProject(that, complete, error);
                                } else {
                                    that.setPercent(
                                        that._percentBase + that.getPercentStep() * (doneAttribSpecs + doneRelationScripts + doneRinfAttribSpecs + doneRinfRelationScripts) / (countRelations + rinfRelationNames.length) / 2,
                                        getResourceText("dbinit.loadConfig")
                                    );
                                }
                            } else if (!isBaseRelation) {
                                doneRelationScripts++;
                                Log.print(Log.l.info, "loadConfigData.relationScript: no script for relationId=" + relationId +
                                    " success! doneAttribSpecs=" + doneAttribSpecs +
                                    " doneRelationScripts=" + doneRelationScripts +
                                    " countRelations=" + countRelations);
                                if (doneAttribSpecs === countRelations && doneRelationScripts === countRelations) {
                                    insertRinfSpecs();
                                } else {
                                    that.setPercent(
                                        that._percentBase + that.getPercentStep() * (doneAttribSpecs + doneRelationScripts + doneRinfAttribSpecs + doneRinfRelationScripts) / (countRelations + rinfRelationNames.length) / 2,
                                        getResourceText("dbinit.loadConfig")
                                    );
                                }
                            }
                        }
                    }, function(errorResponse) {
                        Log.print(Log.l.error, "loadConfigData.relationScript: " + AppData.getErrorMsgFromResponse(errorResponse));
                        error(errorResponse);
                    }, { RelationSpecID: relationId });
                };
                var insertRelationSpec = function(results) {
                    countRelations = results.length;
                    Log.print(Log.l.info, "loadConfigData: countRelations=" + countRelations);
                    var stmt = "INSERT INTO \"RelationSpec\"(\"RelationID\",\"Name\",\"Type\",\"PrimKeyFlags0\",\"PrimKeyFlags1\",\"ForeignKeyFlags0\",\"ForeignKeyFlags1\",\"LinkKeyFlags0\",\"LinkKeyFlags1\",\"CrossRelationIndex1\",\"CrossRelationIndex2\") VALUES(?,?,?,?,?,?,?,?,?,?,?)";
                    var batch = [];
                    for (var j = 0; j < results.length; j++) {
                        var replicationSpecRow = results[j];
                        Log.print(Log.l.info, "loadConfigData: " + stmt + "," +
                            replicationSpecRow.RelationSpecID + "," +
                            replicationSpecRow.RelationName + "," +
                            replicationSpecRow.ContentDescr + ",1,0,0,0,0,0,0");
                        var values = [replicationSpecRow.RelationSpecID, replicationSpecRow.RelationName, replicationSpecRow.ContentDescr, 1, 0, 0, 0, 0, 0, 0, 0];
                        var exec = [];
                        exec.push(stmt);
                        exec.push(values);
                        batch.push(exec);
                        if (replicationSpecRow.ContentDescr === "WORK" ||
                            replicationSpecRow.ContentDescr === "USERSPEC") {
                            rinfRelationNames.push("RINF" + replicationSpecRow.RelationName);
                        }
                    }
                    AppData._db.sqlBatch(batch, function() {
                        Log.print(Log.l.trace, "loadConfigData.relationSpec sqlBatch: success!");
                        that.replicationSpec.dbInsert(that.replicationSpec, function() {
                            if (typeof that._progress === "function") {
                                that.setPercent(
                                    that._percentBase,
                                    getResourceText("dbinit.loadConfig")
                                );
                            }
                            Log.print(Log.l.trace, "replicationSpec.dbInsert: success!");
                            for (var i = 0; i < results.length; i++) {
                                var relationId = results[i].RelationSpecID;
                                insertAttribSpec(relationId);
                                insertRelationScript(relationId);
                            }
                        }, function(err) {
                            Log.print(Log.l.error, "loadConfigData.relationSpec: dbInsert " + err);
                            error(err);
                        }, results);
                    }, function(err) {
                        Log.print(Log.l.error, "loadConfigData.relationSpec: sqlBatch " + err);
                        error(err);
                    });
                };
                if (that._baseRelationIds.length > 0 && that._baseRelationIds.length === that._baseRelations.length) {
                    var stmt = "INSERT INTO \"RelationSpec\"(\"RelationID\",\"Name\",\"Type\",\"PrimKeyFlags0\",\"PrimKeyFlags1\",\"ForeignKeyFlags0\",\"ForeignKeyFlags1\",\"LinkKeyFlags0\",\"LinkKeyFlags1\",\"CrossRelationIndex1\",\"CrossRelationIndex2\") VALUES(?,?,?,?,?,?,?,?,?,?,?)";
                    var batch = [];
                    Log.print(Log.l.info, "loadConfigData: that._baseRelationIds.length=" + that._baseRelationIds.length);
                    for (var j = 0; j < that._baseRelationIds.length; j++) {
                        Log.print(Log.l.info, "loadConfigData: " + stmt + "," +
                            that._baseRelationIds[j] + "," +
                            that._baseRelations[j] + "," +
                            "CONFIG" + ",1,0,0,0,0,0,0");
                        var values = [that._baseRelationIds[j], that._baseRelations[j], "CONFIG", 1, 0, 0, 0, 0, 0, 0, 0];
                        var exec = [];
                        exec.push(stmt);
                        exec.push(values);
                        batch.push(exec);
                    }
                    AppData._db.sqlBatch(batch, function () {
                        Log.print(Log.l.trace, "loadConfigData.relationSpec sqlBatch: success!");
                        for (var i = 0; i < that._baseRelationIds.length; i++) {
                            var relationId = that._baseRelationIds[i];
                            insertAttribSpec(relationId);
                            insertRelationScript(relationId);
                        }
                    }, function (err) {
                        Log.print(Log.l.error, "loadConfigData.relationSpec: sqlBatch " + err);
                        error(err);
                    });
                }
                that.replicationSpec.selectAll(function(json) {
                    Log.print(Log.l.info, "loadConfigData.replicationSpec: fetch success!");
                    if (json && json.d && json.d.results) {
                        insertRelationSpec(json.d.results);
                    } else {
                        error({ status: 404, statusText: "loadConfigData.replicationSpec: no data found!" });
                    }
                }, function(errorResponse) {
                    Log.print(Log.l.error, "loadConfigData.replicationSpec: " + AppData.getErrorMsgFromResponse(errorResponse));
                    error(errorResponse);
                }, null, { ordered: true, orderAttribute: "ReplicationType" });

                Log.ret(Log.l.trace);
            },
            createBaseRelations: function(that, complete, error) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                AppData._db.sqlBatch(that.createScript, function() {
                    Log.print(Log.l.trace, "createBaseRelations: success!");
                    that.incPercentBase();
                    if (typeof that._progress === "function") {
                        that.setPercent(
                            that._percentBase,
                            getResourceText("dbinit.loadConfig")
                        );
                    }
                    that.loadConfigData(that, complete, error);
                }, function(err) {
                    Log.print(Log.l.error, "createBaseRelations:", err);
                    error(err);
                });
                Log.ret(Log.l.trace);
            },
            createProjectScripts: function(that, complete, error) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                var createScript = [];
                var addScriptStmt = function(relationScriptRow) {
                    if (relationScriptRow.Status === 3 || // fertig
                            relationScriptRow.Status === 13 // fertig, in Bearbeitung
                    ) {
                        var stmt = null;
                        var relationName = relationScriptRow.Name;
                        if (relationName) {
                            switch (relationScriptRow.ScriptTypeID) {
                            case 1: // DBView
                            case 16385: // Synonym DBView
                                stmt = "DROP VIEW IF EXISTS \"" + relationScriptRow.Title + "\"";
                                Log.print(Log.l.info, "createProjectScripts: " + stmt);
                                createScript.push(stmt);
                                stmt = "CREATE VIEW \"" + relationScriptRow.Title + "\" " + relationScriptRow.Script;
                                Log.print(Log.l.info, "createProjectScripts: " + stmt);
                                createScript.push(stmt);
                                break;
                            case 2: // InsertTrigger
                            case 4: // UpdateTrigger
                            case 8: // DeleteTrigger
                            case 16386: // BeforeInsertTrigger
                            case 16388: // BeforeInsertTrigger
                            case 16392: // BeforeInsertTrigger
                                stmt = "DROP TRIGGER IF EXISTS \"" + relationScriptRow.Title + "\"";
                                Log.print(Log.l.info, "createProjectScripts: " + stmt);
                                createScript.push(stmt);
                                stmt = "CREATE TRIGGER \"" + relationScriptRow.Title + "\"";
                                if (relationScriptRow.ScriptTypeID & 0x4000) {
                                    stmt += " BEFORE";
                                } else {
                                    stmt += " AFTER";
                                }
                                if (relationScriptRow.ScriptTypeID & 2) {
                                    stmt += " INSERT";
                                } else if (relationScriptRow.ScriptTypeID & 4) {
                                    stmt += " UPDATE";
                                } else if (relationScriptRow.ScriptTypeID & 8) {
                                    stmt += " DELETE";
                                }
                                stmt += " ON \"" + relationName + "\" " + relationScriptRow.Script;
                                Log.print(Log.l.info, "createProjectScripts: " + stmt);
                                createScript.push(stmt);
                                break;
                            case 256: // InsertUpdateTrigger
                            case 16640: // BeforeInsertUpdateTrigger
                                var createIuTrigger = function(iu, name) {
                                    stmt = "DROP TRIGGER IF EXISTS \"" + name + "\"";
                                    Log.print(Log.l.info, "createProjectScripts: " + stmt);
                                    createScript.push(stmt);
                                    stmt = "CREATE TRIGGER \"" + name + "\"";
                                    if (relationScriptRow.ScriptTypeID & 0x4000) {
                                        stmt += " BEFORE";
                                    } else {
                                        stmt += " AFTER";
                                    }
                                    stmt += " " + iu + " ON \"" + relationName + "\" " + relationScriptRow.Script;
                                    Log.print(Log.l.info, "createProjectScripts: " + stmt);
                                    createScript.push(stmt);
                                };
                                createIuTrigger("INSERT", relationScriptRow.Title + "I");
                                createIuTrigger("UPDATE", relationScriptRow.Title + "U");
                                break;
                            }
                        }
                    }
                };
                // create project scripts
                AppData._db.executeSql("SELECT \"RelationScript\".*,\"RelationSpec\".\"Name\" FROM \"RelationScript\",\"RelationSpec\" WHERE \"RelationScript\".\"RelationID\"=\"RelationSpec\".\"RelationID\"", [], function (res) {
                    if (res && res.rows) {
                        for (var i = 0; i < res.rows.length; i++) {
                            addScriptStmt(res.rows.item(i));
                        }
                    }
                    AppData._db.sqlBatch(createScript, function() {
                        Log.print(Log.l.info, "createProjectScripts: success!");
                        that.incPercentBase();
                        that.setPercent(
                            that._percentBase,
                            getResourceText("dbinit.createScripts")
                        );
                        WinJS.Promise.timeout(500).then(function () {
                            // init replication
                            var repl = new AppRepl.DbReplicator();
                            complete({});
                        });
                    }, function(err) {
                        Log.print(Log.l.error, "createProjectScripts:", err);
                        error(err);
                    });
                }, function(err) {
                    error(err);
                });
                Log.ret(Log.l.trace);
            },
            loadProjectData: function(that, complete, error) {
                var loadedProjectRelations = 0;
                Log.call(Log.l.trace, "AppData.DbInit.");
                // load data into project tables
                that.selectProjectRelations(that, complete, error).then(function(res) {
                    var projectRelations = [];
                    var projectRelationsType = [];
                    var projectRelationsState = [];
                    var loadCancelled = false;
                    var cancelOnError = function(err) {
                        loadCancelled = true;
                        error(err);
                    };
                    var getRelationState = function(index) {
                        return projectRelationsState[index];
                    };
                    var setRelationState = function(index, state) {
                        projectRelationsState[index] = state;
                        if (state === "finished") {
                            for (var j = projectRelationsState.length - 1; j >= 0; j--) {
                                if (projectRelations[j] && projectRelationsState[j] !== state) {
                                    return;
                                }
                            }
                            that.incPercentBase();
                            that.createProjectScripts(that, complete, error);
                        }
                    };
                    var loadRinf = function(relationName, fncDbInsert) {
                        if (loadCancelled) {
                            Log.print(Log.l.error, "loadProjectData.loadRinf: relationName=" + relationName + " cancelled!");
                        } else {
                            var relation = AppData.getFormatView(relationName, 0, true);
                            relation.selectAll(function(json) {
                                Log.print(Log.l.info, "loadProjectData: select LOAD" + relation.relationName + " fetch success!");
                                if (json && json.d && json.d.results && json.d.results.length > 0) {
                                    fncDbInsert(relation, json.d.results);
                                } else {
                                    Log.print(Log.l.info, "loadProjectData.dbInsert: NO DATA for select LOAD" + relation.relationName);
                                    //cancelOnError({ status: 404, statusText: "loadConfigData.attribSpec: no data found!" });
                                }
                            }, function(errorResponse) {
                                Log.print(Log.l.error, "loadProjectData.dbInsert: select LOAD" + relation.relationName + " Error: " + AppData.getErrorMsgFromResponse(errorResponse));
                                cancelOnError(errorResponse);
                            }, null);
                        }
                    };
                    var localDbInsert = function(relation, results) {
                        if (loadCancelled) {
                            Log.print(Log.l.info, "loadProjectData.dbInsert: relationName=" + relation.relationName + " cancelled!");
                        } else {
                            var isRinf;
                            var projectRelationName;
                            if (relation.relationName.substr(0, 4) === "RINF") {
                                projectRelationName = relation.relationName.substr(4);
                                isRinf = true;
                            } else {
                                projectRelationName = relation.relationName;
                                isRinf = false;
                            }
                            var index = projectRelations.indexOf(projectRelationName);
                            if (index >= 0) {
                                if (index > 0) {
                                    for (var j = index - 1; j >= 0; j--) {
                                        if (projectRelationsType[j] < projectRelationsType[index] &&
                                            getRelationState(j) !== "finished") {
                                            Log.print(Log.l.info, "loadProjectData.dbInsert: relationName=" + relation.relationName +
                                                " status=" + getRelationState(j) + " of relation " + projectRelations[j] +
                                                " blocked load - try insert later!");
                                            WinJS.Promise.timeout(100).then(function() {
                                                localDbInsert(relation, results);
                                            });
                                            return;
                                        }
                                    }
                                }
                                if (!isRinf) {
                                    setRelationState(index, "loading");
                                } else if (getRelationState(index) !== "finished") {
                                    Log.print(Log.l.info, "loadProjectData.dbInsert: relationName=RINF" + relation.relationName +
                                        " status=" + getRelationState(index) + " of relation " + projectRelations[index] +
                                        " blocked load - try insert later!");
                                    WinJS.Promise.timeout(100).then(function() {
                                        localDbInsert(relation, results);
                                    });
                                }
                                relation.dbInsert(relation, function() {
                                    Log.print(Log.l.info, "loadProjectData.dbInsert: relationName=" + relation.relationName + " insert success!");
                                    if (!isRinf) {
                                        var curindex = projectRelations.indexOf(relation.relationName);
                                        if (curindex >= 0) {
                                            setRelationState(curindex, "finished");
                                            loadedProjectRelations++;
                                            that.setPercent(
                                                that._percentBase + that.getPercentStep() * loadedProjectRelations / projectRelations.length,
                                                getResourceText("dbinit.loadData")
                                            );
                                        }
                                        if (relation.relationName.substr(0, 4) !== "INIT" &&
                                            relation.relationName.substr(0, 8) !== "LGNTINIT") {
                                            loadRinf("RINF" + relation.relationName, localDbInsert);
                                        }
                                    }
                                }, function(err) {
                                    Log.print(Log.l.error, "loadProjectData.dbInsert: relationName=" + relation.relationName + " Error: " + err);
                                    if (!isRinf) {
                                        var curindex = projectRelations.indexOf(relation.relationName);
                                        if (curindex >= 0) {
                                            setRelationState(curindex, "finished");
                                        }
                                    }
                                    cancelOnError(err);
                                }, results);
                            }
                        }
                    };
                    //lgntInitData
                    var loadLgntInit = function(relationName) {
                        if (loadCancelled) {
                            Log.print(Log.l.error, "loadProjectData.loadLgntInit: relationName=" + relationName + " cancelled!");
                        } else {
                            var relation = AppData.getLgntInit(relationName, true);
                            relation.selectAll(function(json) {
                                Log.print(Log.l.info, "loadProjectData: select " + relation.relationName + " fetch success!");
                                var curindex = projectRelations.indexOf(relation.relationName);
                                if (curindex >= 0) {
                                    if (json && json.d && json.d.results && json.d.results.length > 0) {
                                        setRelationState(curindex, "selected");
                                        localDbInsert(relation, json.d.results);
                                    } else {
                                        setRelationState(curindex, "finished");
                                        Log.print(Log.l.info, "loadProjectData.dbInsert: NO DATA for select " + relation.relationName);
                                        loadedProjectRelations++;
                                        that.setPercent(
                                            that._percentBase + that.getPercentStep() * loadedProjectRelations / projectRelations.length,
                                            getResourceText("dbinit.loadData")
                                        );
                                        //cancelOnError({ status: 404, statusText: "loadConfigData.attribSpec: no data found!" });
                                    }
                                }
                            }, function(errorResponse) {
                                var curindex = projectRelations.indexOf(relationName);
                                if (curindex >= 0) {
                                    setRelationState(curindex, "finished");
                                }
                                Log.print(Log.l.error, "loadProjectData.dbInsert: select " + relation.relationName + " Error: " + AppData.getErrorMsgFromResponse(errorResponse));
                                cancelOnError(errorResponse);
                            }, null, { allLanguages : true });
                        }
                    };
                    var loadFormatView = function(relationName, bLoadDbSiteSpec) {
                        if (loadCancelled) {
                            Log.print(Log.l.error, "loadProjectData.loadFormatView: relationName=" + relationName + " cancelled!");
                        } else {
                            var relation = AppData.getFormatView(relationName, 0, true);
                            relation.selectAll(function(json) {
                                var curindex = projectRelations.indexOf(relation.relationName);
                                Log.print(Log.l.info, "loadProjectData: select LOAD" + relation.relationName + " fetch success!");
                                if (json && json.d && json.d.results && json.d.results.length > 0) {
                                    if (bLoadDbSiteSpec) {
                                        var firstRow = json.d.results[0];
                                        var pkName = relation.relationName + "VIEWID";
                                        var dbSiteId = AppData._persistentStates.odata.dbSiteId;
                                        var locationId = firstRow[pkName];
                                        if (dbSiteId) {
                                            var results = [
                                                {
                                                    DBSiteSpecID: dbSiteId,
                                                    Name: AppData.appSettings.odata.login, // login is the site name!
                                                    LocalFlag: 1,
                                                    Location: null,
                                                    Address: null,
                                                    Description: "This is the App's local site",
                                                    LocationID: locationId
                                                }
                                            ];
                                            Log.print(Log.l.info, "inserting dbSiteId=" + dbSiteId);
                                            that.dbSiteSpec.dbInsert(that.dbSiteSpec, function() {
                                                Log.print(Log.l.info, "dbSiteSpec.dbInsert: dbSiteId=" + dbSiteId);
                                            }, function(err) {
                                                Log.print(Log.l.info, "dbSiteSpec.dbInsert: error " + err);
                                                cancelOnError(err);
                                            }, results);
                                        }
                                    }
                                    if (curindex >= 0) {
                                        projectRelationsState[curindex] = "selected";
                                    }
                                    localDbInsert(relation, json.d.results);
                                } else {
                                    if (curindex >= 0) {
                                        projectRelationsState[curindex] = "finished";
                                    }
                                    Log.print(Log.l.info, "loadProjectData.dbInsert: NO DATA for select LOAD" + relation.relationName);
                                    loadedProjectRelations++;
                                    that.setPercent(
                                        that._percentBase + that.getPercentStep() * loadedProjectRelations / projectRelations.length,
                                        getResourceText("dbinit.loadData")
                                    );
                                    //cancelOnError({ status: 404, statusText: "loadConfigData.attribSpec: no data found!" });
                                }
                            }, function(errorResponse) {
                                var curindex = projectRelations.indexOf(relationName);
                                if (curindex >= 0) {
                                    projectRelationsState[curindex] = "finished";
                                }
                                Log.print(Log.l.error, "loadProjectData.dbInsert: select LOAD" + relation.relationName + " Error: " + AppData.getErrorMsgFromResponse(errorResponse));
                                cancelOnError(errorResponse);
                            }, null);
                        }
                    };
                    if (res && res.rows) {
                        for (var i = 0; i < res.rows.length && !loadCancelled; i++) {
                            var replicationSpecRow = res.rows.item(i);
                            if (replicationSpecRow.PollInterval === 1 ||
                                replicationSpecRow.ContentDescr === "USERSPEC") {
                                projectRelations[i] = replicationSpecRow.RelationName;
                                projectRelationsType[i] = replicationSpecRow.ReplicationType;
                                projectRelationsState[i] = "selecting";
                                if (replicationSpecRow.ContentDescr === "INIT") {
                                    loadLgntInit(replicationSpecRow.RelationName);
                                } else {
                                    loadFormatView(replicationSpecRow.RelationName, replicationSpecRow.ContentDescr === "USERSPEC" ? true : false);
                                }
                            }
                        }
                    }
                }, function(err) {
                    error(err);
                });
                Log.ret(Log.l.trace);
            },
            createProjectRelations: function(that, complete, error) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                AppData._db.sqlBatch(that.createScript, function() {
                    Log.print(Log.l.trace, "createProjectRelations: success!");
                    that.incPercentBase();
                    if (typeof that._progress === "function") {
                        that.setPercent(
                            that._percentBase,
                            getResourceText("dbinit.loadData")
                        );
                    }
                    that.loadProjectData(that, complete, error);
                }, function(err) {
                    Log.print(Log.l.error, "createProjectRelations:", err);
                    error(err);
                });
                Log.ret(Log.l.trace);
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "AppData.DbInit.");
                var url = null;
                if (response && response.d && response.d.__next) {
                    var pos = response.d.__next.indexOf("://");
                    if (pos > 0) {
                        var pos2 = response.d.__next.substr(pos + 3).indexOf("/");
                        if (pos2 > 0) {
                            var pos3 = response.d.__next.substr(pos + 3 + pos2 + 1).indexOf("/");
                            if (pos3 > 0) {
                                url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath +
                                    response.d.__next.substr(pos + 3 + pos2 + 1 + pos3);
                            }
                        }
                    }
                    Log.ret(Log.l.trace, "next=" + url);
                } else {
                    Log.ret(Log.l.trace, "finished");
                }
                return url;
            },
            fetchNextAttribSpecs: function (that, results, next, followFunction, complete, error, param) {
                Log.call(Log.l.trace, "AppData.DbInit.", "next=" + next);
                var user = AppData.getOnlineLogin();
                var password = AppData.getOnlinePassword();
                var options = {
                    type: "GET",
                    url: next,
                    user: user,
                    password: password,
                    customRequestInitializer: function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(user + ":" + password)
                    }
                };
                Log.print(Log.l.info, "calling xhr method=GET url=" + next);
                var ret = WinJS.xhr(options).then(function (response) {
                    Log.print(Log.l.trace, "success!");
                    try {
                        var obj = JSON.parse(response.responseText);
                        if (obj && obj.d) {
                            results = results.concat(obj.d.results);
                            var next = that.getNextUrl(obj);
                            if (next) {
                                return that.fetchNext(that, results, next, followFunction, complete, error, param);
                            } else {
                                followFunction(complete, param, results);
                            }
                        } else {
                            var err = { status: 404, statusText: "no data found" };
                            error(err);
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                        error({ status: 500, statusText: "data parse error " + (exception && exception.message) });
                    }
                    return WinJS.Promise.as();
                }, function(errorResponse) {
                    Log.print(Log.l.error, "error: " + AppData.getErrorMsgFromResponse(errorResponse));
                    error(errorResponse);
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            fetchAllAttribSpecs: function(that, obj, followFunction, complete, error, param) {
                Log.call(Log.l.trace, "AppData.DbInit.", "");
                var retNext;
                var next = that.getNextUrl(obj);
                if (next) {
                    retNext = that.fetchNextAttribSpecs(that, obj.d.results, next, followFunction, complete, error, param);
                } else {
                    if (obj && obj.d) {
                        var results = obj.d.results;
                        followFunction(complete, param, results);
                    } else {
                        error({ status: 404, statusText: "AttribSpecs no data found for relationName=" + param });
                    }
                    retNext = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return retNext;
            },
            getAttribSpecs: function(that, relationName, complete, error) {
                var ret;
                Log.call(Log.l.trace, "AppData.DbInit.", "relationName=" + relationName);
                var loadAttribSpecs = function () {
                    var followFunction = function(complete, relationName, results) {
                        if (relationName === "AttribSpec") {
                            results.push({
                                AttributeIDX: 12,
                                Name: "RelationName",
                                Format: 12,
                                Function: 1,
                                Param: 31,
                                PParam: null
                            });
                            results.push({
                                AttributeIDX: 13,
                                Name: "BaseRelationName",
                                Format: 12,
                                Function: 1,
                                Param: 31,
                                PParam: null
                            });
                            results.push({
                                AttributeIDX: 14,
                                Name: "BaseRelationID",
                                Format: 4,
                                Function: 1,
                                Param: 0,
                                PParam: null
                            });
                            results.push({
                                AttributeIDX: 15,
                                Name: "BaseAttributeName",
                                Format: 12,
                                Function: 1,
                                Param: 31,
                                PParam: null
                            });
                            results.push({
                                AttributeIDX: 15,
                                Name: "ODataAttributeName",
                                Format: 12,
                                Function: 1,
                                Param: 31,
                                PParam: null
                            });
                            results.push({
                                AttributeIDX: 15,
                                Name: "RefRINFRelationName",
                                Format: 12,
                                Function: 1,
                                Param: 31,
                                PParam: null
                            });
                        }
                        complete(results);
                    };
                    var url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath;
                    url += "/AttribSpecExtView?$filter=(RelationName%20eq%20'" + relationName + "')&$format=json&$orderby=AttributeIDX";
                    var user = AppData.getOnlineLogin();
                    var password = AppData.getOnlinePassword();
                    var options = {
                        type: "GET",
                        url: url,
                        user: user,
                        password: password,
                        customRequestInitializer: function (req) {
                            if (typeof req.withCredentials !== "undefined") {
                                req.withCredentials = true;
                            }
                        },
                        headers: {
                            "Authorization": "Basic " + btoa(user + ":" + password)
                        }
                    };
                    Log.print(Log.l.info, "calling xhr method=GET url=" + url);
                    return WinJS.xhr(options).then(function (responseAttribSpec) {
                        Log.print(Log.l.trace, "success!");
                        try {
                            var json = JSON.parse(responseAttribSpec.responseText);
                            that.fetchAllAttribSpecs(that, json, followFunction, complete, error, relationName);
                        } catch (exception) {
                            Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                            error({ status: 500, statusText: "AttribSpecExtView parse error " + (exception && exception.message) });
                        }
                        return WinJS.Promise.as();
                    }, function (errorResponse) {
                        Log.print(Log.l.error, "error: " + AppData.getErrorMsgFromResponse(errorResponse));
                        error(errorResponse);
                    });
                };
                if (that.configLoaded) {
                    var results = [];
                    var stmt = "SELECT \"AttribSpec\".* FROM \"AttribSpec\",\"RelationSpec\" WHERE \"AttribSpec\".\"RelationID\"=\"RelationSpec\".\"RelationID\" AND \"RelationSpec\".\"Name\"=?";
                    var values = [relationName];
                    Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                    ret = SQLite.xsql(AppData._db, stmt, values).then(function (res) {
                        Log.print(Log.l.trace, "SELECT * FROM \"AttribSpec\" success!");
                        if (res && res.rows) {
                            for (var i = 0; i < res.rows.length; i++) {
                                var row = res.rows.item(i);
                                results.push(row);
                            }
                        }
                        return WinJS.Promise.as();
                    }, function(err) {
                        Log.print(Log.l.error, "SELECT * FROM \"AttribSpec\" error " + err);
                        error(err);
                    }).then(function () {
                        if (results.length === 0) {
                            return loadAttribSpecs();
                        } else {
                            complete(results);
                            return WinJS.Promise.as();
                        }
                    });
                } else {
                    return loadAttribSpecs();
                }
                Log.ret(Log.l.trace);
                return ret;
            },
            _serverView: {},
            createServerViews: function() {
                for (var i = 0; i < this._baseRelations.length; i++) {
                    if (!this._serverView[this._baseRelations[i]]) {
                        this._serverView[this._baseRelations[i]] = new AppData.configViewData(this._baseRelations[i]);
                    }
                }
            },
            relationSpec: {
                get: function() {
                    if (!this._serverView.RelationSpec) {
                        this.createServerViews();
                    }
                    return this._serverView.RelationSpec;
                }
            },
            attribSpec: {
                get: function() {
                    if (!this._serverView.AttribSpec) {
                        this.createServerViews();
                    }
                    return this._serverView.AttribSpec;
                }
            },
            relationScript: {
                get: function() {
                    if (!this._serverView.RelationScript) {
                        this.createServerViews();
                    }
                    return this._serverView.RelationScript;
                }
            },
            replicationSpec: {
                get: function() {
                    if (!this._serverView.ReplicationSpec) {
                        this.createServerViews();
                    }
                    return this._serverView.ReplicationSpec;
                }
            },
            dbSiteSpec: {
                get: function() {
                    if (!this._serverView.DBSiteSpec) {
                        this.createServerViews();
                    }
                    return this._serverView.DBSiteSpec;
                }
            },
            recordInfoFlowSpec: {
                get: function() {
                    if (!this._serverView.RecordInfoFlowSpec) {
                        this.createServerViews();
                    }
                    return this._serverView.RecordInfoFlowSpec;
                }
            },
            replicationFlowSpec: {
                get: function() {
                    if (!this._serverView.ReplicationFlowSpec) {
                        this.createServerViews();
                    }
                    return this._serverView.ReplicationFlowSpec;
                }
            },
            languageSpec: {
                get: function () {
                    if (!this._serverView.LanguageSpec) {
                        this.createServerViews();
                    }
                    return this._serverView.LanguageSpec;
                }
            },
            _percentSteps: null,
            _percentStepsIdx: 0,
            _percentBase: 0,
            getPercentStep: function() {
                return this._percentSteps[this._percentStepsIdx];
            },
            getMaxPercent: function () {
                var ret = 0;
                for (var i = 0; i <= this._percentStepsIdx; i++) {
                    ret += this._percentSteps[i];
                }
                return ret;
            },
            incPercentBase: function() {
                this._percentBase += this.getPercentStep();
                this._percentStepsIdx ++;
            },
            _prevPercent: 0,
            setPercent: function (percent, statusText) {
                if (percent < this._prevPercent) {
                    Log.print(Log.l.error, "percent=" + percent + " < prevPercent=" + this._prevPercent);
                } else {
                    var max = this.getMaxPercent();
                    if (percent > max) {
                        Log.print(Log.l.error, "percent=" + percent + " > max=" + max);
                        this._prevPercent = max;
                    } else {
                        this._prevPercent = percent;
                    }
                }
                if (typeof this._progress === "function") {
                    this._progress({
                        percent: this._prevPercent,
                        statusText: statusText
                    });
                }
            },
            _percent: 0,
            _progress: null,
            _configLoaded: false,
            configLoaded: {
                get: function() {
                    return this._configLoaded;
                }
            },
            _baseRelations: [
                "RelationSpec",
                "AttribSpec",
                "RelationScript",
                "ReplicationSpec",
                "DBSiteSpec",
                "RecordInfoFlowSpec",
                "ReplicationFlowSpec",
                "LanguageSpec"
            ],
            _baseRelationIds: [
                8001,
                10001,
                13001,
                16300,
                14510,
                14600,
                16340,
                7601
            ],
            _baseRelationTypes: [
                "CONFIG",
                "CONFIG",
                "CONFIG",
                "CONFIG",
                "CONFIG",
                "CONFIG",
                "CONFIG",
                "CONFIG"
            ],
            _allRelations: [],
            _allRelationIds: [],
            _allRelationTypes: [],
            _userSpecIndex: 0,
            userSpecIndex: {
                get: function() {
                    return this._userSpecIndex;
                }
            },
            _createdCount: 0,
            _createScript: [],
            createScript: {
                get: function() {
                    return this._createScript;
                }
            },
            allRelations: {
                get: function() {
                    return this._allRelations;
                }
            },
            allRelationIds: {
                get: function() {
                    return this._allRelationIds;
                }
            },
            allRelationTypes: {
                get: function() {
                    return this._allRelationTypes;
                }
            }
        }),
        getDefLanguages: function() {
            return [
                { LanguageSpecID: 1031, Title: 'German (Germany)', ProjectStatus: 0, DOMCode: 'de-de', DefaultLanguage: 1, ShowLanguage: 'deutsch' },
                { LanguageSpecID: 1033, Title: 'English (USA)', ProjectStatus: 0, DOMCode: 'en-us', DefaultLanguage: null, ShowLanguage: 'english' },
                { LanguageSpecID: 1036, Title: 'French (France)', ProjectStatus: 0, DOMCode: 'fr-fr', DefaultLanguage: null, ShowLanguage: 'francaise' },
                { LanguageSpecID: 1040, Title: 'Italian (Italy)', ProjectStatus: 0, DOMCode: 'it-it', DefaultLanguage: null, ShowLanguage: 'italiano' }
            ];
        },
        getRelationId: function(relationName) {
            var ret = null;
            if (relationName && AppData._dbInit && AppData._dbInit.allRelationIds && AppData._dbInit.allRelations) {
                var index = AppData._dbInit.allRelations.indexOf(relationName);
                if (index >= 0) {
                    ret = AppData._dbInit.allRelationIds[index];
                }
            }
            return ret;
        },
        getRelationName: function (relationId) {
            var ret = null;
            if (relationId && AppData._dbInit && AppData._dbInit.allRelationIds && AppData._dbInit.allRelations) {
                var index = AppData._dbInit.allRelationIds.indexOf(relationId);
                if (index >= 0) {
                    ret = AppData._dbInit.allRelations[index];
                }
            }
            return ret;
        },
        isLocalRelation: function(relationName) {
            if (AppData._dbInit && AppData._dbInit.allRelations &&
                AppData._dbInit.allRelations.indexOf(relationName) >= 0) {
                return true;
            } else {
                return false;
            }
        },
        initLocalDB: function (complete, error, progress, bReInit) {
            var ret;
            Log.call(Log.l.trace, "AppData.", " bReInit=" + bReInit);
            if (AppData._dbInit && !bReInit) {
                complete({});
                Log.print(Log.l.trace, "local db already initialized");
                ret = WinJS.Promise.as();
            } else if (!AppData._db) {
                AppData._formatViews = [];
                AppData._lgntInits = [];
                AppData._dbInit = null;
                error({ status: 500, statusText: "Eror: local DB does not exist!" });
                ret = WinJS.Promise.as();
            } else {
                AppData._formatViews = [];
                AppData._lgntInits = [];
                AppData._dbInit = null;
                var options = {
                    user: AppData.appSettings.odata.login,
                    connectionType: 0,
                    connectionBusy: 0,
                    languageId: AppData.getLanguageId(),
                    uuid: window.device && window.device.uuid
                };
                ret = AppData.setConnectionProperties(AppData._db, options, function() {
                    // check for existence of ReplicationSpec table
                    return WinJS.Promise.as();
                }, function (err) {
                    error(err);
                }).then(function () {
                    // init empty DB
                    AppData._dbInit = new AppData.DbInit(complete, error, progress, bReInit);
                    return AppData._dbInit._promise;
                });
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        /**
         * @function openDB 
         * @memberof AppData
         * @param {AppData.DbInit~complete} complete - Success handler callback function.
         * @param {AppData.DbInit~error} error - Error handler callback function.
         * @param {AppData.DbInit~progress} error - Progress callback function.
         * @param {boolean} bReInit - True if an existing local SQLite database should be overwritten.
         * @description This function is used by the framework to open an existing or to initialize a new local SQLite storage database.
         *  New local storage databases are created and filled based on the configuration metadata retrieved automatically from the server database.
         */
        openDB: function (complete, error, progress, bReInit) {
            var ret;
            Log.call(Log.l.trace, "AppData.");
            Log.print(Log.l.info, "useOffline=" + AppData._persistentStates.odata.useOffline);
            var userId = null;
            if (typeof AppData._persistentStates.allRecIds !== "undefined" &&
                typeof AppData._persistentStates.allRecIds["Mitarbeiter"] !== "undefined") {
                userId = AppData._persistentStates.allRecIds["Mitarbeiter"];
                Log.print(Log.l.info, "userId=" + userId);
            }
            if (!userId ||
                !AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password ||
                !AppData.appSettings.odata.dbSiteId) {
                ret = new WinJS.Promise.as().then(function() {
                    AppData._formatViews = [];
                    AppData._lgntInits = [];
                    AppData._dbInit = null;
                    AppData._db = null;
                    complete({});
                    return WinJS.Promise.as();
                });
            } else if (!AppData._persistentStates.odata.useOffline) {
                ret = new WinJS.Promise.as().then(function () {
                    AppData._formatViews = [];
                    AppData._lgntInits = [];
                    AppData._dbInit = null;
                    AppData._db = null;
                    complete({});
                    return WinJS.Promise.as();
                });
            } else if (!AppData._db) {
                ret = SQLite.open({
                    name: 'leadsuccess.db',
                    location: 'default'
                }).then(function (db) {
                    AppData._db = db;
                    Log.print(Log.l.info, "SQLite.open returned!");
                    return AppData.initLocalDB(complete, error, progress, bReInit);
                }, function(err) {
                    AppData._formatViews = [];
                    AppData._lgntInits = [];
                    AppData._dbInit = null;
                    AppData._db = null;
                    Log.print(Log.l.info, "SQLite.open error!");
                    error(err);
                    return WinJS.Promise.as();
                });
            } else {
                Log.print(Log.l.info, "SQLite db already open");
                ret = AppData.initLocalDB(complete, error, progress, bReInit);
            }
            Log.ret(Log.l.trace);
            return ret;
        }
    });
})();
