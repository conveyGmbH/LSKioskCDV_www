// controller for page: dbinit
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dbinit.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/dbinit/dbinitService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("DBInit", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "DBInit.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataLogin: {
                    Login: "",
                    Password: "",
                    privacyPolicyFlag: false,
                    privacyPolicydisabled: false
                },
                progress: {
                    percent: 0,
                    text: "",
                    show: null
                }
            }, commandList]);

            var that = this;

            var getStartPage = function() {
                var startPage;
                var userId = null;
                if (typeof AppData._persistentStates.allRecIds !== "undefined" &&
                    typeof AppData._persistentStates.allRecIds["Mitarbeiter"] !== "undefined") {
                    userId = AppData._persistentStates.allRecIds["Mitarbeiter"];
                    Log.print(Log.l.info, "userId=" + userId);
                }
                if (!userId || 
                    !that.binding.appSettings.odata.login ||
                    !that.binding.appSettings.odata.password ||
                    !that.binding.appSettings.odata.dbSiteId) {
                    startPage = "login";
                } else {
                    startPage = "start";
                }
                return startPage;
            }
            this.getStartPage = getStartPage;

            // define handlers
            this.eventHandlers = {
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "DBInit.Controller.");
                    Application.navigateById("login", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
            }

            var openDb = function (complete, error, doReloadDb) {
                AppBar.busy = true;

                var ret;
                Log.call(Log.l.info, "DBInit.Controller.");
                if (AppRepl.replicator &&
                    AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "replicator still running - try later!");
                    ret = WinJS.Promise.timeout(500).then(function () {
                        return that.openDb(complete, error, doReloadDb);
                    });
                } else {
                    ret = AppData.openDB(function (json) {
                        AppBar.busy = false;
                        Log.print(Log.l.info, "openDB success!");
                        AppData._curGetUserDataId = 0;
                        AppData.getUserData();
                                function resultConverter(item, index) {
                                    var property = AppData.getPropertyFromInitoptionTypeID(item);
                                    if (property && property !== "individualColors" && (!item.pageProperty) && item.LocalValue) {
                                        item.colorValue = "#" + item.LocalValue;
                                        AppData.applyColorSetting(property, item.colorValue);
                                    }
                                }
                        var results = AppData._persistentStates.veranstoption;
                        if (results && results.length > 0) {
                                    AppData._persistentStates.serverColors = false;
                                    results.forEach(function (item, index) {
                                        resultConverter(item, index);
                                    });
                                    Application.pageframe.savePersistentStates();
                                }
                                Colors.updateColors();
                                if (typeof complete === "function") {
                                    complete({});
                                }
                    }, function (err) {
                        AppBar.busy = false;
                        Log.print(Log.l.error, "openDB error!");
                        AppData.setErrorMsg(that.binding, err);
                        if (typeof error === "function") {
                            error(err);
                        }
                    }, function (res) {
                        if (res) {
                            that.binding.progress = {
                                percent: res.percent,
                                text: res.statusText,
                                show: 1
                            }
                        }
                    }, doReloadDb);
                }
                Log.ret(Log.l.info);
                return ret;
            };
            that.openDb = openDb;

            var saveData = function (complete, error) {
                var err = null;
                Log.call(Log.l.trace, "DBInit.Controller.");
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                AppBar.busy = true;
                that.binding.appSettings.odata.onlinePath = AppData._persistentStatesDefaults.odata.onlinePath;
                that.binding.appSettings.odata.registerPath = AppData._persistentStatesDefaults.odata.registerPath;
                var ret = DBInit.loginRequest.insert(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                    Log.call(Log.l.trace, "loginRequest: success!");
                    // loginData returns object already parsed from json file in response
                    if (json && json.d && json.d.ODataLocation) {
                        if (json.d.InactiveFlag) {
                            AppBar.busy = false;
                            err = { status: 503, statusText: getResourceText("dbinit.inactive") };
                            AppData.setErrorMsg(that.binding, err);
                            error(err);
                                } else {
                            var location = json.d.ODataLocation;
                            if (location !== that.binding.appSettings.odata.onlinePath) {
                                that.binding.appSettings.odata.onlinePath = location + AppData._persistentStatesDefaults.odata.onlinePath;
                                that.binding.appSettings.odata.registerPath = location + AppData._persistentStatesDefaults.odata.registerPath;
                                }
                                Application.pageframe.savePersistentStates();
                                }
                    } else {
                        AppBar.busy = false;
                        err = { status: 404, statusText: getResourceText("dbinit.unknown") };
                        AppData.setErrorMsg(that.binding, err);
                        error(err);
                    }
                    return WinJS.Promise.as();
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                    Log.print(Log.l.error, "loginRequest error: " + AppData.getErrorMsgFromResponse(errorResponse));
                    // ignore this error here for compatibility!
                    return WinJS.Promise.as();
                }, {
                    LoginName: AppData._persistentStates.odata.login
                            }).then(function () {
                    if (!err) {
                        var deviceID = "";
                        if (window.device && window.device.uuid) {
                            deviceID = "DeviceID=" + window.device.uuid;
                        }
                        var dataLogin = {
                            Login: AppData._persistentStates.odata.login,
                            Password: AppData._persistentStates.odata.password,
                            LanguageID: AppData.getLanguageId(),
                            Aktion: deviceID
                        };
                        return DBInit.loginView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.call(Log.l.trace, "loginData: success!");
                            // loginData returns object already parsed from json file in response
                            if (json && json.d) {
                                dataLogin = json.d;
                                if (dataLogin.OK_Flag === "X" && dataLogin.MitarbeiterID) {
                                    NavigationBar.enablePage("settings");
                                    NavigationBar.enablePage("info");
                                    NavigationBar.enablePage("search");
                                    var prevMitarbeiterId = AppData.generalData.getRecordId("Mitarbeiter");
                                    var doReloadDb = false;
                                    if (!AppData._persistentStates.odata.dbSiteId ||
                                        prevMitarbeiterId !== dataLogin.MitarbeiterID ||
                                        AppData._persistentStates.odata.dbinitIncomplete) {
                                        doReloadDb = true;
                                    }
                                    Log.print(Log.l.info, "loginData: doReloadDb=" + doReloadDb + " useOffline=" + that.binding.appSettings.odata.useOffline);
                                    if (doReloadDb) {
                                        AppData._persistentStates.allRestrictions = {};
                                        AppData._persistentStates.allRecIds = {};
                                        AppData._userData = {};
                                        AppData._persistentStates.veranstoption = {};
                                        AppData._userRemoteData = {};
                                        AppData._contactData = {};
                                        AppData._photoData = null;
                                        AppData._barcodeType = null;
                                        AppData._barcodeRequest = null;
                                        AppData.generalData.setRecordId("Mitarbeiter", dataLogin.MitarbeiterID);
                                    }
                                    if (that.binding.appSettings.odata.useOffline) {
                                        if (doReloadDb) {
                                            AppData._persistentStates.odata.dbSiteId = dataLogin.Mitarbeiter_AnmeldungVIEWID;
                                            Application.pageframe.savePersistentStates();
                                        }
                                        return that.openDb(complete, error, doReloadDb);
                                    } else {
                                        AppBar.busy = false;
                                        AppData.generalData.setRecordId("Kontakt", dataLogin.KontaktID);
                                        AppData._curGetUserDataId = 0;
                                        AppData.getUserData();
                                        complete(json);
                                        return WinJS.Promise.as();
                                    }
                                } else {
                                    AppBar.busy = false;
                                    that.binding.messageText = dataLogin.MessageText;
                                    err = { status: 401, statusText: dataLogin.MessageText };
                                    AppData.setErrorMsg(that.binding, err);
                                    error(err);
                                    return WinJS.Promise.as();
                                }
                            } else {
                                AppBar.busy = false;
                                err = { status: 404, statusText: "no data found" };
                                AppData.setErrorMsg(that.binding, err);
                                error(err);
                                return WinJS.Promise.as();
                            }
                        }, function (errorResponse) {
                            AppBar.busy = false;
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            error(errorResponse);
                                return WinJS.Promise.as();
                        }, dataLogin);
                        } else {
                            return WinJS.Promise.as();
                        }
                        });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                // now open the DB
                return WinJS.Promise.timeout(0);
            }).then(function () {
                if (AppData._persistentStates.odata.dbinitIncomplete) {
                    Log.print(Log.l.trace, "Appheader refresh complete");
                    Application.pageframe.hideSplashScreen();
                }
                Application.navigateById(getStartPage(), null, true);
            });
            Log.ret(Log.l.trace);
        })
    });
})();


