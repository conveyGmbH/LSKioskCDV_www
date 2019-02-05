// controller for page: info
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/info/infoService.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

(function () {
    "use strict";
    WinJS.Namespace.define("Info", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Info.Controller.");

            var isDeviceListOpened = false;
            var isWindows = false;
            var isWindows10 = false;
            var isAndroid = false;
            if (typeof device === "object" && typeof device.platform === "string") {
                if (device.platform === "Android") {
                    if (typeof AppData.generalData.useAudioNote === "undefined") {
                        AppData._persistentStates.useAudioNote = false;
                    }
                    isAndroid = true;
                } else if (device.platform === "windows") {
                    isWindows = true;
                    if (typeof device.version === "string" && device.version.substr(0, 4) === "10.0") {
                        isWindows10 = true;
                    }
                }
            }
            var hasBarcodeScanner = (isAndroid || isWindows10) ? true : false;
            var hasSerialDevice = (isWindows10 && AppData.generalData.useBarcodeActivity) ? true : false;
            Application.Controller.apply(this, [pageElement, {
                uploadTS: (AppData.appSettings.odata.replPrevPostMs ?
                "\/Date(" + AppData.appSettings.odata.replPrevPostMs + ")\/" : null),
                downloadTS: (AppData.appSettings.odata.replPrevSelectMs ?
                "\/Date(" + AppData.appSettings.odata.replPrevSelectMs + ")\/" : null),
                version: Application.version,
                environment: "Platform: " + navigator.appVersion,
                showClipping: true,
                isAndroid: isAndroid,
                isWindows: isWindows,
                hasBarcodeScanner: hasBarcodeScanner,
                hasSerialDevice: hasSerialDevice,
                barcodeDeviceStatus: Barcode.deviceStatus
            }, commandList]);

            this.barcodeDevice = AppData.generalData.barcodeDevice;
            this.binding.generalData.barcodeDevice = "";

            var barcodeDeviceSelect = pageElement.querySelector("#barcodeDeviceSelect");
            var nullDevice = { name: "", id: "" };
            var deviceList = null;

            var that = this;

            this.dispose = function () {
                if (barcodeDeviceSelect && barcodeDeviceSelect.winControl) {
                    barcodeDeviceSelect.winControl.data = null;
                }
                if (isDeviceListOpened &&
                    isWindows &&
                    navigator.serialDevice &&
                    typeof navigator.serialDevice.closeDeviceList === "function") {
                    navigator.serialDevice.closeDeviceList();
                }
            }

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
                clickUseBarcodeActivity: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.useBarcodeActivity = toggle.checked;
                            that.binding.hasSerialDevice = (isWindows10 && AppData.generalData.useBarcodeActivity) ? true : false;
                            if (that.binding.hasSerialDevice) {
                                WinJS.Promise.timeout(0).then(function () {
                                    that.loadData();
                                });
                            }
                            if (device &&
                                (device.platform === "Android" || device.platform === "windows") &&
                                AppData.generalData.useBarcodeActivity &&
                                AppData.generalData.barcodeDevice &&
                                !Barcode.listening) {
                                Barcode.startListenDelayed(250);
                            }
                        } else if (Barcode.listening) {
                            Barcode.stopListen();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changeBarcodeDeviceSelect: function(event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var prevValue = that.binding.generalData.barcodeDevice;
                        var value = event.currentTarget.value;
                        if (prevValue !== value) {
                            WinJS.Promise.timeout(0).then(function() {
                                Barcode.stopListen(prevValue);
                                return WinJS.Promise.timeout(500);
                            }).then(function () {
                                if (prevValue !== value) {
                                    that.binding.generalData.barcodeDevice = value;
                                    Barcode.listening = false;
                                    Barcode.startListenDelayed(0);
                                }
                            });
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
                },
                clickLogLogWinJS: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.logWinJS = toggle.checked;
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

            var setDeviceList = function (newDeviceList) {
                Log.call(Log.l.trace, "info.Controller.");
                if (newDeviceList) {
                    var i, j, numDeviceEntries, bFound = false;
                    var foundEntries = [];
                    if (!deviceList) {
                        deviceList = new WinJS.Binding.List([nullDevice]);
                        if (barcodeDeviceSelect &&
                            barcodeDeviceSelect.winControl) {
                            barcodeDeviceSelect.winControl.data = deviceList;
                        }
                    }
                    // empty entry at start remain2 in list!
                    for (i = 1, numDeviceEntries = deviceList.length; i < numDeviceEntries; i++) {
                        var deviceInformation = deviceList.getAt(i);
                        if (deviceInformation) {
                            for (j = 0; j < newDeviceList.length; j++) {
                                if (newDeviceList[j].id === deviceInformation.id) {
                                    foundEntries[j] = true;
                                    if (newDeviceList[j].id === that.barcodeDevice) {
                                        bFound = true;
                                    }
                                    break;
                                }
                            }
                            if (!foundEntries[j]) {
                                deviceList.splice(i, 1);
                            }
                        }
                    }
                    for (j = 0; j < newDeviceList.length; j++) {
                        if (!foundEntries[j]) {
                            deviceList.push(newDeviceList[j]);
                            if (newDeviceList[j].id === that.barcodeDevice) {
                                bFound = true;
                            }
                        }
                    }
                    if (bFound) {
                        that.binding.generalData.barcodeDevice = that.barcodeDevice;
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.setDeviceList = setDeviceList;

            var loadData = function() {
                Log.call(Log.l.trace, "info.Controller.");
                var ret = new WinJS.Promise.as().then(function() {
                    if (that.binding.hasSerialDevice &&
                        navigator.serialDevice &&
                        typeof navigator.serialDevice.openDeviceList === "function") {
                        navigator.serialDevice.openDeviceList(that.setDeviceList, function(error) {
                            Log.print(Log.l.error, "openDeviceList returned " + error);
                            isDeviceListOpened = false;
                        }, {
                            onDeviceListChange: that.setDeviceList
                        });
                        isDeviceListOpened = true;
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loadad");
                AppBar.notifyModified = true;
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



