// controller for page: settings
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/colors.js" />
/// <reference path="~/www/lib/convey/scripts/colorPicker.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/settings/settingsService.js" />

(function () {
    "use strict";
    WinJS.Namespace.define("Settings", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Settings.Controller.");
            Application.Controller.apply(this, [pageElement, {
            }]);

            var that = this;

            var createColorPicker = function (colorProperty, doRecreate) {
                Log.call(Log.l.trace, "Settings.Controller.");
                var id = "#" + colorProperty + "_picker";
                var element = pageElement.querySelector(id);
                if (element) {
                    element.innerHTML = "";
                    var colorPicker = new ColorPicker.ColorPickerClass(
                        element, 10, 28,
                        Colors[colorProperty],
                        function (color) { // callback function for change of color property!
                            Colors[colorProperty] = color;
                            if (this.triggerElement) {
                                if (this.triggerElement && this.triggerElement.style) {
                                    this.triggerElement.style.borderColor = Colors.textColor;
                                }
                            }
                            if (doRecreate) {
                                that.createColorPicker("backgroundColor");
                                that.createColorPicker("textColor");
                                that.createColorPicker("labelColor");
                                that.createColorPicker("tileTextColor");
                                that.createColorPicker("tileBackgroundColor");
                                that.createColorPicker("navigationColor");
                            }
                        }
                    );
                    var triggerElement = colorPicker.triggerElement;
                    if (triggerElement && triggerElement.style) {
                        triggerElement.style.borderColor = Colors.textColor;
                    }
                }
                Log.ret(Log.l.trace);
            };
            this.createColorPicker = createColorPicker;
            // create all color pickers!
            this.createColorPicker("accentColor", true);
            this.createColorPicker("backgroundColor");
            this.createColorPicker("textColor");
            this.createColorPicker("labelColor");
            this.createColorPicker("tileTextColor");
            this.createColorPicker("tileBackgroundColor");
            this.createColorPicker("navigationColor");

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Contact.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    } else {
                        Application.navigateById("start", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickGotoPublish: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    Application.navigateById("publish", event);
                    Log.ret(Log.l.trace);
                },
                clickIsDarkTheme: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.isDarkTheme = toggle.checked;
                        }
                        WinJS.Promise.timeout(0).then(function () {
                            Colors.isDarkTheme = that.binding.generalData.isDarkTheme;
                            Log.print(Log.l.trace, "isDarkTheme=" + Colors.isDarkTheme);
                            that.createColorPicker("backgroundColor");
                            that.createColorPicker("textColor");
                            that.createColorPicker("labelColor");
                            that.createColorPicker("tileTextColor");
                            that.createColorPicker("tileBackgroundColor");
                            that.createColorPicker("navigationColor");
                        });
                    }
                    Log.ret(Log.l.trace);
                },
                clickIndividualColors: function (event) {
                    var restoreDefault = false;
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            if (!toggle.checked) {
                                restoreDefault = true;
                            }
                            that.binding.generalData.individualColors = toggle.checked;
                        }
                        AppData._persistentStates.individualColors = that.binding.generalData.individualColors;
                        if (restoreDefault) {
                            AppData._persistentStates.colorSettings = AppData.persistentStatesDefaults.colorSettings;
                            WinJS.Promise.timeout(0).then(function () {
                                var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                                that.createColorPicker("accentColor", true);
                                that.createColorPicker("backgroundColor");
                                that.createColorPicker("textColor");
                                that.createColorPicker("labelColor");
                                that.createColorPicker("tileTextColor");
                                that.createColorPicker("tileBackgroundColor");
                                that.createColorPicker("navigationColor");
                            });
                        }
                        Application.pageframe.savePersistentStates();
                    }
                    Log.ret(Log.l.trace);
                },
                clickShowAppBkg: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.showAppBkg = toggle.checked;
                            if (AppBar.notifyModified) {
                                AppData._persistentStates.showAppBkg = that.binding.generalData.showAppBkg;
                                Log.print(Log.l.trace, "showAppBkg=" + AppData._persistentStates.showAppBkg);
                            }
                        }
                        WinJS.Promise.timeout(0).then(function () {
                            var appBkg = document.querySelector(".app-bkg");
                            if (appBkg && appBkg.style) {
                                appBkg.style.visibility = AppData._persistentStates.showAppBkg ? "visible" : "hidden";
                            }
                        });
                    }
                    Log.ret(Log.l.trace);
                },
                changedInputBorder: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.inputBorder = range.value;
                        }
                        WinJS.Promise.timeout(0).then(function () {
                            Colors.inputBorder = that.binding.generalData.inputBorder;
                            Log.print(Log.l.trace, "inputBorder=" + Colors.inputBorder);
                        });
                    }
                    Log.ret(Log.l.trace);
                }
            };

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
        getInputBorderName: function (level) {
            Log.call(Log.l.trace, "Settings.", "level=" + level);
            var key = "border" + level;
            Log.print(Log.l.trace, "key=" + key);
            var resources = getResourceTextSection("settings");
            var name = resources[key];
            Log.ret(Log.l.trace, "name=" + name);
            return name;
        }
    });
})();

