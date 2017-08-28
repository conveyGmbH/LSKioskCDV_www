// general app settings
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/sqlite.js" />
/// <reference path="../../../lib/convey/scripts/strings.js" />


/**
 * Use the methods and properties in this namespace to access application state and data access components.
 * @namespace AppData
 */

(function () {
    "use strict";

    WinJS.Namespace.define("AppData", {
        _persistentStatesDefaults: {
            colorSettings: {
                // navigation-color with 100% saturation and brightness
                accentColor: "#0078D7"
            },
            languageId: 0,
            prevLanguageId: 0,
            showAppBkg: false,
            logEnabled: false,
            logLevel: 3,
            logGroup: false,
            logNoStack: true,
            inputBorder: 1,
            appBarSize: 48,
            appBarHideOverflowButton: false,
            navigatorOptions: null,
            odata: {
                https: true,
                hostName: "",
                onlinePort: 8090,
                urlSuffix: null,
                onlinePath: "odata_online", // serviceRoot online requests
                login: "",
                password: "",
                registerPath: "odata_register", // serviceRoot register requests
                registerLogin: "",
                registerPassword: "",
                useOffline: false,
                replActive: false,
                replInterval: 30,
                replPrevPostMs: 0,
                replPrevSelectMs: 0,
                replPrevFlowSpecId: 0,
                replSyncPostOrder: false,
                dbSiteId: 0,
                serverSiteId: 1,
                timeZoneAdjustment: 0,
                timeZoneRemoteAdjustment: null,
                timeZoneRemoteDiffMs: 0,
                serverFailure: false
            }
        },
        _persistentStates: {},
        _db: null,
        _dbInit: null,
        _formatViews: [],
        _lgntInits: []
    });

    WinJS.Namespace.define("AppData", {
        /**
         * @property {Object} persistentStatesDefaults - Application state object.
         * @property {Object} persistentStatesDefaults.colorSettings - Application color settings.
         * @property {string} persistentStatesDefaults.colorSettings.accentColor - Application accent color.
         * @property {number} persistentStatesDefaults.languageId - Application language code.
         * @property {boolean} persistentStatesDefaults.logEnabled - Enable/disable logging.
         * @property {number} persistentStatesDefaults.logLevel - Current logging level.
         * @property {boolean} persistentStatesDefaults.logGroup - Enable/disable logging grouping.
         * @property {boolean} persistentStatesDefaults.logNoStack - Enable/disable logging optimization by ignoring function call stack on currently not logged functions.
         * @property {number} persistentStatesDefaults.inputBorder - Border width of HTML input controls in px. Default: 1
         * @property {number} persistentStatesDefaults.appBarSize - Height of application toolbar in px. Default: 48
         * @property {boolean} persistentStatesDefaults.appBarHideOverflowButton - Hide/show application toolbar overflow button. Default: false
         * @property {Object} persistentStatesDefaults.navigatorOptions - Optional application menu settings object. Default: null
         * @property {Object} persistentStatesDefaults.navigatorOptions.splitViewDisplayMode - SplitView menu settings object. 
         *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/dn919970.aspx WinJS.UI.SplitView object}.
         *  If this property is indefined, a matching display mode of the opened and closed SplitView menu is choosen in respect of the current application window size.
         *  Default: undefined. 
         * @property {string} persistentStatesDefaults.navigatorOptions.splitViewDisplayMode.opened - Display mode of opened SplitView menu. 
         *  See {@link https://msdn.microsoft.com/de-de/library/dn919982.aspx WinJS.UI.SplitView.OpenedDisplayMode enumeration}. 
         * @property {string} persistentStatesDefaults.navigatorOptions.splitViewDisplayMode.closed - Display mode of closed SplitView menu. 
         *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/mt661893.aspx WinJS.UI.SplitView.ClosedDisplayMode enumeration}. 
         * @property {Object} persistentStatesDefaults.odata - Database settings for online connections and background synchronisation to a database server using the {@link http://www.odata.org/ OData protocoll}.
         * @property {boolean} persistentStatesDefaults.odata.https - Database connections use HTTPS for encrypted data transfer. Default: true
         * @property {string} persistentStatesDefaults.odata.hostName - DNS name or IP address (if supported by the platform) of the OData producer. All server connections of the app will use this address.
         * @property {number} persistentStatesDefaults.odata.onlinePort - TCP port for database connections to the server. 
         * @property {string} persistentStatesDefaults.odata.onlinePath - Path to OData producer for all online database operations except initial registration data and user status verification provided as a virtual web server directory. Default: "odata_online"
         *  This directory will be automatically changed by the server in server farm proxy configurations.
         * @property {string} persistentStatesDefaults.odata.login - User name used to access the OData producer for online connections.
         * @property {string} persistentStatesDefaults.odata.password - Password used to access the OData producer for online connections.
         * @property {string} persistentStatesDefaults.odata.registerPath - Path to OData producer for initial registration data and user status verification database connection provided as a virtual web server directory. Default: "odata_register"
         *  This connection is used before user authentication to receive initial registration data and support path redirection in server farm proxy configurations
         * @property {string} persistentStatesDefaults.odata.registerLogin - User name used to access the OData producer for initial registration connection.
         * @property {string} persistentStatesDefaults.odata.registerPassword - Password used to access the OData producer for initial registration connection.
         * @property {boolean} persistentStatesDefaults.odata.useOffline - Activates offline data storage in a local SQLite database. This feature is only supported in mobile apps not in browser apps. Default: false
         * @property {boolean} persistentStatesDefaults.odata.replActive - Activates automatic background data synchronisation between offline data storage in a local SQLite database and the OData producer. This feature is only supported in mobile apps not in browser apps. Default: false
         * @property {number} persistentStatesDefaults.odata.replInterval - Replication interval of automatic background data synchronisation selects in seconds. Default: 30
         * @memberof AppData
         * @protected
         * @description Read/Write. Provides access to the application state default settings. Initialize this member first in you application startup code, usually at the top of index.js script.
         *  The user can change application settings in the app. The current application settings will be saved in an app specific json file and in JavaScript local storage. 
         *  File storage is priorized but only supported in mobile apps. Browser only apps will only support local storage for persistend application settings.
         *  Set the default settings of your app in the application startup code, usualli in the index.js file, like this:
         <pre>
        // default settings
        AppData.persistentStatesDefaults = {
            colorSettings: {
                // navigation-color with 100% saturation and brightness
                accentColor: "#ff3c00"
            },
            showAppBkg: false,
            logEnabled: false,
            logLevel: 3,
            logGroup: false,
            logNoStack: true,
            inputBorder: 1,
            odata: {
                https: false,
                hostName: "domino.convey.de",
                onlinePort: 8080,
                urlSuffix: null,
                onlinePath: "odata_online", // serviceRoot online requests
                login: "",
                password: "",
                useOffline: false,
                replActive: false,
                replInterval: 30
            }
        };
         </pre>
         */
        persistentStatesDefaults: {
            set: function(newPersistentStatesDefaults) {
                AppData._persistentStatesDefaults = newPersistentStatesDefaults;
                AppData._persistentStates = newPersistentStatesDefaults;
            },
            get: function() {
                return AppData._persistentStatesDefaults;
            }
        },
        getBaseURL: function (port) {
            return (AppData._persistentStates.odata.https ? "https" : "http") + "://" + AppData._persistentStates.odata.hostName +
                   (port !== 80 && port !== 443 ? ":" + port : "") +
                   (AppData._persistentStates.odata.urlSuffix ? ("/" + AppData._persistentStates.odata.urlSuffix) : "");
        },
        getOnlinePath: function(isRegister) {
            return isRegister ? AppData._persistentStates.odata.registerPath : AppData._persistentStates.odata.onlinePath;
        },
        getOnlineLogin: function(isRegister) {
            return isRegister ? AppData._persistentStates.odata.registerLogin : 
                (AppData._persistentStates.odata.login ? AppData._persistentStates.odata.login : (window.device && window.device.uuid));
        },
        getOnlinePassword: function (isRegister) {
            return isRegister ? AppData._persistentStates.odata.registerPassword :
                (AppData._persistentStates.odata.password ? AppData._persistentStates.odata.password : (window.device && window.device.uuid));
        }
    });
    WinJS.Namespace.define("AppData", {
        /**
         * @function getErrorMsgFromResponse
         * @param {Object} errorResponse - Error object, code or string returned by any function.
         * @returns {string} User-readable error message to display in an alert box 
         * @memberof AppData
         * @description Use this function to create a readable format of error messages.
         */
        getErrorMsgFromResponse: function (errorResponse) {
            var errorMsg = "";
            if (errorResponse) {
                if (typeof errorResponse === "string") {
                    errorMsg += errorResponse;
                } else if (typeof errorResponse === "number") {
                    errorMsg += "Error Status: " + errorResponse;
                } else if (typeof errorResponse === "object") {
                    if (errorResponse.status || errorResponse.code) {
                        errorMsg += "Error Status: ";
                        errorMsg += (errorResponse.status || errorResponse.code);
                        if (errorResponse.statusText || errorResponse.message) {
                            errorMsg += " " + (errorResponse.statusText || errorResponse.message);
                        }
                    } else if (errorResponse.statusText || errorResponse.message) {
                        errorMsg += errorResponse.statusText || errorResponse.message;
                    } 
                    if (!errorResponse.data && (errorResponse.responseText || errorResponse.response)) {
                        try {
                            errorResponse.data = JSON.parse(errorResponse.responseText || errorResponse.response);
                        } catch (exception) {
                            Log.print(Log.l.error, "resource parse error " + (errorResponse.responseText || errorResponse.response));
                            var div = document.createElement("div");
                            div.innerHTML = errorResponse.responseText || errorResponse.response;
                            errorResponse.data = {
                                error: {
                                    message: {
                                        value: div.textContent
                                    }
                                }
                            }
                        }
                    }
                    if (errorResponse.data) {
                        var data = errorResponse.data;
                        if (data.error) {
                            if (data.error.code) {
                                if (errorMsg.length > 0) {
                                    errorMsg += "\r\n";
                                }
                                Log.print(Log.l.error, "error code=" + data.error.code);
                                errorMsg += "Detailed Code: " + data.error.code;
                            }
                            if (data.error.message && data.error.message.value) {
                                if (errorMsg.length > 0) {
                                    errorMsg += "\r\n";
                                }
                                Log.print(Log.l.error, "error message=" + data.error.message.value);
                                errorMsg += data.error.message.value;
                            }
                        }
                        if (data.code || data.errno || data.hostname || data.syscall) {
                            errorMsg += "\r\nhostname: " + data.hostname +
                                "\r\nsyscall: " + data.syscall +
                                "\r\ncode: " + data.code +
                                "\r\nerrno: " + data.errno;
                        }
                    }
                }
            }
            return errorMsg;
        },
        /**
         * @function setErrorMsg
         * @param {Object} bindingObject - Binding proxy object to receive error message and display status. 
         *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229801.aspx WinJS.Binding.as() function}.
         * @param {Object} errorResponse - Error object, code or string returned by any function.
         * @memberof AppData
         * @description Use this function to fill a binding proxy within a page with error an message.
         *  If a page is currently loaded in the application toolbar scope, this function displays a flyout to show the error message in the page.
         */
        setErrorMsg: function (bindingObject, errorResponse) {
            if (bindingObject) {
                var error;
                if (errorResponse) {
                    error = {
                        errorMsg: AppData.getErrorMsgFromResponse(errorResponse),
                        displayErrorMsg: "block"
                    }
                } else {
                    error = {
                        errorMsg: "",
                        displayErrorMsg: "none"
                    }
                }
                bindingObject.error = error;
                if (AppBar.scope && AppBar.scope.element) {
                    var closeErrorMessage = function(element) {
                        WinJS.UI.Animation.fadeOut(element).done(function () {
                            bindingObject.error = {
                                errorMsg: "",
                                displayErrorMsg: "none"
                            }
                        });
                    }
                    var errorMessage = AppBar.scope.element.querySelector(".error-message");
                    if (errorMessage) {
                        errorMessage.onclick = function (event) {
                            closeErrorMessage(errorMessage);
                        }
                        //WinJS.Promise.timeout(30000).then(function() {
                        //    closeErrorMessage(errorMessage);
                        //});
                        if (errorResponse) {
                            //WinJS.UI.Animation.fadeIn(errorMessage).done(function() {
                            if (errorMessage.style) {
                                errorMessage.style.opacity = "";
                            }
                            //});
                        }
                    }
                }
            }
        },
        _language: "",
        /**
         * @property {string} language - BCP-47 language tag
         * @memberof AppData
         * @description Read/Write. Retrieves or sets the {@link https://tools.ietf.org/html/bcp47 BCP-47 language tag} of the primary language currently active in the app.
         */
        language: {
            get: function () { return Application._language; },
            set: function(newLanguage) {
                 Application._language = newLanguage;
            }
        },
        /**
         * @function getLanguageFromId
         * @param {number} languageId - A language identifier constant.
         * @returns {string} A BCP-47 language tag corresponding to the given language identifier.
         * @memberof AppData
         * @description Use this function to convert a {@link https://msdn.microsoft.com/en-us/library/windows/desktop/dd318693.aspx language identifier}, like 0x409 (decimal 1033), to a {@link https://tools.ietf.org/html/bcp47 BCP-47 language tag}, like "en-US".
         *  If the given language identifier is not supported, a default value of "en-US" will be returned.
         */
        getLanguageFromId: function (languageId) {
            var languages = AppData.getDefLanguages();
            for (var i = 0; i < languages.length; i++) {
                var row = languages[i];
                if (row.LanguageSpecID === languageId) {
                    Log.print(Log.l.trace, "found in default languages: " + row.DOMCode);
                    var pos = row.DOMCode.indexOf("-");
                    var language;
                    if (pos >= 0) {
                        language = row.DOMCode.substr(0, pos) + "-" + row.DOMCode.substr(pos + 1).toUpperCase();
                    } else {
                        language = row.DOMCode + "-" + row.DOMCode.toUpperCase();
                    }
                    return language;
                }
            }
            return "en-US";
        },
        /**
         * @function getLanguageId
         * @returns {string} The current language identifier constant.
         * @memberof AppData
         * @description Use this function to receive the {@link https://msdn.microsoft.com/en-us/library/windows/desktop/dd318693.aspx language identifier} of the primary language currently active in the app.
         *  The primary language will be determined from localization settings of the environment if not set in the app. If no language is set, a default value of 0x409 (decimal 1033) will be returned.
         */
        getLanguageId: function () {
            var language = Application.language.toLowerCase();
            var languages = AppData.getDefLanguages();
            for (var i = 0; i < languages.length; i++) {
                var row = languages[i];
                if (row.DOMCode.toLowerCase() === language) {
                    Log.print(Log.l.trace, "found in default languages: " + row.LanguageSpecID);
                    return row.LanguageSpecID;
                }
            }
            return 1033;
        },
        /**
         * @property {Object} appSettings - Application settings.
         * @property {Object} appSettings.odata - Database settings for online connections and background synchronisation to a database server using the {@link http://www.odata.org/ OData protocoll}.
         * @memberof AppData
         * @protected
         * @description Read-only. Provides access to some application settings. 
         *  See AppData.persistentStates property for further informations.
         */
        appSettings: {
            get: function() {
                var data = {
                    odata: AppData._persistentStates.odata
                };
                return data;
            }
        },
        setConnectionProperties: function(db, properties, complete, error) {
            Log.call(Log.l.trace, "createConnectionProperties.");

            var modifyProp = function(tx, prop, params) {
                var query = "SELECT * FROM \"ConnectionProperties\" WHERE \"Key\" = ?";
                var stmtInsert = "INSERT INTO \"ConnectionProperties\"(\"Value\",\"Text\",\"Key\") VALUES(?,?,?)";
                var stmtUpdate = "UPDATE \"ConnectionProperties\" SET \"Value\" = ?,\"Text\" = ? WHERE \"Key\" = ?";
                Log.print(Log.l.info, "createConnectionProperties.modifyProp: " + [query, [prop]]);
                tx.executeSql(query, [prop], function(tx2, res2) {
                    var nextStmt;
                    Log.print(Log.l.info, "createConnectionProperties.modifyProp: result count=" + res2.rows.length);
                    if (res2.rows.length === 0) {
                        nextStmt = stmtInsert;
                    } else {
                        nextStmt = stmtUpdate;
                    }
                    Log.print(Log.l.info, "createConnectionProperties.modifyProp: " + [nextStmt, params]);
                    tx2.executeSql(nextStmt, params, function (tx3, res3) {
                        Log.print(Log.l.info, "createConnectionProperties.modifyProp: " + "success!");
                    }, function (tx3, err) {
                        error(err);
                    });
                }, function(tx2, err) {
                    error(err);
                });
            }
            var values = [];
            var stmt = "PRAGMA foreign_keys = 1";
            Log.print(Log.l.info, stmt);
            var ret = SQLite.xsql(db, stmt, values).then(function() {
                Log.print(Log.l.info, "PRAGMA foreign_keys = 1: success!");
                stmt = "PRAGMA recursive_triggers = 1";
                Log.print(Log.l.info, stmt);
                return SQLite.xsql(db, stmt, values).then(function () {
                    Log.print(Log.l.info, "PRAGMA recursive_triggers = 1: success!");
                }, function (err) {
                    Log.print(Log.l.error, "PRAGMA recursive_triggers = 1: error!");
                    error(err);
                });
            }, function (err) {
                Log.print(Log.l.error, "PRAGMA foreign_keys = 1: error!");
                error(err);
            }).then(function () {
                stmt = "CREATE TABLE IF NOT EXISTS \"ConnectionProperties\"(\"ConnectionPropertiesID\" INTEGER,\"Key\" TEXT UNIQUE NOT NULL,\"Value\" INTEGER,\"Text\" TEXT,PRIMARY KEY(\"ConnectionPropertiesID\"))";
                Log.print(Log.l.info, stmt);
                return SQLite.xsql(db, stmt, values).then(function () {
                    Log.print(Log.l.info, "createConnectionProperties: CREATE TABLE success!");
                }, function (err) {
                    Log.print(Log.l.error, "createConnectionProperties: CREATE TABLE: error!");
                    error(err);
                });
            }).then(function () {
                return SQLite.tx(db, function(tx) {
                    for (var prop in properties) {
                        if (properties.hasOwnProperty(prop)) {
                            var value = null;
                            var text = null;
                            var type = typeof properties[prop];
                            if (type === "number") {
                                value = properties[prop];
                            } else {
                                text = properties[prop];
                            }
                            var params = [value, text, prop];
                            modifyProp(tx, prop, params);
                        }
                    }
                }).then(function() {
                    Log.print(Log.l.trace, "createConnectionProperties.db.transaction complete!");
                    complete();
                }, function(err) {
                    Log.print(Log.l.error, "createConnectionProperties.db.transaction error!");
                    error(err);
                });
            });
            Log.ret(Log.l.trace);
            return ret;
        }
    });
})();