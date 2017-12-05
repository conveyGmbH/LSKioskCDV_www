// controller for page: dbinit
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dbinit.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/dbinit/dbinitService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("DBInit", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "DBInit.Controller.");
            Application.Controller.apply(this, [pageElement, {
                progress: {
                    percent: 0,
                    text: "",
                    show: null
                }
            }]);

            var that = this;

            var getStartPage = function() {
                var startPage;
                var userId = null;
                if (typeof AppData._persistentStates.allRecIds !== "undefined" &&
                    typeof AppData._persistentStates.allRecIds["Mitarbeiter"] !== "undefined") {
                    userId = AppData._persistentStates.allRecIds["Mitarbeiter"];
                    Log.print(Log.l.info, "userId=" + userId);
                }
                if (!userId || 
                    !that.binding.appSettings.odata.login ||
                    !that.binding.appSettings.odata.password/* ||
                    !that.binding.appSettings.odata.dbSiteId*/) {
                    startPage = "login";
                } else {
                    startPage = "start";
                }
                return startPage;
            }
            var applyColorSetting = function (colorProperty, color) {
                Log.call(Log.l.trace, "Settings.Controller.", "colorProperty=" + colorProperty + " color=" + color);

                Colors[colorProperty] = color;

                // new for KioskApp
                if (Colors.kioskHeaderBackgroundColor) {
                    Colors.changeCSS(".nx-header .nx-header__top-bar", "background-color", Colors.kioskHeaderBackgroundColor);
                }
                if (Colors.kioskButtonBackgroundColor) {
                    Colors.changeCSS(".nx-button", "background-color", Colors.kioskButtonBackgroundColor + " !important");
                }
                if (Colors.kioskProductBackgroundColor) {
                    Colors.changeCSS(".nx-proitem .nx-proitem__overlay", "background-color", Colors.kioskProductBackgroundColor);
                }
                if (Colors.kioskProductPreloadColor) {
                    Colors.changeCSS(".nx-proitem .nx-proitem__img-container .nx-proitem__preload-bg-color", "background-color", Colors.kioskProductPreloadColor + " !important");
                }
                if (Colors.kioskProductTitleColor) {
                    Colors.changeCSS(".nx-proitem .nx-proitem__title", "color", Colors.kioskProductTitleColor);
                }
               // that.binding.generalData[colorProperty] = color;
                switch (colorProperty) {
                    case "accentColor":
                        /* that.createColorPicker("backgroundColor");
                         that.createColorPicker("textColor");
                         that.createColorPicker("labelColor");
                         that.createColorPicker("tileTextColor");
                         that.createColorPicker("tileBackgroundColor");
                         that.createColorPicker("navigationColor");*/
                        // fall through...
                    case "navigationColor":
                        AppBar.loadIcons();
                        NavigationBar.groups = Application.navigationBarGroups;
                        break;
                }
                Log.ret(Log.l.trace);
            }
            this.applyColorSetting = applyColorSetting;

            var resultConverter = function (item, index) {
                var plusRemote = false;
                // item.INITOptionTypeID 25, 26, 27, 28, 29 
                if (item.INITOptionTypeID > 10) {
                    switch (item.INITOptionTypeID) {
                        case 25:
                            item.colorPickerId = "kioskHeaderBackgroundColor";
                            break;
                        case 26:
                            item.colorPickerId = "kioskButtonBackgroundColor";
                            break;
                        case 27:
                            item.colorPickerId = "kioskProductBackgroundColor";
                            break;
                        case 28:
                            item.colorPickerId = "kioskProductPreloadColor";
                            break;
                        case 29:
                            item.colorPickerId = "kioskProductTitleColor";
                            break;
                        default:
                            // defaultvalues
                    }
                    if (item.colorPickerId && item.LocalValue) {
                        item.colorValue = "#" + item.LocalValue;
                        that.applyColorSetting(item.colorPickerId, item.colorValue);
                    }
                }
                /*if (item.INITOptionTypeID === 10) {
                    if (item.LocalValue === "0") {
                        WinJS.Promise.timeout(0).then(function () {
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                            var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                            /*   that.createColorPicker("accentColor", true);
                               that.createColorPicker("backgroundColor");
                               that.createColorPicker("textColor");
                               that.createColorPicker("labelColor");
                               that.createColorPicker("tileTextColor");
                               that.createColorPicker("tileBackgroundColor");
                               that.createColorPicker("navigationColor");
                            AppBar.loadIcons();
                            NavigationBar.groups = Application.navigationBarGroups;
                        });
                    }
                }
                if (item.INITOptionTypeID === 18) {
                    if (item.LocalValue === "0") {
                        that.binding.generalData.isDarkTheme = false;
                    } else {
                        that.binding.generalData.isDarkTheme = true;
                    }
                    WinJS.Promise.timeout(0).then(function () {
                        Colors.isDarkTheme = that.binding.generalData.isDarkTheme;
                        Log.print(Log.l.trace, "isDarkTheme=" + Colors.isDarkTheme);
                        /*that.createColorPicker("backgroundColor");
                        that.createColorPicker("textColor");
                        that.createColorPicker("labelColor");
                        that.createColorPicker("tileTextColor");
                        that.createColorPicker("tileBackgroundColor");
                        that.createColorPicker("navigationColor");
                    });
                }*/
               /* if (item.pageProperty) {
                    if (item.LocalValue === "1") {
                        NavigationBar.enablePage(item.pageProperty);
                        if (plusRemote) {
                            NavigationBar.enablePage(item.pageProperty + "Remote");
                        }
                    } else if (item.LocalValue === "0") {
                        NavigationBar.disablePage(item.pageProperty);
                        if (plusRemote) {
                            NavigationBar.disablePage(item.pageProperty + "Remote");
                        }
                    }
                }*/
            }
            this.resultConverter = resultConverter;
            // define handlers
            this.eventHandlers = {
            };

            this.disableHandlers = {
            }

            var openDb = function () {
                AppBar.busy = true;

                var ret;
                Log.call(Log.l.info, "Account.Controller.");
                if (AppRepl.replicator &&
                    AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "replicator still running - try later!");
                    ret = WinJS.Promise.timeout(500).then(function () {
                        that.openDb();
                    });
                } else {
                    ret = AppData.openDB(function () {
                        AppBar.busy = false;
                        Log.print(Log.l.info, "openDB success!");
                        AppData._curGetUserDataId = 0;
                        AppData.getUserData();
                        WinJS.Promise.timeout(0).then(function () {
                            // navigate async here to ensure load of navigation menu!
                            Application.navigateById(getStartPage());
                        });
                    }, function (err) {
                        AppBar.busy = false;
                        Log.print(Log.l.error, "openDB error!");
                        AppData.setErrorMsg(that.binding, err);
                    }, function (res) {
                        if (res) {
                            that.binding.progress = {
                                percent: res.percent,
                                text: res.statusText,
                                show: 1
                            }
                        }
                    }).then(function () {
                        if (getStartPage() === "start") {
                            // load color settings
                            return DBInit.CR_VERANSTOPTION_ODataView.select(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "Account: success!");
                                // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response
                                if (json && json.d && json.d.results && json.d.results.length > 0) {
                                    var results = json.d.results;
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                    });
                                } else {
                                    AppData._persistentStates.individualColors = false;
                                    AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                                    var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                                }
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                // ignore error in app!
                                // AppData.setErrorMsg(that.binding, errorResponse);
                            }).then(function () {
                                Colors.updateColors();
                                return WinJS.Promise.as();
                            });
                        } else {
                            return WinJS.Promise.as();
                        }
                    });
                }
                Log.ret(Log.l.info);
                return ret;
            };
            that.openDb = openDb;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                // now open the DB
                that.openDb();
            });
            Log.ret(Log.l.trace);
        })
    });
})();


