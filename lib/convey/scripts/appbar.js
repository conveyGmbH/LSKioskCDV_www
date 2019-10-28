// implements an application-wide tool and menu bar
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/WinJS/scripts/ui.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/strings.js" />
/// <reference path="../../../lib/convey/scripts/colors.js" />

/**
 * Use the methods and properties in this namespace to display and handle commands in the application toolbar.
 * @namespace AppBar
 */

(function () {
    "use strict";

    WinJS.Namespace.define("AppBar", {
        hasShowingKeyboardHandler: false,
        outputCommand: WinJS.UI.eventHandler(function outputCommand(ev) {
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
                // anchor for element itself
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
                                    var childElementCount = parentNode.childElementCount;
                                    if (childElementCount > 2) {
                                        // remove prev. element
                                        var prevImage = parentNode.firstElementChild;
                                        if (prevImage) {
                                            parentNode.removeChild(prevImage);
                                            prevImage.innerHTML = "";
                                        }
                                    }
                                    // overlay span element over svg object to enable user input
                                    winCommandimage.setAttribute("style",
                                        "position: relative; top: -" + (symbolSize + 4).toString() + "px; width: " + symbolSize.toString() + "px; height: " + symbolSize.toString() +
                                        "px; background-size: " + AppBar._appBar._heightOfCompact.toString() + "px " + AppBar._appBar._heightOfCompact.toString() + "px;");

                                    // load the image file
                                    var promise = Colors.loadSVGImage({
                                        fileName: svg,
                                        color: Colors.navigationColor,
                                        element: svgObject,
                                        size: symbolSize,
                                        strokeWidth: AppData._persistentStates.iconStrokeWidth
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
                            if (command.element.id === "clickBack" &&
                                !WinJS.Utilities.hasClass(command.element, "leftmost")) {
                                WinJS.Utilities.addClass(command.element,"leftmost");
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
         * @function replaceEventHandlers
         * @memberof AppBar
         * @param {object} addEventHandlers - Object with member functions named by the corresponding toolbar command IDs to be added to toolbar.
         * @param {object} removeEventHandlers - Object with member functions named by the corresponding toolbar command IDs to be removed from toolbar.
         * @description Use this function to add and remove command event handler functions to/from toolbar.
         */
        replaceEventHandlers: function (addEventHandlers, removeEventHandlers) {
            Log.call(Log.l.trace, "AppBar.");
            if (!AppBar._eventHandlers) {
                AppBar.eventHandlers = addEventHandlers;
            } else {
                var commandId;
                if (removeEventHandlers) {
                    for (commandId in removeEventHandlers) {
                        if (removeEventHandlers.hasOwnProperty(commandId)) {
                            if (AppBar._eventHandlers[commandId]) {
                                delete AppBar._eventHandlers[commandId];
                            }
                        }
                    }
                }
                if (addEventHandlers) {
                    for (commandId in addEventHandlers) {
                        if (addEventHandlers.hasOwnProperty(commandId)) {
                            AppBar._eventHandlers[commandId] = addEventHandlers[commandId];
                        }
                    }
                }
            }
            Log.ret(Log.l.trace);
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
                AppBar._eventHandlers = {};
                for (var prop in newEventHandlers) {
                    if (newEventHandlers.hasOwnProperty(prop)) {
                        AppBar._eventHandlers[prop] = newEventHandlers[prop];
                    }
                }
                Log.ret(Log.l.u2);
            }
        },
        /**
         * @function replaceDisableHandlers
         * @memberof AppBar
         * @param {object} addDisableHandlers - Object with member functions named by the corresponding toolbar command IDs to be added to toolbar.
         * @param {object} removeDisableHandlers - Object with member functions named by the corresponding toolbar command IDs to be removed from toolbar.
         * @description Use this function to add and remove disable handlers to/from toolbar.
         */
        replaceDisableHandlers: function (addDisableHandlers, removeDisableHandlers) {
            var i;
            if (!AppBar._disableHandlers) {
                AppBar.disableHandlers = addDisableHandlers;
            } else {
                var commandId;
                if (removeDisableHandlers) {
                    for (commandId in removeDisableHandlers) {
                        if (removeDisableHandlers.hasOwnProperty(commandId)) {
                            for (i = AppBar._disableCommandIds.length - 1; i >= 0; i--) {
                                if (AppBar._disableCommandIds[i] === commandId) {
                                    AppBar._disableCommandIds.splice(i, 1);
                                    AppBar.disableHandlers.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
                if (addDisableHandlers) {
                    for (commandId in addDisableHandlers) {
                        if (addDisableHandlers.hasOwnProperty(commandId)) {
                            var bReplaced = false;
                            for (i = 0; i < AppBar._disableCommandIds.length; i++) {
                                if (AppBar._disableCommandIds[i] === commandId) {
                                    AppBar._disableHandlers[i] = addDisableHandlers[commandId];
                                    bReplaced = true;
                                    break;
                                }
                            }
                            if (!bReplaced) {
                                AppBar._disableCommandIds.push(commandId);
                                AppBar._disableHandlers.push(addDisableHandlers[commandId]);
                            }
                        }
                    }
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
            Log.call(Log.l.u1, "AppBar.");
            if (AppBar._commandList) {
                for (var j = 0; j < AppBar._commandList.length; j++) {
                    if (AppBar._commandList[j] && AppBar._commandList[j].id) {
                        var disableHandler = null;
                        if (AppBar._disableCommandIds && AppBar._disableHandlers) {
                            for (var k = 0; k < AppBar._disableCommandIds.length && k < AppBar._disableHandlers.length; k++) {
                                if (AppBar._disableCommandIds[k] === AppBar._commandList[j].id) {
                                    disableHandler = AppBar._disableHandlers[k];
                                    break;
                                }
                            }
                        }
                        if (typeof disableHandler === "function") {
                            AppBar.disableCommand(AppBar._commandList[j].id, disableHandler());
                        }
                    }
                }
            }
            Log.ret(Log.l.u1);
        },
        checkDefaultButtonPos: function () {
            var i;
            Log.call(Log.l.u1, "AppBar.");
            // place enter key command as most right primary
            if (AppBar._commandList && AppBar.barElement) {
                var idxKeyEnter = -1;
                for (i = 0; i < AppBar._commandList.length; i++) {
                    if (AppBar._commandList[i].section === "primary") {
                        if (idxKeyEnter < 0 && AppBar._commandList[i].key === WinJS.Utilities.Key.enter) {
                            idxKeyEnter = i;
                            break;
                        }
                    }
                }
                var idxPrimary = -1;
                if (idxKeyEnter >= 0) {
                    var winCommands = AppBar.barElement.querySelectorAll(".win-command");
                    var width = 30; // always add ... extra space
                    for (i = 0; i < AppBar._commandList.length && i < winCommands.length; i++) {
                        if (AppBar._commandList[i].section === "primary") {
                            var widthCommand = winCommands[i].clientWidth;
                            if (!widthCommand || width + widthCommand > document.body.clientWidth) {
                                break;
                            }
                            width += widthCommand;
                            idxPrimary = i;
                        }
                    }
                    if (idxPrimary >= 0 && idxPrimary !== idxKeyEnter) {
                        var enterCommand = AppBar._commandList.slice(idxKeyEnter)[0];
                        var prevCommand = AppBar._commandList.splice(idxPrimary, 1, enterCommand)[0];
                        AppBar._commandList.splice(idxKeyEnter, 1, prevCommand);
                        if (AppBar.barControl.data) {
                            enterCommand = AppBar.barControl.data.slice(idxKeyEnter)[0];
                            prevCommand = AppBar.barControl.data.splice(idxPrimary, 1, enterCommand)[0];
                            AppBar.barControl.data.splice(idxKeyEnter, 1, prevCommand);
                        }
                    }
                }
            }
            Log.ret(Log.l.u1);
        },
        /**
         * @function replaceCommands
         * @memberof AppBar
         * @param {object[]} addComands - List of command properties to be added to toolbar.
         * @param {object[]} removeCommands - List of command properties to be removed from toolbar.
         * @description Use this function to add and remove commands to/from toolbar. See commandList property for description of command objects.
         */
        replaceCommands: function (addComands, removeCommands) {
            Log.call(Log.l.trace, "AppBar.");
            var i, j, k, commandId;
            if (!AppBar._commandList || !AppBar._commandList.length) {
                AppBar.commandList = addComands;
            } else {
                if (removeCommands && removeCommands.length > 0) {
                    for (j = 0; j < removeCommands.length; j++) {
                        for (i = AppBar._commandList.length - 1; i >= 0; i--) {
                            commandId = AppBar._commandList[i].id;
                            if (removeCommands[j].id === commandId) {
                                Log.print(Log.l.trace, "remove commandId[" + i + "].id=" + commandId);
                                if (AppBar._disableCommandIds) {
                                    for (k = 0; k < AppBar._disableCommandIds.length; k++) {
                                        if (AppBar._disableCommandIds[k] === commandId) {
                                            AppBar._disableCommandIds.splice(k, 1);
                                            AppBar._disableHandlers.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                                if (AppBar.barControl.data) {
                                    AppBar.barControl.data.splice(i, 1);
                                }
                                AppBar._commandList.splice(i, 1);
                                if (AppBar._eventHandlers[commandId]) {
                                    delete AppBar._eventHandlers[commandId];
                                }
                                break;
                            }
                        }
                    }
                }
                if (addComands && addComands.length > 0) {
                    // copy values to prevent usage of modified objects in a later call
                    var newCommandList = copyByValue(addComands);

                    // remove clickBack on all platforms except iOS - problem: Windows Desktop < 10!
                    if (typeof device === "object" &&
                        device.platform !== "iOS" &&
                        document.body.clientWidth <= 499) {
                        for (i = 0; i < newCommandList.length; i++) {
                            if (newCommandList[i].id === "clickBack") {
                                newCommandList[i].section = "secondary";
                                break;
                            }
                        }
                    }
                    if (!AppBar.barControl.data) {
                        AppBar.barControl.data = new WinJS.Binding.List();
                    }
                    var prevLength = AppBar._commandList.length;
                    for (j = 0; j < newCommandList.length; j++) {
                        Log.print(Log.l.u1,
                            "section=" + newCommandList[j].section +
                            " id=" + newCommandList[j].commandId +
                            " label=" + newCommandList[j].label +
                            " svg=" + newCommandList[j].svg);
                        if (!newCommandList[j].onclick) {
                            newCommandList[j].onclick = AppBar.outputCommand;
                        }
                        if (typeof newCommandList[j].disabled === "undefined") {
                            newCommandList[j].disabled = true;
                        }
                        newCommandList[j].commandId = newCommandList[j].id;
                        var command = new WinJS.UI.AppBarCommand(null, newCommandList[j]);

                        var bReplaced = false;
                        for (i = 0; i < prevLength; i++) {
                            commandId = AppBar._commandList[i].id;
                            if (newCommandList[j].id === commandId) {
                                Log.print(Log.l.trace, "replace commandId[" + i + "].id=" + commandId);
                                AppBar.barControl.data.setAt(i, command);
                                AppBar._commandList[i] = newCommandList[j];
                                bReplaced = true;
                                break;
                            }
                        }
                        if (!bReplaced) {
                            AppBar.barControl.data.push(command);
                            AppBar._commandList.push(newCommandList[j]);
                        }
                    }
                }
                AppBar.loadIcons();
                WinJS.Promise.timeout(50).then(function () {
                    AppBar.triggerDisableHandlers();
                    if (Application.navigator) {
                        Application.navigator._resized();
                    }
                });
            }
            Log.ret(Log.l.trace);
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
                Log.call(Log.l.trace, "AppBar.commandList.");
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
                        /*var ellipsisElements = AppBar.barElement.querySelectorAll("hr.win-command, .win-appbar-ellipsis, .win-label");
                        if (ellipsisElements && ellipsisElements.length > 0) {
                            for (var j = 0; j < ellipsisElements.length; j++) {
                                ellipsisElements[j].style.color = AppBar.textColor;
                            }
                        }*/
                    }
                }
                AppBar._commandList = newCommandList;
                AppBar._eventHandlers = null;
                AppBar._disableHandlers = null;
                AppBar._disableCommandIds = null;
                AppBar.loadIcons();
                WinJS.Promise.timeout(50).then(function () {
                    AppBar.triggerDisableHandlers();
                    if (Application.navigator) {
                        Application.navigator._resized();
                    }
                });
                Log.ret(Log.l.trace);
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
            } else if (AppBar.eventHandlers) {
                var curHandler = AppBar.eventHandlers[id];
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

