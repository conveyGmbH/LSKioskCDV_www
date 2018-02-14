// controller for page: start
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/failed/failedService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Failed", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Failed.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataContact: {}
            }]);

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 10000;

            var that = this;

            this.dispose = function() {
                that.cancelPromises();
            };

            var cancelPromises = function () {
                Log.call(Log.l.trace, "Failed.Controller.");
                if (that.restartPromise) {
                    Log.print(Log.l.trace, "cancel previous restart Promise");
                    that.restartPromise.cancel();
                    that.restartPromise = null;
                }
                Log.ret(Log.l.trace);
            }
            this.cancelPromises = cancelPromises;

            var waitForIdleAction = function () {
                Log.call(Log.l.trace, "Failed.Controller.", "idleWaitTimeMs=" + that.idleWaitTimeMs);
                that.cancelPromises();
                that.restartPromise = WinJS.Promise.timeout(that.idleWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "timeout occurred, navigate back to start page!");
                    Application.navigateById("start");
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    //if (WinJS.Navigation.canGoBack === true) {
                    //    that.cancelPromises();
                    //    WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    //}
                    Log.ret(Log.l.trace);
                },
                clickStart: function (event) {
                    Log.call(Log.l.trace, "Failed.Controller.");
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickScan: function (event) {
                    Log.call(Log.l.trace, "Failed.Controller.");
                    that.cancelPromises();
                    Application.navigateById("barcode", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                }
            };

            var loadData = function () {
                Log.call(Log.l.trace, "Failed.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    var recordId = AppData.getRecordId("Kontakt");
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        return Failed.contactView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactView: success!");
                            if (json && json.d && json.d.KontaktVIEWID) {
                                that.binding.dataContact = json.d;
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, recordId);
                    } else {
                        // ignore that here
                        //var err = { status: 0, statusText: "no record selected" };
                        //AppData.setErrorMsg(that.binding, err);
                        Log.print(Log.l.trace, "contactView: no record selected!");
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;


            that.processAll().then(function () {
                var noSize;
                Log.print(Log.l.trace, "Binding wireup page complete");
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, "#00417F");
                Colors.loadSVGImageElements(pageElement, "failed-image", noSize, "#DC453A");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "data loaded");
                that.waitForIdleAction();
            });
            Log.ret(Log.l.trace);
        })
    });
})();







