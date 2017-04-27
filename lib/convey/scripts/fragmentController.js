// base-class for fragment controller helper object
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

/**
 * Use the methods and properties in this namespace to access page fragment controller.
 * @namespace Fragments
 */

(function () {
    "use strict";

    WinJS.Namespace.define("Fragments", {
        define: function (path, object) {
            object._path = path;
            object._name = Application.getFragmentId(path);
            object.getAnimationElements = function() {
                return this.controller && this.controller.element;
            }
            object.dispose = function() {
                Log.call(Log.l.trace, "Fragments.FragmentControl.", "path=" + this._path);
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                Log.ret(Log.l.trace);
            },
            object.FragmentControl = WinJS.Class.define(function FragmentControl(element) {
                Log.call(Log.l.trace, "Fragments.FragmentControl.", "path=" + this._path);
                this._element = element;
                Log.ret(Log.l.trace);
            }, object);
            WinJS.Namespace.define("Fragments." + path, object);
        },

        /**
         * @class Controller 
         * @memberof Fragments
         * @param {Object} element - The HTML root element of the fragment
         * @param {Object} addPageData - An object to add to the fragment data binding proxy
         * @description This class implements the base class for fragment controller
         */
        Controller: WinJS.Class.define(function Controller(element, addPageData) {
            Log.call(Log.l.trace, "Fragments.Controller.", "path=" + this._path);
            var controllerElement = element;
            while (controllerElement &&
                    controllerElement.className !== "data-container") {
                controllerElement = controllerElement.firstElementChild || controllerElement.firstChild;
            }
            if (controllerElement) {
                Log.print(Log.l.trace, "controllerElement: #" + controllerElement.id);
                controllerElement.winControl = this;
                WinJS.Utilities.addClass(controllerElement, "win-disposable");
                this._element = controllerElement;
            } else {
                Log.print(Log.l.error, "no data-container class found for controller element");
            }
            this.pageData.generalData = AppData.generalData;
            this.pageData.appSettings = AppData.appSettings;

            // First, we call WinJS.Binding.as to get the bindable proxy object
            var propertyName;
            /**
             * @property {Object} binding - Bindable proxy object connected to fragment data 
             * @memberof Fragments.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the page data via bindable proxy object.
             *  Changes in the binding member of the controller are automatically synchronized between bound fragment control elements and the data members.
             *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229801.aspx WinJS.Binding.as} for furher informations.
             */
            this.binding = WinJS.Binding.as(this.pageData);
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
             * @memberof Fragments.Controller
             * @description Call this function to add event listener to avoid memory leaks due to not removed event listeners on unload of the fragment.
             *  Do not use the addEventListener() inside the derived fragment controller class!
             *  All event handlers added by this functions are automatically removed on unload of the fragment.
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
             * @property {Object} pageData - Root element of bindable fragment data
             * @property {Object} pageData.generalData - Data member prefilled with application wide used data members
             * @property {Object} pageData.appSettings - Data member prefilled with application settings data members
             * @memberof Fragments.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the fragment's page data used by the binding proxy.
             */
            pageData: {
                generalData: AppData.generalData,
                appSettings: AppData.appSettings,
                resources: {}
            },
            /**
             * @function processAll
             * @returns {WinJS.Promise} The fulfillment of the binding processing is returned in a {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object.
             * @memberof Fragments.Controller
             * @description Call this function at the end of the constructor function of the derived fragment controler class to process resource load and data binding in the page fragement.
             *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211864.aspx WinJS.Resources.processAll} and {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229846.aspx WinJS.Binding.processAll} for further informations.
             */
            processAll: function () {
                var that = this;
                return WinJS.Resources.processAll(this.element).then(function () {
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
             * @memberof Fragments.Controller
             * @description Read/Write. 
             *  Use this property to overwrite the dispose function in the derived controller class.
             *  The framework calls the function returned from this property to dispose the fragment controller. 
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
             * @memberof Fragments.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the HTML root element of the fragment.
             */
            element: {
                get: function () {
                    return this._element;
                },
                set: function (newElement) {
                    this._element = newElement;
                }
            }
        })
    });
})();

