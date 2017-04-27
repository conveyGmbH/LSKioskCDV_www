// controller for page: start
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/finished/finishedService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Finished", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Finished.Controller.");
            Application.Controller.apply(this, [pageElement, {
            }]);

            var that = this;

            this.dispose = function () {
            }

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Finished.Controller.");
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







