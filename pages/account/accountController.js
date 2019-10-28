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
            var bIgnoreDuplicate = false;
            Application.Controller.apply(this, [pageElement, {
                dataLogin: {
                    Login: AppData._persistentStates.odata.login,
                    Password: AppData._persistentStates.odata.password,
                    PrivacyPolicyFlag: true,
                    PrivacyPolicydisabled: true,
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

            var prevLogin = AppData._persistentStates.odata.login;
            var prevPassword = AppData._persistentStates.odata.password;
            var prevHostName = AppData._persistentStates.odata.hostName;
            var prevOnlinePort = AppData._persistentStates.odata.onlinePort;
            var prevOnlinePath = AppData._persistentStates.odata.onlinePath;
            var prevUseOffline = AppData._persistentStates.odata.useOffline;

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

            if (!prevLogin || !prevPassword || !prevHostName || !prevUseOffline) {
                // enable edit per default on empty settings
                this.binding.doEdit = true;
            }
            var portalLink = pageElement.querySelector("#portalLink");

            if (portalLink) {
                var portalLinkUrl = (AppData._persistentStates.odata.https ? "https://" : "http://") +
                        AppData._persistentStates.odata.hostName +
                        getResourceText("account.portalPath");;
                if (isAppleDevice) {
                    portalLink.innerHTML = "<a href=\"#\" onclick=\"cordova.InAppBrowser.open('" + portalLinkUrl + "'" + ", '_system');\">" +
                        portalLinkUrl + "</a>";
                } else {
                portalLink.innerHTML = "<a href=\"" + portalLinkUrl + "\">" + portalLinkUrl + "</a>";
            }

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

            var privacyPolicyLink = pageElement.querySelector("#privacyPolicyLink");
            if (privacyPolicyLink) {
                if (isAppleDevice) {
                    privacyPolicyLink.innerHTML = "<a style=\"pointer-events: none; cursor: default;\" href=\"https://" +
                        getResourceText("account.privacyPolicyLink") +
                        "\">" +
                        getResourceText("account.privacyPolicyLink") +
                        "</a>";
                } else {
                    privacyPolicyLink.innerHTML = "<a href=\"https://" +
                        getResourceText("account.privacyPolicyLink") +
                        "\">" +
                        getResourceText("account.privacyPolicyLink") +
                        "</a>";
                }
            }

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("start", event, true);
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    //that.binding.doEdit -> hat sich was geändert?
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            that.binding.doEdit = false;
                    Application.navigateById("login", event);
                        } else {
                            Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                        }
                    });
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    //ignore that here!
                    //Application.navigateById("userinfo", event);
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
                },
                clickPrivacyPolicy: function (event) {
                    Log.call(Log.l.trace, "Login.Controller.");
                    that.binding.dataLogin.privacyPolicyFlag = event.currentTarget.checked;
                    AppBar.triggerDisableHandlers();
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
                        if (that.binding.appSettings.odata.hostName !== prevHostName) {
                        that.binding.doReloadDb = true;
                        }
                        that.binding.doEdit = true;
                    }
                    if (!that.binding.dataLogin.Login || !that.binding.dataLogin.Password) {
                        that.binding.dataLogin.PrivacyPolicyFlag = false;
                        that.binding.dataLogin.PrivacyPolicydisabled = false;
                    }
                    if (AppBar.busy || (!that.binding.dataLogin.Login || !that.binding.dataLogin.Password || !that.binding.dataLogin.PrivacyPolicyFlag)) {
                        NavigationBar.disablePage("start");
                        NavigationBar.disablePage("search");
                        NavigationBar.disablePage("settings");
                        NavigationBar.disablePage("info");
                    } else {
                        NavigationBar.enablePage("start");
                    }
                    return AppBar.busy || (!that.binding.dataLogin.Login || !that.binding.dataLogin.Password || !that.binding.dataLogin.PrivacyPolicyFlag);
                },
                clickLogoff: function() {
                    return false; //!that.binding.generalData.logOffOptionActive
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

            var saveData = function (complete, error) {
                var err = null, ret;
                Log.call(Log.l.trace, "Account.Controller.");
                if (contentarea) {
                    contentarea.scrollTop = 0;
                }
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                if (!that.binding.doEdit && !AppData._persistentStates.odata.dbinitIncomplete) {
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
                        // loginData returns object already parsed from json file in response
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
                            err = { status: 404, statusText: getResourceText("account.unknown") };
                            AppData.setErrorMsg(that.binding, err);
                            error(err);
                        }
                        return WinJS.Promise.as();
                    }, function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        Log.print(Log.l.info, "loginRequest error: " + AppData.getErrorMsgFromResponse(errorResponse) + " ignored for compatibility!");
                        // ignore this error here for compatibility!
                        return WinJS.Promise.as();
                    }, {
                        LoginName: that.binding.dataLogin.Login
                    }).then(function () {
                        var deviceID = "";
                        if (window.device && window.device.uuid) {
                            deviceID = bIgnoreDuplicate ? "DeviceID=" : "TestID=" + window.device.uuid;
                        }
                        if (!err) {
                            var dataLogin = {
                                Login: that.binding.dataLogin.Login,
                                Password: that.binding.dataLogin.Password,
                                LanguageID: AppData.getLanguageId(),
                                Aktion: "Kiosk"
                            };
                            return Account.loginView.insert(function(json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "loginData: success!");
                                // loginData returns object already parsed from json file in response
                                if (json && json.d) {
                                    dataLogin = json.d;
                                    if (dataLogin.OK_Flag === "X" && dataLogin.MitarbeiterID) {
                                        AppData._persistentStates.odata.login = that.binding.dataLogin.Login;
                                        AppData._persistentStates.odata.password = that.binding.dataLogin.Password;
                                        NavigationBar.enablePage("settings");
                                        NavigationBar.enablePage("info");
                                        NavigationBar.enablePage("search");
                                        var prevMitarbeiterId = AppData.generalData.getRecordId("Mitarbeiter");
                                        var doReloadDb = false;
                                        if (!AppData._persistentStates.odata.dbSiteId ||
                                            prevMitarbeiterId !== dataLogin.MitarbeiterID ||
                                            AppData._persistentStates.odata.dbinitIncomplete ||
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
                                            AppData.generalData.setRecordId("Mitarbeiter", dataLogin.MitarbeiterID);
                                        }
                                        if (that.binding.appSettings.odata.useOffline) {
                                            if (doReloadDb) {
                                                if (!that.binding.doReloadDb) {
                                                    that.binding.doReloadDb = true;
                                                }
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
                            }, function(errorResponse) {
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
                            return Account.CR_VERANSTOPTION_ODataView.select(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "CR_VERANSTOPTION: success!");
                                // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response
                                if (json && json.d && json.d.results && json.d.results.length > 0) {
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
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
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


