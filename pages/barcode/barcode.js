// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/barcode/barcodeController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("barcode");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            this.inResize = 0;
            this.prevWidth = 0;
            this.prevHeight = 0;

            if (!options) {
                options = {};
            }
            options.showHalfCircle = true;

            AppBar.commandList = [
               // now only for page navigation test purpose:
               // { id: "clickFailed", label: getResourceText("command.delete"), tooltip: getResourceText("tooltip.delete"), section: "primary", svg: "delete" },
               // { id: "clickFinished", label: getResourceText("command.ok"), tooltip: getResourceText("tooltip.ok"), section: "primary", svg: "navigate_check", key: WinJS.Utilities.Key.enter }
            ];
            this.controller = new Barcode.Controller(element);
            if (this.controller.eventHandlers) {
                // general event listener for hardware back button, too!
                this.controller.addRemovableEventListener(document, "backbutton", this.controller.eventHandlers.clickBack.bind(this.controller));
            }
            Log.ret(Log.l.trace);
        },

        // This function is called before a user navigates away from this page. It
        // can save page data and delay or cancel page transition.
        /*
        canUnload: function (complete, error) {
            Log.call(Log.l.trace, pageName + ".");
            var ret;
            if (this.controller) {
                ret = this.controller.saveData(function (response) {
                    // called asynchronously if ok
                    complete(response);
                }, function (errorResponse) {
                    error(errorResponse);
                });
            } else {
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
         * 
         */

        unload: function () {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Respond to navigations away from this page.
            Log.ret(Log.l.trace);
        },

        updateLayout: function (element, viewState, lastViewState) {
            var ret = null;
            var that = this;
            Log.call(Log.l.u1, pageName + ".");
            /// <param name="element" domElement="true" />
            // TODO: Respond to changes in viewState.
            if (element && !that.inResize) {
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function() {
                    if (that.controller) {
                        var contentarea = element.querySelector(".contentarea");
                        if (contentarea) {
                            var width = contentarea.clientWidth;
                            var height = contentarea.clientHeight - 8;
                            if (width !== that.prevWidth) {
                                // ToDo: horizontal layout changes
                                that.prevWidth = width;
                            }
                            if (height !== that.prevHeight) {
                                // ToDo: vertical layout changes
                                that.prevHeight = height;
                            }
                        }
                    }
                    that.inResize = 0;
                });
            }
            Log.ret(Log.l.u1);
            return ret;
        }
    });
})();
