// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints,
// and then run "window.location.reload()" in the JavaScript Console.
/// <reference path="~/www/lib/WinJS/scripts/base.min.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/pageFrame.js" />
/// <reference path="~/www/scripts/generalData.js" />

(function() {
    "use strict";

    // default settings
    AppData.persistentStatesDefaults = {
        colorSettings: {
            // navigation-color with 100% saturation and brightness
            accentColor: "#ff3c00"
        },
        showAppBkg: false,
        logEnabled: false,
        logLevel: 3,
        logGroup: false,
        logNoStack: true,
        inputBorder: 1,
        appBarSize: 96,
        appBarHideOverflowButton: true,
        navigatorOptions: {
            splitViewDisplayMode: {
                opened: WinJS.UI.SplitView.OpenedDisplayMode.overlay,
                closed: WinJS.UI.SplitView.ClosedDisplayMode.none
            }
        },
        odata: {
            https: false,
            hostName: "localhost",
            onlinePort: 8090,
            onlinePath: "odata_online", // serviceRoot online requests
            login: "",
            password: "",
            registerPath: "odata_register", // serviceRoot register requests
            registerLogin: "AppRegister",
            registerPassword: "6530bv6OIUed3",
            useOffline: false,
            replActive: false,
            replInterval: 30
        }
    };

    // static array of menu groups for the split view pane
    Application.navigationBarGroups = [
        { id: "start", group: 1, svg: "home", disabled: false },
        { id: "info", group: 7, svg: "gearwheel", disabled: false }
    ];

    // static array of pages for the navigation bar
    Application.navigationBarPages = [
        { id: "start", group: -1, disabled: false },
        { id: "languagelist", group: -1, disabled: false },
        { id: "productlist", group: -1, disabled: false },
        { id: "barcode", group: -1, disabled: false },
        { id: "finished", group: -1, disabled: false },
        { id: "failure", group: -1, disabled: false },
        { id: "info", group: 3, disabled: false },
        { id: "settings", group: 3, disabled: false },
        { id: "account", group: 3, disabled: false }
    ];


    // static array of pages master/detail relations
    Application.navigationMasterDetail = [
    ];

    // init page for app startup
    Application.initPage = Application.getPagePath("dbinit");
    // home page of app
    Application.startPage = Application.getPagePath("start");

    // new contact function select feature:
    Application.prevNavigateNewId = "newContact";
    // some more default page navigation handling
    Application.navigateByIdOverride = function (id, event) {
        Log.call(Log.l.trace, "Application.", "id=" + id);
        if (id === "start") {
            // clear contactId 
            AppData.setRecordId("Kontakt", null);
            // re-route directly to productlist page
            id = "productlist";
            //id = "languagelist";
        }
        Log.ret(Log.l.trace);
        return id;
    };

    // initiate the page frame class
    var pageframe = new Application.PageFrame("LeadSuccessKiosk");
})();

