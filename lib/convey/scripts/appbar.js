// implements an application-wide tool and menu bar
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/colors.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

/**
 * Use the methods and properties in this namespace to display and handle commands in the application toolbar.
 * @namespace AppBar
 */

(function () {
    "use strict";

    WinJS.Namespace.define("AppBar", {
        outputCommand: WinJS.UI.eventHandler(function(ev) {
            Log.call(Log.l.trace, "AppBar.");
            var commandId = null;
            var command = ev.currentTarget;
            if (command && command.winControl) {
                commandId = command.winControl.commandId;
                if (!commandId && command.winControl._originalICommand) {
                    commandId = command.winControl._originalICommand.commandId;
                }
                var label = command.winControl.label || command.winControl.icon || "button";
                var section = command.winControl.section || "";
                var msg = section + " command " + label + " with id=" + commandId + " was pressed";
                Log.print(Log.l.trace, msg);
            }
            if (commandId) {
                if (AppBar.barControl && AppBar.barControl.opened) {
                    Log.print(Log.l.u1, "closing AppBar");
                    AppBar.barControl.close();
                }
                if (AppBar._eventHandlers) {
                    var handler = AppBar._eventHandlers[commandId];
                    if (typeof handler == 'function') {
                        Log.print(Log.l.u1, "calling handler");
                        handler(ev);
                    }
                }
            }
            Log.ret(Log.l.trace);
        }),

        /**
         * @class AppBarClass 
         * @memberof AppBar
         * @param {Object} settings - Initialization settings
         * @param {number} settings.size - Height of the toolbar commanding surface in px, implies minimum toolbar primary command symbol size of size/2. Default value for size: 48px.
         * @param {boolean} settings.hideOverflowButton - Hides the secondary commands menu overflow button "..." if true.
         * @description The class definition for the application toolbar. 
         */
        AppBarClass: WinJS.Class.define(
            function AppBarClass(settings) {
                Log.call(Log.l.trace, "AppBar.");
                this._element = document.querySelector("#appbar");
                if (settings) {
                    if (typeof settings.size !== "undefined" && settings.size !== 48) {
                        this._heightOfCompact = settings.size;
                        Colors.changeCSS(".win-commandingsurface-closeddisplaycompact.win-commandingsurface-closed.win-commandingsurface .win-commandingsurface-actionarea", "height", this._heightOfCompact.toString() + "px");
                        Colors.changeCSS(".win-commandingsurface-closeddisplayminimal.win-commandingsurface-closed.win-commandingsurface .win-commandingsurface-actionarea", "height", Math.floor(this._heightOfCompact / 2).toString() + "px");
                        Colors.changeCSS(".win-commandingsurface .win-commandingsurface-actionarea .win-commandingsurface-overflowbutton", "width", (this._heightOfCompact / 2 + 8).toString() + "px");
                    }
                    if (typeof settings.hideOverflowButton !== "undefined") {
                        this._hideOverflowButton = settings.hideOverflowButton;
                    }
                }
                AppBar._appBar = this;
                document.body.addEventListener("keydown", function(e) {
                    return AppBar._appBar._handleKeydown(e);
                }.bind(this), true);
                Log.ret(Log.l.trace);
            }, {
                // anchor for element istself
                _hideOverflowButton: false,
                _heightOfCompact: 48,
                _element: null,
                _promises: null,
                _handleKeydown: function(e) {
                    var commandElement = null;
                    if (!e.ctrlKey && !e.altKey) {
                        if (AppBar._commandList && AppBar.barControl && AppBar.barControl.data) {
                            for (var i = 0; i < AppBar._commandList.length; i++) {
                                if (AppBar._commandList[i].key === e.keyCode) {
                                    var command = AppBar.barControl.data.getAt(i);
                                    if (command && !command.disabled) {
                                        commandElement = command.element;
                                    }
                                    e.stopImmediatePropagation();
                                    break;
                                }
                            }
                        }
                    }
                    if (commandElement) {
                        commandElement.focus();
                    }
                }
            }
        ),
        loadIcons: function() {
            Log.call(Log.l.u2, "AppBar.");
            if (AppBar._commandList && AppBar.barControl && AppBar.barControl.data) {
                for (var i = 0; i < AppBar._commandList.length; i++) {
                    var section = AppBar._commandList[i].section;
                    var svg = AppBar._commandList[i].svg;
                    if (section === "primary" && svg) {
                        var command = AppBar.barControl.data.getAt(i);
                        if (command && command.element) {
                            var symbolSize = AppBar._appBar._heightOfCompact - 24;
                            var winCommandicon = command.element.querySelector(".win-commandicon");
                            if (winCommandicon && winCommandicon.style) {
                                winCommandicon.style.width = symbolSize.toString() + "px";
                                winCommandicon.style.height = symbolSize.toString() + "px";
                            }
                            var winCommandimage = command.element.querySelector(".win-commandimage");
                            if (winCommandimage) {
                                var svgObject = document.createElement("div");
                                if (svgObject) {
                                    svgObject.setAttribute("width", symbolSize.toString());
                                    svgObject.setAttribute("height", symbolSize.toString());
                                    svgObject.style.display = "inline";
                                    svgObject.id = svg;

                                    // insert svg object before span element
                                    var parentNode = winCommandimage.parentNode;
                                    parentNode.insertBefore(svgObject, winCommandimage);

                                    // overlay span element over svg object to enable user input
                                    winCommandimage.setAttribute("style",
                                        "position: relative; top: -" + (symbolSize + 4).toString() + "px; width: " + symbolSize.toString() + "px; height: " + symbolSize.toString() +
                                        "px; background-size: " + AppBar._appBar._heightOfCompact.toString() + "px " + AppBar._appBar._heightOfCompact.toString() + "px;");

                                    // load the image file
                                    var promise = Colors.loadSVGImage({
                                        fileName: svg,
                                        color: Colors.navigationColor,
                                        element: svgObject,
                                        size: symbolSize
                                    });
                                    AppBar._appBar._promises.push(promise);
                                }
                            }
                            var winLabel = command.element.querySelector(".win-label");
                            if (winLabel && winLabel.style) {
                                // allow for 2*1px for focus border on each side 
                                winLabel.style.maxWidth = (AppBar._appBar._heightOfCompact + 18).toString() + "px";
                                //winLabel.style.color = Colors.navigationColor;
                            }
                        }
                    }
                    if (AppBar._appBar._hideOverflowButton) {
                        var winOverflowbutton = AppBar.barElement.querySelector(".win-appbar-overflowbutton");
                        if (winOverflowbutton && winOverflowbutton.style) {
                            if (AppBar.barControl.closedDisplayMode === "full") {
                                winOverflowbutton.style.visibility = "hidden";
                            } else {
                                winOverflowbutton.style.visibility = "visible";
                            }
                        }
                    }
                }
            }
            Log.ret(Log.l.u2);
        },
        /**
         * @property {Object} scope - Instance of class Application.Controller or derived class.
         * @memberof AppBar
         * @description Read/Write. Provides access to controller class object of currently loaded page.
         */
        scope: {
            get: function() { return AppBar._scope; },
            set: function(newScope) {
                AppBar._scope = newScope;
                AppBar._notifyModified = false;
                AppBar._modified = false;
                AppBar._busy = false;
            }
        },
        /**
         * @property {Object} eventHandlers - Object with member functions named by the corresponding toolbar command IDs.
         * @memberof AppBar
         * @description Read/Write. Provides access to toolbar command event handler functions.
         */
        eventHandlers: {
            get: function() { return AppBar._eventHandlers; },
            set: function(newEventHandlers) {
                Log.call(Log.l.u2, "AppBar.eventHandlers.");
                AppBar._eventHandlers = newEventHandlers;
                Log.ret(Log.l.u2);
            }
        },
        /**
         * @property {Object} disableHandlers - Object with member functions named by the corresponding toolbar command IDs.
         * @memberof AppBar
         * @description Read/Write. Provides access to toolbar command disable handler functions.
         */
        disableHandlers: {
            get: function() { return AppBar._disableHandlers; },
            set: function(newDisableHandlers) {
                Log.call(Log.l.u2, "AppBar.disableHandlers.");
                if (AppBar._scope && newDisableHandlers) {
                    AppBar._disableCommandIds = [];
                    AppBar._disableHandlers = [];
                    for (var commandId in newDisableHandlers) {
                        if (newDisableHandlers.hasOwnProperty(commandId)) {
                            AppBar._disableCommandIds.push(commandId);
                            AppBar._disableHandlers.push(newDisableHandlers[commandId]);
                        }
                    }
                } else {
                    AppBar._disableCommandIds = null;
                    AppBar._disableHandlers = null;
                }
                if (AppBar._commandList) {
                    for (var j = 0; j < AppBar._commandList.length; j++) {
                        var disableHandler = null;
                        if (AppBar._disableCommandIds) {
                            for (var k = 0; k < AppBar._disableCommandIds.length; k++) {
                                if (AppBar._disableCommandIds[k] === AppBar._commandList[j].id) {
                                    Log.print(Log.l.u1, "disableHandler for commandId=", AppBar._commandList[j].id);
                                    disableHandler = AppBar._disableHandlers[k];
                                    break;
                                }
                            }
                        }
                        if (typeof disableHandler === "function") {
                            Log.print(Log.l.u1, "call disableHandler of commandId=", AppBar._commandList[j].id);
                            AppBar.disableCommand(AppBar._commandList[j].id, disableHandler());
                        } else {
                            Log.print(Log.l.u1, "enable commandId=", AppBar._commandList[j].id);
                            AppBar.disableCommand(AppBar._commandList[j].id, false);
                        }
                    }
                }
                Log.ret(Log.l.u2);
            }
        },
        /**
         * @function triggerDisableHandlers
         * @memberof AppBar
         * @description Use this function to initiate refresh of enable/disable states of toolbar commands after state changes.
         */
        triggerDisableHandlers: function () {
            if (AppBar._commandList && AppBar._disableHandlers) {
                for (var j = 0; j < AppBar._commandList.length; j++) {
                    var disableHandler = null;
                    if (AppBar._disableCommandIds) {
                        for (var k = 0; k < AppBar._disableCommandIds.length; k++) {
                            if (AppBar._disableCommandIds[k] === AppBar._commandList[j].id) {
                                Log.print(Log.l.u1, "disableHandler for commandId=", AppBar._commandList[j].id);
                                disableHandler = AppBar._disableHandlers[k];
                                break;
                            }
                        }
                    }
                    if (typeof disableHandler === "function") {
                        Log.print(Log.l.u1, "call disableHandler of commandId=", AppBar._commandList[j].id);
                        AppBar.disableCommand(AppBar._commandList[j].id, disableHandler());
                    }
                }
            }
        },
        /**
         * @property {Object[]} commandList - List of command properties.
         * @property {string} commandList[].id - The AppBarCommand identifier.
         * @property {string} commandList[].label - The AppBarCommand label.
         * @property {string} commandList[].tooltip - The {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh700522.aspx tooltip} of the AppBarCommand.
         * @property {string} commandList[].section - The section of the {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229670.aspx AppBar} that hosts this AppBarCommand. 
         *  For values see {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh700511.aspx AppBarCommand.section property}
         * @property {string} commandList[].svg - Filename (withoit extension) of SVG graphics document to display primary toolbar command symbol. 
         * @property {string} commandList[].key - Keyboard shortcut for toolbar command. See {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211775.aspx WinJS.Utilities.Key enumeration} for possible values. 
         *  The toolbar command symbol with keyboard shortcut WinJS.Utilities.Key.enter is always placed to the rightmost of the visdible toolbar commanding surface.
         * @memberof AppBar
         * @description Read/Write. Returns or creates list of current toolbars {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh700497.aspx WinJS.UI.AppBarCommand} properties.
         */
        commandList: {
            get: function() { return AppBar._commandList; },
            set: function(newCommandList) {
                Log.call(Log.l.u2, "AppBar.commandList.");
                if (typeof AppBar._detachDisableHandlers === "function") {
                    AppBar._detachDisableHandlers();
                    AppBar._detachDisableHandlers = null;
                }
                AppBar._appBar._promises = [];
                if (AppBar.barControl) {
                    var i;
                    if (!AppBar.barControl.data) {
                        AppBar.barControl.data = new WinJS.Binding.List();
                    } else {
                        AppBar.barControl.data.length = 0;
                    }
                    // remove clickBack on all platforms except iOS - problem: Windows Desktop < 10!
                    if (typeof device === "object" && device.platform !== "iOS" &&
                        document.body.clientWidth <= 499) {
                        for (i = 0; i < newCommandList.length; i++) {
                            if (newCommandList[i].id === "clickBack") {
                                newCommandList[i].section = "secondary";
                                break;
                            }
                        }
                    }

                    // place enter key command as most right primary
                    var idxKeyEnter = -1;
                    for (i = 0; i < newCommandList.length; i++) {
                        if (newCommandList[i].section === "primary") {
                            if (idxKeyEnter < 0 && newCommandList[i].key === WinJS.Utilities.Key.enter) {
                                idxKeyEnter = i;
                                break;
                            }
                        }
                    }
                    var idxPrimary = -1;
                    if (idxKeyEnter >= 0) {
                        var width = AppBar._appBar._heightOfCompact + 6; // always add ... extra space
                        for (i = 0; i < newCommandList.length; i++){
                            if (newCommandList[i].section === "primary") {
                                width += AppBar._appBar._heightOfCompact + 20;
                                idxPrimary = i;
                            }
                            if (width > document.body.clientWidth) {
                                break;
                            }
                        }
                        if (idxPrimary >= 0 && idxPrimary !== idxKeyEnter) {
                            var enterCommand = newCommandList.slice(idxKeyEnter)[0];
                            var prevCommand = newCommandList.splice(idxPrimary, 1, enterCommand)[0];
                            newCommandList.splice(idxKeyEnter, 1, prevCommand);
                        }
                    }
                    // enable/disable AppBar
                    if (newCommandList.length > 0) {
                        var existsSecondary = false;
                        var existsPrimary = false;
                        for (i = 0; i < newCommandList.length; i++) {
                            if (newCommandList[i].section === "primary") {
                                existsPrimary = true;
                            } else if (newCommandList[i].section === "secondary") {
                                existsSecondary = true;
                            }
                        }
                        AppBar.barControl.disabled = false;
                        if (existsPrimary) {
                            if (!existsSecondary && AppBar._appBar._hideOverflowButton) {
                                AppBar.barControl.closedDisplayMode = "full";
                            } else {
                                AppBar.barControl.closedDisplayMode = "compact";
                            }
                        } else {
                            AppBar.barControl.closedDisplayMode = "minimal";
                        }
                    } else {
                        AppBar.barControl.disabled = true;
                        AppBar.barControl.closedDisplayMode = "none";
                    }
                    AppBar.barControl.close();

                    if (newCommandList.length > 0 && AppBar.barControl.data) {
                        // insert new buttons
                        for (i = 0; i < newCommandList.length; i++) {
                            Log.print(Log.l.u1,
                                "section=" + newCommandList[i].section +
                                " id=" + newCommandList[i].commandId +
                                " label=" + newCommandList[i].label +
                                " svg=" + newCommandList[i].svg);
                            if (!newCommandList[i].onclick) {
                                newCommandList[i].onclick = AppBar.outputCommand;
                            }
                            if (typeof newCommandList[i].disabled === "undefined") {
                                newCommandList[i].disabled = true;
                            }
                            newCommandList[i].commandId = newCommandList[i].id;
                            var command = new WinJS.UI.AppBarCommand(null, newCommandList[i]);
                            AppBar.barControl.data.push(command);
                        }
                    }
                    if (AppBar.barElement) {
                        // set the foreground elements color
                        var ellipsisElements = AppBar.barElement.querySelectorAll("hr.win-command, .win-appbar-ellipsis, .win-label");
                        if (ellipsisElements && ellipsisElements.length > 0) {
                            for (var j = 0; j < ellipsisElements.length; j++) {
                                ellipsisElements[j].style.color = AppBar.textColor;
                            }
                        }
                    }
                }
                AppBar._commandList = newCommandList;
                AppBar._eventHandlers = null;
                AppBar._disableHandlers = null;
                AppBar._disableCommandIds = null;
                AppBar.loadIcons();
                WinJS.Promise.timeout(0).then(function () {
                    if (Application.navigator) {
                        Application.navigator._resized();
                    }
                });
                Log.ret(Log.l.u2);
            }
        },
        /**
         * @property {Object} barElement - The application toolbars HTML element.
         * @memberof AppBar
         * @description Read only. Gets the HTML element containing the application toolbar.
         */
        barElement: {
            get: function() { return AppBar._appBar && AppBar._appBar._element; }
        },
        // winControl property, returns the WinJS control
        /**
         * @property {Object} barControl - The application toolbars control object.
         * @memberof AppBar
         * @description Read only. Gets the {@link https://msdn.microsoft.com/en-us/library/windows/apps/br229670.aspx AppBar} object of the application toolbar.
         */
        barControl: {
            get: function() { return AppBar._appBar && AppBar._appBar._element && AppBar._appBar._element.winControl; }
        },
        /**
         * @property {string} textColor - The application toolbars color style.
         * @memberof AppBar
         * @description Read only. Gets the application toolbars color style.
         */
        textColor: {
            get: function() { return AppBar._textColor; }
        },
        /**
         * @function disableCommand
         * @memberof AppBar
         * @param {string} commandId - Identifies the application toolbar command by it's ID.
         * @param {boolean} disabled - Set true to disable the given command.
         * @description Use this function to enable/disable a specified toolbar command.
         */
        disableCommand: function (commandId, disabled) {
            Log.call(Log.l.u1, "AppBar.", "commandId=" + commandId + " disabled=" + disabled);
            if (AppBar._commandList && AppBar.barControl && AppBar.barControl.data) {
                for (var i = 0; i < AppBar._commandList.length; i++) {
                    if (AppBar._commandList[i].id === commandId) {
                        var command = AppBar.barControl.data.getAt(i);
                        if (command) {
                            command.disabled = disabled;
                        }
                        break;
                    }
                }
            }
            Log.ret(Log.l.u1);
        },
        /**
         * @property {boolean} notifyModified - Current page modify notification state.
         * @memberof AppBar
         * @description Read/Write. Gets or sets the page modify notification state.
         *  A page is set to modified on change of currently bound data elements if modify notification state is true.
         */
        notifyModified: {
            get: function() {
                return (AppBar._notifyModified);
            },
            set: function (newNotifyModified) {
                AppBar._notifyModified = newNotifyModified;
                if (newNotifyModified) {
                    AppBar.triggerDisableHandlers();
                }
            }
        },
        /**
         * @property {boolean} modified - Current page modify state.
         * @memberof AppBar
         * @description Read/Write. Gets or sets the page modify state.
         *  A page can only set to modified if modify notification state is also true.
         *  The retrieval of modified state can be overwritten by isModified() method, if existing, of a page controller object in current scope.
         *  If a page is set to modified state, the modifyHandler(), if existing, of a page controller object in current scope will be called.
         */
        modified: {
            get: function () {
                if (AppBar.scope && typeof AppBar.scope.isModified === "function") {
                    AppBar._modified = AppBar.scope.isModified();
                }
                return AppBar._modified;
            },
            set: function (newModified) {
                if (AppBar._modified !== newModified) {
                    AppBar._modified = newModified;
                }
                if (AppBar.notifyModified) {
                    AppBar.triggerDisableHandlers();
                }
                if (AppBar.scope &&
                    typeof AppBar.scope.modifyHandler === "function") {
                    AppBar.scope.modifyHandler();
                }
            }
        },
        _busy: false,
        /**
         * @property {boolean} busy - Current page busy state.
         * @memberof AppBar
         * @description Read/Write. Gets or sets the page busy state.
         *  If current page modify notification state is true the AppBar.triggerDisableHandlers() will be called if the busy state changes.
         */
        busy: {
            get: function() {
                return AppBar._busy;
            },
            set: function(newBusy) {
                AppBar._busy = newBusy;
                if (AppBar.notifyModified) {
                    AppBar.triggerDisableHandlers();
                }
            }
        },
        /**
         * @function handleEvent
         * @memberof AppBar
         * @param {string} type - Identifies the event type, like "change" or "click".
         * @param {string} id - Identifies the event id.
         * @param {Object} event - Current HTML event object.
         * @description Use this function to route an event to the event handler of the currently loaded page, e.g. like this:
         <pre>
        &lt;input type="checkbox" class="win-checkbox" value="1"
                data-win-bind="checked: dataRecord.dataOfCheckbox"
                onchange="AppBar.handleEvent('change', 'myCheckboxHandler', event)" /&gt;
         </pre>
         */
        handleEvent: function (type, id, event) {
            Log.call(Log.l.trace, "AppBar.", "type=" + type + " id=" + id);
            if (type === "change" && !AppBar._notifyModified) {
                Log.print(Log.l.trace, "extra ignored: change of id=" + id);
            } else if (AppBar.scope && AppBar.scope.eventHandlers) {
                var curHandler = AppBar.scope.eventHandlers[id];
                if (typeof curHandler === "function") {
                    curHandler(event);
                } else {
                    Log.print(Log.l.error, "handler for id=" + id + " is no function!");
                }
            }
            Log.ret(Log.l.trace);
        },
        _scope: null,
        _notifyModified: false,
        _modified: false,
        _commandList: null,
        _eventHandlers: null,
        _disableHandlers: null,
        _disableCommandIds: null,
        _appBar: null
    });

})();

