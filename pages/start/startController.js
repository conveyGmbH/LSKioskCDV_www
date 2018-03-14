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
                showStart: true
            }]);

            var that = this;

            this.dispose = function () {
            }

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    that.binding.showStart = false;
                    Application.navigateById("languagelist", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
            };

            var fadeAnimantion = function (element, bIn) {
                Log.call(Log.l.trace, "Start.Controller.");
                if (element && that.binding) {
                    var fnAnimation = bIn ? WinJS.UI.Animation.fadeIn : WinJS.UI.Animation.fadeOut;
                    fnAnimation(element).done(function () {
                        if (!that.binding || !that.binding.showStart) {
                            Log.print(Log.l.trace, "finished");
                        } else {
                            Log.print(Log.l.trace, "go on with animation");
                            that.animationPromise = WinJS.Promise.timeout(1000).then(function () {
                                that.fadeAnimantion(element, !bIn);
                            });
                        }
                    });
                }
                Log.ret(Log.l.trace);
            }
            this.fadeAnimantion = fadeAnimantion;
            
            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return WinJS.Promise.timeout(Application.pageframe.splashScreenDone ? 0 : 1000);
            }).then(function() {
                Colors.loadSVGImageElements(pageElement, "start-navigate-image", 512, Colors.kioskProductTitleColor, "title", function (svgInfo) {
                    if (svgInfo && svgInfo.element && svgInfo.element.title === "hand_touch") {
                        that.fadeAnimantion(svgInfo.element.firstElementChild ||
                            svgInfo.element.firstChild, true);
                    }
                });
                Colors.loadSVGImageElements(pageElement, "start-navigate-image-black", 512, "#000000", "title", function (svgInfo) {
                });
                Log.print(Log.l.trace, "Splash time over");
                return Application.pageframe.hideSplashScreen();
            }).then(function() {
                Log.print(Log.l.trace, "Splash screen vanished");
            });
            Log.ret(Log.l.trace);
        })
    });
})();







