// controller for page: login
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
/// <reference path="~/www/pages/login/loginService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Login", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Login.Controller.");
            var bIgnoreDuplicate = false;
            // delete login data first
            AppData._persistentStates.odata.login = null;
            AppData._persistentStates.odata.password = null;
            AppData._persistentStates.odata.dbSiteId = 0;
            AppData._persistentStates.allRestrictions = {};
            AppData._persistentStates.allRecIds = {};
            AppData._userData = {};
            AppData._userRemoteData = {};
            AppData._contactData = {};
            AppData._photoData = null;
            AppData._barcodeType = null;
            AppData._barcodeRequest = null;
            Application.pageframe.savePersistentStates();

            Application.Controller.apply(this, [pageElement, {
                dataLogin: {
                    Login: "",
                    Password: "",
                    privacyPolicyFlag: false
                },
                progress: {
                    percent: 0,
                    text: "",
                    show: null
                }
            }, commandList]);

            var that = this;

            var checkIPhoneBug = function () {
                if (navigator.appVersion) {
                    var testDevice = ["iPhone OS", "iPod OS"];
                    for (var i = 0; i < testDevice.length; i++) {
                        var iPhonePod = navigator.appVersion.indexOf(testDevice[i]);
                        if (iPhonePod >= 0) {
                            return true;
                        }
                    }
                }
                return false;
            };
            var isAppleDevice = checkIPhoneBug();

            var privacyPolicyLink = pageElement.querySelector("#privacyPolicyLink");
            if (privacyPolicyLink) {
                if (isAppleDevice) {
                    privacyPolicyLink
                        .innerHTML =
                        "<a onclick=\"cordova.InAppBrowser.open('https://" + getResourceText("login.privacyPolicyLink") + "'" + ", '_system');\">" +
                        getResourceText("login.privacyPolicy") +
                        "</a>";
                } else {
                    privacyPolicyLink.innerHTML = "<a class=\"checkbox\" href=\"https://" + getResourceText("login.privacyPolicyLink") + "\" target=\"_blank\">" + getResourceText("login.privacyPolicy") + "</a>";
                }
            }

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
                    Log.call(Log.l.trace, "Login.Controller.");
                    Application.navigateById("start", event, true);
                    Log.ret(Log.l.trace);
                },
                clickAccount: function (event) {
                    Log.call(Log.l.trace, "Login.Controller.");
                    Application.navigateById("account", event, true);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    //ignore that here!
                    //Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickPrivacyPolicy: function (event) {
                    Log.call(Log.l.trace, "Login.Controller.");
                    if (event && event.currentTarget) {
                    that.binding.dataLogin.privacyPolicyFlag = event.currentTarget.checked;
                    AppBar.triggerDisableHandlers();
                    }
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function() {
                    if (AppBar.busy || (that.binding.dataLogin.Login.length === 0 || that.binding.dataLogin.Password.length === 0 || !that.binding.dataLogin.privacyPolicyFlag)) {
                        NavigationBar.disablePage("start");
                    } else {
                        NavigationBar.enablePage("start");
                    }
                    if (!that.binding.dataLogin.Login || !that.binding.dataLogin.Password) {
                        that.binding.dataLogin.privacyPolicyFlag = false;
                    }
                    return AppBar.busy || (that.binding.dataLogin.Login.length === 0 || that.binding.dataLogin.Password.length === 0 || !that.binding.dataLogin.privacyPolicyFlag);
                }
            };

            var openDb = function (complete, error) {
                var ret;
                Log.call(Log.l.info, "Login.Controller.");
                if (AppRepl.replicator &&
                    AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "replicator still running - try later!");
                    ret = WinJS.Promise.timeout(500).then(function () {
                        return that.openDb(complete, error);
                    });
                } else {
                    ret = AppData.openDB(function (json) {
                        AppBar.busy = false;
                        AppData._curGetUserDataId = 0;
                        AppData.getUserData();
                        if (typeof complete === "function") {
                        complete(json);
                        }
                    }, function (err) {
                        AppBar.busy = false;
                        AppData.setErrorMsg(that.binding, err);
                        AppData._persistentStates.odata.dbSiteId = 0;
                        Application.pageframe.savePersistentStates();
                        if (typeof error === "function") {
                            error(err);
                        }
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

            var saveData = function(complete, error) {
                var err = null;
                Log.call(Log.l.trace, "Login.Controller.");
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                AppBar.busy = true;
                that.binding.appSettings.odata.onlinePath = AppData._persistentStatesDefaults.odata.onlinePath;
                that.binding.appSettings.odata.registerPath = AppData._persistentStatesDefaults.odata.registerPath;
                var ret = Login.loginRequest.insert(function (json) {
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.call(Log.l.trace, "loginRequest: success!");
                    // loginData returns object already parsed from json file in response
                    if (json && json.d && json.d.ODataLocation) {
                        if (json.d.InactiveFlag) {
                            AppBar.busy = false;
                            err = { status: 503, statusText: getResourceText("login.inactive") };
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
                }, function (errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    err = AppData.getErrorMsgFromResponse(errorResponse);
                    //if (err === "") {
                    //    err = { status: 404, statusText: getResourceText("general.ckeckServer") };
                    //}
                    //Log.print(Log.l.info, "loginRequest error: " + err + " ignored for compatibility!");
                    // ignore this error here for compatibility!
                    //AppData.setErrorMsg(that.binding, err);
                    return WinJS.Promise.as();
                }, {
                    LoginName: that.binding.dataLogin.Login
                }).then(function () {
                    if (!err) {
                        var deviceID = "";
                        if (window.device && window.device.uuid) {
                            deviceID = bIgnoreDuplicate ? "DeviceID=" : "TestID=" + window.device.uuid;
                        }
                        var dataLogin = {
                            Login: that.binding.dataLogin.Login,
                            Password: that.binding.dataLogin.Password,
                            LanguageID: AppData.getLanguageId(),
                            Aktion: "Kiosk"
                        };
                        return Login.loginView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.call(Log.l.trace, "loginData: success!");
                            // loginData returns object already parsed from json file in response
                            if (json && json.d) {
                                dataLogin = json.d;
                                if (dataLogin.OK_Flag === "X" && dataLogin.MitarbeiterID) {
                                    AppData._persistentStates.odata.login = that.binding.dataLogin.Login;
                                    AppData._persistentStates.odata.password = that.binding.dataLogin.Password;
                                    var prevMitarbeiterId = AppData.generalData.getRecordId("Mitarbeiter");
                                    NavigationBar.enablePage("settings");
                                    NavigationBar.enablePage("info");
                                    NavigationBar.enablePage("search");
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
                                        return that.openDb(complete, error);
                                    } else {
                                        AppBar.busy = false;
                                        AppData._curGetUserDataId = 0;
                                        AppData.getUserData();
                                        complete(json);
                                        return WinJS.Promise.as();
                                    }
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
                                    var duplicate = false;
                                    if (dataLogin.Aktion &&
                                        dataLogin.Aktion.substr(0, 9).toUpperCase() === "DUPLICATE") {
                                        var confirmTitle = dataLogin.MessageText;
                                        return confirm(confirmTitle, function (result) {
                                            if (result) {
                                                Log.print(Log.l.trace, "clickLogoff: user choice OK");
                                                bIgnoreDuplicate = true;
                                                return that.saveData(complete, error);
                                            } else {
                                                Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                                                that.binding.messageText = dataLogin.MessageText;
                                                err = { status: 401, statusText: dataLogin.MessageText, duplicate: duplicate };
                                                AppData.setErrorMsg(that.binding, err);
                                                error(err);
                                                return WinJS.Promise.as();
                                            }
                                        });
                                    } else {
                                    that.binding.messageText = dataLogin.MessageText;
                                        err = { status: 401, statusText: dataLogin.MessageText, duplicate: duplicate };
                                    AppData.setErrorMsg(that.binding, err);
                                    error(err);
                                    return WinJS.Promise.as();
                                }
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
                            err = errorResponse;
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
                    if (!err && !AppData.appSettings.odata.serverFailure) {
                        // load color settings
                        return Login.CR_VERANSTOPTION_ODataView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "CR_VERANSTOPTION: success!");
                            // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response
                            if (json && json.d && json.d.results && json.d.results.length > 1) {
                                var results = json.d.results;
                                AppData._persistentStates.serverColors = false;
                                results.forEach(function (item, index) {
                                    that.resultConverter(item, index);
                                });
                                Application.pageframe.savePersistentStates();
                            }
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
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            var autoLogin = function () {
                Log.call(Log.l.trace, "Login.Controller.");
                that.binding.dataLogin.Login = Login.nextLogin;
                that.binding.dataLogin.Password = Login.nextPassword;
                Login.nextLogin = null;
                Login.nextPassword = null;
                if (that.binding.dataLogin.Login &&
                    that.binding.dataLogin.Password) {
                    that.binding.dataLogin.privacyPolicyFlag = true;
                    AppBar.triggerDisableHandlers();
                    WinJS.Promise.timeout(100).then(function () {
                        Application.navigateById("start", null, true);
                    });
                }
                Log.ret(Log.l.trace);
            }
            that.autoLogin = autoLogin;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                if (AppHeader && AppHeader.controller) {
                    return AppHeader.controller.loadData();
                } else {
                    return WinJS.Promise.as();
                }
            }).then(function () {
                Log.print(Log.l.trace, "Appheader refresh complete");
                Application.pageframe.hideSplashScreen();
                if (Login.nextLogin || Login.nextPassword) {
                    that.autoLogin();
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();


