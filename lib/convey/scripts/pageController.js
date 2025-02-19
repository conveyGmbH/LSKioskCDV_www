// base-class for page controller helper object
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/WinJS/scripts/ui.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../../lib/convey/scripts/dataService.js" />
/// <reference path="../../../lib/convey/scripts/appbar.js" />
/// <reference path="../../../lib/hammer/scripts/hammer.js"/>

(function () {
    "use strict";
    
    var nav = WinJS.Navigation;

    WinJS.Utilities._require([
        'WinJS/Core/_Global'
    ], function (_Global) {
        var head = _Global.document.head || _Global.document.getElementsByTagName("head")[0];

        WinJS.Namespace.define("Application", {
            _horzSwipeActionThreshX: 30,
            _horzSwipeAnimationThreshX: 200,
            _horzSwipeMinThreshX: 20,
            _horzSwipeMaxThreshY: 100,
            _horzSwipeExcludedInputTypes: ["date", "datetime", "datetime-local", "email", "month", "number", "password", "range", "search", "tel", "text", "time", "url", "week"],
            /**
             * @class Controller 
             * @memberof Application
             * @param {Object} element - The HTML root element of the page
             * @param {Object} addPageData - An object to add to the page data binding proxy
             * @param {Object[]} commandList -  List of command properties
             * @param {boolean} isMaster - True if the page is to be used as master view
             * @description This class implements the base class for page controller
             */
            Controller: WinJS.Class.define(function Controller(pageElement, addPageData, commandList, isMaster) {
                Log.call(Log.l.trace, "Application.Controller.");
                this._pageElement = pageElement;
                this.mouseDown = false;
                this.cursorPos = { x: 0, y: 0 };
                this._hammer = null;
                this._hammerState = 0;
                this._hammerWatchdogPromise = null;
                this._hammerExcludeRect = { left: 0, top: 0, right: 0, bottom: 0 };
                this._hammerDisabled = false;
                this._disposed = false;
                this._derivedDispose = null;
                this._getHammerExcludeRect = null;
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
                this.isMaster = !!isMaster;
                this._commandList = commandList;
                this._eventHandlers = {};
                this._disableHandlers = {};
                this._selectPromise = null;

                // Set scope only if commandList is specified - don't use commandList for master views!
                if (!isMaster) {
                    if (typeof commandList !== "undefined") {
                        AppBar.commandList = commandList;
                    }
                    AppBar.scope = this;
                }

                var that = this;

                this.scripts = {};
                var headScriptsInitialized = false;
                var headScripts = {};
                var addScript = function (scriptTag, fragmentHref, position, lastNonInlineScriptPromise) {
                    // We synthesize a name for inline scripts because today we put the
                    // inline scripts in the same processing pipeline as src scripts. If
                    // we seperated inline scripts into their own logic, we could simplify
                    // this somewhat.
                    //
                    var src = scriptTag.src;
                    var inline = !src;
                    if (inline) {
                        src = fragmentHref + "script[" + position + "]";
                    }
                    src = src.toLowerCase();

                    if (!headScriptsInitialized) {
                        headScriptsInitialized = true;
                        var scriptElements = head.querySelectorAll("script");
                        if (scriptElements && scriptElements.length > 0) {
                            for (var i = 0; i < scriptElements.length; i++) {
                                var e = scriptElements[i];
                                headScripts[e.src.toLowerCase()] = true;
                            }
                        }
                    }

                    if (!(src in headScripts) && !(src in that.scripts)) {
                        var promise = null;

                        var n = _Global.document.createElement("script");
                        if (scriptTag.language) {
                            n.setAttribute("language", "javascript");
                        }
                        n.setAttribute("type", scriptTag.type);
                        n.setAttribute("async", "false");
                        if (scriptTag.id) {
                            n.setAttribute("id", scriptTag.id);
                        }
                        if (inline) {
                            var text = scriptTag.text;
                            promise = lastNonInlineScriptPromise.then(function () {
                                n.text = text;
                            }).then(null, function () {
                                // eat error
                            });
                        } else {
                            promise = new WinJS.Promise(function (c) {
                                n.onload = n.onerror = function () {
                                    c();
                                };

                                // Using scriptTag.src to maintain the original casing
                                n.setAttribute("src", scriptTag.src);
                            });
                        }
                        that.scripts[src] = n;
                        head.appendChild(n);

                        return {
                            promise: promise,
                            inline: inline
                        };
                    } else {
                        return lastNonInlineScriptPromise;
                    }
                };

                // First, we call WinJS.Binding.as to get the bindable proxy object
                /**
                 * @property {Object} binding - Bindable proxy object connected to page data 
                 * @memberof Application.Controller
                 * @description Read/Write. 
                 *  Use this property to retrieve or set the page data via bindable proxy object.
                 *  Changes in the binding member of the controller are automatically synchronized between bound page control elements and the data members.
                 *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229801.aspx WinJS.Binding.as} for furher informations.
                 */
                this.binding = WinJS.Binding.as(this._pageData);
                var propertyName;
                AppData.setErrorMsg(this.binding);
                // Then, we add all properties of derived class to the bindable proxy object
                var sp = [];
                if (addPageData) {
                    for (propertyName in addPageData) {
                        if (addPageData.hasOwnProperty(propertyName)) {
                            if (propertyName === "scripts" && Array.isArray(addPageData[propertyName])) {
                                var scripts = addPageData[propertyName];
                                if (scripts.length > 0 && pageElement.winControl) {
                                    var lastNonInlineScriptPromise = WinJS.Promise.as();
                                    scripts.forEach(function (e, i) {
                                        var result = addScript(e, pageElement.winControl.uri, i, lastNonInlineScriptPromise);
                                        if (result) {
                                            if (!result.inline) {
                                                lastNonInlineScriptPromise = result.promise;
                                            }
                                            sp.push(result.promise);
                                        }
                                    });
                                }
                            } else {
                                Log.print(Log.l.trace, "added " + propertyName + "=" + addPageData[propertyName]);
                                this.binding.addProperty(propertyName, addPageData[propertyName]);
                            }
                        }
                    }
                }
                if (sp.length > 0) {
                    this.addPagePromise = WinJS.Promise.join(sp);
                } else {
                    this.addPagePromise = null;
                }

                this._eventHandlerRemover = [];
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

                this._disposablePromises = [];
                /**
                 * @function addDisposablePromise
                 * @param {Object} promise - The promise to add to disposable list
                 * @memberof Application.Controller
                 * @description Call this function to add a promise to a list of disposable promises
                 *  All disposable promises added by this functions are automatically calcelled on dispose of the page.
                 */
                this.addDisposablePromise = function (promise) {
                    if (this._disposablePromises &&
                        typeof this._disposablePromises.push === "function") {
                        this._disposablePromises.push(promise);
                    }
                    return promise;
                };
                /**
                 * @function removeDisposablePromise
                 * @param {Object} promise - The promise to remove from disposable list
                 * @memberof Application.Controller
                 * @description Call this function to remove a promise from a list of disposable promises
                 */
                this.removeDisposablePromise = function (promise) {
                    if (this._disposablePromises && this._disposablePromises.length > 0) {
                        for (var i = 0; i < this._disposablePromises.length; i++) {
                            if (this._disposablePromises[i] === promise) {
                                this._disposablePromises.splice(i, 1);
                                break;
                            }
                        }
                    }
                    return promise;
                };
                if (!isMaster) {
                    // general event listener for mouse/touch - down/up!
                    this.addRemovableEventListener(document, "mousedown", this.onMouseDown.bind(this));
                    this.addRemovableEventListener(document, "pointerdown", this.onPointerDown.bind(this));
                    this.addRemovableEventListener(document, "mouseup", this.onMouseUp.bind(this));
                    this.addRemovableEventListener(document, "pointerup", this.onPointerUp.bind(this));
                }
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
                        var listControl = that.listView.winControl;
                        if (listControl) {
                            var row, col, columnIndexes = [], colCount = 0;
                            var headerFields = that.listView.querySelectorAll(".list-header .list-landscape-only > div:not(.row-bkg-gray)")
                            if (headerFields) {
                                for (col = 0; col < headerFields.length; col++) {
                                    var headerField = headerFields[col];
                                    if (headerField.firstElementChild &&
                                        headerField.firstElementChild.clientWidth > (columnWidths[col] || 100) + 8) {
                                        columnWidths[col] = Math.round(headerField.firstElementChild.clientWidth);
                                    }
                                    if (columnWidths[col]) {
                                        if (columnIndexes.indexOf(col) < 0) {
                                            columnIndexes.push(col);
                                        }
                                    }
                                }
                                colCount = headerFields.length;
                            }
                            var indexOfFirstVisible = listControl.indexOfFirstVisible;
                            var indexOfLastVisible = listControl.indexOfLastVisible;
                            for (row = indexOfFirstVisible; row <= indexOfLastVisible; row++) {
                                var element = listControl.elementFromIndex(row);
                                if (element) {
                                    var listFields = element.querySelectorAll(".list-landscape-only > div:not(.row-bkg-gray)");
                                    if (listFields) for (col = 0; col < listFields.length; col++) {
                                        var listField = listFields[col];
                                        if (listField.firstElementChild &&
                                            listField.firstElementChild.clientWidth > (columnWidths[col] || 100) + 8) {
                                            columnWidths[col] = Math.round(listField.firstElementChild.clientWidth);
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
                Log.ret(Log.l.trace);
            }, {
                _getHammerExcludeRect: null,
                hammer: {
                    get: function() {
                        return this._hammer;
                    },
                    set: function(newHammer) {
                        this._hammer = newHammer;
                    }
                },
                hammerExcludeRect: {
                    get: function() {
                        if (typeof this._getHammerExcludeRect === "function") {
                            var newHammerExcludeRect = this._getHammerExcludeRect();
                            return {
                                left: newHammerExcludeRect && newHammerExcludeRect.left || 0,
                                top: newHammerExcludeRect && newHammerExcludeRect.top || 0,
                                right: newHammerExcludeRect && newHammerExcludeRect.right || 0,
                                bottom: newHammerExcludeRect && newHammerExcludeRect.bottom || 0
                            }
                        }
                        return this._hammerExcludeRect;
                    },
                    set: function(newHammerExcludeRect) {
                        this._hammerExcludeRect = {
                            left: newHammerExcludeRect && newHammerExcludeRect.left || 0,
                            top: newHammerExcludeRect && newHammerExcludeRect.top || 0,
                            right: newHammerExcludeRect && newHammerExcludeRect.right || 0,
                            bottom: newHammerExcludeRect && newHammerExcludeRect.bottom || 0
                        };
                    }
                },
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
                    get: function () {
                        return this._pageData;
                    },
                    set: function (newPageData) {
                        this._pageData = newPageData;
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
                    get: function () {
                        return this._disableHandlers;
                    },
                    set: function (newDisableHandlers) {
                        this._disableHandlers = newDisableHandlers;
                        // don't do this for master views!
                        if (!this.isMaster) {
                            AppBar.disableHandlers = this._disableHandlers;
                        }
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
                    get: function () {
                        return this._eventHandlers;
                    },
                    set: function (newEventHandlers) {
                        this._eventHandlers = newEventHandlers;
                        // don't do this for master views!
                        if (!this.isMaster) {
                            AppBar.eventHandlers = this._eventHandlers;
                        }
                    }
                },
    			addScrollIntoViewCheck: function (input, scrollSurface) {
			        var that = this;
			        if (input) {
				        var prevBlurHandler = input.onblur;
				        var prevFocusHandler = input.onfocus;
				        input.onfocus = function (event) {
				            input._scrollIntoViewCheck = function (repeat) {
					        var activeElement = document.activeElement;
	                        var pageElement = Application.navigator.pageElement;
					        if (activeElement === input &&
					            pageElement.contains(that.element)) {
						        function scrollIntoView() {
                                    if (scrollSurface && scrollSurface.scrollHeight > 0) {
                                        var position = WinJS.Utilities._getPositionRelativeTo(input, scrollSurface);
                                        var top = position.top - scrollSurface.scrollTop;
                                        var height = position.height;
                                        var clientHeight = scrollSurface.clientHeight;
                                        if (top < 20) {
                                            Log.print(Log.l.trace, "scrollIntoView: scrollTop " + scrollSurface.scrollTop + "=>" + (scrollSurface.scrollTop - (20 - top)).toString());
                                            scrollSurface.scrollTop -= 20 - top;
                                        } else if ((top + height) > clientHeight) {
                                            Log.print(Log.l.trace, "scrollIntoView: scrollTop " + scrollSurface.scrollTop + "=>" + (scrollSurface.scrollTop + (top + height - clientHeight)).toString());
                                            scrollSurface.scrollTop += top + height - clientHeight;
                                        } else {
                                            Log.print(Log.l.trace, "scrollIntoView: top=" + top + " clientHeight=" + clientHeight + " scrollTop=" + scrollSurface.scrollTop);
                                        }
                                    }
						        }
						        function resizeView() {
						            var clientHeight = pageElement.clientHeight;
						            if (AppBar.commandList &&
							            AppBar.commandList.length > 0 &&
							            AppBar.barElement &&
							            AppBar.barElement.clientHeight > 0) {
							                var positionContent = WinJS.Utilities._getPositionRelativeTo(pageElement, null);
							                var positionAppBar = WinJS.Utilities._getPositionRelativeTo(AppBar.barElement, null);
							                var newHeight = positionAppBar.top - positionContent.top;
							                if (newHeight < clientHeight) {
							                    Log.print(Log.l.trace, "resizeView: height " + clientHeight + "=>" + newHeight);
							                    pageElement.style.height = newHeight + "px";
							                    var contentarea = pageElement.querySelector(".contentarea");
							                    if (contentarea && contentarea.style) {
							                        contentarea.style.height = newHeight.toString() + "px";
							                    }
							                    Application.navigator.elementUpdateLayout(pageElement);
							                } else {
							                    Log.print(Log.l.trace, "resizeView: positionContent.top=" + positionContent.top + " positionAppBar.top=" + positionAppBar.top + " clientHeight=" + clientHeight);
							                }
						                }
						            }
						            WinJS.Promise.timeout(50).then(function () {
						                if (!AppBar.hasShowingKeyboardHandler) {
							                resizeView();
						                }
						                return WinJS.Promise.timeout(50);
						            }).then(function () {
						                scrollIntoView();
						                return WinJS.Promise.timeout(100);
						            }).then(function () {
						                if (typeof repeat === "number" && repeat > 1 &&
						                    typeof input._scrollIntoViewCheck === "function") {
							                input._scrollIntoViewCheck(--repeat);
						                }
						            });
					            }
				            }
				            var target = event.target;
				            if (target === input && 
				                typeof input._scrollIntoViewCheck === "function") {
					            input._scrollIntoViewCheck(5);
				            }
				            if (typeof prevFocusHandler === "function") {
					            return prevFocusHandler(event);
				            } else {
					            return true;
				            }
				        }
				        input.onblur = function (event) {
				            WinJS.Promise.timeout(0).then(function () {
				                var pageElement = Application.navigator.pageElement;
					            if (pageElement) {
					                Application.navigator.resizePageElement(pageElement);
					            }
				            });
				            if (input._scrollIntoViewCheck) {
					            delete input._scrollIntoViewCheck;
				            }
				            if (typeof prevBlurHandler === "function") {
					            return prevBlurHandler(event);
				            } else {
					            return true;
				            }
				        }
			        }
			    },
                addScrollIntoViewCheckForInputElements: function(listView) {
                    if (typeof device === "object" &&
                        (device.platform === "windows" || device.platform === "Android")) {
                        var scrollSurface = listView.querySelector(".win-viewport");
                        if (scrollSurface) {
                            var inputs = scrollSurface.querySelectorAll("input, textarea");
                            if (inputs && inputs.length > 0) {
                                for (var j = 0; j < inputs.length; j++) {
                                    this.addScrollIntoViewCheck(inputs[j], scrollSurface);
                                }
                            }
                        }
                    }
                },
                /**
               * @function processAll
               * @returns {WinJS.Promise} The fulfillment of the binding processing is returned in a {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object.
               * @memberof Application.Controller
               * @description Call this function at the end of the constructor function of the derived fragment controller class to process resource load and data binding in the page.
               *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211864.aspx WinJS.Resources.processAll} and {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229846.aspx WinJS.Binding.processAll} for further informations.
               */
                processAll: function () {
                    // Set scope only if commandList is specified - don't use commandList for master views!
                    var that = this;
                    var initSwipeHandler = function() {
                        var prevPage = Application.prevPageInGroup(Application.getPageId(nav.location));
                        var nextPage = Application.nextPageInGroup(Application.getPageId(nav.location));
                        if (!that.hammer && that._element && typeof Hammer === "function") {
                            var contentArea = that._element.querySelector(".contentarea");
                            if (contentArea) {
                                var listView = contentArea.querySelector(".win-listview");
                                if (listView) {
                                    var parentElement = listView.parentElement;
                                    while (!WinJS.Utilities.hasClass(parentElement, "contentarea")) {
                                        parentElement = parentElement.parentElement;
                                    }
                                    if (parentElement === contentArea) {
                                        // switch to viewport of listview if direct child of contentarea
                                        contentArea = listView.querySelector(".win-viewport");
                                    }
                                }
                            }
                            if (contentArea) {
                                that.hammer = new Hammer.Manager(contentArea, {
                                    touchAction: "pan-y"
                                });
                                that.hammer.add(new Hammer.Pan({
                                    direction: Hammer.DIRECTION_HORIZONTAL,
                                    enable: function (recognizer, ev) {
                                        if (ev && ev.center && ev.pointerType === "touch" &&
                                            ev.srcEvent && ev.srcEvent.type === "pointerdown") {
                                            var rect = that.hammerExcludeRect;
                                            var targetTagName = ev.target &&
                                                ev.target.tagName &&
                                                ev.target.tagName.toLowerCase();
                                                var targetId = ev.target && ev.target.id;
                                            if (rect &&
                                                rect.right > rect.left &&
                                                rect.bottom > rect.top &&
                                                ev.center.x > rect.left &&
                                                ev.center.x < rect.right &&
                                                ev.center.y > rect.top &&
                                                ev.center.y < rect.bottom ||
                                                    ev.target && ((targetId === "svgsketch" || targetTagName === "textarea" || targetTagName === "input" &&
                                                        Application._horzSwipeExcludedInputTypes.indexOf(ev.target.type) >= 0) ||
                                                    ev.target.dataset && ev.target.dataset.winControl === "WinJS.UI.ToggleSwitch")) {
                                                that._hammerDisabled = true;
                                                if (that._element && that._element.style) {
                                                    that._element.style.marginLeft = 0;
                                                }
                                            } else {
                                                var target = ev.target;
                                                while (target.parentElement !== that._element) {
                                                    if (target.dataset &&
                                                        (target.dataset.winControl === "WinJS.UI.FlipView" ||
                                                         target.dataset.winControl === "WinJS.UI.ListView" &&
                                                         target.winControl &&
                                                         target.winControl.layout &&
                                                         target.winControl.layout.orientation === "horizontal")) {
                                                        that._hammerDisabled = true;
                                                        Log.print(Log.l.u2, " center x=" + ev.center.x + " y=" + ev.center.y + " disabled=" + that._hammerDisabled);
                                                        return !that._hammerDisabled;
                                                    }
                                                    target = target.parentElement;
                                                }
                                                that._hammerDisabled = false;
                                            }
                                            Log.print(Log.l.u2, " center x=" + ev.center.x + " y=" + ev.center.y + " disabled=" + that._hammerDisabled);
                                        }
                                        return !that._hammerDisabled;
                                    }
                                }));
                                that.hammer.on('panstart', function(ev) {
                                    Log.print(Log.l.u2," type=" + ev.type + " eventType="+ ev.eventType + " pointerType=" + ev.pointerType);
                                    if (ev.center && ev.pointerType === "touch") {
                                        Log.print(Log.l.u2, " center x=" + ev.center.x + " y=" + ev.center.y + " disabled=" + that._hammerDisabled);
                                        if (that._element && that._element.style) {
                                            that._element.style.marginLeft = 0;
                                        }
                                    }
                                });
                                that.hammer.on('panmove', function(ev) {
                                    Log.print(Log.l.u2," type=" + ev.type + " eventType="+ ev.eventType + " pointerType=" + ev.pointerType);
                                    if (!that._hammerDisabled && ev.pointerType === "touch" &&
                                        !(Application.navigator._nextMaster &&
                                            Application.navigator._masterMaximized &&
                                            !Application.navigator._masterHidden) &&
                                        Math.abs(ev.deltaY) < Application._horzSwipeMaxThreshY &&
                                        Math.abs(ev.deltaX) > Application._horzSwipeMinThreshX) {
                                        if (ev.deltaX >= 0) {
                                            if (Application.navigator._nextMaster &&
                                                Application.navigator._masterMaximized &&
                                                Application.navigator._masterHidden || 
                                                prevPage ||
                                                !prevPage && typeof that.eventHandlers.clickBack === "function" &&
                                                !(that.disableHandlers && 
                                                    typeof that.disableHandlers.clickBack === "function" &&
                                                    that.disableHandlers.clickBack())) {
                                                if (that._element && that._element.style) {
                                                    that._element.style.marginLeft = ev.deltaX + "px";
                                                }
                                            } else if (that._element && that._element.style) {
                                                that._element.style.marginLeft = Math.sqrt(ev.deltaX) + "px";
                                            }
                                        } else {
                                            if (nextPage ||
                                                !nextPage && typeof that.eventHandlers.clickForward === "function" &&
                                                !(that.disableHandlers &&
                                                typeof that.disableHandlers.clickForward === "function" &&
                                                that.disableHandlers.clickForward())) {
                                                if (that._element && that._element.style) {
                                                    that._element.style.marginLeft = ev.deltaX + "px";
                                                }
                                            } else if (that._element && that._element.style) {
                                                that._element.style.marginLeft = (-Math.sqrt(-ev.deltaX)) + "px";
                                            }
                                        }
                                    }
                                });
                                that.hammer.on('panend', function(ev) {
                                    Log.print(Log.l.u2," type=" + ev.type + " eventType="+ ev.eventType + " pointerType=" + ev.pointerType);
                                    if (!that._hammerDisabled && ev.pointerType === "touch" &&
                                        !(Application.navigator._nextMaster &&
                                            Application.navigator._masterMaximized &&
                                            !Application.navigator._masterHidden)) {
                                        if ((ev.deltaX >= Application._horzSwipeActionThreshX && ev.velocityX >= 0.3 ||
                                            ev.deltaX >= Application._horzSwipeActionThreshX * 4 && !ev.velocityX) &&
                                            ev.maxPointers === 1 && Math.abs(ev.deltaY) < Application._horzSwipeMaxThreshY) {
                                            if (Application.navigator._nextMaster &&
                                                Application.navigator._masterMaximized &&
                                                Application.navigator._masterHidden) {
                                                Application.showMaster(function () {
                                                    if (that._element && that._element.style) {
                                                        that._element.style.marginLeft = 0;
                                                    }
                                                });
                                            } else if (prevPage) {
                                                WinJS.UI.Animation.slideRightOut(that._element).then(function () {
                                                    if (that._element && that._element.style) {
                                                        that._element.style.marginLeft = 0;
                                                        that._element.style.opacity = 1;
                                                        Application.navigateById(prevPage);
                                                    }
                                                });
                                            } else if (!prevPage && typeof that.eventHandlers.clickBack === "function" &&
                                                !(that.disableHandlers &&
                                                    typeof that.disableHandlers.clickBack === "function" &&
                                                    that.disableHandlers.clickBack())) {
                                                WinJS.UI.Animation.slideRightOut(that._element).then(function() {
                                                    if (that._element && that._element.style) {
                                                        that._element.style.marginLeft = 0;
                                                        that._element.style.opacity = 1;
                                                    }
                                                    that.eventHandlers.clickBack();
                                                });
                                            } else {
                                                if (that._element && that._element.style) {
                                                    that._element.style.marginLeft = 0;
                                                }
                                                if (ev.deltaX >= Application._horzSwipeAnimationThreshX &&
                                                    Application.navigator._nextMaster &&
                                                    Application.navigator._masterMaximized &&
                                                    Application.navigator._masterHidden || 
                                                    prevPage ||
                                                    !prevPage && typeof that.eventHandlers.clickBack === "function" &&
                                                    !(that.disableHandlers && 
                                                        typeof that.disableHandlers.clickBack === "function" &&
                                                        that.disableHandlers.clickBack())) {
                                                    WinJS.UI.Animation.slideLeftIn(that._element);
                                                }
                                            }
                                        } else if ((ev.deltaX <= -Application._horzSwipeActionThreshX && ev.velocityX <= -0.3 ||
                                            ev.deltaX <= -Application._horzSwipeActionThreshX * 4 && !ev.velocityX) &&
                                            ev.maxPointers === 1 && Math.abs(ev.deltaY) < Application._horzSwipeMaxThreshY) {
                                            if (nextPage) {
                                                WinJS.UI.Animation.slideLeftOut(that._element).then(function () {
                                                    if (that._element && that._element.style) {
                                                        that._element.style.marginLeft = 0;
                                                        that._element.style.opacity = 1;
                                                        Application.navigateById(nextPage);
                                                    }
                                                });
                                            } else if (!nextPage &&
                                                typeof that.eventHandlers.clickForward === "function" &&
                                                !(that.disableHandlers &&
                                                    typeof that.disableHandlers.clickForward === "function" &&
                                                    that.disableHandlers.clickForward())) {
                                                if (that._element && that._element.style) {
                                                    that._element.style.marginLeft = 0;
                                                    that._element.style.opacity = 1;
                                                }
                                                that.eventHandlers.clickForward();
                                            } else {
                                                if (that._element && that._element.style) {
                                                    that._element.style.marginLeft = 0;
                                                }
                                                if (ev.deltaX <= -Application._horzSwipeAnimationThreshX &&
                                                    nextPage ||
                                                    !nextPage && typeof that.eventHandlers.clickForward === "function" &&
                                                    !(that.disableHandlers &&
                                                    typeof that.disableHandlers.clickForward === "function" &&
                                                    that.disableHandlers.clickForward())) {
                                                    WinJS.UI.Animation.slideRightIn(that._element);
                                                }
                                            }
                                        } else {
                                            if (that._element && that._element.style) {
                                                that._element.style.marginLeft = 0;
                                            }
                                            if (Math.abs(ev.deltaY) < Application._horzSwipeMaxThreshY) {
                                                if (ev.deltaX >= Application._horzSwipeAnimationThreshX) {
                                                    WinJS.UI.Animation.slideLeftIn(that._element);
                                                } else if (ev.deltaX <= -Application._horzSwipeAnimationThreshX) {
                                                    WinJS.UI.Animation.slideRightIn(that._element);
                                                }
                                            }
                                        }
                                    }
                                });
                                that.hammer.on('pancancel', function(ev) {
                                    Log.print(Log.l.u2," type=" + ev.type + " eventType="+ ev.eventType + " pointerType=" + ev.pointerType);
                                    if (!that._hammerDisabled && ev.pointerType === "touch" &&
                                        !(Application.navigator._nextMaster &&
                                            Application.navigator._masterMaximized &&
                                            !Application.navigator._masterHidden)) {
                                        if (that._element && that._element.style) {
                                            that._element.style.marginLeft = 0;
                                        }
                                        if (Math.abs(ev.deltaY) < Application._horzSwipeMaxThreshY) {
                                            if (ev.deltaX >= Application._horzSwipeAnimationThreshX) {
                                                WinJS.UI.Animation.slideLeftIn(that._element);
                                            } else if (ev.deltaX <= -Application._horzSwipeAnimationThreshX) {
                                                WinJS.UI.Animation.slideRightIn(that._element);
                                            }
                                        }
                                    }
                                });
                                that.hammer.on("hammer.input", function(ev) {
                                    var pan = that.hammer.get('pan');
                                    Log.print(Log.l.u2," type=" + ev.type + " eventType="+ ev.eventType + " pointerType=" + ev.pointerType + " pan.state=" + (pan ? pan.state : 0));
                                    that._hammerState = pan ? pan.state : Hammer.STATE_FAILED;
                                    if (!that._hammerDisabled && ev.pointerType === "touch" &&
                                        that._hammerState === Hammer.STATE_FAILED && !that._hammerWatchdogPromise) {
                                        that._hammerWatchdogPromise = WinJS.Promise.timeout(250).then(function() {
                                            that._hammerWatchdogPromise.cancel();
                                            that.removeDisposablePromise(that._hammerWatchdogPromise);
                                            that._hammerWatchdogPromise = null;
                                            if (that.hammer && that._hammerState === Hammer.STATE_FAILED) {
                                                Log.print(Log.l.info,"re-init hammer for being locked in failed state!");
                                                if (!(Application.navigator._nextMaster &&
                                                    Application.navigator._masterMaximized &&
                                                    !Application.navigator._masterHidden)) {
                                                    if (that._element && that._element.style) {
                                                        that._element.style.marginLeft = 0;
                                                    }
                                                    if (Math.abs(ev.deltaY) < Application._horzSwipeMaxThreshY) {
                                                        if (ev.deltaX >= Application._horzSwipeAnimationThreshX) {
                                                            WinJS.UI.Animation.slideLeftIn(that._element);
                                                        } else if (ev.deltaX <= -Application._horzSwipeAnimationThreshX) {
                                                            WinJS.UI.Animation.slideRightIn(that._element);
                                                        }
                                                    }
                                                }
                                                that.hammer.stop(true);
                                                that.hammer.off('hammer.input');
                                                that.hammer.off('panmove');
                                                that.hammer.off('panend');
                                                that.hammer.off('pancancel');
                                                that.hammer.destroy();
                                                that.hammer = null;
                                                initSwipeHandler();
                                            }
                                        });
                                        that.addDisposablePromise(that._hammerWatchdogPromise);
                                    } else if (that._hammerWatchdogPromise) {
                                        that._hammerWatchdogPromise.cancel();
                                        that.removeDisposablePromise(that._hammerWatchdogPromise);
                                        that._hammerWatchdogPromise = null;
                                    }
                                });
                            }
                        }
                    }
                    if (!that.isMaster) {
                        initSwipeHandler();
                    }
                    var ret = WinJS.Resources.processAll(that.element).then(function () {
                        return WinJS.Binding.processAll(that.element, that.binding);
                    }).then(function () {
                        if (typeof device === "object") {
                            if (device.platform === "windows") {
                                if (AppBar.barControl &&
                                    !AppBar.barControl._handleShowingKeyboardNew &&
                                    typeof AppBar.barControl._handleShowingKeyboardBound === "function") {
                                    var prevHandleShowingKeyboardBound = AppBar.barControl._handleShowingKeyboardBound;
                                    WinJS.Utilities._inputPaneListener.removeEventListener(AppBar.barControl._dom.root, "showing", AppBar.barControl._handleShowingKeyboardBound);
                                    AppBar.barControl._handleShowingKeyboardNew = function (event) {
                                        AppBar.hasShowingKeyboardHandler = true;
                                        var occludedRect = null;
                                        var ret = prevHandleShowingKeyboardBound(event) || WinJS.Promise.as();
                                        // disable automatic focused-element-in-view behavior on Windows devices!
                                        if (event && event.detail && event.detail.originalEvent && event.detail.originalEvent.detail) {
                                            var inputPaneVisibilityEventArgs = event.detail.originalEvent.detail[0];
                                            if (inputPaneVisibilityEventArgs) {
                                                inputPaneVisibilityEventArgs.ensuredFocusedElementInView = true;
                                                occludedRect = inputPaneVisibilityEventArgs.occludedRect;
                                            }
                                        }
                                        var pageElement = Application.navigator.pageElement;
                                        return ret.then(function () {
                                            if (occludedRect && occludedRect.height > 0) {
                                                if (pageElement && pageElement.style) {
                                                    var newHeight = pageElement.clientHeight - occludedRect.height;
                                                    pageElement.style.height = newHeight + "px";
                                                    var contentarea = pageElement.querySelector(".contentarea");
                                                    if (contentarea && contentarea.style) {
                                                        contentarea.style.height = newHeight.toString() + "px";
                                                    }
                                                    Application.navigator.elementUpdateLayout(pageElement);
                                                }
                                                return WinJS.Promise.timeout(0);
                                            } else {
                                                return WinJS.Promise.timeout(250);
                                            }
                                        }).then(function () {
                                            if (pageElement && pageElement.style) {
                                                var clientHeight = pageElement.clientHeight;
                                                if (AppBar.commandList &&
                                                    AppBar.commandList.length > 0 &&
                                                    AppBar.barElement &&
                                                    AppBar.barElement.clientHeight > 0) {
                                                    var positionContent = WinJS.Utilities._getPositionRelativeTo(pageElement, null);
                                                    var positionAppBar = WinJS.Utilities._getPositionRelativeTo(AppBar.barElement, null);
                                                    var newHeight = positionAppBar.top - positionContent.top;
                                                    if (newHeight < clientHeight) {
                                                        pageElement.style.height = newHeight + "px";
                                                        var contentarea = pageElement.querySelector(".contentarea");
                                                        if (contentarea && contentarea.style) {
                                                            contentarea.style.height = newHeight.toString() + "px";
                                                        }
                                                        Application.navigator.elementUpdateLayout(pageElement);
                                                    }
                                                }
                                            }
                                            var activeElement = document.activeElement;
                                            if (activeElement &&
                                                typeof activeElement._scrollIntoViewCheck === "function") {
                                                activeElement._scrollIntoViewCheck(5);
                                            }
                                        });
                                    }
                                    AppBar.barControl._handleShowingKeyboardBound = AppBar.barControl._handleShowingKeyboardNew.bind(AppBar.barControl);
                                    WinJS.Utilities._inputPaneListener.addEventListener(AppBar.barControl._dom.root, "showing", AppBar.barControl._handleShowingKeyboardBound);
                                }
                                if (AppBar.barControl &&
                                    !AppBar.barControl._handleHidingKeyboardNew &&
                                    typeof AppBar.barControl._handleHidingKeyboardBound === "function") {
                                    var prevHandleHidingKeyboardBound = AppBar.barControl._handleHidingKeyboardBound;
                                    WinJS.Utilities._inputPaneListener.removeEventListener(AppBar.barControl._dom.root, "hiding", AppBar.barControl._handleHidingKeyboardBound);
                                    AppBar.barControl._handleHidingKeyboardNew = function (event) {
                                        var ret = prevHandleHidingKeyboardBound(event) || WinJS.Promise.as();
                                        var pageElement = Application.navigator.pageElement;
                                        return ret.then(function () {
                                            if (pageElement) {
                                                Application.navigator.resizePageElement(pageElement);
                                            }
                                        });
                                    }
                                    AppBar.barControl._handleHidingKeyboardBound = AppBar.barControl._handleHidingKeyboardNew.bind(AppBar.barControl);
                                    WinJS.Utilities._inputPaneListener.addEventListener(AppBar.barControl._dom.root, "hiding", AppBar.barControl._handleHidingKeyboardBound);
                                }
                            }
                            if (device.platform === "windows" || device.platform === "Android") {
                                var scrollSurface = that.element.querySelector(".contentarea");
                                var inputs = that.element.querySelectorAll("input, textarea");
                                if (inputs && inputs.length > 0) {
                                    for (var i = 0; i < inputs.length; i++) {
                                        that.addScrollIntoViewCheck(inputs[i], scrollSurface);
                                    }
                                }
                            }
                        }
                        if (that.eventHandlers && typeof that.eventHandlers.clickBack === "function") {
                            // general event listener for hardware back button, too!
                            that.addRemovableEventListener(document, "backbutton", that.eventHandlers.clickBack.bind(that));
                        }
                    });
                    if (this.addPagePromise) {
                        return this.addPagePromise.then(function () {
                            return ret;
                        });
                    } else {
                        return ret;
                    }
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
                    var i;
                    Log.call(Log.l.trace, "Application.Controller.");
                    if (this._disposed) {
                        Log.ret(Log.l.trace, "extra ignored!");
                        return;
                    }
                    this._disposed = true;
                    if (this._disposablePromises && this._disposablePromises.length > 0) {
                        for (i = 0; i < this._disposablePromises.length; i++) {
                            var promise = this._disposablePromises[i];
                            if (promise && typeof promise.cancel === "function") {
                                Log.print(Log.l.info, "cancelling disposablePromises[" + i + "]");
                                promise.cancel();
                            }
                        }
                        this._disposablePromises = null;
                    }
                    if (this._selectPromise) {
                        this._selectPromise.cancel();
                        this._selectPromise = null;
                    }
                    if (this._derivedDispose) {
                        this._derivedDispose();
                    }
                    if (this.records) {
                        // free record set!
                        this.records = null;
                    }
                    if (this.scripts) {
                        var src;
                        for (src in this.scripts) {
                            if (this.scripts.hasOwnProperty(src)) {
                                var s = this.scripts[src];
                                s.parentNode.removeChild(s);
                            }
                        }
                    }
                    if (this._eventHandlerRemover) {
                        for (i = 0; i < this._eventHandlerRemover.length; i++) {
                            this._eventHandlerRemover[i]();
                        }
                        this._eventHandlerRemover = [];
                    }
                    this.binding = WinJS.Binding.unwrap(this.binding);
                    if (this._hammer) {
                        if (typeof this._hammer.stop === "function") {
                            this._hammer.stop();
                        }
                        if (typeof this._hammer.destroy === "function") {
                            this._hammer.destroy();
                        }
                        this._hammer = null;
                    }
                    this._element = null;
                    Log.ret(Log.l.trace);
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
                    get: function () {
                        if (!this._element) {
                            var controllerElement = this._pageElement && this._pageElement.querySelector(".data-container");
                            if (controllerElement) {
                                Log.print(Log.l.trace, "controllerElement: #" + controllerElement.id);
                                controllerElement.winControl = this;
                                WinJS.Utilities.addClass(controllerElement, "win-disposable");
                                this._element = controllerElement;
                            }
                        }
                        return this._element;
                    }
                },
                commandList: {
                    get: function () {
                        return this._commandList;
                    }
                },
                onPointerDown: function (e) {
                    Log.call(Log.l.trace, "Application.Controller.");
                    this.cursorPos = { x: e.pageX, y: e.pageY };
                    this.mouseDown = true;
                    Log.ret(Log.l.trace);
                },
                onMouseDown: function (e) {
                    Log.call(Log.l.trace, "Application.Controller.");
                    this.cursorPos = { x: e.pageX, y: e.pageY };
                    this.mouseDown = true;
                    Log.ret(Log.l.trace);
                },
                onPointerUp: function (e) {
                    Log.call(Log.l.trace, "Application.Controller.");
                    this.mouseDown = false;
                    Log.ret(Log.l.trace);
                },
                onMouseUp: function (e) {
                    Log.call(Log.l.trace, "Application.Controller.");
                    this.mouseDown = false;
                    Log.ret(Log.l.trace);
                },
                setFocusOnItemInvoked: function (eventInfo) {
                    var that = this;
                    Log.call(Log.l.trace, "Application.Controller.");
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
    });


    WinJS.Namespace.define("Application", {
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
        RecordsetController: WinJS.Class.derive(Application.Controller, function RecordsetController(pageElement, addPageData, commandList, isMaster, tableView, showView, listView) {
            Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
            Application.Controller.apply(this, [pageElement, addPageData, commandList, isMaster]);
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.", "recordId=" + recordId);
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.", "recordId=" + recordId);
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
                if (that.binding.loading ||
                    that.listControl && that.listControl.loadingState !== "complete") {
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
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
                        if (typeof complete === "function") {
                        complete({});
                        }
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
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
                                    Log.print(Log.l.info, "Application.RecordsetController.Controller. update: success!");
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
                if (that.showView && that.listControl && that.listControl.selection) {
                    var selectionCount = that.listControl.selection.count();
                    if (selectionCount === 1) {
                        // Only one item is selected, show the page
                        ret = that.listControl.selection.getItems().then(function (items) {
                            var item = items[0];
                            that.currentlistIndex = items[0].index;
                            var newRecId = item.data && that.showView.getRecordId(item.data);
                            if (newRecId) {
                                Log.print(Log.l.trace, "Application.RecordsetController.Controller.selectionChanged: newRecId=" + newRecId + " curRecId=" + that.curRecId);
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

            var loadingStateChanged = function (eventInfo) {
                var i;
                Log.call(Log.l.u1, "Application.RecordsetController.Controller.");
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
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
                if (that.records && that.showView &&
                    typeof that.showView.selectNext === "function" &&
                    typeof that.showView.getNextUrl === "function") {
                    AppBar.busy = true;
                    that.binding.loading = true;
                    var nextUrl = that.nextUrl;
                    that.nextUrl = null;
                    AppData.setErrorMsg(that.binding);
                    Log.print(Log.l.trace, "calling selectNext...");
                    if (that._selectPromise) {
                        that._selectPromise.cancel();
                    }
                    that._selectPromise = that.showView.selectNext(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.info, "Application.RecordsetController.Controller.loadNext: selectNext success!");
                        // selectNext returns object already parsed from json file in response
                        if (json && json.d && json.d.results && json.d.results.length > 0) {
                            that.nextUrl = that.showView.getNextUrl(json);
                            var results = json.d.results;
                            if (!results) {
                                results = [];
                            }
                            if (typeof that.resultConverter === "function") {
                                results.forEach(function(item, index) {
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
                    ret = that._selectPromise;
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
                var recordId = null;
                Log.call(Log.l.trace, "Application.RecordsetController.Controller.");
                if (that.showView && typeof that.showView.select === "function") {
                    AppBar.busy = true;
                    that.binding.loading = true;
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
                    if (!recordId) {
                        if (that._selectPromise) {
                            that._selectPromise.cancel();
                            that._selectPromise = null;
                        }
                    }
                    AppData.setErrorMsg(that.binding);
                    ret = that.showView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.info, "Application.RecordsetController.Controller.loadData select success!");
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
                                    if (that.listControl &&
                                        that.listControl.selection &&
                                        that.listControl.selection.count() === 1) {
                                        if (bFound) {
                                            that.selectRecordId(that.curRecId);
                                        } else {
                                            var selIndex = that.listControl.selection.getIndices()[0];
                                            if (typeof selIndex === "number") {
                                                that.listControl.selection.clear().then(function() {
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
                    if (!recordId) {
                        that._selectPromise = ret;
                    }
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
        }, {
        })
    });
})();

