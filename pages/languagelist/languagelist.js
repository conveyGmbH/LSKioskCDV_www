﻿// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/languagelist/languagelistController.js" />
(function () {
    "use strict";

    WinJS.Namespace.define("Application.LanguageListLayout", {
        LanguagesLayout: WinJS.Class.derive(WinJS.UI.GridLayout, function (options) {
            WinJS.UI.GridLayout.apply(this, [options]);
            this._site = null;
            this._surface = null;
        },
        {
            // This sets up any state and CSS layout on the surface of the custom layout
            initialize: function (site) {
                if (this.__proto__ &&
                    typeof this.__proto__.initialize === "function") {
                    this.__proto__.initialize(site);
                }
                this._site = site;
                this._surface = this._site.surface;

                // Add a CSS class to control the surface level layout
                WinJS.Utilities.addClass(this._surface, "languagelistLayout");

                return WinJS.UI.Orientation.vertical;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
                WinJS.Utilities.removeClass(this._surface, "languagelistLayout");
                this._site = null;
                this._surface = null;
                if (this.__proto__ &&
                    typeof this.__proto__.uninitialize === "function") {
                    this.__proto__.uninitialize();
                }
            }
        })
    });

    var pageName = Application.getPagePath("languagelist");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            this.inResize = 0;
            this.prevWidth = 0;
            this.prevHeight = 0;

            // add page specific commands to AppBar
            /*
            AppBar.commandList = [
                { id: 'clickBack', label: getResourceText("command.backward"), tooltip: getResourceText("tooltip.backward"), section: 'primary', svg: 'navigate_left' },
                { id: "clickOk", label: getResourceText("command.ok"), tooltip: getResourceText("tooltip.ok"), section: "primary", svg: "navigate_check", key: WinJS.Utilities.Key.enter }
            ];
             */
            AppBar.commandList = [];

            this.controller = new LanguageList.Controller(element);
            if (this.controller.eventHandlers) {
                // general event listener for hardware back button, too!
                this.controller.addRemovableEventListener(document, "backbutton", this.controller.eventHandlers.clickBack.bind(this.controller));
            }
            Log.ret(Log.l.trace);
        },

        unload: function () {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Respond to navigations away from this page.
            Log.ret(Log.l.trace);
        },

        updateLayout: function (element, viewState, lastViewState) {
            var ret = null;
            var that = this;
            /// <param name="element" domElement="true" />
            Log.call(Log.l.u1, pageName + ".");
            // TODO: Respond to changes in viewState.
            if (element && !that.inResize) {
                var width, height;
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function () {
                    var organizerImageContainer = element.querySelector(".organizer-image-container");
                    if (organizerImageContainer && organizerImageContainer.style) {
                        var contentarea = element.querySelector(".contentarea");
                        if (contentarea) {
                            width = contentarea.clientWidth;
                            height = contentarea.clientHeight;
                            if (width !== that.prevWidth) {
                                organizerImageContainer.style.width = width.toString() + "px";
                            }
                            if (height !== that.prevHeight) {
                                organizerImageContainer.style.height = (height - 178).toString() + "px";
                            }
                        }
                    }
                    return WinJS.Promise.timeout(50);
                }).then(function () {
                    var organizerImage = element.querySelector(".organizer-image");
                    if (organizerImage && organizerImage.style) {
                        var organizerImageLeft = (width - organizerImage.clientWidth) / 2;
                        if (width !== that.prevWidth) {
                            that.prevWidth = width;
                            organizerImage.style.left = organizerImageLeft.toString() + "px";
                        }
                        if (height !== that.prevHeight) {
                            that.prevHeight = height;
                            organizerImage.style.left = organizerImageLeft.toString() + "px";
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
