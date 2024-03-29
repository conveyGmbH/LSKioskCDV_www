﻿// controller for page: start
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
            
            var loadData = function () {
                Log.call(Log.l.trace, "Start.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (AppData._userRemoteDataPromise) {
                        Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                        AppData._userRemoteDataPromise.cancel();
                    }
                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(100).then(function () {
                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + 100 + "s is over!");
                        AppData._curGetUserRemoteDataId = 0;
                        AppData.getUserRemoteData();
                        Log.print(Log.l.info, "getCRVeranstOption: Now, timeout=" + 100 + "s is over!");
                        AppData.getCRVeranstOption();
                    });
                });
            }
            this.loadData = loadData;

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
                that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "data loaded");
                if (AppData.generalData.useBarcodeScanner &&
                    Barcode &&
                    !Barcode.listening) {
                    Barcode.startListenDelayed(250);
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();







