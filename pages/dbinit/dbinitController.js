// controller for page: dbinit
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
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
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "DBInit.Controller.");
            Application.Controller.apply(this, [pageElement, {
                progress: {
                    percent: 0,
                    text: "",
                    show: null
                }
            }]);

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
                    !that.binding.appSettings.odata.password/* ||
                    !that.binding.appSettings.odata.dbSiteId*/) {
                    startPage = "login";
                } else {
                    startPage = "start";
                }
                return startPage;
            }

            // define handlers
            this.eventHandlers = {
            };

            this.disableHandlers = {
            }

            var openDb = function () {
                AppBar.busy = true;

                var ret;
                Log.call(Log.l.info, "Account.Controller.");
                if (AppRepl.replicator &&
                    AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "replicator still running - try later!");
                    ret = WinJS.Promise.timeout(500).then(function () {
                        that.openDb();
                    });
                } else {
                    ret = AppData.openDB(function () {
                        AppBar.busy = false;
                        Log.print(Log.l.info, "openDB success!");
                        AppData._curGetUserDataId = 0;
                        AppData.getUserData();
                        WinJS.Promise.timeout(0).then(function () {
                            // navigate async here to ensure load of navigation menu!
                            Application.navigateById(getStartPage());
                        });
                    }, function (err) {
                        AppBar.busy = false;
                        Log.print(Log.l.error, "openDB error!");
                        AppData.setErrorMsg(that.binding, err);
                    }, function (res) {
                        if (res) {
                            that.binding.progress = {
                                percent: res.percent,
                                text: res.statusText,
                                show: 1
                            }
                        }
                    });
                }
                Log.ret(Log.l.info);
                return ret;
            };
            that.openDb = openDb;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                // now open the DB
                that.openDb();
            });
            Log.ret(Log.l.trace);
        })
    });
})();


