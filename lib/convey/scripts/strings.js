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
        'WinJS/Core/_Base',
        'WinJS/Core/_BaseUtils'
    ], function resourcesInit(_Global, _Base, _BaseUtils) {

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

        if (WinJS.Utilities &&
            typeof WinJS.Utilities.isPhone === "undefined") {
            var isPhone = false;
            if (typeof navigator.userAgent === "string" &&
                navigator.userAgent.match(/Phone/i)) {
                isPhone = true;
            }
            WinJS.Utilities.isPhone = isPhone;
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
            var strings = _Global.strings;
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
         * @function equals
         * @param {*} a - value to compare to b. 
         * @param {*} b - value compared to a. 
         * @global
         * @returns {boolean} true if a and b are deeply equal, false otherwise.
         * @description  Compares two values of any type
         */
        _Global.equals = function equals( a, b ) {
            if (a === b) return true;

            var aStr = JSON.stringify(a);
            var bStr = JSON.stringify(b);

            return aStr === bStr;
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

        /** 
         * @function encodeURL
         * @param {string} text - The text to parse. 
         * @global
         * @returns {Object} full URL encoded string. 
         * @description Use this function to eliminate bad characters from URL component. 
         */
        _Global.encodeURL = function(text) {
            if (text && typeof text === "string") {
                //var cleanText = text.replace(/\x1a/g, "?");
                var cleanText = _Global.stripControlCodes(text);
                var uriComponent;
                var invalidChars;
                if (typeof encodeURIComponent === "function") {
                    uriComponent = encodeURIComponent(cleanText);
                    invalidChars = "!'()*-.";
                } else {
                    uriComponent = encodeURI(cleanText);
                    invalidChars = "!#$&'()*+,-./:;=?@";
                }
                var len = uriComponent.length;
                var ret = "";
                var prevPos = 0;
                for (var i = 0; i < len; i++) {
                    var pos = invalidChars.indexOf(uriComponent);
                    if (pos >= 0) {
                        var code = invalidChars.charCodeAt(pos);
                        var hex = "%" + code.toString(16).toUpperCase();
                        if (code === 39) {
                            // double-quote ''
                            hex += hex;
                        }
                        if (i - prevPos > 0) {
                            ret += uriComponent.substr(prevPos, i - prevPos);
                        }
                        ret += hex;
                        prevPos = i + 1;
                    }
                }
                if (prevPos > 0) {
                    ret += uriComponent.substr(prevPos);
                } else {
                    ret = uriComponent;
                }
                return ret;
            } else {
                return text;
            }
        },

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
                var milliseconds = parseInt(dateString);
                if (AppData.appSettings.odata.timeZoneAdjustment) {
                    milliseconds -= AppData.appSettings.odata.timeZoneAdjustment * 60000;
                }
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
            var milliseconds = dateObj.getTime();
            if (AppData.appSettings.odata.timeZoneAdjustment) {
                milliseconds += AppData.appSettings.odata.timeZoneAdjustment * 60000;
            }
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

        if ( typeof _Global.CustomEvent !== "function" ) {
            function CustomEvent ( event, params ) {
                params = params || { bubbles: false, cancelable: false, detail: null };
                var evt = document.createEvent( 'CustomEvent' );
                evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
                return evt;
            }
            _Global.CustomEvent = CustomEvent;
        }

        if (!_Global.URL || !_Global.URL.prototype || !('href' in _Global.URL.prototype)) {
          function URL(url, base) {
            if (!url)
              throw new TypeError('Invalid argument');

            var doc = document.implementation.createHTMLDocument('');
            if (base) {
              var baseElement = doc.createElement('base');
              baseElement.href = base;
              doc.head.appendChild(baseElement);
            }
            var anchorElement = doc.createElement('a');
            anchorElement.href = url;
            doc.body.appendChild(anchorElement);

            if (anchorElement.protocol === ':' || !/:/.test(anchorElement.href))
              throw new TypeError('Invalid URL');

            Object.defineProperty(this, '_anchorElement', {value: anchorElement});
          }

          URL.prototype = {
            toString: function() {
              return this.href;
            },

            get href() {
              return this._anchorElement.href;
            },
            set href(value) {
              this._anchorElement.href = value;
            },

            get protocol() {
              return this._anchorElement.protocol;
            },
            set protocol(value) {
              this._anchorElement.protocol = value;
            },

            // NOT IMPLEMENTED
            // get username() {
            //   return this._anchorElement.username;
            // },
            // set username(value) {
            //   this._anchorElement.username = value;
            // },

            // get password() {
            //   return this._anchorElement.password;
            // },
            // set password(value) {
            //   this._anchorElement.password = value;
            // },

            // get origin() {
            //   return this._anchorElement.origin;
            // },

            get host() {
              return this._anchorElement.host;
            },
            set host(value) {
              this._anchorElement.host = value;
            },

            get hostname() {
              return this._anchorElement.hostname;
            },
            set hostname(value) {
              this._anchorElement.hostname = value;
            },

            get port() {
              return this._anchorElement.port;
            },
            set port(value) {
              this._anchorElement.port = value;
            },

            get pathname() {
              return this._anchorElement.pathname;
            },
            set pathname(value) {
              this._anchorElement.pathname = value;
            },

            get search() {
              return this._anchorElement.search;
            },
            set search(value) {
              this._anchorElement.search = value;
            },

            get hash() {
              return this._anchorElement.hash;
            },
            set hash(value) {
              this._anchorElement.hash = value;
            }
          };

          var oldURL = _Global.URL || _Global.webkitURL || _Global.mozURL;

          URL.createObjectURL = function(blob) {
            return oldURL.createObjectURL.apply(oldURL, arguments);
          };

          URL.revokeObjectURL = function(url) {
            return oldURL.revokeObjectURL.apply(oldURL, arguments);
          };

          Object.defineProperty(URL.prototype, 'toString', {enumerable: false});

          _Global.URL = URL;
        }

        if (!_Global.String.prototype.endsWith) {
            _Global.String.prototype.endsWith = function(searchString, position) {
                var subjectString = this.toString();
                if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                    position = subjectString.length;
                }
                position -= searchString.length;
                var lastIndex = subjectString.indexOf(searchString, position);
                return lastIndex !== -1 && lastIndex === position;
            };
        }

        if (!_Global.String.prototype.startsWith) {
            _Global.String.prototype.startsWith = function(searchString, position) {
                position = position || 0;
                return this.indexOf(searchString, position) === position;
            };
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
                            var handler = Application.alertHandler;
                            Application.alertHandler = null;
                            Application._closeAlert();
                            if (typeof handler === "function") {
                                handler(true);
                            }
                        }, false);
                    }
                    var cancelButton = document.querySelector("#cancelButton");
                    if (cancelButton) {
                        cancelButton.addEventListener("click", function (event) {
                            var handler = Application.alertHandler;
                            Application.alertHandler = null;
                            Application._closeAlert();
                            if (typeof handler === "function") {
                                handler(false);
                            }
                        }, false);
                    }
                    alertFlyout.addEventListener("beforehide", function(ev) {
                        var handler = Application.alertHandler;
                        Application.alertHandler = null;
                        if (typeof handler === "function") {
                            handler(false);
                        }
                    });
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
        confirm: function (text, handler, anchor, className) {
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
                                if (WinJS.Utilities.hasClass(alertText, className)) {
                                    WinJS.Utilities.removeClass(alertText, className);
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
                            if (alertText && alertText.style && className) {
                                if (!WinJS.Utilities.hasClass(alertText, className)) {
                                    WinJS.Utilities.addClass(alertText, className);
                                }
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
        _initModal: function () {
            Log.call(Log.l.trace, "Application.", "");
            var confirmModal = document.querySelector("#confirmModal");
            if (confirmModal) {
                WinJS.Resources.processAll(confirmModal).then(function () {
                    confirmModal.addEventListener("beforehide", function (ev) {
                        var handler = Application.alertHandler;
                        Application.alertHandler = null;
                        if (typeof handler === "function") {
                            var result = ev && ev.detail && ev.detail.result;
                            handler(result === WinJS.UI.ContentDialog.DismissalResult.primary);
                        }
                    });
                });
            }
            Log.ret(Log.l.trace);
        },
        _closeModal: function () {
            Log.call(Log.l.trace, "Application.", "");
            var confirmModal = document.querySelector("#confirmModal");
            if (confirmModal && confirmModal.winControl) {
                var confirmText = document.querySelector("#confirmText");
                if (confirmText) {
                    confirmText.textContent = "";
                }
                confirmModal.winControl.hide();
            }
            Log.ret(Log.l.trace);
        },
        /**
         * @memberof Application
         * @function confirmModal
         * @param {string} title - Dialog box box title
         * @param {string} text - Dialog box box text
         * @param {string} primaryCommandText - Primary command text
         * @param {string} secondaryCommandText - Secondary command text
         * @param {function} handler - Handler function(boolean) to be called.
         * @description Implements the alert box functionality. The handler function is called with true value by Ok and false by the Cancel button of the message box.
         */
        confirmModal: function (title, text, primaryCommandText, secondaryCommandText, handler, className) {
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
            function init() {
                var confirmModal = document.querySelector("#confirmModal");
                if (confirmModal && confirmModal.winControl) {
                    confirmModal.style.display = "";
                    confirmModal.winControl.hide();
                }
            }
            init();
            var run;
            ret = new WinJS.Promise(
                function (c, e, p) {
                    var priority = WinJS.Utilities.Scheduler.currentPriority;
                    run = function () {
                        var confirmModalShown = false;
                        var confirmModal = document.querySelector("#confirmModal");
                        if (confirmModal && confirmModal.winControl) {
                            confirmModal.winControl.title = title;
                            var confirmText = confirmModal.querySelector("#confirmText");
                            if (confirmText) {
                                confirmText.textContent = text;
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
                                if (WinJS.Utilities.hasClass(confirmText, className)) {
                                    WinJS.Utilities.removeClass(confirmText, className);
                                }
                            }
                            confirmModal.winControl.primaryCommandText = primaryCommandText;
                            confirmModal.winControl.secondaryCommandText = secondaryCommandText;
                            if (primaryCommandText) {
                                confirmModal.winControl.primaryCommandDisabled = false;
                                if (secondaryCommandText) {
                                    confirmModal.winControl.secondaryCommandDisabled = false;
                                } else {
                                    confirmModal.winControl.secondaryCommandDisabled = true;
                                }
                                if (confirmText && confirmText.style && className) {
                                    if (!WinJS.Utilities.hasClass(confirmText, className)) {
                                        WinJS.Utilities.addClass(confirmText, className);
                                    }
                                }
                                confirmModal.winControl.show();
                                confirmModalShown = true;
                            } else if (secondaryCommandText) {
                                confirmModal.winControl.primaryCommandDisabled = true;
                                confirmModal.winControl.secondaryCommandDisabled = false;
                                if (confirmText && confirmText.style && className) {
                                    if (!WinJS.Utilities.hasClass(confirmText, className)) {
                                        WinJS.Utilities.addClass(confirmText, className);
                                    }
                                }
                                confirmModal.winControl.show();
                                confirmModalShown = true;
                            } else {
                                confirmModal.winControl.primaryCommandDisabled = true;
                                confirmModal.winControl.secondaryCommandDisabled = true;
                            }
                        }
                        if (!confirmModalShown) {
                            var err = { status: 501, statusText: "no confirmModal found" };
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
function alert(text, handler, anchor) {
    return Application.alert(text, handler, anchor);
}

/** 
 * @function confirm
 * @param {string} text - Message box text
 * @param {function} handler - Handler function(boolean) to be called.
 * @global
 * @description Overrides the confirm box functionality. The handler function is called with true value by Ok and false by the Cancel button of the message box.
 */
function confirm(text, handler, anchor, className) {
    return Application.confirm(text, handler, anchor, className);
}

/** 
 * @function confirm
 * @param {string} text - Message box text
 * @param {function} handler - Handler function(boolean) to be called.
 * @global
 * @description Overrides the confirm box functionality. The handler function is called with true value by Ok and false by the Cancel button of the message box.
 */
function confirmModal(title, text, primaryCommandText, secondaryCommandText, handler, className) {
    return Application.confirmModal(title, text, primaryCommandText, secondaryCommandText, handler, className);
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
 * @function utf8_decode
 * @global
 * @param {string} str - UTF-8 string to decode
 * @returns {Uint8Array} Decoded Byte array.
 * @description Use this function to decode a UTF-8 string to a byte array.
 */
function utf8_decode(str) {
    // TODO(user): Use native implementations if/when available
    var out = [], p = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 128) {
            out[p++] = c;
        } else if (c < 2048) {
            out[p++] = (c >> 6) | 192;
            out[p++] = (c & 63) | 128;
        } else if (
            ((c & 0xFC00) === 0xD800) && (i + 1) < str.length &&
                ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
            // Surrogate Pair
            c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
            out[p++] = (c >> 18) | 240;
            out[p++] = ((c >> 12) & 63) | 128;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        } else {
            out[p++] = (c >> 12) | 224;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        }
    }
    return new Uint8Array(out);
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

/** 
 * @function getQueryStringParameters
 * @global
 * @param {String} url - String containing query string after question mark with URL encoded key-value pairs
 * @returns {Object} Key/value object.
 * @description Use this function to get an object containing the query parameter values
 */
function getQueryStringParameters(url) {
    var query = "";
    if (url) {
        if(url.split("?").length > 0 ) {
            query = url.split("?")[1];
        }
    } else if (typeof window === "object") {
        query = window.location && window.location.search && window.location.search.substring(1);
    }
    if (!query) {
        return {};
    }
    return (/^[?#]/.test(query) ? query.slice(1) : query).split("&").reduce(function(params, param) {
        var keyValue = param.split("=");
        params[keyValue[0]] = keyValue[1] ? decodeURIComponent(keyValue[1].replace(/\+/g, " ")) : "";
        return params;
    }, { });
};

/** 
 * @function createQueryStringFromParameters
 * @global
 * @param {Object} params - Key/value object. 
 * @returns {String} String containing query string after question mark with URL encoded key-value pairs
 * @description Use this function to get a query string containing the query parameter values
 */
function createQueryStringFromParameters(params) {
    var queryString = "";
    if (params) {
        for (var prop in params) {
            if (params.hasOwnProperty(prop) && prop !== "") {
                if (queryString) {
                    queryString += "&";
                }
                queryString += prop + "=" + params[prop];
            }
        }
    }
    return queryString;
}
