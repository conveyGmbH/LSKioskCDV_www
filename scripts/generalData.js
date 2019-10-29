// general data services 
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/sqlite.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dbinit.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />
/// <reference path="~/www/pages/appHeader/appHeaderController.js" />

(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.Namespace.define("AppData", {
        __generalUserRemoteView: null,
        _generalUserRemoteView: {
            get: function() {
                if (!AppData.__generalUserRemoteView) {
                    // create remote view here always!
                    AppData.__generalUserRemoteView = new AppData.formatViewData("Mitarbeiter", 20431, false);
                }
                return AppData.__generalUserRemoteView;
            }
        },
        generalUserRemoteView: {
            select: function(complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalUserRemoteView.", "recordId=" + recordId);
                var ret = AppData._generalUserRemoteView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            isLocal: {
                get: function() {
                    return AppData._generalUserRemoteView.isLocal;
                }
            }
        },
        _generalUserView: {
            get: function() {
                return AppData.getFormatView("Mitarbeiter", 20431);
            }
        },
        generalUserView: {
            select: function(complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalUserView.", "recordId=" + recordId);
                var ret = AppData._generalUserView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            isLocal: {
                get: function() {
                    return AppData._generalUserView.isLocal;
                }
            }
        },
        _generalContactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20434);
            }
        },
        generalContactView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalContactView.", "recordId=" + recordId);
                var ret = AppData._generalContactView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _prefetchedProductView: null,
        _curGetUserDataId: 0,
        _curGetContactDataId: 0,
        _contactData: {},
        _userData: {},
        _photoData: null,
        _barcodeType: null,
        _barcodeRequest: null,
        getRecordId: function (relationName) {
            Log.call(Log.l.trace, "AppData.", "relationName=" + relationName);
            // check for initial values
            if (typeof AppData._persistentStates.allRecIds === "undefined") {
                AppData._persistentStates.allRecIds = {};
            }
            if (typeof AppData._persistentStates.allRecIds[relationName] === "undefined") {
                if (relationName === "Mitarbeiter") {
                    if (AppData._userData) {
                        AppData._persistentStates.allRecIds[relationName] = AppData._userData.MitarbeiterVIEWID;
                    }
                } else if (relationName === "IMPORT_CARDSCAN") {
                    if (AppData._contactData) {
                        AppData._persistentStates.allRecIds[relationName] = AppData._contactData.IMPORT_CARDSCANID;
                    }
                } else if (relationName === "Veranstaltung") {
                    if (AppData._userData) {
                        AppData._persistentStates.allRecIds[relationName] = AppData._userData.VeranstaltungID;
                    } else {
                        if (typeof AppData.getUserData === "function") {
                            AppData.getUserData();
                        }
                        Log.ret(Log.l.trace, "undefined");
                        return null;
                    }
                } else {
                    Log.ret(Log.l.trace, "undefined");
                    return null;
                }
            }
            var ret = AppData._persistentStates.allRecIds[relationName];
            Log.ret(Log.l.trace, ret);
            return ret;
        },
        setRecordId: function (relationName, newRecordId) {
            Log.call(Log.l.trace, "AppData.", "relationName=" + relationName + " newRecordId=" + newRecordId);
            // check for initial values
            if (typeof AppData._persistentStates.allRecIds === "undefined") {
                AppData._persistentStates.allRecIds = {};
            }
            if (typeof AppData._persistentStates.allRecIds[relationName] === "undefined" ||
                !newRecordId || AppData._persistentStates.allRecIds[relationName] !== newRecordId) {
                AppData._persistentStates.allRecIds[relationName] = newRecordId;
                if (relationName === "Mitarbeiter") {
                    delete AppData._persistentStates.allRecIds["Veranstaltung"];
                    if (typeof AppData.getUserData === "function") {
                        AppData.getUserData();
                    }
                } else if (relationName === "Kontakt") {
                    // delete relationships
                    delete AppData._persistentStates.allRecIds["Zeilenantwort"];
                    delete AppData._persistentStates.allRecIds["KontaktNotiz"];
                    delete AppData._persistentStates.allRecIds["IMPORT_CARDSCAN"];
                    delete AppData._persistentStates.allRecIds["DOC1IMPORT_CARDSCAN"];
                    delete AppData._persistentStates.allRecIds["ImportBarcodeScan"];
                    AppData._photoData = null;
                    AppData._barcodeType = null;
                    AppData._barcodeRequest = null;
                    if (typeof AppData.getContactData === "function") {
                        AppData.getContactData();
                    }
                }
                Application.pageframe.savePersistentStates();
            }
            Log.ret(Log.l.trace);
        },
        getRestriction: function (relationName) {
            Log.call(Log.l.trace, "AppData.", "relationName=" + relationName);
            if (typeof AppData._persistentStates.allRestrictions === "undefined") {
                AppData._persistentStates.allRestrictions = {};
            }
            Log.ret(Log.l.trace);
            return AppData._persistentStates.allRestrictions[relationName];
        },
        setRestriction: function (relationName, newRestriction) {
            Log.call(Log.l.trace, ".", "relationName=" + relationName);
            if (typeof AppData._persistentStates.allRestrictions === "undefined") {
                AppData._persistentStates.allRestrictions = {};
            }
            AppData._persistentStates.allRestrictions[relationName] = newRestriction;
            Application.pageframe.savePersistentStates();
            Log.ret(Log.l.trace);
        },
        getUserData: function () {
            var ret;
            Log.call(Log.l.trace, "AppData.");
            var userId = AppData.getRecordId("Mitarbeiter");
            if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password) {
                Log.print(Log.l.trace, "getUserData: no logon information provided!");
                ret = WinJS.Promise.as();
            } else if (userId && userId !== AppData._curGetUserDataId) {
                AppData._curGetUserDataId = userId;
                ret = new WinJS.Promise.as().then(function () {
                    Log.print(Log.l.trace, "calling select generalUserView...");
                    return AppData.generalUserView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "generalUserView: success!");
                        // startContact returns object already parsed from json file in response
                        if (json && json.d) {
                            AppData._userData = json.d;
                            if (typeof AppHeader === "object" && AppHeader.controller && 
                                typeof AppHeader.controller.loadData === "function") {
                                AppHeader.controller.loadData();
                            }
                        }
                        AppData._curGetUserDataId = 0;
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        Log.print(Log.l.error, "error in select generalUserView statusText=" + errorResponse.statusText);
                        AppData._curGetUserDataId = 0;
                    }, userId);
                });
            } else {
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        getUserRemoteData: function () {
            var ret = WinJS.Promise.as();
            Log.call(Log.l.trace, "AppData.");
            if (AppData._userRemoteDataPromise) {
                Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                AppData._userRemoteDataPromise.cancel();
            }
            if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password ||
                !AppData.appSettings.odata.dbSiteId) {
                Log.print(Log.l.trace, "getUserRemoteData: no logon information provided!");
            } else if (AppData.generalUserView.isLocal) {
                var userId = AppData.getRecordId("Mitarbeiter");
                if (userId && userId !== AppData._curGetUserRemoteDataId) {
                    if (AppData._persistentStates.odata.useOffline && (!AppData._db || !AppData._dbInit)) {
                        Log.print(Log.l.trace, "getUserRemoteData: local db not yet initialized!");
                    } else {
                        var dateLocal = new Date();
                        var millisecondsLocal = dateLocal.getTime();
                        AppData._curGetUserRemoteDataId = userId;
                        ret = new WinJS.Promise.as().then(function() {
                            if (AppData._prcUserRemoteCallSucceeded || !AppData._prcUserRemoteCallFailed) {
                                Log.print(Log.l.trace, "calling select PRC_MitarbeiterAppDaten...");
                                return AppData.call("PRC_MitarbeiterAppDaten", {
                                    pCreatorSiteID: AppData._persistentStates.odata.dbSiteId,
                                    pNavigationLocation: 0
                                }, function (json) {
                                    Log.print(Log.l.info, "call success! json=" + json);
                                    AppData._prcUserRemoteCallSucceeded = true;
                                    var doUpdate = false;
                                    if (AppData.appSettings.odata.serverFailure) {
                                        AppData.appSettings.odata.serverFailure = false;
                                        NavigationBar.enablePage("listRemote");
                                        NavigationBar.enablePage("search");
                                        doUpdate = true;
                                    }
                                    if (json && json.d && json.d.results.length === 1) {
                                        var prevUserRemoteData = AppData._userRemoteData;
                                        AppData._userRemoteData = json.d.results[0];
                                        AppData.appSettings.odata.timeZoneRemoteAdjustment = AppData._userRemoteData.TimeZoneAdjustment || 0;
                                        if (AppData._userRemoteData.CurrentTS) {
                                            var msString = AppData._userRemoteData.CurrentTS.replace("\/Date(", "").replace(")\/", "");
                                            var millisecondsRemote = parseInt(msString) - AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                                            AppData.appSettings.odata.timeZoneRemoteDiffMs = millisecondsLocal - millisecondsRemote;
                                            if (!AppData.appSettings.odata.replPrevSelectMs) {
                                                var now = new Date();
                                                AppData.appSettings.odata.replPrevSelectMs = now.getTime() - AppData.appSettings.odata.timeZoneRemoteDiffMs;
                                            }
                                        }
                                        Log.print(Log.l.info, "timeZoneRemoteAdjustment=" + AppData.appSettings.odata.timeZoneRemoteAdjustment +
                                            " timeZoneRemoteDiffMs=" + AppData.appSettings.odata.timeZoneRemoteDiffMs);
                                        if (AppBar.scope && AppData._userRemoteData.Message) {
                                            Log.print(Log.l.error, "Message=" + AppData._userRemoteData.Message);
                                            AppData.setErrorMsg(AppBar.scope.binding, AppData._userRemoteData.Message);
                                        }
                                        if (AppBar.scope && typeof AppBar.scope.updateActions === "function" &&
                                            (!prevUserRemoteData ||
                                             prevUserRemoteData.AnzVersendeteKontakte !== AppData._userRemoteData.AnzVersendeteKontakte)) { //
                                            doUpdate = true;
                                        }
                                    }
                                    if (AppBar.scope && typeof AppBar.scope.updateActions === "function" && doUpdate) {
                                        AppBar.scope.updateActions();
                                    }
                                    var timeout = AppData._persistentStates.odata.replInterval || 30;
                                    Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s");
                                    if (AppData._userRemoteDataPromise) {
                                        Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                        AppData._userRemoteDataPromise.cancel();
                                    }
                                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                        AppData._curGetUserRemoteDataId = 0;
                                        AppData.getUserRemoteData();
                                    });
                                }, function (errorResponse) {
                                    Log.print(Log.l.error, "call error=" + errorResponse + 
                                        " prcUserRemoteCallSucceeded=" + AppData._prcUserRemoteCallSucceeded + 
                                        " prcUserRemoteCallFailed" + AppData._prcUserRemoteCallFailed);
                                    if (AppData._prcUserRemoteCallSucceeded) {
                                        var err = "";
                                        if (!AppData.appSettings.odata.serverFailure) {
                                            AppData.appSettings.odata.serverFailure = true;
                                            NavigationBar.disablePage("listRemote");
                                            NavigationBar.disablePage("search");
                                            if (AppBar.scope && typeof AppBar.scope.checkListButtonStates === "function") {
                                                AppBar.scope.checkListButtonStates();
                                            }
                                            if (AppRepl.replicator &&
                                                AppRepl.replicator.networkState !== "Offline" &&
                                                AppRepl.replicator.networkState !== "Unknown" &&
                                                DBInit &&
                                                DBInit.loginRequest) {
                                                DBInit.loginRequest.insert(function(json) {
                                                    // this callback will be called asynchronously
                                                    // when the response is available
                                                    Log.print(Log.l.trace, "loginRequest: success!");
                                                    // loginData returns object already parsed from json file in response
                                                    if (json && json.d && json.d.ODataLocation) {
                                                        if (json.d.InactiveFlag) {
                                                            if (AppBar.scope) {
                                                                err = { status: 503, statusText: getResourceText("login.inactive") };
                                                                AppData.setErrorMsg(AppBar.scope.binding, err);
                                                            }
                                                        } else if (json.d.ODataLocation !== AppData._persistentStates.odata.onlinePath) {
                                                            if (AppBar.scope) {
                                                                err = { status: 404, statusText: getResourceText("login.modified") };
                                                                AppData.setErrorMsg(AppBar.scope.binding, err);
                                                            }
                                                        }
                                                    } else {
                                                        if (AppBar.scope) {
                                                            err = { status: 404, statusText: getResourceText("login.unknown") };
                                                            AppData.setErrorMsg(AppBar.scope.binding, err);
                                                        }
                                                    }
                                                }, function(errorResponse) {
                                                    // called asynchronously if an error occurs
                                                    // or server returns response with an error status.
                                                    Log.print(Log.l.error, "loginRequest error: " + AppData.getErrorMsgFromResponse(errorResponse));
                                                    // ignore this error here for compatibility!
                                                }, {
                                                    LoginName: AppData._persistentStates.odata.login
                                                });
                                            }
                                        }
                                        // called asynchronously if an error occurs
                                        // or server returns response with an error status.
                                        Log.print(Log.l.error, "error in select generalUserRemoteView statusText=" + errorResponse.statusText);
                                        if (AppBar.scope && errorResponse.statusText === "") {
                                            //err = { status: 404, statusText: getResourceText("login.unknown") };
                                            AppData.setErrorMsg(AppBar.scope.binding,
                                                { status: 404, statusText: getResourceText("general.internet") });
                                        } else {
                                            AppData.setErrorMsg(AppBar.scope.binding,
                                                { status: 404, statusText: errorResponse.statusText });
                                        }
                                        var timeout = AppData._persistentStates.odata.replInterval || 30;
                                        Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s");
                                        if (AppData._userRemoteDataPromise) {
                                            Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                            AppData._userRemoteDataPromise.cancel();
                                        }
                                    } else if (AppRepl.replicator &&
                                        AppRepl.replicator.networkState !== "Offline" &&
                                        AppRepl.replicator.networkState !== "Unknown") {
                                        AppData._prcUserRemoteCallFailed = true;
                                    } else {
                                        if (!AppData.appSettings.odata.serverFailure) {
                                            AppData.appSettings.odata.serverFailure = true;
                                            NavigationBar.disablePage("listRemote");
                                            NavigationBar.disablePage("search");
                                            if (AppBar.scope && typeof AppBar.scope.checkListButtonStates === "function") {
                                                AppBar.scope.checkListButtonStates();
                                            }
                                        }
                                    }
                                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function() {
                                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                        AppData._curGetUserRemoteDataId = 0;
                                        AppData.getUserRemoteData();
                                    });
                                });
                            } else {
                                Log.print(Log.l.trace, "calling select generalUserRemoteView...");
                                return AppData.generalUserRemoteView.select(function(json) {
                                    var doUpdate = false;
                                    if (AppData.appSettings.odata.serverFailure) {
                                        AppData.appSettings.odata.serverFailure = false;
                                        NavigationBar.enablePage("listRemote");
                                        NavigationBar.enablePage("search");
                                        doUpdate = true;
                                    }
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    Log.print(Log.l.trace, "generalUserRemoteView: success!");
                                    // startContact returns object already parsed from json file in response
                                    if (json && json.d) {
                                        var prevUserRemoteData = AppData._userRemoteData;
                                        AppData._userRemoteData = json.d;
                                        AppData.appSettings.odata.timeZoneRemoteAdjustment = AppData._userRemoteData.TimeZoneAdjustment || 0;
                                        if (AppData._userRemoteData.CurrentTS) {
                                            var msString = AppData._userRemoteData.CurrentTS.replace("\/Date(", "").replace(")\/", "");
                                            var millisecondsRemote = parseInt(msString) - AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                                            AppData.appSettings.odata.timeZoneRemoteDiffMs = millisecondsLocal - millisecondsRemote;
                                            if (!AppData.appSettings.odata.replPrevSelectMs) {
                                                var now = new Date();
                                                AppData.appSettings.odata.replPrevSelectMs = now.getTime() - AppData.appSettings.odata.timeZoneRemoteDiffMs;
                                            }
                                        }
                                        Log.print(Log.l.info,
                                            "timeZoneRemoteAdjustment=" +
                                            AppData.appSettings.odata.timeZoneRemoteAdjustment +
                                            " timeZoneRemoteDiffMs=" +
                                            AppData.appSettings.odata.timeZoneRemoteDiffMs);
                                        if (AppBar.scope && AppData._userRemoteData.Message) {
                                            Log.print(Log.l.error, "Message=" + AppData._userRemoteData.Message);
                                            AppData.setErrorMsg(AppBar.scope.binding, AppData._userRemoteData.Message);
                                        }
                                        if (AppBar.scope &&
                                            typeof AppBar.scope.updateActions === "function" &&
                                            (!prevUserRemoteData ||
                                                prevUserRemoteData.AnzVersendeteKontakte !== AppData._userRemoteData.AnzVersendeteKontakte)) { //
                                            doUpdate = true;
                                        }
                                    }
                                    if (AppBar.scope && typeof AppBar.scope.updateActions === "function" && doUpdate) {
                                        AppBar.scope.updateActions();
                                    }
                                    var timeout = AppData._persistentStates.odata.replInterval || 30;
                                    Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s");
                                    if (AppData._userRemoteDataPromise) {
                                        Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                        AppData._userRemoteDataPromise.cancel();
                                    }
                                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function() {
                                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                        AppData._curGetUserRemoteDataId = 0;
                                        AppData.getUserRemoteData();
                                    });
                                }, function(errorResponse) {
                                    var err = "";
                                    if (!AppData.appSettings.odata.serverFailure) {
                                        AppData.appSettings.odata.serverFailure = true;
                                        NavigationBar.disablePage("listRemote");
                                        NavigationBar.disablePage("search");
                                        if (AppBar.scope && typeof AppBar.scope.checkListButtonStates === "function") {
                                            AppBar.scope.checkListButtonStates();
                                        }
                                        if (AppRepl.replicator &&
                                            AppRepl.replicator.networkState !== "Offline" &&
                                            AppRepl.replicator.networkState !== "Unknown" &&
                                            DBInit &&
                                            DBInit.loginRequest) {
                                            DBInit.loginRequest.insert(function(json) {
                                                // this callback will be called asynchronously
                                                // when the response is available
                                                Log.print(Log.l.trace, "loginRequest: success!");
                                                // loginData returns object already parsed from json file in response
                                                if (json && json.d && json.d.ODataLocation) {
                                                    if (json.d.InactiveFlag) {
                                                        if (AppBar.scope) {
                                                            err = { status: 503, statusText: getResourceText("login.inactive") };
                                                            AppData.setErrorMsg(AppBar.scope.binding, err);
                                                        }
                                                    } else if (json.d.ODataLocation !== AppData._persistentStates.odata.onlinePath) {
                                                        if (AppBar.scope) {
                                                            err = { status: 404, statusText: getResourceText("login.modified") };
                                                            AppData.setErrorMsg(AppBar.scope.binding, err);
                                                        }
                                                    }
                                                } else {
                                                    if (AppBar.scope) {
                                                        err = { status: 404, statusText: getResourceText("login.unknown") };
                                                        AppData.setErrorMsg(AppBar.scope.binding, err);
                                                    }
                                                }
                                            }, function(errorResponse) {
                                                // called asynchronously if an error occurs
                                                // or server returns response with an error status.
                                                Log.print(Log.l.error, "loginRequest error: " + AppData.getErrorMsgFromResponse(errorResponse));
                                                // ignore this error here for compatibility!
                                            }, {
                                                LoginName: AppData._persistentStates.odata.login
                                            });
                                        }
                                    }
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    Log.print(Log.l.error, "error in select generalUserRemoteView statusText=" + errorResponse.statusText);
                                    if (AppBar.scope && errorResponse.statusText === "") {
                                        //err = { status: 404, statusText: getResourceText("login.unknown") };
                                        AppData.setErrorMsg(AppBar.scope.binding,
                                            { status: 404, statusText: getResourceText("general.internet") });
                                    } else {
                                        AppData.setErrorMsg(AppBar.scope.binding,
                                            { status: 404, statusText: errorResponse.statusText });
                                    }
                                    var timeout = AppData._persistentStates.odata.replInterval || 30;
                                    Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s");
                                    if (AppData._userRemoteDataPromise) {
                                        Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                        AppData._userRemoteDataPromise.cancel();
                                    }
                                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function() {
                                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                        AppData._curGetUserRemoteDataId = 0;
                                        AppData.getUserRemoteData();
                                    });
                                },
                                userId);
                            }
                        });
                    }
                } else {
                    ret = WinJS.Promise.as();
                }
            } else {
                ret = AppData.getUserData();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        getContactData: function () {
            var ret;
            Log.call(Log.l.trace, "AppData.");
            var contactId = AppData.getRecordId("Kontakt");
            if (!contactId) {
                AppData._contactData = {};
                ret = WinJS.Promise.as();
            } else if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password) {
                Log.print(Log.l.trace, "getContactData: no logon information provided!");
                ret = WinJS.Promise.as();
            } else if (contactId !== AppData._curGetContactDataId) {
                AppData._curGetContactDataId = contactId;
                ret = new WinJS.Promise.as().then(function () {
                    Log.print(Log.l.trace, "calling select generalContactView...");
                    return AppData.generalContactView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "generalContactView: success!");
                        // startContact returns object already parsed from json file in response
                        if (json && json.d) {
                            AppData._contactData = json.d;
                            if (AppData._contactData) {
                                if (typeof AppBar === "object" &&
                                    AppBar.scope && AppBar.scope.binding && AppBar.scope.binding.generalData) {
                                    AppBar.scope.binding.generalData.contactDate = AppData._contactData.Erfassungsdatum;
                                    AppBar.scope.binding.generalData.contactId = AppData._contactData.KontaktVIEWID;
                                    AppBar.scope.binding.generalData.globalContactID =
                                        AppData._contactData.CreatorRecID
                                        ? (AppData._contactData.CreatorSiteID + "/" + AppData._contactData.CreatorRecID)
                                        : "";
                                }
                            }
                        }
                        AppData._curGetContactDataId = 0;
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        Log.print(Log.l.error, "error in select generalContactView statusText=" + errorResponse.statusText);
                        AppData._curGetContactDataId = 0;
                    }, contactId);
                });
            } else {
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        getContactDate: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._contactData &&
                AppData._contactData.Erfassungsdatum) {
                ret = AppData._contactData.Erfassungsdatum;
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getContactDateString: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._contactData &&
                AppData._contactData.Erfassungsdatum) {
                // value now in UTC ms!
                var msString = AppData._contactData.Erfassungsdatum.replace("\/Date(", "").replace(")\/", "");
                var milliseconds = parseInt(msString) - AppData.appSettings.odata.timeZoneAdjustment * 60000;
                var date = new Date(milliseconds);
                ret = date.toLocaleDateString();
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getContactTimeString: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._contactData &&
                AppData._contactData.Erfassungsdatum) {
                // value now in UTC ms!
                var msString = AppData._contactData.Erfassungsdatum.replace("\/Date(", "").replace(")\/", "");
                var milliseconds = parseInt(msString) - AppData.appSettings.odata.timeZoneAdjustment * 60000;
                var date = new Date(milliseconds);
                var hours = date.getHours();
                var minutes = date.getMinutes();
                ret = ((hours < 10) ? "0" : "") + hours.toString() + ":" +
                      ((minutes < 10) ? "0" : "") + minutes.toString();
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getEventName: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userData &&
                AppData._userData.VeranstaltungName) {
                ret = AppData._userData.VeranstaltungName;
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getUserPresent: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userData &&
                (AppData._userData.Present === 0 ||
                 AppData._userData.Present === 1)) {
                ret = AppData._userData.Present;
            } else {
                ret = null;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getUserName: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userData &&
                AppData._userData.Login) {
                ret = AppData._userData.Login;
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getPublishFlag: function() {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userData &&
                AppData._userData.PublishFlag) {
                ret = AppData._userData.PublishFlag;
            } else {
                ret = 0;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getPropertyFromInitoptionTypeID: function (item) {
            Log.call(Log.l.u1, "AppData.");
            var plusRemote = false;
            var property = "";
            var color;
            switch (item.INITOptionTypeID) {
                case 9:
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.showAppBkg = true;
                    } else {
                        AppData._persistentStates.showAppBkg = false;
                    }
                    break;
                case 10:
                    property = "individualColors";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.individualColors = true;
                    } else {
                        AppData._persistentStates.individualColors = false;
                    }
                    break;
                case 11:
                    if (AppData._persistentStates.individualColors) {
                        property = "accentColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 12:
                    if (AppData._persistentStates.individualColors) {
                        property = "backgroundColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 13:
                    if (AppData._persistentStates.individualColors) {
                        property = "navigationColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 14:
                    if (AppData._persistentStates.individualColors) {
                        property = "textColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 15:
                    if (AppData._persistentStates.individualColors) {
                        property = "labelColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 16:
                    if (AppData._persistentStates.individualColors) {
                        property = "tileTextColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 17:
                    if (AppData._persistentStates.individualColors) {
                        property = "tileBackgroundColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 18:
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.isDarkTheme = true;
                    } else {
                        AppData._persistentStates.isDarkTheme = false;
                    }
                    Colors.isDarkTheme = AppData._persistentStates.isDarkTheme;
                    break;
                case 25:
                    property = "kioskHeaderBackgroundColor";
                    break;
                case 26:
                    property = "kioskButtonBackgroundColor";
                    break;
                case 27:
                    property = "kioskProductBackgroundColor";
                    break;
                case 28:
                    property = "kioskProductPreloadColor";
                    break;
                case 29:
                    property = "kioskProductTitleColor";
                    break;
                case 32:
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.kioskUsesCamera = true;
                    } else {
                        AppData._persistentStates.kioskUsesCamera = false;
                    }
                    break;
                default:
                    // defaultvalues
            }
            if (item.pageProperty) {
                if (item.LocalValue === "1") {
                    NavigationBar.disablePage(item.pageProperty);
                    if (plusRemote) {
                        NavigationBar.disablePage(item.pageProperty + "Remote");
                    }
                } else {
                    NavigationBar.enablePage(item.pageProperty);
                    if (plusRemote) {
                        NavigationBar.enablePage(item.pageProperty + "Remote");
                    }
                }
            }
            Log.ret(Log.l.u1, property);
            return property;
        },
        applyColorSetting: function (colorProperty, color) {
            Log.call(Log.l.u1, "AppData.", "colorProperty=" + colorProperty + " color=" + color);
            Colors[colorProperty] = color;
            switch (colorProperty) {
                case "kioskHeaderBackgroundColor":
                    if (AppData._persistentStates.showAppBkg) {
                        Colors.changeCSS(".nx-header .nx-header__top-bar", "background-color", "transparent");
                    } else {
                        Colors.changeCSS(".nx-header .nx-header__top-bar", "background-color", Colors.kioskHeaderBackgroundColor);
                    }
                    break;
                case "kioskButtonBackgroundColor":
                    Colors.changeCSS(".nx-button", "background-color", Colors.kioskButtonBackgroundColor + " !important");
                    break;
                case "kioskProductBackgroundColor":
                    Colors.changeCSS(".nx-proitem .nx-proitem__overlay", "background-color", Colors.kioskProductBackgroundColor);
                    break;
                case "kioskProductPreloadColor":
                    Colors.changeCSS(".nx-proitem .nx-proitem__img-container .nx-proitem__preload-bg-color", "background-color", Colors.kioskProductPreloadColor + " !important");
                    break;
                case "kioskProductTitleColor":
                    Colors.changeCSS(".nx-proitem .nx-proitem__title", "color", Colors.kioskProductTitleColor);
                    Colors.changeCSS(".nx-title_color", "color", Colors.kioskProductTitleColor);
                    break;
                case "textColor":
                    Colors.changeCSS(".nx-title_black", "color", Colors.textColor);
                    break;
                case "accentColor":
                    // fall through...
                case "navigationColor":
                    AppBar.loadIcons();
                    NavigationBar.groups = Application.navigationBarGroups;
                    break;
            }
            Log.ret(Log.l.u1);
        },
        generalData: {
            get: function () {
                var data = AppData._persistentStates;
                data.logTarget = Log.targets.console;
                data.setRecordId = AppData.setRecordId;
                data.getRecordId = AppData.getRecordId;
                data.setRestriction = AppData.setRestriction;
                data.getRestriction = AppData.getRestriction;
                data.contactDateTime = (function () {
                    return (AppData.getContactDateString() + " " + AppData.getContactTimeString());
                })();
                data.eventName = AppData._userData.VeranstaltungName;
                data.userName = AppData._userData.Login;
                data.userPresent = AppData._userData.Present;
                data.publishFlag = AppData._userData.PublishFlag;
                data.contactDate = (AppData._contactData && AppData._contactData.Erfassungsdatum);
                data.contactId = (AppData._contactData && AppData._contactData.KontaktVIEWID);
                data.globalContactID = ((AppData._contactData && AppData._contactData.CreatorRecID)
                    ? (AppData._contactData.CreatorSiteID + "/" + AppData._contactData.CreatorRecID)
                    : "");
                data.on = getResourceText("settings.on");
                data.off = getResourceText("settings.off");
                data.dark = getResourceText("settings.dark");
                data.light = getResourceText("settings.light");
                data.present = getResourceText("userinfo.present");
                data.absend = getResourceText("userinfo.absend");
                return data;
            }
        },
        _initAnredeView: {
            get: function () {
                return AppData.getLgntInit("LGNTINITAnrede");
            }
        },
        _initLandView: {
            get: function () {
                return AppData.getLgntInit("LGNTINITLand");
            }
        },
        initAnredeView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.initAnredeView.");
                var ret = AppData._initAnredeView.select(complete, error, recordId, { ordered: true, orderByValue: true });
                Log.ret(Log.l.trace);
                return ret;
            },
            getResults: function () {
                Log.call(Log.l.trace, "AppData.initAnredeView.");
                var ret = AppData._initAnredeView.results;
                Log.ret(Log.l.trace);
                return ret;
            },
            getMap: function () {
                Log.call(Log.l.trace, "AppData.initAnredeView.");
                var ret = AppData._initAnredeView.map;
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        initLandView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.initLandView.");
                var ret = AppData._initLandView.select(complete, error, recordId, { ordered: true });
                Log.ret(Log.l.trace);
                return ret;
            },
            getResults: function () {
                Log.call(Log.l.trace, "AppData.initLandView.");
                var ret = AppData._initLandView.results;
                Log.ret(Log.l.trace);
                return ret;
            },
            getMap: function () {
                Log.call(Log.l.trace, "AppData.initLandView.");
                var ret = AppData._initLandView.map;
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });

    // forward declarations used in binding converters
    WinJS.Namespace.define("Settings", {
        getInputBorderName: null
    });
    WinJS.Namespace.define("Info", {
        getLogLevelName: null
    });
    WinJS.Namespace.define("Barcode", {
        listening: false,
        dontScan: false,
        waitingScans: 0,
        onBarcodeSuccess: function (result, repeatCount) {
            repeatCount = repeatCount || 0;
            Log.call(Log.l.trace, "Barcode.", "repeatCount=" + repeatCount);
            if (Application.getPageId(nav.location) === "barcode") {
                if (Barcode.dontScan &&
                    AppBar.scope &&
                    typeof AppBar.scope.onBarcodeSuccess === "function") {
                    Barcode.dontScan = false;
                    AppBar.scope.onBarcodeSuccess(result);
                } else {
                    Barcode.waitingScans++;
                    WinJS.Promise.timeout(250).then(function () {
                        Barcode.waitingScans--;
                        Barcode.onBarcodeSuccess(result, repeatCount + 1);
                    });
                }
            } else {
                Barcode.dontScan = true;
                Application.navigateById("barcode");
                WinJS.Promise.timeout(250).then(function () {
                    Barcode.onBarcodeSuccess(result, repeatCount + 1);
                });
            }
            if (!repeatCount) {
                Barcode.startListenDelayed(0);
            }
            Log.ret(Log.l.trace);
        },
        onBarcodeError: function (error, repeatCount) {
            repeatCount = repeatCount || 0;
            Log.call(Log.l.trace, "Barcode.", "repeatCount=" + repeatCount);
            if (Application.getPageId(nav.location) === "barcode") {
                if (Barcode.dontScan &&
                    AppBar.scope &&
                    typeof AppBar.scope.onBarcodeError === "function") {
                    Barcode.dontScan = false;
                    AppBar.scope.onBarcodeError(error);
                } else {
                    Barcode.waitingScans++;
                    WinJS.Promise.timeout(250).then(function () {
                        Barcode.waitingScans--;
                        Barcode.onBarcodeError(error, repeatCount + 1);
                    });
                }
            } else {
                Barcode.dontScan = true;
                Application.navigateById("barcode");
                WinJS.Promise.timeout(250).then(function () {
                    Barcode.onBarcodeError(error, repeatCount + 1);
                });
            }
            if (!repeatCount) {
                Barcode.startListenDelayed(0);
            }
            Log.ret(Log.l.trace);
        },
        onDeviceConnected: function (result) {
            var id = result && result.id;
            var status = result && result.status;
            Log.call(Log.l.trace, "Barcode.", "id=" + id + " status=" + status);
            Barcode.startListenDelayed(250);
            Log.ret(Log.l.trace);
        },
        onDeviceConnectFailed: function (error) {
            var id = error && error.id;
            var status = error && error.status;
            Log.call(Log.l.trace, "Barcode.", "id=" + id + " status=" + status);
            Barcode.startListenDelayed(2000);
            Log.ret(Log.l.trace);
        },
        DeviceConstants: {
            connectionStatus: {}
        },
        connectionStatus: "",
        ioStatus: "",
        deviceStatus: {
            get: function() {
                if (typeof Barcode === "object") {
                    return Barcode.connectionStatus + (Barcode.ioStatus ? (" / " + Barcode.ioStatus) : "");
                } else {
                    return "";
                }
            }
        },
        startListenDelayed: function(delay) {
            Log.call(Log.l.trace, "Barcode.", "delay=" + delay);
            if (Barcode.listenPromise) {
                Barcode.listenPromise.cancel();
            }
            if (!delay) {
                Barcode.listenPromise = null;
                Barcode.startListen();
            } else {
                Barcode.listenPromise = WinJS.Promise.timeout(delay).then(function () {
                    Barcode.listenPromise = null;
                    Barcode.startListen();
                });
            }
            Log.ret(Log.l.trace);
        },
        startListen: function () {
            Log.call(Log.l.trace, "Barcode.");
            var generalData = AppData.generalData;
            if (typeof device === "object" && device.platform === "Android" &&
                generalData.useBarcodeActivity &&
                navigator &&
                navigator.broadcast_intent_plugin &&
                typeof navigator.broadcast_intent_plugin.listen === "function") {
                Log.print(Log.l.trace, "Android: calling  navigator.broadcast_intent_plugin.start...");
                navigator.broadcast_intent_plugin.listen(Barcode.onBarcodeSuccess, Barcode.onBarcodeError);
                Barcode.listening = true;
            } else if (typeof device === "object" && device.platform === "windows" &&
                generalData.useBarcodeActivity &&
                generalData.barcodeDevice &&
                navigator &&
                navigator.serialDevice) {
                if (Barcode.connectionStatus === Barcode.DeviceConstants.connectionStatus.connected &&
                    Barcode.ioStatus === Barcode.DeviceConstants.ioStatus.read) {
                    Log.print(Log.l.trace, "Windows: already reading...");
                } else if (Barcode.connectionStatus === Barcode.DeviceConstants.connectionStatus.connected) {
                    Barcode.startRead();
                } else if (!Barcode.listening) {
                    navigator.serialDevice.enumConnectionStatus(function (result) {
                        Barcode.DeviceConstants.connectionStatus = result;
                    });
                    navigator.serialDevice.enumIoStatus(function (result) {
                        Barcode.DeviceConstants.ioStatus = result;
                    });
                    navigator.serialDevice.connectDevice(
                        Barcode.connectionStatusChange,
                        Barcode.onDeviceConnectFailed, {
                            id: generalData.barcodeDevice,
                            onDeviceConnectionStatusChange: Barcode.connectionStatusChange
                        });
                    Barcode.listening = true;
                } else {
                    Barcode.startListenDelayed(2000);
                }
            }
            Log.ret(Log.l.trace);
        },
        stopListen: function (id) {
            Log.call(Log.l.trace, "Barcode.");
            if (id &&
                typeof device === "object" && device.platform === "windows" &&
                navigator &&
                navigator.serialDevice) {
                navigator.serialDevice.disconnectDevice(function (result) {
                    if (!AppData.generalData.barcodeDevice) {
                        Barcode.connectionStatusChange(result);
                    }
                }, function (error) {
                    if (!AppData.generalData.barcodeDevice) {
                        Barcode.connectionStatusChange(error);
                    }
                }, {
                    id: id,
                    onDeviceConnectionStatusChange: Barcode.connectionStatusChange
                });
            }
            Log.ret(Log.l.trace);
        },
        startRead: function() {
            var generalData = AppData.generalData;
            Log.call(Log.l.trace, "Barcode.");
            if (navigator &&
                navigator.serialDevice) {
                navigator.serialDevice.readFromDevice(function(readResult) {
                    var data = readResult && readResult.data;
                    Log.print(Log.l.trace, "readFromDevice: success! data=" + data);
                    if (data) {
                        Barcode.onBarcodeSuccess({
                            text: data
                        });
                    } else {
                        WinJS.Promise.timeout(0) .then(function() {
                            Barcode.startRead();
                        });
                    }
                }, function(readError) {
                    Log.print(Log.l.error, "readFromDevice: failed!");
                    if (readError && readError.id && readError.id === generalData.barcodeDevice) {
                        Barcode.onBarcodeError(readError.status);
                    }
                }, {
                    id: generalData.barcodeDevice,
                    onDeviceConnectionStatusChange: Barcode.connectionStatusChange,
                    prefixBinary: "#LSAD",
                    prefixLengthAdd: 2
                });
            }
            Log.ret(Log.l.trace);
        },
        connectionStatusChange: function (result) {
            var id = result && result.id;
            var connectionStatus = result && result.connectionStatus;
            var ioStatus = result && result.ioStatus;
            Log.call(Log.l.trace, "Barcode.", "id=" + id + " connectionStatus=" + connectionStatus + " ioStatus=" + ioStatus);
            var prevConnectionStatus = Barcode.connectionStatus;

            Barcode.connectionStatus = connectionStatus;
            Barcode.ioStatus = ioStatus;
            if (Application.getPageId(nav.location) === "info" &&
                AppBar.scope && AppBar.scope.binding) {
                AppBar.scope.binding.barcodeDeviceStatus = Barcode.deviceStatus;
            }
            switch (connectionStatus) {
            case Barcode.DeviceConstants.connectionStatus.connected:
                if (prevConnectionStatus !== Barcode.DeviceConstants.connectionStatus.connected) {
                    Barcode.onDeviceConnected();
                }
                break;
            case Barcode.DeviceConstants.connectionStatus.connecting:
            case Barcode.DeviceConstants.connectionStatus.disconnecting:
                break;
            default:
                Barcode.listening = false;
            }
            Log.ret(Log.l.trace);
        }
    });
    // usage of binding converters
    //
    //<span 
    //
    //       // display element if value is set:
    //
    //       data-win-bind="textContent: loginModel.userName; style.display: loginModel.userName Binding.Converter.toDisplay" 
    //
    WinJS.Namespace.define("Binding.Converter", {
        toLogLevelName: WinJS.Binding.converter(function (value) {
            return (typeof Info.getLogLevelName === "function" && Info.getLogLevelName(value));
        }),
        toInputBorderName: WinJS.Binding.converter(function (value) {
            return (typeof Settings.getInputBorderName === "function" && Settings.getInputBorderName(value));
        })
    });

})();