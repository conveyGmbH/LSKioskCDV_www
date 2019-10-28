// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/dbinit/dbinitController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("dbinit");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app"s data.
        ready: function(element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            if (AppData._persistentStates.odata.dbinitIncomplete) {
                NavigationBar.disablePage("search");
                NavigationBar.disablePage("info");
            }
            // add page specific commands to AppBar
            var commandList = [];

            this.controller = new DBInit.Controller(element, commandList);
            Log.ret(Log.l.trace);
        },

        canUnload: function (complete, error) {
            Log.call(Log.l.trace, pageName + ".");
            var ret;
            if (this.controller) {
                if (AppData._persistentStates.odata.dbinitIncomplete &&
                    this.controller.getStartPage() === "start") {
                    ret = this.controller.saveData(function(response) {
                            // called asynchronously if ok
                            NavigationBar.enablePage("search");
                            NavigationBar.enablePage("info");
                            complete(response);
                        },
                        function(errorResponse) {
                            error(errorResponse);
                        });
                } else {
                    ret = this.controller.openDb(complete, error);
                }
            } else {
                ret = WinJS.Promise.as().then(function () {
                    var err = { status: 500, statusText: "fatal: page already deleted!" };
                    error(err);
                });
            }
            Log.ret(Log.l.trace);
            return ret;
        },

        unload: function() {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Respond to navigations away from this page.
            Log.ret(Log.l.trace);
        },

        updateLayout: function(element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            // TODO: Respond to changes in viewState.
        }
    });
})();