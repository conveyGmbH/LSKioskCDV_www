// controller for page: info
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/info/infoService.js" />

(function () {
    "use strict";
    WinJS.Namespace.define("Info", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Info.Controller.");
            Application.Controller.apply(this, [pageElement, {
                uploadTS: (AppData.appSettings.odata.replPrevPostMs ?
                "\/Date(" + AppData.appSettings.odata.replPrevPostMs + ")\/" : null),
                downloadTS: (AppData.appSettings.odata.replPrevSelectMs ?
                "\/Date(" + AppData.appSettings.odata.replPrevSelectMs + ")\/" : null),
                version: Application.version,
                environment: "Platform: " + navigator.appVersion,
                showClipping: true
            }, commandList]);

            var that = this;

            var homepageLink = pageElement.querySelector("#homepageLink");
            if (homepageLink) {
                homepageLink.innerHTML = "<a href=\"http://" + getResourceText("info.homepage") + "\">" + getResourceText("info.homepage") + "</a>";
            }

            var setupLog = function () {
                var settings = null;
                Log.call(Log.l.trace, "Info.Controller.");
                if (that.binding.generalData.logEnabled) {
                    settings = {
                        target: that.binding.generalData.logTarget,
                        level: that.binding.generalData.logLevel,
                        group: that.binding.generalData.logGroup,
                        noStack: that.binding.generalData.logNoStack
                    };
                }
                Log.ret(Log.l.trace);
                Log.init(settings);
            };
            this.setupLog = setupLog;

            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Contact.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Info.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    } else {
                        Application.navigateById("start", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Info.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickLogEnabled: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.logEnabled = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseClippingCamera: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.useClippingCamera = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseBarcodeScanner: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.useBarcodeScanner = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedAutoShutterTime: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.autoShutterTime = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedVideoRotation: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.videoRotation = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                                clickCameraUseGrayscale: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.cameraUseGrayscale = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedCameraQuality: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.cameraQuality = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedLogLevel: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.logLevel = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickLogGroup: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.logGroup = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickLogNoStack: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.logNoStack = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            }

            this.disableHandlers = {
                clickOk: function () {
                    // always enabled!
                    return false;
                }
            }

            AppData.setErrorMsg(this.binding);

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
            });
            Log.ret(Log.l.trace);
        }),
        getLogLevelName: function (level) {
            Log.call(Log.l.trace, "Info.", "level=" + level);
            var key = "log" + level;
            Log.print(Log.l.trace, "key=" + key);
            var name = getResourceText("info." + key);
            Log.ret(Log.l.trace, "name=" + name);
            return name;
        }
    });
})();



