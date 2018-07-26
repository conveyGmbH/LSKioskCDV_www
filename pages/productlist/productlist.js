// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/productlist/productlistController.js" />
(function () {
    "use strict";

    WinJS.Namespace.define("Application.ProductListLayout", {
        GroupsLayout: WinJS.Class.derive(WinJS.UI.GridLayout, function (options) {
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
                WinJS.Utilities.addClass(this._surface, "productgroupLayout");

                return WinJS.UI.Orientation.vertical;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
                WinJS.Utilities.removeClass(this._surface, "productgroupLayout");
                this._site = null;
                this._surface = null;
                if (this.__proto__ &&
                    typeof this.__proto__.uninitialize === "function") {
                    this.__proto__.uninitialize();
                }
            }
        }),
        ProductsLayout: WinJS.Class.derive(WinJS.UI.GridLayout, function (options) {
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
                WinJS.Utilities.addClass(this._surface, "productlistLayout");

                return WinJS.UI.Orientation.vertical;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
                WinJS.Utilities.removeClass(this._surface, "productlistLayout");
                this._site = null;
                this._surface = null;
                if (this.__proto__ &&
                    typeof this.__proto__.uninitialize === "function") {
                    this.__proto__.uninitialize();
                }
            }
        })
    });

    var pageName = Application.getPagePath("productlist");

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
            AppBar.commandList = [
                /*
                { id: 'clickBack', label: getResourceText("command.backward"), tooltip: getResourceText("tooltip.backward"), section: 'primary', svg: 'navigate_left' },
                { id: "clickOk", label: getResourceText("command.ok"), tooltip: getResourceText("tooltip.ok"), section: "primary", svg: "navigate_check", key: WinJS.Utilities.Key.enter }
                 */
            ];

            this.controller = new ProductList.Controller(element);
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
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function () {
                    var contentarea = element.querySelector(".contentarea");
                    if (contentarea) {
                        var listHeader = element.querySelector(".list-header");
                        var width = contentarea.clientWidth;
                        var height = contentarea.clientHeight - 8;
                        if (listHeader) {
                            height -= listHeader.clientHeight;
                        }
                        if (width !== that.prevWidth || height !== that.prevHeight) {
                            var listView = element.querySelector("#productlist.listview");
                            var groupView = element.querySelector("#productgroups.listview");
                            var sezoom = element.querySelector("#sezoom");
                            if (sezoom && sezoom.style && listView && listView.style && groupView && groupView.style) {
                                if (width !== that.prevWidth) {
                                    that.prevWidth = width;
                                    if (sezoom.clientWidth !== width) {
                                        Log.print(Log.l.u1, "sezoom: width " + sezoom.clientWidth + " => " + height);
                                        sezoom.style.width = width.toString() + "px";
                                    }
                                    if (listView.clientWidth !== width) {
                                        Log.print(Log.l.u1, "listView: width " + listView.clientWidth + " => " + height);
                                        listView.style.width = width.toString() + "px";
                                    }
                                    if (groupView.clientWidth !== width) {
                                        Log.print(Log.l.u1, "groupView: width " + groupView.clientWidth + " => " + height);
                                        groupView.style.width = width.toString() + "px";
                                    }
                                }
                                if (height !== that.prevHeight) {
                                    that.prevHeight = height;
                                    if (sezoom.clientHeight !== height) {
                                        Log.print(Log.l.u1, "sezoom: height " + sezoom.clientHeight + " => " + height);
                                        sezoom.style.height = height.toString() + "px";
                                    }
                                    if (listView.clientHeight !== height) {
                                        Log.print(Log.l.u1, "listView: height " + listView.clientHeight + " => " + height);
                                        listView.style.height = height.toString() + "px";
                                    }
                                    if (groupView.clientHeight !== height) {
                                        Log.print(Log.l.u1, "groupView: height " + groupView.clientHeight + " => " + height);
                                        groupView.style.height = height.toString() + "px";
                                    }
                                }
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
