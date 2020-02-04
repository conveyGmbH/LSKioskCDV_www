// controller for page: confirm
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/confirm/confirmService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Confirm", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Confirm.Controller.");
            Application.Controller.apply(this, [pageElement, {
            }]);

            var that = this;

            this.dispose = function () {
                that.cancelPromises();
            }

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 30000;

            var cancelPromises = function () {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (that.restartPromise) {
                    Log.print(Log.l.trace, "cancel previous restart Promise");
                    that.restartPromise.cancel();
                    that.restartPromise = null;
                }
                Log.ret(Log.l.trace);
            }
            this.cancelPromises = cancelPromises;

            var waitForIdleAction = function () {
                Log.call(Log.l.trace, "ProductList.Controller.", "idleWaitTimeMs=" + that.idleWaitTimeMs);
                that.cancelPromises();
                that.restartPromise = WinJS.Promise.timeout(that.idleWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "timeout occurred, check for selectionCount!");
                    Application.navigateById("start", event);
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Confirm.Controller.");
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    //if (WinJS.Navigation.canGoBack === true) {
                    //    WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    //}
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Confirm.Controller.");
                    that.cancelPromises();
                    Application.navigateById("barcode", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
            };

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                that.waitForIdleAction();
            });
            Log.ret(Log.l.trace);
        })
    });
})();







