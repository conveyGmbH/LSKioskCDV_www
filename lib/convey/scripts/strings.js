// Collection of String utility functions
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/appbar.js" />

/**
 * Use the functions in this namespace to access Windows resource loader interface.
 * @namespace Resources
 */

(function () {
    "use strict";

    WinJS.Utilities._require([
        'WinJS/Core/_Global',
        'WinJS/Core/_Base'
    ], function resourcesInit(_Global, _Base) {

        /**
         * @function get 
         * @memberof Resources
         * @returns {Object} {@link https://docs.microsoft.com/en-us/uwp/api/Windows.ApplicationModel.Resources.Core Windows.ApplicationModel.Resources.Core}
         * @description Used to access Windows resource loader interface. Use this function to access the Windows resource loader interface. The interface provides classes that enable advanced resource loading.
         */
        function get() {
            var resources = null;
            try {
                resources = _Global.Windows.ApplicationModel.Resources.Core;
            } catch (e) { }
            return resources;
        }

        /**
         * @function getLanguages 
         * @memberof Resources
         * @returns {Array<string>} {@link https://msdn.microsoft.com/de-de/library/windows/apps/windows.globalization.applicationlanguages.languages.aspx Windows.Globalization.ApplicationLanguages.languages}
         * @description Used to access list of languages supported by Windows in current user context. Use this function to access the languages list. Specifies the language-related preferences that the app can use and maintain.
         */
        function getLanguages() {
            var languages = [];
            try {
                languages = _Global.Windows.Globalization.ApplicationLanguages.languages;
            } catch (e) { }
            return languages;
        }

        /**
         * @function primaryLanguageOverride
         * @memberof Resources
         * @param {string} language - a BCP-47 language tag. 
         * @returns {boolean} The return value is true if the override was successfull. Otherwise the return value is false.
         * @description Used to access native Windows.Globalization.ApplicationLanguages.languages object. See reference to {@link https://tools.ietf.org/html/bcp47 BCP-47} for supported language parameter.
         */
        function primaryLanguageOverride(language) {
            var ret;
            var lowerCase = language.toLowerCase();
            var bFound = false;
            var languages = getLanguages();
            for (var i = 0; i < languages.length; i++) {
                if (lowerCase === languages[i].toLowerCase()) {
                    language = languages[i];
                    bFound = true;
                    break;
                }
            }
            if (!bFound) {
                language = "en-US";
            }
            try {
                _Global.Windows.Globalization.ApplicationLanguages.primaryLanguageOverride = language;
                ret = true;
            } catch (e) {
                Log.print(Log.l.error, "Error in primaryLanguageOverride: " + e);
                ret = false;
            }
            return ret;
        }

        function primaryLanguage() {
            var ret = null;
            var languages = getLanguages();
            try {
                ret = _Global.Windows.Globalization.ApplicationLanguages.primaryLanguageOverride;
            } catch (e) {
                Log.print(Log.l.error, "Error in primaryLanguageOverride: " + e);
            }
            if (!ret && languages) {
                ret = languages[0];
            }
            return ret;
        }

        WinJS.Namespace.define("Resources", {
            get: get,
            primaryLanguageOverride: primaryLanguageOverride,
            primaryLanguage: primaryLanguage,
            languages: getLanguages()
        });

        _Global.stripControlCodes = function (value) {
            var ret;
            Log.call(Log.l.u2);
            if (value && typeof value === "string") {
                ret = "";
                var prevPos = 0;
                var len = value.length;
                for (var i = 0; i < len; i++) {
                    var code = value.charCodeAt(i);
                    if (code < 32 && code !== 0xd && code !== 0xa) {
                        if (i - prevPos > 0) {
                            ret += value.substr(prevPos, i - prevPos);
                        }
                        ret += " ";
                        prevPos = i + 1;
                    }
                }
                if (prevPos > 0) {
                    ret += value.substr(prevPos);
                } else {
                    ret = value;
                }
            } else {
                ret = value;
            }
            Log.ret(Log.l.u2);
            return ret;
        }


        /**
         * @function getResourceText
         * @param {string} resourceName - A string containing the resource ID of the string to retrieve. 
         * @global
         * @returns {string} The requested resource string or null if the string cannot be loaded.
         * @description Retrieves the resource string that has the specified resource identifier. For further documentation, see {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh701590.aspx WinJS.Resources.getString function}. The getResourceText() function returns the language specific string value using the primary language selected in current user context.
         */
        _Global.getResourceText = function(resourceName) {
            Log.call(Log.l.u1);
            var string = WinJS.Resources.getString(resourceName);
            if (string) {
                Log.ret(Log.l.u1, string.value);
                return string.value;
            } else {
                Log.ret(Log.l.u1);
                return null;
            }
        }

        /**
         * @function getResourceTextSection
         * @param {string} sectionName - The section part of the resource ID to retrieve. 
         * @global
         * @returns {Object} An object with resource ID members and string values. The return value is always present. 
         * @description Retrieves the resource string that has the specified resource identifier. The object is filled with all resource IDs that can be retrieved from resources given the naming convention <sectionName>.<resource ID> using the primary language selected in current user context.
         */
        _Global.getResourceTextSection = function(sectionName) {
            Log.call(Log.l.u1);
            var ret = {};
            var strings = window.strings;
            if (sectionName && strings) {
                for (var prop in strings) {
                    if (strings.hasOwnProperty(prop)) {
                        if (prop.substr(0, sectionName.length + 1) === sectionName + ".") {
                            var newProp = prop.substr(sectionName.length + 1, prop.length - sectionName.length - 1);
                            ret[newProp] = strings[prop];
                            Log.print(Log.l.u1, newProp + ": " + ret[newProp]);
                        }
                    }
                }
            }
            Log.ret(Log.l.u1);
            return ret;
        }

        /**
         * @function getEmptyDefaultValue
         * @param {Object} defaultValue - An Object wich members should be used as a template. 
         * @global
         * @returns {Object} An object which members are set to default. 
         * @description Returns an object with String and Number members of defaultValue set to "" rsp. 0. 
         */
        _Global.getEmptyDefaultValue = function(defaultValue) {
            var ret = {};
            Log.call(Log.l.u1);
            for (var prop in defaultValue) {
                if (defaultValue.hasOwnProperty(prop)) {
                    var type = typeof defaultValue[prop];
                    if (type === "string") {
                        ret[prop] = "";
                    } else if (type === "number") {
                        ret[prop] = 0;
                    }
                }
            }
            Log.ret(Log.l.u1);
            return ret;
        }

        /**
         * @function copyByValue
         * @param {Object} o - An Object to copy by value of each property. 
         * @global
         * @returns {Object} A copy of the object. 
         * @description Creates a recursive copy by value of an object and it's properties. 
         */
        _Global.copyByValue = function copyByValue(o) {
            if (o === null) {
                return null;
            }
            if (typeof o === "object") {
                var output = Array.isArray(o) ? [] : {};
                for (var key in o) {
                    if (o.hasOwnProperty(key)) {
                        var v = o[key];
                        output[key] = (typeof v === "object") ? copyByValue(v) : v;
                    }
                }
                return output;
            }
            return o;
        }

        /**
         * @function copyMissingMembersByValue
         * @param {Object} targetObj - An Object to copy by value of each property. 
         * @param {Object} defaultObj - An Object containing additional properties. 
         * @global
         * @returns {Object} the target object extended by copies of additional properties from defaultObj. 
         * @description Creates a recursive copy by value of additional properties from defaultObj and exdtends properties of targetObj. 
         */
        _Global.copyMissingMembersByValue = function copyMissingMembersByValue(targetObj, defaultObj) {
            if (typeof defaultObj === "object") {
                if (typeof targetObj === "undefined") {
                    return copyByValue(defaultObj);
                } 
                for (var key in defaultObj) {
                    if (defaultObj.hasOwnProperty(key)) {
                        if (typeof targetObj[key] === "undefined") {
                            var v = defaultObj[key];
                            targetObj[key] = (typeof v === "object") ? copyByValue(v) : v;
                        }
                    }
                }
            }
            return targetObj;
        }

        _Global.bindResource = function (element, resourceName) {
            Log.call(Log.l.u2);
            if (element) {
                element.textContent = getResourceText(resourceName);
            }
            Log.ret(Log.l.u2);
        }

        /** 
         * @function jsonParse
         * @param {string} text - The text to parse. 
         * @global
         * @returns {Object} An JSON object parsed from text or null if the test param is invalid. 
         * @description Use this function to eliminate bad characters before parsing JSON. 
         */
        _Global.jsonParse = function(text) {
            if (text && typeof text === "string") {
                //var cleanText = text.replace(/\x1a/g, "?");
                var cleanText = _Global.stripControlCodes(text);
                return JSON.parse(cleanText);
            } else {
                return null;
            }
        }

        _Global.formatFloat = function (num, decDigits, sepDecimal, sepThousand) {
            decDigits = decDigits || 0;
            if (AppData && typeof AppData.getLanguageId === "function" && AppData.getLanguageId() === 1033) {
                sepDecimal = sepDecimal || ".";
                sepThousand = sepThousand || ",";
            } else {
                sepDecimal = sepDecimal || ",";
                sepThousand = sepThousand || ".";
            }
            var sign;
            if (num < 0) {
                num = -num;
                sign = -1;
            } else {
                sign = 1;
            }
            var ret = "";
            var part = "";
            if (num !== Math.floor(num)) { // decimal values present
                if (decDigits > 0) {
                    var decPart = (num - Math.floor(num)) * Math.pow(10, decDigits);
                    part = Math.round(decPart).toString(); // transforms decimal part into integer (rounded)
                    if (part.length > decDigits) {
                        ret = sepDecimal + part.substr(1);
                        num = Math.round(num);
                    } else {
                        while (part.length < decDigits) {
                            part = "0" + part;
                        }
                        ret = sepDecimal + part;
                        num = Math.floor(num);
                    }
                } else {
                    num = Math.round(num);
                }
            } // end of decimal part
            if (num === 0) {
                ret = "0" + ret;
            } else while (num > 0) {// integer part
                part = (num - Math.floor(num/1000)*1000).toString(); // part = three less significant digits
                num = Math.floor(num/1000);
                if (num > 0) {
                    while (part.length < 3) { // 123.023.123  if sepMilhar = '.'
                        part = "0" + part; // 023
                    }
                }
                ret = part + ret;
                if (num > 0) {
                    ret = sepThousand + ret;
                }
            }
            if (sign < 0) {
                ret = '-' + ret;
            }
            return ret;
        }

        //27.12.2016 generate the string date
        _Global.getDateObject = function (dateData) {
            var ret;
            if (dateData) {
                var dateString = dateData.replace("\/Date(", "").replace(")\/", "");
                var milliseconds = parseInt(dateString) - AppData.appSettings.odata.timeZoneAdjustment * 60000;
                ret = new Date(milliseconds);
            } else {
                ret = new Date();
            }
            return ret;
        };

        //03.01.2016 convert Date() to String
        _Global.getDateData = function (dateObj) {
            if (!dateObj) {
                dateObj = new Date();
            }
            var milliseconds = dateObj.getTime() + AppData.appSettings.odata.timeZoneAdjustment * 60000;
            var dateString = milliseconds.toString();
            return "/Date(" + dateString + ")/";
        };

        //22.06.2018 convert Date() to an ISO date string for compatibility to procedure call parameters
        _Global.getDateIsoString = function (value) {
            var year = value.getFullYear();
            var month = value.getMonth() + 1;
            var day = value.getDate();
            return year.toString() + "-" + (month <= 9 ? "0" + month.toString() : month.toString()) + "-" + (day <= 9 ? "0" + day.toString() : day.toString());
        }

    });
})();



/**
 * Use the methods and properties in this namespace for application control.
 * @namespace Application
 */

// alert box via Flyout
(function () {
    "use strict";

    WinJS.Namespace.define("Application", {
        _alertHandler: null,
        /**
         * @property {function} alertHandler - Read/Write
         * @memberof Application
         * @description Retrieves or sets the handler function for interactive user notification alert box.
         */
        alertHandler: {
            get: function() {
                return Application._alertHandler;
            },
            set: function(aHandler) {
                Application._alertHandler = aHandler;
            }
        },
        _initAlert: function () {
            Log.call(Log.l.trace, "Application.", "");
            var alertFlyout = document.querySelector("#alertFlyout");
            if (alertFlyout) {
                WinJS.Resources.processAll(alertFlyout).then(function() {
                    var okButton = document.querySelector("#okButton");
                    if (okButton) {
                        okButton.addEventListener("click", function (event) {
                            Application._closeAlert();
                            if (typeof Application.alertHandler === "function") {
                                Application.alertHandler(true);
                                Application.alertHandler = null;
                            }
                        }, false);
                    }
                    var cancelButton = document.querySelector("#cancelButton");
                    if (cancelButton) {
                        cancelButton.addEventListener("click", function (event) {
                            Application._closeAlert();
                            if (typeof Application.alertHandler === "function") {
                                Application.alertHandler(false);
                                Application.alertHandler = null;
                            }
                        }, false);
                    }
                });
            }
            Log.ret(Log.l.trace);
        },
        _closeAlert: function () {
            Log.call(Log.l.trace, "Application.", "");
            var alertFlyout = document.querySelector("#alertFlyout");
            if (alertFlyout && alertFlyout.winControl) {
                var alertText = document.querySelector("#alertText");
                if (alertText) {
                    alertText.textContent = "";
                }
                alertFlyout.winControl.hide();
            }
            Log.ret(Log.l.trace);
        },
        /**
         * @memberof Application
         * @function alert
         * @param {string} text - Message box text
         * @param {function} handler - Handler function(boolean) to be called.
         * @description Implements the alert box functionality. The handler function is called with true value by Ok button of the message box.
         */
        alert: function (text, handler, anchor) {
            Log.call(Log.l.trace, "Application.", "text=" + text);
            function schedule(f, arg, priority) {
                WinJS.Utilities.Scheduler.schedule(function () {
                    f(arg);
                }, priority, null, "confirm");
            }
            var run;
            var ret = new WinJS.Promise(
                function (c, e, p) {
                    var priority = WinJS.Utilities.Scheduler.currentPriority;
                    run = function () {
                        var alertFlyoutShown = false;
                        var alertFlyout = document.querySelector("#alertFlyout");
                        if (alertFlyout && alertFlyout.winControl) {
                            var alertText = alertFlyout.querySelector("#alertText");
                            if (alertText) {
                                alertText.textContent = text;
                            }
                            Application.alertHandler = function (value) {
                                if (typeof handler === "function") {
                                    handler(value);
                                }
                                schedule(c, value, priority);
                            }
                            var cancelButton = alertFlyout.querySelector("#cancelButton");
                            if (cancelButton && cancelButton.style) {
                                cancelButton.style.display = "none";
                            }
                            var okButton = alertFlyout.querySelector("#okButton");
                            if (okButton) {
                                if (!anchor) {
                                    anchor = (AppBar && AppBar.scope && AppBar.scope.element) ? AppBar.scope.element : document.body;
                                }
                                alertFlyout.winControl.show(anchor);
                                alertFlyoutShown = true;
                            }
                        }
                        if (!alertFlyoutShown) {
                            var err = { status: 501, statusText: "no alertFlyout found" };
                            schedule(e, err, priority);
                        }
                    }
                    schedule(run, this, priority);
                }
            );
            Log.ret(Log.l.trace);
            return ret;
        },
        /**
         * @memberof Application
         * @function confirm
         * @param {string} text - Message box text
         * @param {function} handler - Handler function(boolean) to be called.
         * @description Implements the alert box functionality. The handler function is called with true value by Ok and false by the Cancel button of the message box.
         */
        confirm: function (text, handler, anchor) {
            var ret = null;
            Log.call(Log.l.trace, "Application.", "text=" + text);
            function cancel() {
                if (ret && typeof ret.cancel === "function") {
                    ret.cancel();
                }
            }
            function schedule(f, arg, priority) {
                WinJS.Utilities.Scheduler.schedule(function () {
                    f(arg);
                }, priority, null, "confirm");
            }
            var run;
            ret = new WinJS.Promise(
                function (c, e, p) {
                    var priority = WinJS.Utilities.Scheduler.currentPriority;
                    run = function () {
                        var alertFlyoutShown = false;
                        var alertFlyout = document.querySelector("#alertFlyout");
                        if (alertFlyout && alertFlyout.winControl) {
                            var alertText = alertFlyout.querySelector("#alertText");
                            if (alertText) {
                                alertText.textContent = text;
                            }
                            Application.alertHandler = function (value) {
                                if (typeof handler === "function") {
                                    handler(value);
                                }
                                if (value) {
                                    schedule(c, value, priority);
                                } else {
                                    schedule(cancel, value, priority);
                                }
                            }
                            var cancelButton = alertFlyout.querySelector("#cancelButton");
                            if (cancelButton && cancelButton.style) {
                                cancelButton.style.display = "";
                            }
                            var okButton = alertFlyout.querySelector("#okButton");
                            if (okButton) {
                                if (!anchor) {
                                    anchor = (AppBar && AppBar.scope && AppBar.scope.element) ? AppBar.scope.element : document.body;
                                }
                                alertFlyout.winControl.show(anchor);
                                alertFlyoutShown = true;
                            }
                        }
                        if (!alertFlyoutShown) {
                            var err = { status: 501, statusText: "no alertFlyout found" };
                            schedule(e, err, priority);
                        }
                    }
                    schedule(run, this, priority);
                }
            );
            Log.ret(Log.l.trace);
            return ret;
        }
    });
})();

/** 
 * @function alert
 * @param {string} text - Message box text
 * @param {function} handler - Handler function(boolean) to be called.
 * @global
 * @description Overrides the alert box functionality. The handler function is called with true value by Ok button of the message box.
 */
function alert(text, handler) {
    return Application.alert(text, handler);
}

/** 
 * @function confirm
 * @param {string} text - Message box text
 * @param {function} handler - Handler function(boolean) to be called.
 * @global
 * @description Overrides the confirm box functionality. The handler function is called with true value by Ok and false by the Cancel button of the message box.
 */
function confirm(text, handler) {
    return Application.confirm(text, handler);
}


function getDatum() {
    // current date
    var date = new Date();
    // getMonth() returns an integer between 0 and 11. 0 corresponds to January, 11 to December.
    var month = date.getMonth() + 1;
    var monthStr = month.toString();
    if (month >= 1 && month <= 9) {
        monthStr = "0" + monthStr;
    }
    var day = date.getDate();
    var dayStr = day.toString();
    if (day >= 1 && day <= 9) {
        dayStr = "0" + dayStr;
    }
    var year = date.getFullYear();
    var yearStr = year.toString();
    // string result for date
    return dayStr + "." + monthStr + "." + yearStr;
}


function getClock() {
    // current date
    var date = new Date();
    var hour = date.getHours();
    var hourStr = hour.toString();
    if (hour >= 0 && hour <= 9) {
        hourStr = "0" + hourStr;
    }
    var minute = date.getMinutes();
    var minuteStr = minute.toString();
    if (minute >= 0 && minute <= 9) {
        minuteStr = "0" + minuteStr;
    }
    return hourStr + ":" + minuteStr;
}

/** 
 * @function fireEvent
 * @global
 * @param {string} eventName - Name of event
 * @param {Object} element - A HTML element object
 * @returns {boolean} The return value is true if event is cancelable and at least one of the event handlers which handled this event called event.preventDefault(). Otherwise it returns false.
 * @description Use this function to fire an event of given name to the given element.
 */
function fireEvent(eventName, element) {
    if (!element) {
        element = document;
    }
    // Gecko-style approach (now the standard) takes more work
    var eventClass;

    // Different events have different event classes.
    // If this switch statement can't map an eventName to an eventClass,
    // the event firing is going to fail.
    switch (eventName) {
        case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
        case "mousedown":
        case "mouseup":
            eventClass = "MouseEvents";
            break;

        case "focus":
        case "change":
        case "blur":
        case "select":
            eventClass = "HTMLEvents";
            break;

        default:
            eventClass = "HTMLEvents";
            break;
    }
    // dispatch for firefox + others
    var evt = document.createEvent(eventClass);
    evt.initEvent(event, true, true); // event type,bubbling,cancelable
    return !element.dispatchEvent(evt);
}

/** 
 * @function utf8_encode
 * @global
 * @param {string} argString - Single byte string to encode
 * @returns {string} Encoded string.
 * @description Use this function to encode a single byte string to UTF-8 character set. For further informations read {@link http://locutus.io/php/xml/utf8_encode/ here}.
 */
function utf8_encode(argString) {
    //  discuss at: http://phpjs.org/functions/utf8_encode/ 
    // original by: Webtoolkit.info (http://www.webtoolkit.info/) 
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net) 
    // improved by: sowberry 
    // improved by: Jack 
    // improved by: Yves Sucaet 
    // improved by: kirilloid 
    // bugfixed by: Onno Marsman 
    // bugfixed by: Onno Marsman 
    // bugfixed by: Ulrich 
    // bugfixed by: Rafal Kukawski 
    // bugfixed by: kirilloid 
    //   example 1: utf8_encode('Kevin van Zonneveld'); 
    //   returns 1: 'Kevin van Zonneveld' 


    if (argString === null || typeof argString === 'undefined') {
        return '';
    }


    // .replace(/\r\n/g, "\n").replace(/\r/g, "\n"); 
    var string = (argString + '');
    var utftext = '',
      start, end, stringl = 0;


    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;


        if (c1 < 128) {
            end++;
        } else if (c1 > 127 && c1 < 2048) {
            enc = String.fromCharCode(
              (c1 >> 6) | 192, (c1 & 63) | 128
            );
        } else if ((c1 & 0xF800) !== 0xD800) {
            enc = String.fromCharCode(
              (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        } else {
            // surrogate pairs 
            if ((c1 & 0xFC00) !== 0xD800) {
                throw new RangeError('Unmatched trail surrogate at ' + n);
            }
            var c2 = string.charCodeAt(++n);
            if ((c2 & 0xFC00) !== 0xDC00) {
                throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
            }
            c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
            enc = String.fromCharCode(
              (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.slice(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }


    if (end > start) {
        utftext += string.slice(start, stringl);
    }


    return utftext;
}

/** 
 * @function getSubDocument
 * @global
 * @param {Object} embeddingElement - A HTML element embedding a SVG graphics document
 * @returns {Object} Embedded document.
 * @description Use this function to get access to an embedded SVG graphics document.
 *  For further informations read about {@link https://msdn.microsoft.com/en-us/library/hh772865.aspx getSVGDocument()}
 */
function getSubDocument(embeddingElement) {
    if (embeddingElement.nodeName === "svg" ||
        embeddingElement.nodeName === "SVG") {
        return embeddingElement;
    }
    if (embeddingElement.contentDocument) {
        return embeddingElement.contentDocument;
    } else {
        var subdoc = null;
        try {
            subdoc = embeddingElement.getSVGDocument();
        } catch (e) {
        }
        return subdoc;
    }
}

