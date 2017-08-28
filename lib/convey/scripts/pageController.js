// base-class for page controller helper object
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/WinJS/scripts/ui.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../../lib/convey/scripts/dataService.js" />
/// <reference path="../../../lib/convey/scripts/appbar.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Application", {
        /**
         * @class Controller 
         * @memberof Application
         * @param {Object} element - The HTML root element of the page
         * @param {Object} addPageData - An object to add to the page data binding proxy
         * @param {boolean} isMaster - True if the page is to be used as master view
         * @description This class implements the base class for page controller
         */
        Controller: WinJS.Class.define(function Controller(pageElement, addPageData, isMaster) {
            Log.call(Log.l.trace, "Application.Controller.");
            var controllerElement = pageElement;
            while (controllerElement &&
                controllerElement.className !== "data-container") {
                controllerElement = controllerElement.firstElementChild || controllerElement.firstChild;
            }
            if (controllerElement) {
                Log.print(Log.l.trace, "controllerElement: #" + controllerElement.id);
                controllerElement.winControl = this;
                WinJS.Utilities.addClass(controllerElement, "win-disposable");
                this._element = controllerElement;
            }
            this.pageData.generalData = AppData.generalData;
            this.pageData.appSettings = AppData.appSettings;

            // Set scope only if commandList is specified - don't use commandList for master views!
            if (!isMaster) {
                AppBar.scope = this;
            }

            // First, we call WinJS.Binding.as to get the bindable proxy object
            /**
             * @property {Object} binding - Bindable proxy object connected to page data 
             * @memberof Application.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the page data via bindable proxy object.
             *  Changes in the binding member of the controller are automatically synchronized between bound page control elements and the data members.
             *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229801.aspx WinJS.Binding.as} for furher informations.
             */
            this.binding = WinJS.Binding.as(this.pageData);
            var propertyName;
            AppData.setErrorMsg(this.binding);
            // Then, we add all properties of derived class to the bindable proxy object
            if (addPageData) {
                for (propertyName in addPageData) {
                    if (addPageData.hasOwnProperty(propertyName)) {
                        Log.print(Log.l.trace, "added " + propertyName + "=" + addPageData[propertyName]);
                        this.binding.addProperty(propertyName, addPageData[propertyName]);
                    }
                }
            }

            this._eventHandlerRemover = [];

            var that = this;
            /**
             * @function addRemovableEventListener
             * @param {Object} e - The HTML element to add an event listener to
             * @param {string} eventName - The name of the event
             * @param {function} handler - The event handler function
             * @param {bool} capture - Controls if the event bubbles through the event handler chain
             * @memberof Application.Controller
             * @description Call this function to add event listener to avoid memory leaks due to not removed event listeners on unload of the page.
             *  Do not use the addEventListener() inside the derived page controller class!
             *  All event handlers added by this functions are automatically removed on unload of the page.
             */
            this.addRemovableEventListener = function (e, eventName, handler, capture) {
                e.addEventListener(eventName, handler, capture);
                that._eventHandlerRemover.push(function () {
                    e.removeEventListener(eventName, handler);
                });
            };

            Log.ret(Log.l.trace);
        }, {
            /**
             * @property {Object} pageData - Root element of bindable page data
             * @property {Object} pageData.generalData - Data member prefilled with application wide used data members
             * @property {Object} pageData.appSettings - Data member prefilled with application settings data members
             * @property {string} pageData.messageText - Page message text
             * @property {Object} pageData.error - Error status of page
             * @property {string} pageData.error.errorMsg - Error message to be shown in alert flyout
             * @property {boolean} pageData.error.displayErrorMsg - True, if the error alert flyout should be visible
             * @memberof Application.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the page data used by the binding proxy.
             */
            pageData: {
                generalData: AppData.generalData,
                appSettings: AppData.appSettings,
                resources: {},
                messageText: null,
                error: {
                    errorMsg: "",
                    displayErrorMsg: "none"
                }
            },
            _disableHandlers: {},
            /**
             * @property {Object} disableHandlers - Object with member functions controlling disabled/enabled sate of command handlers in the page
             * @memberof Application.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the enable/disable handler for command ids to be used in the page controller.
             *  The disableHandlers object can contain a member function named with the command id.
             *  If the disableHandlers member function of the command returns true, the command is disabled in the application toolbar control.
             *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh700497.aspx WinJS.UI.AppBarCommand} for further informations.
             */
            disableHandlers: {
                get: function() {
                    return this._disableHandlers;
                },
                set: function(newDisableHandlers) {
                    this._disableHandlers = newDisableHandlers;
                    // todo: don't do this for master views!
                    AppBar.disableHandlers = this._disableHandlers;
                }
            },
            _eventHandlers: {},
            /**
             * @property {Object} eventHandlers - Object with member functions to handle commands in the page
             * @memberof Application.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the event handlers for command ids to be used in the page controller.
             *  The eventHandlers object must contain a member function named with the command id for each command id the page controller should handle.
             *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh700497.aspx WinJS.UI.AppBarCommand} for further informations.
             */
            eventHandlers: {
                get: function() {
                    return this._eventHandlers;
                },
                set: function(newEventHandlers) {
                    this._eventHandlers = newEventHandlers;
                    // todo: don't do this for master views!
                    AppBar.eventHandlers = this._eventHandlers;
                }
            },
            /**
             * @function processAll
             * @returns {WinJS.Promise} The fulfillment of the binding processing is returned in a {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object.
             * @memberof Application.Controller
             * @description Call this function at the end of the constructor function of the derived fragment controler class to process resource load and data binding in the page.
             *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211864.aspx WinJS.Resources.processAll} and {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229846.aspx WinJS.Binding.processAll} for further informations.
             */
            processAll: function () {
                var that = this;
                return WinJS.Resources.processAll(this.element).then(function() {
                    return WinJS.Binding.processAll(that.element, that.binding);
                });
            },
            _disposed: false,
            _dispose: function () {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                for (var i = 0; i < this._eventHandlerRemover.length; i++) {
                    this._eventHandlerRemover[i]();
                }
                this._eventHandlerRemover = null;
                this._element = null;
            },
            _derivedDispose: null,
            /**
             * @property {function} dispose
             * @memberof Application.Controller
             * @description Read/Write. 
             *  Use this property to overwrite the dispose function in the derived controller class.
             *  The framework calls the function returned from this property to dispose the page controller. 
             *  If a new dispose function is set in the derived controller class, this function is called on retrieval of the property by the framework.
             *  Do not retrieve this property in your application.
             */
            dispose: {
                get: function () {
                    if (this._derivedDispose) {
                        this._derivedDispose();
                    }
                    return this._dispose;
                },
                set: function (newDispose) {
                    if (typeof newDispose === "function") {
                        this._derivedDispose = newDispose;
                    }
                }
            },
            /**
             * @property {Object} element
             * @memberof Application.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the HTML root element of the page.
             */
            element: {
                get: function() {
                    return this._element;
                },
                set: function(newElement) {
                    this._element = newElement;
                }
            }
        })
    });
})();

