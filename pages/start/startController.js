// controller for page: start
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/start/startService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Start", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Start.Controller.");
            Application.Controller.apply(this, [pageElement, {
            }]);

            var that = this;

            this.dispose = function () {
            }

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    Application.navigateById("languagelist", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
            };

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return WinJS.Promise.timeout(Application.pageframe.splashScreenDone ? 0 : 1000);
            }).then(function() {
                Log.print(Log.l.trace, "Splash time over");
                return Application.pageframe.hideSplashScreen();
            }).then(function() {
                Log.print(Log.l.trace, "Splash screen vanished");
            });
            Log.ret(Log.l.trace);
        })
    });
})();







