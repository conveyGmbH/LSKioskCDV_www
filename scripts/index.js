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
        cameraQuality: 50,
        cameraUseGrayscale: true,
        cameraMaxSize: 2560,
        useClippingCamera: true,
        autoShutterTime: 1500,
        videoRotation: 180,
        brightnessValue: 20,
        focusValue: 18,
        contrastValue: 0.3,
        useBarcodeScanner: false,
        barcodeDevice: "",
        logEnabled: false,
        logLevel: 3,
        logGroup: false,
        logNoStack: true,
        logWinJS: false,
        inputBorder: 1,
        appBarSize: 48,
        appBarHideOverflowButton: true,
        navigatorOptions: {
            splitViewDisplayMode: {
                opened: WinJS.UI.SplitView.OpenedDisplayMode.overlay,
                closed: WinJS.UI.SplitView.ClosedDisplayMode.none
            }
        },
        odata: {
            https: true,
            hostName: "leadsuccess.convey.de",
            onlinePort: 443,
            onlinePath: "odata_online", // serviceRoot online requests
            login: "",
            password: "",
            registerPath: "odata_register", // serviceRoot register requests
            registerLogin: "AppRegister",
            registerPassword: "6530bv6OIUed3",
            useOffline: true,
            replActive: true,
            replInterval: 30,
            callerAddress: "Kiosk",
            serverSiteId: 1
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
        { id: "exportcontrol", group: -1, disabled: false },
        { id: "languagelist", group: -1, disabled: false },
        { id: "productlist", group: -1, disabled: false },
        { id: "confirm", group: -1, disabled: false },
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
            if (AppData.generalData.useBarcodeScanner &&
                Barcode && !Barcode.listening) {
                Barcode.startListenDelayed(250);
            }
            // clear contactId 
            AppData.setRecordId("Kontakt", null);
            id = "languagelist";
            //id = "productlist";
        } else if (id === "newlanguagelist") {
            id = "languagelist";
            //id = "exportcontrol";
            //id = "productlist";
        } else if (id === "languagelist") {
            //id = "exportcontrol";
        }
        Log.ret(Log.l.trace);
        return id;
    };

    Application.refreshAfterFetchOverride = function() {
        Log.call(Log.l.trace, "Application.");
        AppData.getUserData();
        AppData._curGetUserRemoteDataId = 0;
        AppData.getUserRemoteData();
        AppData.getContactData();
        Log.ret(Log.l.trace);
    };

    Application.onResumeOverride = function () {
        Log.call(Log.l.trace, "Application.");
        AppData._curGetUserRemoteDataId = 0;
        AppData.getUserRemoteData();
        Log.ret(Log.l.trace);
    };

    // initiate the page frame class
    var pageframe = new Application.PageFrame("LeadSuccessKiosk");
    pageframe.onOnlineHandler = function (eventInfo) {
        Log.call(Log.l.trace, "Application.PageFrame.");
        if (AppData._userRemoteDataPromise) {
            Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
            AppData._userRemoteDataPromise.cancel();
        }
        AppData._userRemoteDataPromise = WinJS.Promise.timeout(1000).then(function () {
            Log.print(Log.l.info, "getUserRemoteData: Now, timeout=1s is over!");
            AppData._curGetUserRemoteDataId = 0;
            AppData.getUserRemoteData();
        });
        WinJS.Promise.timeout(50).then(function () {
            if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                var numFastReqs = 1;
                AppRepl.replicator.run(numFastReqs);
            }
        });
        Log.ret(Log.l.trace);
    };
})();

