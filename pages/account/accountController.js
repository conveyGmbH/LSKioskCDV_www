// controller for page: account
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
/// <reference path="~/www/pages/account/accountService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Account", {
        getClassNameOffline: function (useOffline) {
            return useOffline ? "field_line field_line_even" : "hide-element";
        },
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Account.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataLogin: {
                    Login: AppData._persistentStates.odata.login,
                    Password: AppData._persistentStates.odata.password,
                    INITSpracheID: 0,
                    LanguageID: null
                },
                doEdit: false,
                doReloadDb: false,
                progress: {
                    percent: 0,
                    text: "",
                    show: null
                }
            }, commandList]);

            // select combo
            var initSprache = pageElement.querySelector("#InitSprache");

            var prevLogin = AppData._persistentStates.odata.login;
            var prevPassword = AppData._persistentStates.odata.password;
            var prevHostName = AppData._persistentStates.odata.hostName;
            var prevOnlinePort = AppData._persistentStates.odata.onlinePort;
            var prevOnlinePath = AppData._persistentStates.odata.onlinePath;
            var prevUseOffline = AppData._persistentStates.odata.useOffline;
            if (!prevLogin || !prevPassword || !prevHostName) {
                // enable edit per default on empty settings
                this.binding.doEdit = true;
            }
            var portalLink = pageElement.querySelector("#portalLink");
            if (portalLink) {
                var portalLinkUrl = (AppData._persistentStates.odata.https ? "https://" : "http://") +
                    AppData._persistentStates.odata.hostName + getResourceText("account.portalPath");
                portalLink.innerHTML = "<a href=\"" + portalLinkUrl + "\">" + portalLinkUrl + "</a>";
            }
            var contentarea = pageElement.querySelector(".contentarea");

            var that = this;

            var resultConverter = function (item, index) {
                var property = AppData.getPropertyFromInitoptionTypeID(item);
                if (property && property !== "individualColors" && (!item.pageProperty) && item.LocalValue) {
                    item.colorValue = "#" + item.LocalValue;
                    AppData.applyColorSetting(property, item.colorValue);
                }
            }
            this.resultConverter = resultConverter;

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("login", event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickDoEdit: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.doEdit = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickDoReloadDb: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified && that.binding.doEdit) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.doReloadDb = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickHttps: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified && that.binding.doEdit) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.appSettings.odata.https = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseOffline: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified && that.binding.doEdit) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.appSettings.odata.useOffline = toggle.checked;
                            AppBar.triggerDisableHandlers();
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function() {
                    // work on user change handling!
                    if (!that.binding.appSettings.odata.useOffline) {
                        that.binding.doReloadDb = false;
                    } else if (that.binding.dataLogin.Login !== prevLogin ||
                        that.binding.dataLogin.Password !== prevPassword ||
                        that.binding.appSettings.odata.hostName !== prevHostName ||
                        that.binding.appSettings.odata.onlinePort !== prevOnlinePort ||
                        that.binding.appSettings.odata.onlinePath !== prevOnlinePath ||
                        !prevUseOffline) {
                        that.binding.doReloadDb = true;
                        that.binding.doEdit = true;
                    }
                    if (AppBar.busy) {
                        NavigationBar.disablePage("start");
                    } else {
                        NavigationBar.enablePage("start");
                    }
                    return AppBar.busy;
                }
            };

            var openDb = function (complete, error) {
                var ret;
                Log.call(Log.l.info, "Account.Controller.");
                if (AppRepl.replicator &&
                    AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "replicator still running - try later!");
                    ret = WinJS.Promise.timeout(500).then(function () {
                        that.openDb(complete, error);
                    });
                } else {
                    ret = AppData.openDB(function (json) {
                        AppBar.busy = false;
                        AppData._curGetUserDataId = 0;
                        AppData.getUserData();
                        complete(json);
                    }, function (curerr) {
                        AppBar.busy = false;
                        AppData.setErrorMsg(that.binding, curerr);
                        AppData._persistentStates.odata.dbSiteId = 0;
                        Application.pageframe.savePersistentStates();
                        error(curerr);
                    }, function (res) {
                        if (res) {
                            that.binding.progress = {
                                percent: res.percent,
                                text: res.statusText,
                                show: 1
                            };
                        }
                    }, true);
                }
                Log.ret(Log.l.info);
                return ret;
            };
            that.openDb = openDb;

            var setLanguage = function (results) {
                Log.call(Log.l.trace, "Account.Controller.");
                if (initSprache && results) {
                    for (var i = 0; i < results.length; i++) {
                        var row = results[i];
                        if (row.LanguageID === AppData.getLanguageId()) {
                            Log.print(Log.l.info, "found LanguageId=" + row.LanguageID);
                            that.binding.dataLogin.INITSpracheID = row.INITSpracheID;
                            break;
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            var getLanguage = function () {
                var ret = null;
                Log.call(Log.l.trace, "Account.Controller.");
                var results = Account.initSpracheView.getResults();
                var map = Account.initSpracheView.getMap();
                if (map && results) {
                    var curIndex = map[that.binding.dataLogin.INITSpracheID];
                    if (typeof curIndex !== "undefined") {
                        var row = results[curIndex];
                        Log.print(Log.l.info, "found LanguageId=" + row.LanguageID);
                        ret = row.LanguageID;
                    }
                }
                Log.ret(Log.l.trace);
                return ret;
            }

            var loadData = function () {
                Log.call(Log.l.trace, "Account.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!Account.initSpracheView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initSpracheView...");
                        //@nedra:25.09.2015: load the list of INITAnrede for Combobox
                        return Account.initSpracheView.select(function (json) {
                            Log.print(Log.l.trace, "initSpracheView: success!");
                            if (json && json.d) {
                                var results = json.d.results;
                                // Now, we call WinJS.Binding.List to get the bindable list
                                if (initSprache && initSprache.winControl) {
                                    initSprache.winControl.data = new WinJS.Binding.List(results);
                                    setLanguage(results);
                                }
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        if (initSprache && initSprache.winControl) {
                            var results = Account.initSpracheView.getResults();
                            initSprache.winControl.data = new WinJS.Binding.List(results);
                            setLanguage(results);
                        }
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var saveData = function (complete, error) {
                var err = null, ret;
                Log.call(Log.l.trace, "Account.Controller.");
                if (contentarea) {
                    contentarea.scrollTop = 0;
                }
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                if (!that.binding.doEdit) {
                    var newLanguageId = getLanguage();
                    if (newLanguageId !== AppData._persistentStates.languageId) {
                        AppData._persistentStates.languageId = newLanguageId;
                        Application.pageframe.savePersistentStates();
                    }
                    ret = WinJS.Promise.as();
                    complete({});
                } else {
                    AppBar.busy = true;
                    that.binding.appSettings.odata.onlinePath = AppData._persistentStatesDefaults.odata.onlinePath;
                    that.binding.appSettings.odata.registerPath = AppData._persistentStatesDefaults.odata.registerPath;
                    ret = Account.loginRequest.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.call(Log.l.trace, "loginRequest: success!");
                        // loginData returns object already parsed from json data in response
                        if (json && json.d && json.d.ODataLocation) {
                            if (json.d.InactiveFlag) {
                                AppBar.busy = false;
                                err = { status: 503, statusText: getResourceText("account.inactive") };
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
                            err = { status: 404, statusText: getResourceText("login.unknown") };
                            AppData.setErrorMsg(that.binding, err);
                            error(err);
                        }
                        return WinJS.Promise.as();
                    }, function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        Log.print(Log.l.error, "loginRequest error: " + AppData.getErrorMsgFromResponse(errorResponse));
                        // ignore this error here for compatibility!
                        return WinJS.Promise.as();
                    }, {
                        LoginName: that.binding.dataLogin.Login
                    }).then(function () {
                        if (!err) {
                            var dataLogin = {
                                Login: that.binding.dataLogin.Login,
                                Password: that.binding.dataLogin.Password,
                                LanguageID: getLanguage(),
                                Aktion: "Kiosk"
                            };
                            return Account.loginView.insert(function(json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "loginData: success!");
                                // loginData returns object already parsed from json data in response
                                if (json && json.d) {
                                    dataLogin = json.d;
                                    if (dataLogin.OK_Flag === "X" && dataLogin.MitarbeiterID) {
                                        AppData._persistentStates.odata.login = that.binding.dataLogin.Login;
                                        AppData._persistentStates.odata.password = that.binding.dataLogin.Password;
                                        NavigationBar.enablePage("settings");
                                        NavigationBar.enablePage("info");
                                        var prevMitarbeiterId = AppData.getRecordId("Mitarbeiter");
                                        var doReloadDb = false;
                                        if (prevMitarbeiterId !== dataLogin.MitarbeiterID ||
                                            that.binding.doReloadDb) {
                                            doReloadDb = true;
                                        }
                                        Log.print(Log.l.info, "loginData: doReloadDb=" + doReloadDb + " useOffline=" + that.binding.appSettings.odata.useOffline);
                                        if (doReloadDb) {
                                            AppData._persistentStates.allRestrictions = {};
                                            AppData._persistentStates.allRecIds = {};
                                            AppData._userData = {};
                                            AppData._userRemoteData = {};
                                            AppData._contactData = {};
                                            AppData._photoData = null;
                                            AppData._barcodeType = null;
                                            AppData._barcodeRequest = null;
                                            AppData.setRecordId("Mitarbeiter", dataLogin.MitarbeiterID);
                                        }
                                        AppData._persistentStates.languageId = dataLogin.LanguageID;
                                        if (that.binding.appSettings.odata.useOffline) {
                                            if (doReloadDb) {
                                                AppData._persistentStates.odata.dbSiteId = dataLogin.Mitarbeiter_AnmeldungVIEWID;
                                                Application.pageframe.savePersistentStates();
                                                return that.openDb(complete, error);
                                            } else {
                                                Application.pageframe.savePersistentStates();
                                                AppBar.busy = false;
                                                AppData._curGetUserDataId = 0;
                                                AppData.getUserData();
                                                complete(json);
                                                return WinJS.Promise.as();
                                            }
                                        } else {
                                            AppBar.busy = false;
                                            AppData.setRecordId("Kontakt", dataLogin.KontaktID);
                                            Application.pageframe.savePersistentStates();
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
                            }, function(errorResponse) {
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
                    }).then(function () {
                        if (!err) {
                            // load color settings
                            return Account.CR_VERANSTOPTION_ODataView.select(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "Account: success!");
                                // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response
                                if (json && json.d && json.d.results && json.d.results.length > 0) {
                                    var results = json.d.results;
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                    });
                                } else {
                                    AppData._persistentStates.individualColors = false;
                                    AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                                    var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                                }
                                Application.pageframe.savePersistentStates();
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }).then(function () {
                                Colors.updateColors();
                                return WinJS.Promise.as();
                            });
                        } else {
                            return WinJS.Promise.as();
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
                AppBar.notifyModified = true;
                if (AppHeader && AppHeader.controller) {
                    return AppHeader.controller.loadData();
                } else {
                    return WinJS.Promise.as();
                }
            }).then(function () {
                Log.print(Log.l.trace, "Appheader refresh complete");
                Application.pageframe.hideSplashScreen();
            });
            Log.ret(Log.l.trace);
        })
    });
})();


