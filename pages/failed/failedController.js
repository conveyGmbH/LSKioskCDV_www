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
            }]);

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 10000;

            var that = this;

            this.dispose = function() {
            };

            var waitForIdleAction = function() {
                Log.call(Log.l.trace, "Failed.Controller.", "idleWaitTimeMs=" + that.idleWaitTimeMs);
                if (that.restartPromise) {
                    Log.print(Log.l.trace, "cancel previous Promise");
                    that.restartPromise.cancel();
                }
                that.restartPromise = WinJS.Promise.timeout(that.idleWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "timeout occurred, navigate back to start page!");
                    Application.navigateById("start");
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Failed.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
            };

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
            });
            Log.ret(Log.l.trace);
        })
    });
})();







