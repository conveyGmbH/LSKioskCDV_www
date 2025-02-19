// base-class for fragment controller helper object
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/WinJS/scripts/ui.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../../lib/convey/scripts/dataService.js" />

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
                    Log.ret(Log.l.trace, "extra irgnored!");
                    return;
                }
                this._disposed = true;
                var controllerElement = this._element;
                while (controllerElement &&
                    controllerElement.className.indexOf("data-container") < 0) {
                    controllerElement = controllerElement.firstElementChild || controllerElement.firstChild;
                }
                if (controllerElement && controllerElement.className.indexOf("win-disposable") >= 0) {
                    WinJS.Utilities.removeClass(controllerElement, "win-disposable");
                    if (controllerElement.winControl && controllerElement.winControl.dispose) {
                        controllerElement.winControl.dispose();
                    }
                }
                WinJS.Utilities.disposeSubTree(this._element);
                this._element = null;
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
        Controller: WinJS.Class.define(function Controller(element, addPageData, commandList) {
            Log.call(Log.l.trace, "Fragments.Controller.");
            var controllerElement = element;
            while (controllerElement &&
                    controllerElement.className.indexOf("data-container") < 0) {
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
            this.mouseDown = false;
            this.cursorPos = { x: 0, y: 0 };
            this._pageData = {
                generalData: AppData.generalData,
                appSettings: AppData.appSettings,
                resources: {},
                messageText: null,
                error: {
                    errorMsg: "",
                    displayErrorMsg: "none"
                },
                loading: false,
                count: 0
            };
            this._commandList = commandList;

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

            this.updateCommands = function (prevFragment) {
                AppBar.replaceCommands(that.commandList,
                    prevFragment ? prevFragment.commandList : null
                );
                AppBar.replaceEventHandlers(that.eventHandlers,
                    prevFragment ? prevFragment.eventHandlers : null
                );
                AppBar.replaceDisableHandlers(that.disableHandlers,
                    prevFragment ? prevFragment.disableHandlers : null
                );
            }
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
             * @memberof Fragments.Controller
             * @description Read/Write. 
             *  Use this property to retrieve or set the page data used by the binding proxy.
             */
            pageData: {
                get: function () {
                    return this._pageData;
                },
                set: function (newPageData) {
                    this._pageData = newPageData;
                }
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
                if (that.commandList && that.commandList.length > 0) {
                    AppBar.replaceCommands(that.commandList, null);
                }
                if (that.eventHandlers) {
                    AppBar.replaceEventHandlers(that.eventHandlers, null);
                }
                if (that.disableHandlers) {
                    AppBar.replaceDisableHandlers(that.disableHandlers, null);
                }
                return WinJS.Resources.processAll(this.element).then(function () {
                    return WinJS.Binding.processAll(that.element, that.binding);
                });
            },
            _listView: null,
            listView: {
                get: function () {
                    return this._listView;
                },
                set: function (newListView) {
                    this._listView = newListView;
                }
            },
            listControl: {
                get: function () {
                    return this._listView && this._listView.winControl;
                }
            },
            _records: null,
            records: {
                get: function () {
                    return this._records;
                },
                set: function (newRecords) {
                    if (!newRecords && this.listControl) {
                        this.listControl.itemDataSource = null;
                    }
                    this._records = newRecords;
                }
            },
            _disposed: false,
            _dispose: function () {
                Log.call(Log.l.trace, "Fragments.Controller.");
                if (this._disposed) {
                    Log.ret(Log.l.trace, "extra ignored!");
                    return;
                }
                this._disposed = true;
                if (this._derivedDispose) {
                    this._derivedDispose();
                }
                if (this.records) {
                    // free record set!
                    this.records = null;
                }
                if (this._eventHandlerRemover) {
                    for (var i = 0; i < this._eventHandlerRemover.length; i++) {
                        this._eventHandlerRemover[i]();
                    }
                    this._eventHandlerRemover = null;
                }
                this.binding = WinJS.Binding.unwrap(this.binding);
                this._element = null;
                Log.ret(Log.l.trace);
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
            },
            commandList: {
                get: function() {
                    return this._commandList;
                },
                set: function (newCommandList) {
                    if (newCommandList !== this._commandList) {
                        this._commandList = newCommandList;
                        this.updateCommands();
                    }
                }
            },
            onPointerDown: function (e) {
                Log.call(Log.l.trace, "Fragments.Controller.");
                this.cursorPos = { x: e.pageX, y: e.pageY };
                this.mouseDown = true;
                Log.ret(Log.l.trace);
            },
            onMouseDown: function (e) {
                Log.call(Log.l.trace, "Fragments.Controller.");
                this.cursorPos = { x: e.pageX, y: e.pageY };
                this.mouseDown = true;
                Log.ret(Log.l.trace);
            },
            onPointerUp: function (e) {
                Log.call(Log.l.trace, "Fragments.Controller.");
                this.mouseDown = false;
                Log.ret(Log.l.trace);
            },
            onMouseUp: function (e) {
                Log.call(Log.l.trace, "Fragments.Controller.");
                this.mouseDown = false;
                Log.ret(Log.l.trace);
            },
            setFocusOnItemInvoked: function (eventInfo) {
                var that = this;
                Log.call(Log.l.trace, "Fragments.Controller.");
                if (eventInfo && eventInfo.target) {
                    var comboInputFocus = eventInfo.target.querySelector(".win-dropdown:focus");
                    if (comboInputFocus) {
                        eventInfo.preventDefault();
                    } else {
                        // set focus into textarea if current mouse cursor is inside of element position
                        var setFocusOnElement = function (element) {
                            WinJS.Promise.timeout(0).then(function () {
                                // set focus async!
                                element.focus();
                            });
                        };
                        var textInputs = eventInfo.target.querySelectorAll(".win-textbox");
                        if (textInputs && textInputs.length > 0) {
                            for (var i = 0; i < textInputs.length; i++) {
                                var textInput = textInputs[i];
                                var position = WinJS.Utilities.getPosition(textInput);
                                if (position) {
                                    var left = position.left;
                                    var top = position.top;
                                    var width = position.width;
                                    var height = position.height;
                                    if (that.cursorPos.x >= left && that.cursorPos.x <= left + width &&
                                        that.cursorPos.y >= top && that.cursorPos.y <= top + height) {
                                        setFocusOnElement(textInput);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
            },
            setFocusOnItemInListView: function(listView) {
                var that = this;
                if (listView && listView.winControl) {
                    var getTextareaForFocus = function(element) {
                        var focusElement = null;
                        if (element) {
                            var textareas = element.querySelectorAll(".win-textarea, .win-textbox");
                            if (textareas)
                                for (var i = 0; i < textareas.length; i++) {
                                    var textarea = textareas[i];
                                    if (textarea) {
                                        var position = WinJS.Utilities.getPosition(textarea);
                                        if (position) {
                                            var left = position.left;
                                            var top = position.top;
                                            var width = position.width;
                                            var height = position.height;
                                            if (that.cursorPos.x >= left &&
                                                that.cursorPos.x <= left + width &&
                                                that.cursorPos.y >= top &&
                                                that.cursorPos.y <= top + height + 2) {
                                                focusElement = textarea;
                                                break;
                                            }
                                        }
                                    }
                                }
                        }
                        Log.ret(Log.l.trace);
                        return focusElement;
                    }
                    var trySetActive = function(element, scroller) {
                        var success = true;
                        // don't call setActive() if a dropdown control has focus!
                        var comboInputFocus = element.querySelector(".win-dropdown:focus");
                        if (!comboInputFocus) {
                            var focusElement = getTextareaForFocus(element);
                            try {
                                if (typeof element.setActive === "function") {
                                    element.setActive();
                                    if (focusElement && focusElement !== element) {
                                        focusElement.focus();
                                    }
                                }
                            } catch (e) {
                                // setActive() raises an exception when trying to focus an invisible item. Checking visibility is non-trivial, so it's best
                                // just to catch the exception and ignore it. focus() on the other hand, does not raise exceptions.
                                success = false;
                            }
                            if (success) {
                                // check for existence of WinRT
                                var resources = Resources.get();
                                if (resources) {
                                    if (focusElement && focusElement !== element) {
                                        function trySetFocus(fe, retry) {
                                            try {
                                                fe.focus();
                                            } catch (e) {
                                                // avoid exception on hidden element
                                            }
                                            WinJS.Promise.timeout(100)
                                                .then(function() {
                                                    if (typeof retry === "number" && retry > 1 && listView.contains(fe)) {
                                                        trySetFocus(fe, --retry);
                                                    }
                                                });
                                        }

                                        trySetFocus(focusElement, 5);
                                    }
                                }
                            }
                        }
                        return success;
                    };
                    // overwrite _setFocusOnItem for this ListView to supress automatic
                    // scroll-into-view when calling item.focus() in base.js implementation
                    // by prevent the call of _ElementUtilities._setActive(item);
                    listView.winControl._setFocusOnItem = function ListView_setFocusOnItem(entity) {
                        this._writeProfilerMark("_setFocusOnItem,info");
                        if (this._focusRequest) {
                            this._focusRequest.cancel();
                        }
                        if (this._isZombie()) {
                            return;
                        }
                        var winControl = this;
                        var setFocusOnItemImpl = function(item) {
                            if (winControl._isZombie()) {
                                return;
                            }

                            if (winControl._tabManager.childFocus !== item) {
                                winControl._tabManager.childFocus = item;
                            }
                            winControl._focusRequest = null;
                            if (winControl._hasKeyboardFocus && !winControl._itemFocused) {
                                if (winControl._selection._keyboardFocused()) {
                                    winControl._drawFocusRectangle(item);
                                }
                                // The requestItem promise just completed so _cachedCount will
                                // be initialized.
                                if (entity.type === WinJS.UI.ObjectType.groupHeader ||
                                    entity.type === WinJS.UI.ObjectType.item) {
                                    winControl._view
                                        .updateAriaForAnnouncement(item,
                                            (
                                                entity.type === WinJS.UI.ObjectType.groupHeader
                                                    ? winControl._groups.length()
                                                    : winControl._cachedCount));
                                }

                                // Some consumers of ListView listen for item invoked events and hide the listview when an item is clicked.
                                // Since keyboard interactions rely on async operations, sometimes an invoke event can be received before we get
                                // to WinJS.Utilities._setActive(item), and the listview will be made invisible. If that happens and we call item.setActive(), an exception
                                // is raised for trying to focus on an invisible item. Checking visibility is non-trivial, so it's best
                                // just to catch the exception and ignore it.
                                winControl._itemFocused = true;
                                trySetActive(item);
                            }
                        };

                        if (entity.type === WinJS.UI.ObjectType.item) {
                            this._focusRequest = this._view.items.requestItem(entity.index);
                        } else if (entity.type === WinJS.UI.ObjectType.groupHeader) {
                            this._focusRequest = this._groups.requestHeader(entity.index);
                        } else {
                            this._focusRequest = WinJS.Promise.wrap(entity.type === WinJS.UI.ObjectType.header ? this._header : this._footer);
                        }
                        this._focusRequest.then(setFocusOnItemImpl);
                    };
                }
            }
        })
    });

    WinJS.Namespace.define("Fragments", {
        /**
         * @class RecordsetController 
         * @memberof Application
         * @param {Object} element - The HTML root element of the page
         * @param {Object} addPageData - An object to add to the page data binding proxy
         * @param {Object[]} commandList -  List of command properties
         * @param {boolean} isMaster - True if the page is to be used as master view
         * @param {Object} tableView - database service view object used to modify table data
         * @param {Object} showView - database service view object used to select table data
         * @description This class implements the base class for page controller including recordset selection and modification
         */
        RecordsetController: WinJS.Class.derive(Fragments.Controller, function RecordsetController(pageElement, addPageData, commandList, tableView, showView, listView) {
            Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
            Fragments.Controller.apply(this, [pageElement, addPageData, commandList]);
            if (showView && !tableView) {
                tableView = showView;
            }
            if (!tableView) {
                Log.print(Log.l.error, "tableView missing!");
            } else {
                Log.print(Log.l.trace, "tableView: relationName=" + tableView.relationName);
                if (!showView) {
                    showView = tableView;
                } else {
                    Log.print(Log.l.trace, "showView: relationName=" + showView.relationName);
                }
            }
            this.tableView = tableView;
            this.showView = showView;
            this.listView = listView;
            this.nextUrl = null;
            this.curRecId = 0;
            this.prevRecId = 0;

            var that = this;

            var mergeRecord = function (prevRecord, newRecord) {
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
                var ret = false;
                for (var prop in newRecord) {
                    if (newRecord.hasOwnProperty(prop)) {
                        if (newRecord[prop] !== prevRecord[prop]) {
                            prevRecord[prop] = newRecord[prop];
                            ret = true;
                        }
                    }
                }
                Log.ret(Log.l.trace, ret);
                return ret;
            }
            this.mergeRecord = mergeRecord;

            var selectRecordId = function (recordId) {
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.", "recordId=" + recordId);
                if (that.records && that.showView &&
                    recordId && that.listControl && that.listControl.selection) {
                    for (var i = 0; i < that.records.length; i++) {
                        var record = that.records.getAt(i);
                        if (record && typeof record === "object" &&
                            that.showView.getRecordId(record) === recordId) {
                            that.listControl.selection.set(i);
                            that.listControl.ensureVisible(i);
                            break;
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.selectRecordId = selectRecordId;

            var scopeFromRecordId = function (recordId) {
                var ret = null;
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.", "recordId=" + recordId);
                if (that.records && that.showView && recordId) {
                    var i, item = null;
                    for (i = 0; i < that.records.length; i++) {
                        var record = that.records.getAt(i);
                        if (record && typeof record === "object" &&
                            that.showView.getRecordId(record) === recordId) {
                            item = record;
                            break;
                        }
                    }
                    if (item) {
                        Log.print(Log.l.trace, "found i=" + i);
                        ret = { index: i, item: item };
                    } else {
                        Log.print(Log.l.trace, "not found");
                    }
                }
                Log.ret(Log.l.trace, ret);
                return ret;
            }
            this.scopeFromRecordId = scopeFromRecordId;
            
            var scrollToRecordId = function (recordId) {
                Log.call(Log.l.trace, "QuestionList.Controller.", "recordId=" + recordId);
                if (that.binding.loading) {
                    WinJS.Promise.timeout(50).then(function () {
                        that.scrollToRecordId(recordId);
                    });
                } else if (that.listControl) {
                    var scope = that.scopeFromRecordId(recordId);
                    if (scope && scope.index >= 0) {
                        that.listControl.ensureVisible(scope.index);
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.scrollToRecordId = scrollToRecordId;

            var deleteData = function (complete, error) {
                var ret = null;
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
                if (that.tableView && typeof that.tableView.deleteRecord === "function" && that.curRecId) {
                    var recordId = that.curRecId;
                    AppBar.busy = true;
                    AppData.setErrorMsg(that.binding);
                    ret = that.tableView.deleteRecord(function (response) {
                        that.curRecId = 0;
                        AppData.setRecordId(that.tableView.relationName, that.curRecId);
                        AppBar.busy = false;
                        // called asynchronously if ok
                        if (typeof complete === "function") {
                            complete(response);
                            return WinJS.Promise.as();
                        } else {
                            return that.loadData();
                        }
                    }, function (errorResponse) {
                        AppBar.busy = false;
                        if (typeof error === "function") {
                            error(errorResponse);
                        } else {
                            // delete ERROR
                            var message = null;
                            Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                            if (errorResponse.data && errorResponse.data.error) {
                                Log.print(Log.l.error, "error code=" + errorResponse.data.error.code);
                                if (errorResponse.data.error.message) {
                                    Log.print(Log.l.error, "error message=" + errorResponse.data.error.message.value);
                                    message = errorResponse.data.error.message.value;
                                }
                            }
                            if (!message) {
                                message = getResourceText("error.delete");
                            }
                            AppData.setErrorMsg(that.binding, message);
                        }
                    }, recordId);
                }
                if (!ret) {
                    ret = new WinJS.Promise.as().then(function () {
                        complete({});
                    });
                }
                Log.ret(Log.l.trace, ret);
                return ret;
            }
            this.deleteData = deleteData;

            var getFieldEntries = function (index) {
                var ret = {};
                if (that.listControl) {
                    var element = that.listControl.elementFromIndex(index);
                    if (element) {
                        var fields = element.querySelectorAll('textarea, input[type="text"], .win-rating');
                        if (fields) for (var i = 0; i < fields.length; i++) {
                            var field = fields[i];
                            var fieldEntry = field.getAttribute("data-field-entry");
                            if (fieldEntry) {
                                var style = null;
                                for (var styleElement = field; styleElement !== element; styleElement = styleElement.parentElement) {
                                    style = getComputedStyle(styleElement);
                                    if (style && style.display === "none") {
                                        break;
                                    }
                                }
                                if (!style || style.display !== "none") {
                                    var value;
                                    if (field.winControl && field.winControl.userRating) {
                                        value = field.winControl.userRating;
                                    } else {
                                        value = field.value;
                                    }
                                    ret[fieldEntry] = value;
                                }
                            }
                        }
                    }
                }
                return ret;
            };
            this.getFieldEntries = getFieldEntries;

            var saveData = function (complete, error) {
                var ret = null;
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
                if (that.tableView && typeof that.tableView.update === "function") {
                    // standard call via modify
                    var recordId = that.prevRecId;
                    if (!recordId) {
                        // called via canUnload
                        recordId = that.curRecId;
                    }
                    that.prevRecId = 0;
                    if (recordId) {
                        var curScope = that.scopeFromRecordId(recordId);
                        if (curScope && curScope.item) {
                            var newRecord = that.getFieldEntries(curScope.index);
                            var mergedItem = copyByValue(curScope.item);
                            if (that.mergeRecord(mergedItem, newRecord) || AppBar.modified) {
                                AppData.setErrorMsg(that.binding);
                                Log.print(Log.l.trace, "save changes of recordId:" + recordId);
                                ret = that.tableView.update(function (response) {
                                    Log.print(Log.l.info, "Fragments.RecordsetController.Controller. update: success!");
                                    that.records.setAt(curScope.index, mergedItem);
                                    // called asynchronously if ok
                                    AppBar.modified = false;
                                    if (typeof complete === "function") {
                                        complete(response);
                                        return WinJS.Promise.as();
                                    } else {
                                        return that.loadData(recordId);
                                    }
                                }, function (errorResponse) {
                                    if (typeof error === "function") {
                                        error(errorResponse);
                                    } else {
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                    }
                                }, recordId, mergedItem);
                            } else {
                                Log.print(Log.l.trace, "no changes in recordId:" + recordId);
                            }
                        }
                    }
                }
                if (!ret) {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete({});
                        }
                    });
                }
                Log.ret(Log.l.trace, ret);
                return ret;
            }
            this.saveData = saveData;

            var insertData = function(complete, error) {
                var ret = null;
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
                if (that.tableView && typeof that.tableView.insert === "function") {
                    AppBar.busy = true;
                    AppData.setErrorMsg(that.binding);
                    ret = that.saveData(function (response) {
                        Log.print(Log.l.trace, "record saved");
                        return that.tableView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.info, "record insert: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.curRecId = that.tableView.getRecordId(json.d);
                                Log.print(Log.l.trace, "inserted recordId=" + that.curRecIdd);
                                AppData.setRecordId(that.tableView.relationName, that.curRecId);
                            }
                            AppBar.busy = false;
                            if (typeof complete === "function") {
                                complete(json);
                                return WinJS.Promise.as();
                            } else {
                                return that.loadData().then(function () {
                                    that.selectRecordId(that.curRecId);
                                });
                            }
                        }, function (errorResponse) {
                            AppBar.busy = false;
                            if (typeof error === "function") {
                                error(errorResponse);
                            } else {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }
                        });
                    }, function(errorResponse) {
                        AppBar.busy = false;
                        if (typeof error === "function") {
                            error(errorResponse);
                        } else {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }
                    });
                }
                if (!ret) {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete({});
                        }
                    });
                }
                Log.ret(Log.l.trace, ret);
                return ret;
            }
            this.insertData = insertData;

            var selectionChanged = function (complete, error) {
                var ret = null;
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
                if (that.showView && that.listControl && that.listControl.selection) {
                    var selectionCount = that.listControl.selection.count();
                    if (selectionCount === 1) {
                        // Only one item is selected, show the page
                        ret = that.listControl.selection.getItems().then(function (items) {
                            var item = items[0];
                            that.currentlistIndex = items[0].index;
                            var newRecId = item.data && that.showView.getRecordId(item.data);
                            if (newRecId) {
                                Log.print(Log.l.trace, "Fragments.RecordsetController.Controller.selectionChanged: newRecId=" + newRecId + " curRecId=" + that.curRecId);
                                if (newRecId !== that.curRecId) {
                                    AppData.setRecordId(that.showView.relationName, newRecId);
                                    if (that.curRecId) {
                                        that.prevRecId = that.curRecId;
                                    }
                                    that.curRecId = newRecId;
                                    if (that.prevRecId !== 0) {
                                        return that.saveData(complete, function (errorResponse) {
                                            that.selectRecordId(that.prevRecId);
                                            if (typeof error === "function") {
                                                error(errorResponse);
                                            } else {
                                                AppData.setErrorMsg(that.binding, errorResponse);
                                            }
                                        });
                                    } else {
                                        if (typeof complete === "function") {
                                            complete({});
                                        }
                                        return WinJS.Promise.as();
                                    }
                                } else {
                                    if (typeof complete === "function") {
                                        complete({});
                                    }
                                    return WinJS.Promise.as();
                                }
                            } else {
                                if (typeof complete === "function") {
                                    complete({});
                                }
                                return WinJS.Promise.as();
                            }
                        });
                    }
                }
                if (!ret) {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete({});
                        }
                    });
                }
                Log.ret(Log.l.trace, ret);
                return ret;
            }
            this.selectionChanged = selectionChanged;

            var maxLeadingPages = 0;
            var maxTrailingPages = 0;

            var checkLoadingFinished = function () {
                WinJS.Promise.timeout(10).then(function () {
                    if (!AppBar.busy) {
                        that.binding.loading = false;
                    } else {
                        WinJS.Promise.timeout(100).then(function () {
                            that.checkLoadingFinished();
                        });
                    }
                });
            }
            this.checkLoadingFinished = checkLoadingFinished;

            var loadingStateChanged = function (eventInfo) {
                var i;
                Log.call(Log.l.u1, "Fragments.RecordsetController.Controller.");
                if (that.listControl) {
                    Log.print(Log.l.u1, "loadingState=" + that.listControl.loadingState);
                    if (that.listView && (WinJS.Utilities.hasClass(that.listView, "win-selectionstylefilled") ||
                        that.tableView && typeof that.tableView.update === "function")) {
                        // single list selection
                        if (that.listControl.selectionMode !== WinJS.UI.SelectionMode.single) {
                            that.listControl.selectionMode = WinJS.UI.SelectionMode.single;
                        }
                        // direct selection on each tap
                        if (that.listControl.tapBehavior !== WinJS.UI.TapBehavior.directSelect) {
                            that.listControl.tapBehavior = WinJS.UI.TapBehavior.directSelect;
                        }
                    }
                    // Double the size of the buffers on both sides
                    if (!maxLeadingPages) {
                        maxLeadingPages = that.listControl.maxLeadingPages * 2;
                        that.listControl.maxLeadingPages = maxLeadingPages;
                    }
                    if (!maxTrailingPages) {
                        maxTrailingPages = that.listControl.maxTrailingPages * 2;
                        that.listControl.maxTrailingPages = maxTrailingPages;
                    }
                    if (that.listControl.loadingState === "itemsLoaded") {
                        that.fitColumnWidthToContent();
                        if (!that.binding.count) {
                            that.checkLoadingFinished();
                        }
                    } else if (that.listControl.loadingState === "complete") {
                        that.checkLoadingFinished();
                    }
                }
                Log.ret(Log.l.u1);
            };
            this.loadingStateChanged = loadingStateChanged;

            var loadNext = function(complete, error) {
                var ret = null;
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
                if (that.records && that.showView && 
                    typeof that.showView.selectNext === "function" && 
                    typeof that.showView.getNextUrl === "function") {
                    AppBar.busy = true;
                    that.binding.loading = true;
                    var nextUrl = that.nextUrl;
                    that.nextUrl = null;
                    AppData.setErrorMsg(that.binding);
                    Log.print(Log.l.trace, "calling selectNext...");
                    ret = that.showView.selectNext(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.info, "Fragments.RecordsetController.Controller.loadNext: selectNext success!");
                        // selectNext returns object already parsed from json file in response
                        if (json && json.d && json.d.results && json.d.results.length > 0) {
                            that.nextUrl = that.showView.getNextUrl(json);
                            var results = json.d.results;
                            if (!results) {
                                results = [];
                            }
                            if (typeof that.resultConverter === "function") {
                                results.forEach(function (item, index) {
                                    that.resultConverter(item, index);
                                });
                            }
                            for (var i = 0; i < results.length; i++) {
                                that.records.push(results[i]);
                            }
                            that.binding.count = that.records.length;
                        } else {
                            that.binding.loading = false;
                        }
                        AppBar.busy = false;
                        if (typeof complete === "function") {
                            complete(json);
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppBar.busy = false;
                        that.binding.loading = false;
                        if (typeof error === "function") {
                            error(errorResponse);
                        } else {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }
                    }, null, nextUrl);

                }               
                if (!ret) {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete({});
                        }
                    });
                }
                Log.ret(Log.l.trace, ret);
                return ret;
            }
            this.loadNext = loadNext;

            var loadData = function (restriction, options, itemRenderer, complete, error) {
                var ret = null;
                Log.call(Log.l.trace, "Fragments.RecordsetController.Controller.");
                if (that.showView && typeof that.showView.select === "function") {
                    AppBar.busy = true;
                    that.binding.loading = true;
                    var recordId = null;
                    if (typeof restriction === "number") {
                        if (that.tableView && that.tableView.relationName) {
                            var relationName = (typeof that.tableView.relationName === "string") ? that.tableView.relationName :
                                that.tableView.relationName.get ? that.tableView.relationName.get() : null;
                            var pkName = (typeof that.tableView.pkName === "string") ? that.tableView.pkName :
                                that.tableView.pkName.get ? that.tableView.pkName.get() : null;
                            if (relationName && typeof relationName === "string") {
                                var keyId = null;
                                recordId = restriction;
                                restriction = {};
                                if (relationName.substr(0, 4) === "LGNT") {
                                    // recordId is in fact foreign key to INIT-relation in case of LGNTINIT-relation!
                                    keyId = relationName.substr(4) + "ID";
                                } else if (pkName) {
                                    keyId = pkName;
                                } else {
                                    keyId = relationName + "VIEWID";
                                }
                                Log.print(Log.l.trace, "calling select... recordId=" + recordId);
                                restriction[keyId] = recordId;
                            }
                        }
                    } else {
                        Log.print(Log.l.trace, "calling select...");
                    }
                    AppData.setErrorMsg(that.binding);
                    ret = that.showView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.info, "Fragments.RecordsetController.Controller.loadData select success!");
                        // select returns object already parsed from json file in response
                        if (!recordId) {
                            if (json && json.d) {
                                if (typeof that.showView.getNextUrl === "function") {
                                    that.nextUrl = that.showView.getNextUrl(json);
                                } else {
                                    that.nextUrl = null;
                                }
                                var results = json.d.results;
                                if (!results) {
                                    results = [];
                                }
                                if (typeof that.resultConverter === "function") {
                                    results.forEach(function(item, index) {
                                        that.resultConverter(item, index);
                                    });
                                }
                                if (!that.records) {
                                    // Now, we call WinJS.Binding.List to get the bindable list
                                    that.records = new WinJS.Binding.List(results);
                                    if (that.listControl) {
                                        // fix focus handling
                                        that.setFocusOnItemInListView(that.listView);

                                        that.listControl._supressScrollIntoView = true;
                                        if (typeof itemRenderer === "function") {
                                            // add ListView itemTemplate
                                            that.listControl.itemTemplate = itemRenderer.bind(that);
                                        }
                                        // add ListView dataSource
                                        that.listControl.itemDataSource = that.records.dataSource;
                                    }
                                } else {
                                    var i;
                                    var bChanged = false;
                                    var bFound = false;
                                    var newRecId, newItem;
                                    for (i = 0; i < that.records.length && i < results.length; i++) {
                                        var prevItem = that.records.getAt(i);
                                        newItem = results[i];
                                        for (var prop in newItem) {
                                            if (newItem.hasOwnProperty(prop)) {
                                                if (newItem[prop] !== prevItem[prop]) {
                                                    bChanged = true;
                                                    break;
                                                }
                                            }
                                        }
                                        if (bChanged) {
                                            newRecId = that.showView.getRecordId(newItem);
                                            if (that.showView.getRecordId(prevItem) === newRecId) {
                                                if (that.curRecId === newRecId) {
                                                    bFound = true;
                                                }
                                                that.records.setAt(i, newItem);
                                                bChanged = false;
                                            } else {
                                                break;
                                            }
                                        }
                                    }
                                    if (i < that.records.length) {
                                        if (!that.nextUrl || bChanged) {
                                            that.records.splice(i, that.records.length - i);
                                        }
                                    }
                                    while (i < results.length) {
                                        newItem = results[i++];
                                        if (that.curRecId) {
                                            newRecId = that.showView.getRecordId(newItem);
                                            if (that.curRecId === newRecId) {
                                                bFound = true;
                                            }
                                        }
                                        that.records.push(newItem);
                                    }
                                    if (that.listControl && that.listControl.selection && that.listControl.selection.count() === 1) {
                                        if (bFound) {
                                            that.selectRecordId(that.curRecId);
                                        } else {
                                            var selIndex = that.listControl.selection.getIndices()[0];
                                            if (typeof selIndex === "number") {
                                                that.listControl.selection.clear().then(function () {
                                                    if (selIndex >= results.length) {
                                                        selIndex = results.length - 1;
                                                    }
                                                    if (selIndex >= 0) {
                                                        newItem = results[selIndex];
                                                        newRecId = that.showView.getRecordId(newItem);
                                                        that.selectRecordId(newRecId);
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                                if (that.binding.count !== results.length) {
                                    that.binding.count = results.length;
                                } else if (!that.binding.count) {
                                    that.binding.loading = false;
                                }
                            } else {
                                if (that.records && that.records.length > 0) {
                                    that.records.length = 0;
                                } else {
                                    that.binding.loading = false;
                                }
                            }
                        } else {
                            that.binding.loading = false;
                            if (json && json.d && that.records) {
                                // return only the current record
                                var objectrec = that.scopeFromRecordId(recordId);
                                var record = json.d.results ? json.d.results[0] : json.d;
                                if (typeof that.resultConverter === "function") {
                                    that.resultConverter(record, objectrec.index);
                                }
                                that.records.setAt(objectrec.index, record);
                            }
                        }
                        AppBar.busy = false;
                        if (typeof complete === "function") {
                            complete({});
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppBar.busy = false;
                        that.binding.loading = false;
                        if (typeof error === "function") {
                            error(errorResponse);
                        } else {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }
                    }, restriction, options);
                }
                if (!ret) {
                    ret = new WinJS.Promise.as().then(function () {
                        that.binding.count = 0;
                        AppBar.busy = false;
                        that.binding.loading = false;
                        if (typeof complete === "function") {
                            complete({});
                        }
                    });
                }
                Log.ret(Log.l.trace, ret);
                return ret;

            }
            this.loadData = loadData;

            // add list-column style classes for resize
            var addListColumnStyles = function () {
                if (that.listView && WinJS.Utilities.hasClass(that.listView, "cnv-autoresizecolumns")) {
                    var i;
                    var cssText = "";
                    var listHeaders = pageElement.querySelectorAll(".list-header .list-landscape-only > div");
                    if (listHeaders) for (i = 0; i < listHeaders.length; i++) {
                        if (!cssText) {
                            cssText += "#" + that.listView.id + " .list-landscape-only {display: flex; flex-direction: row; }\n";
                        }
                        var className = "list-column-" + i.toString();
                        cssText += "#" + that.listView.id + " ." + className + "{ flex: 100px; }\n";
                        WinJS.Utilities.addClass(listHeaders[i], className);
                    }
                    if (cssText) {
                        var style = document.createElement("style");
                        style.type = 'text/css';
                        if (style.styleSheet) {
                            style.styleSheet.cssText = cssText;
                        } else {
                            style.appendChild(document.createTextNode(cssText));
                        }
                        document.getElementsByTagName("head")[0].appendChild(style);
                    }
                    var listFields = pageElement.querySelectorAll(".list-template .list-landscape-only > div:not(.row-bkg-gray)");
                    if (listFields) for (i = 0; i < listFields.length; i++) {
                        WinJS.Utilities.addClass(listFields[i], "list-column-" + i.toString());
                    }
                }
            }
            addListColumnStyles();

            var columnWidths = [];
            var fitColumnWidthToContent = function () {
                if (that.listView && WinJS.Utilities.hasClass(that.listView, "cnv-autoresizecolumns")) {
                    if (that.listControl) {
                        var row, col, columnIndexes = [], colCount = 0;
                        var headerFields = that.listView.querySelectorAll(".list-header .list-landscape-only > div:not(.row-bkg-gray)")
                        if (headerFields) {
                            for (col = 0; col < headerFields.length; col++) {
                                var headerField = headerFields[col];
                                if (headerField.firstElementChild &&
                                    headerField.firstElementChild.clientWidth > (columnWidths[col] || 100) + 8) {
                                    columnWidths[col] = headerField.firstElementChild.clientWidth;
                                }
                                if (columnWidths[col]) {
                                    if (columnIndexes.indexOf(col) < 0) {
                                        columnIndexes.push(col);
                                    }
                                }
                            }
                            colCount = headerFields.length;
                        }
                        var indexOfFirstVisible = that.listControl.indexOfFirstVisible;
                        var indexOfLastVisible = that.listControl.indexOfLastVisible;
                        for (row = indexOfFirstVisible; row <= indexOfLastVisible; row++) {
                            var element = that.listControl.elementFromIndex(row);
                            if (element) {
                                var listFields = element.querySelectorAll(".list-landscape-only > div:not(.row-bkg-gray)");
                                if (listFields) for (col = 0; col < listFields.length; col++) {
                                    var listField = listFields[col];
                                    if (listField.firstElementChild &&
                                        listField.firstElementChild.clientWidth > (columnWidths[col] || 100) + 8) {
                                        columnWidths[col] = listField.firstElementChild.clientWidth;
                                    }
                                    if (columnWidths[col]) {
                                        if (columnIndexes.indexOf(col) < 0) {
                                            columnIndexes.push(col);
                                        }
                                    }
                                }
                            }
                        }
                        if (columnIndexes.length > 0) {
                            for (var i = 0; i < columnIndexes.length; i++) {
                                col = columnIndexes[i];
                                var className = "list-column-" + col.toString();
                                var cssSelector = "#" + that.listView.id + " ." + className;
                                Colors.changeCSS(cssSelector, "flex", columnWidths[col] + "px");
                            }
                            var width = 0;
                            for (var j = 0; j < colCount; j++) {
                                width += (columnWidths[j] || 100) + 20;
                            }
                            if (width > 0) {
                                var padding;
                                if (that.listView.clientWidth <= Application.maxViewSize.smallest) {
                                    padding = 0;
                                } else if (that.listView.clientWidth <= Application.maxViewSize.small) {
                                    padding = 10;
                                } else if (that.listView.clientWidth <= Application.maxViewSize.medium) {
                                    padding = 18;
                                } else {
                                    padding = 26;
                                }
                                width += 2 * padding + 20;
                                var winSurface = that.listView.querySelector(".win-surface");
                                if (winSurface && winSurface.style &&
                                    winSurface.clientWidth < width) {
                                    winSurface.style.width = width + "px";
                                }
                                var winHeaderContainer = that.listView.querySelector(".win-headercontainer");
                                if (winHeaderContainer && winHeaderContainer.style &&
                                    winHeaderContainer.clientWidth < width) {
                                    winHeaderContainer.style.width = width + "px";
                                }
                            }
                        }
                    }
                }
            }
            this.fitColumnWidthToContent = fitColumnWidthToContent;
        }, {
        })
    });

})();

