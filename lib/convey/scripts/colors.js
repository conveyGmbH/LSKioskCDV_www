// Namespace Colors define App color theme
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/navigator.js" />
/// <reference path="../../../lib/convey/scripts/dataService.js" />

/**
 * This namespace provides classes, methods and properties for customizing color settings of the cascading style classes used by the app's UI default HTML elements.
 * @namespace Colors
 */

(function () {
    "use strict";

    var getBaseRef = function() {
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i] && scripts[i].src) {
                var pos = scripts[i].src.indexOf("lib/convey/scripts/colors.js");
                if (pos > 0) {
                    return scripts[i].src.substr(0, pos);
                }
            }
        }
        return null;
    }
    var newBaseHref = getBaseRef();

    var include = function(file, fnc) {
        var n, s, l, e = {
            setNext: function(next) {
                return n = next;
            },
            load: function() {
                if (s && l) {
                    s.removeEventListener("load", l);
                    l = null;
                }
                if (n && typeof n.next === "function") {
                    window.setTimeout(function() {
                        n.next();
                    }, 0);
                }
            },
            next: function() {
                if (typeof fnc === "function") {
                    var r = fnc() || include();
                    if (r && typeof r.setNext === "function" &&
                        n && typeof n.next === "function") {
                        r.setNext(n);
                        n = null;
                    }
                } 
            },
            then: function(f) {
                n = include(null, f);
                return n;
            }
        }
        if (typeof file === "string") {
            window.setTimeout(function() {
                s = document.createElement("SCRIPT");
                s.type = "text/javascript";
                s.src = newBaseHref + file;
                l = e.load;
                s.addEventListener("load", l);
                document.head.appendChild(s);
            }, 0);
        } else if (!fnc) {
            window.setTimeout(function() {
                e.load();
            }, 0);
        }
        return e;
    };
    var includeJoined = function(values) {
        var e = include(null, function() {
            return include();
        });
        var pending = values.length;
        values.forEach(function(value) {
            value.then(function() {
                if (--pending === 0) {
                    window.setTimeout(function() {
                        e.load();
                    }, 0);
                }
            });
        });
        return e;
    }

    function checkForIe() {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }
        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }
        // all the other browsers
        return false;
    }

    var msLegacy = checkForIe();

    if (msLegacy !== false) {
        include('lib/convey/scripts/css-vars-ponyfill.min.js').then(function() {
            cssVars({
                watch: true
            });
        });
    }

    WinJS.Namespace.define("Colors", {
        /**
         * @function resizeImageBase64
         * @memberof Colors
         * @param {string} strBase64 - Base-64 encoded image data. 
         * @param {string} contentType - Content type of the image. 
         * @param {number} maxSize - The maximum width or height of the returned image. 
         * @param {number} [quality] - Optional compression quality of returned image in percent [1..100]. 
         * @param {number} [minRatio] - Optional minimal scale factor for down-scaling.
         * @description Use this function to resize an image. 
         */
        resizeImageBase64: function (strBase64, contentType, maxSize, quality, minRatio) {
            return new WinJS.Promise(function (complete, error) {
                var imageData = ""; //"data:" + contentType + ";base64," + strBase64;
                // compare data:image
                var dataURLMimeType = "data:image/jpeg;base64,";
                if (strBase64.substr(0, dataURLMimeType.length) === dataURLMimeType) {
                    imageData = strBase64;
                } else {
                    imageData = "data:image/jpeg;base64," + strBase64;
                }
                var image = new Image();
                image.onload = function () {
                    try {
                        var ratio = Math.min(maxSize / this.width, maxSize / this.height);
                        if (ratio < 1) {
                            if (minRatio) {
                                var exp = Math.floor(Math.log(1 / ratio) / Math.LN2);
                                ratio = 1 / (2 ^ exp);
                                if (ratio < minRatio) {
                                    ratio = minRatio;
                                }
                            }
                            var imageWidth = ratio * this.width;
                            var imageHeight = ratio * this.height;
                            var canvas = document.createElement('canvas');

                            canvas.width = imageWidth;
                            canvas.height = imageHeight;

                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(this, 0, 0, imageWidth, imageHeight);

                            // The resized file ready for upload
                            var finalFile;
                            if (contentType === "image/jpeg" && quality > 0 && quality <= 100) {
                                finalFile = canvas.toDataURL(contentType, quality / 100);
                            } else {
                                finalFile = canvas.toDataURL(contentType);
                            }

                            // Remove the prefix such as "data:" + contentType + ";base64," , in order to meet the Cordova API.
                            var arr = finalFile.split(",");
                            var newStr = finalFile.substr(arr[0].length + 1);
                            complete(newStr);
                        } else {
                            complete(null);
                        }
                    } catch (errorResponse) {
                        Log.print(Log.l.error, "resizeImage exception: " + AppData.getErrorMsgFromResponse(errorResponse));
                        complete(null);
                    }
                };
                image.src = imageData;
            });
        },
        _winRingSvg: '<svg class="win-ring-svg" viewBox="0 0 60 60"><circle class="win-ring-circle" cx="30" cy="30" r="25" /></svg>',
        _winRingStyle: "@keyframes win-ring-turn { 50% { transform: rotate(180deg) } 100% { transform: rotate(720deg) } }" +
                       ".win-ring-svg { animation: win-ring-turn 2s linear infinite; }" +
                       "@keyframes win-ring-stroke { 50% { stroke-dashoffset: 0 } 100%, 100% { stroke-dashoffset: 158 } }" + 
                       ".win-ring-circle { animation: win-ring-stroke 2s ease-out infinite; fill: none; stroke-dasharray: 65, 158; stroke-dashoffset: 158; stroke-linecap: round; stroke-width: 4; }",
        prepareWinRing: function (element) {
            if (element) {
                var resources = Resources && Resources.get();
                if (!resources) {
                    var winRings = element.querySelectorAll("progress.win-progress-ring, progress.win-ring");
                    if (winRings && winRings.length > 0) {
                        for (var i = 0; i < winRings.length; i++) {
                            var winRing = winRings[i];
                            if (winRing && winRing.style) {
                                var winRingDiv = document.createElement("div");
                                winRingDiv.setAttribute("class", winRing.getAttribute("class"));
                                var dataWinBind = winRing.getAttribute("data-win-bind");
                                if (winRing.id) {
                                    winRingDiv.id = winRing.id;
                                }
                                if (winRingDiv.style) {
                                    winRingDiv.style.background = "none";
                                }
                                if (dataWinBind) {
                                    winRingDiv.setAttribute("data-win-bind", dataWinBind);
                                }
                                winRingDiv.innerHTML = Colors._winRingSvg;
                                if (winRingDiv.firstElementChild && winRingDiv.firstElementChild.firstElementChild) {
                                    winRingDiv.firstElementChild.firstElementChild.setAttribute("stroke", Colors.accentColor);
                                }
                                winRing.parentElement.replaceChild(winRingDiv, winRing);
                            }
                        }
                        var prevStyles = document.querySelectorAll("style[id=\"winRingStyle\"]");
                        if (!prevStyles || !prevStyles.length) {
                            var heads = document.getElementsByTagName("head");
                            if (heads && heads[0]) {
                                var style = document.createElement('style');
                                style.id = "winRingStyle";
                                style.textContent = Colors._winRingStyle;
                                heads[0].appendChild(style);
                            }
                        }
                    }
                }
            }
        },
        _a: null,
        _baseHref: null,
        corsAwareCssRuleAccess: true,
        loadCSSfile: function (filename) {
            var ret;
            Log.call(Log.l.trace, "Colors.", "filename=" + filename);
            if (!Colors.corsAwareCssRuleAccess) {
                var heads = document.getElementsByTagName("head");
                if (heads && heads[0]) {
                    var fileRef = document.createElement("link");
                    fileRef.setAttribute("rel", "stylesheet");
                    fileRef.setAttribute("type", "text/css");
                    fileRef.setAttribute("href", filename);
                    var prevRefs = document.querySelectorAll("link[href=\"" + filename + "\"]");
                    if (prevRefs && prevRefs.length > 0) {
                        heads[0].removeChild(prevRefs[0]);
                    }
                    heads[0].appendChild(fileRef);
                }
                ret = WinJS.Promise.as();
            } else {
                var url, rootPath, path, pos;
                var server = filename.split("//")[1];
                if (server) {
                    server = server.split("/")[0];
                    var protocol = filename.split(server)[0];
                    rootPath = protocol + server + "/";
                    path = filename.split(server)[1];
                    pos = path.lastIndexOf("/");
                    if (pos >= 0) {
                        path = path.substr(0, pos + 1);
                    }
                    url = filename;
                } else {
                    if (!Colors._baseHref) {
                        Colors._baseHref = getBaseRef();
                    }
                    if (!Colors._a) {
                        Colors._a = document.createElement("a");
                        Colors._a.href = Colors._baseHref;
                    }
                    function abs(uri) {
                        Colors._a.href = uri;
                        return Colors._a.href;
                    }
                    rootPath = abs(Colors._baseHref);
                    path = filename;
                    pos = path.lastIndexOf("/");
                    if (pos >= 0) {
                        path = path.substr(0, pos + 1);
                    }
                    url = abs(filename);
                }
                ret = WinJS.xhr({ url: url }).then(function xhrSuccess(res) {
                    try {
                        if (res && typeof res.responseText === "string") {
                            var rootPathReplace = "$1" + rootPath + path;
                            var responseText = res.responseText
                                .replace(/(url\([ "]*)/g, rootPathReplace);
                            var heads = document.getElementsByTagName("head");
                            if (heads && heads[0]) {
                                var style = document.createElement('style');
                                style.id = filename;
                                style.textContent = responseText;
                                var prevStyles = document.querySelectorAll("style[id=\"" + filename + "\"]");
                                if (prevStyles && prevStyles.length > 0) {
                                    heads[0].removeChild(prevStyles[0]);
                                }
                                heads[0].appendChild(style);
                            }
                        }
                    } catch (exception) {
                        Log.ret(Log.l.error, "Error loading CSS file " + filename + " Exception:" + JSON.stringify(exception));
                        return WinJS.Promise.as();
                    }
                    return WinJS.Promise.as();
                }, function (err) {
                    Log.print(Log.l.error, "Error loading CSS file " + filename + " Error:" + AppData.getErrorMsgFromResponse(err));
                    return WinJS.Promise.as();
                });
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        /**
         * @function changeCSS
         * @memberof Colors
         * @param {string} selector - A CSS rule selector. 
         * @param {string} attribute - A style attribute to be changed. 
         * @param {string} value - A new value to be set for the attribute. 
         * @description Use this function to change a CSS attribute. 
         *  Only exisiting attribute values in the rule set can be changed.
         *  So, you need to define a default CSS rule for the given selector and attribute e.g. in a style definition file before calling this function.
         */
        changeCSS: function (selector, attribute, value) {
            Log.call(Log.l.u1, "Colors.", "selector=" + selector + " attribute=" + attribute + " value=" + value);
            var cssRules;
            var strValue;
            if (!value) {
                strValue = "";
            } else if (typeof value === "string") {
                strValue = value;
            } else {
                strValue = value.toString();
            }
            var prevValue = null;
            for (var i = document.styleSheets.length - 1; i >= 0; i--) {
                try {
                    var sheet = document.styleSheets[i];
                    if (typeof sheet === "object" && !sheet.href) {
                        if (sheet["rules"]) {
                            cssRules = "rules";
                        } else if (sheet["cssRules"]) {
                            cssRules = "cssRules";
                        } else if (sheet["ownerRule"]) {
                            cssRules = "ownerRule";
                        } else {
                            cssRules = null;
                        }
                    } else {
                        cssRules = null;
                    }
                    if (cssRules) {
                        var rules = sheet[cssRules];
                        if (rules && rules.length > 0) for (var j = rules.length - 1; j >= 0; j--) {
                            var rule = rules[j];
                            if (rule.selectorText === selector && rule.style) {
                                prevValue = rule.style[attribute];
                                if (typeof prevValue === "string" && prevValue.length > 0) {
                                    if (prevValue.substr(0, 3) === "rgb" &&
                                        strValue.substr(0, 1) === "#" &&
                                        Colors.rgbStr2hex(prevValue) === strValue.substr(0, 7) ||
                                        strValue.substr(0, 3) === "rgb" &&
                                        prevValue.substr(0, 1) === "#" &&
                                        Colors.rgbStr2hex(strValue) === prevValue ||
                                        prevValue === strValue) {
                                        Log.print(Log.l.u1, "extra ignored: " + selector + " { " + attribute + ": " + prevValue + " == " + strValue + " }");
                                    } else {
                                        rule.style[attribute] = strValue;
                                        var newValue = rule.style[attribute];
                                        if (newValue.substr(0, 3) === "rgb" &&
                                            strValue.substr(0, 1) === "#" &&
                                            Colors.rgbStr2hex(newValue) === strValue.substr(0, 7) ||
                                            strValue.substr(0, 3) === "rgb" &&
                                            newValue.substr(0, 1) === "#" &&
                                            Colors.rgbStr2hex(strValue) === newValue ||
                                            newValue === strValue) {
                                            Log.print(Log.l.trace, "changed style: " + selector + " { " + attribute + ": " + prevValue + " -> " + strValue + " }");
                                        } else {
                                            if (typeof sheet.addRule === "function") {
                                                var styleText = attribute + ":" + strValue;
                                                sheet.addRule(selector, styleText);
                                            } else if (typeof sheet.insertRule === "function") {
                                                var ruleText = selector + " { " + attribute + ":" + strValue + "; }";
                                                sheet.insertRule(ruleText, rules.length);
                                            }
                                            Log.print(Log.l.trace, "added style: " + selector + " { " + attribute + ": " + prevValue + " -> " + strValue + " }");
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if (prevValue) {
                        break;
                    }
                } catch (err) {
                    Log.print(Log.l.error, "exception occured");
                }
            }
            Log.ret(Log.l.u1);
        },
        cutHex: function (h) {
            return (h && h.charAt(0) === "#") ? h.substring(1, 7) : h;
        },
        /**
         * @function hex2rgb
         * @memberof Colors
         * @param {string} color - A hexadecimal color value in the format "#rrggbb". 
         * @returns {Object} A color value object with number values 0-255 for each color part in the format:
         * <pre>
            {
                r: red,
                g: green,
                b: blue
            }
           </pre> 
         * @description Use this function to convert color values from hex string format into r, g, b number values.
         */
        hex2rgb: function (color) {
            var r, g, b;
            Log.call(Log.l.u2, "Colors.", "color=" + color);
            if (color) {
                r = parseInt((Colors.cutHex(color)).substring(0, 2), 16);
                g = parseInt((Colors.cutHex(color)).substring(2, 4), 16);
                b = parseInt((Colors.cutHex(color)).substring(4, 6), 16);
            } else {
                r = 0;
                g = 0;
                b = 0;
            }
            Log.ret(Log.l.u2, "r=" + r + " g=" + g + " b=" + b);
            return { r: r, g: g, b: b };
        },
        rgbStr2rgb: function (rgbStr) {
            var r, g, b;
            Log.call(Log.l.u2, "Colors.", "rgbStr=" + rgbStr);
            if (rgbStr) {
                rgbStr = rgbStr.replace("rgb(", "");
                rgbStr = rgbStr.replace(")", "");
                var tmpRgb = rgbStr.split(",");
                r = parseInt(tmpRgb[0]);
                g = parseInt(tmpRgb[1]);
                b = parseInt(tmpRgb[2]);
            } else {
                r = 0;
                g = 0;
                b = 0;
            }
            Log.ret(Log.l.u2, "r=" + r + " g=" + g + " b=" + b);
            return { r: r, g: g, b: b };
        },
        /**
         * @function rgb2hsv
         * @memberof Colors
         * @param {number} r - runs from 0 to 255
         * @param {number} g - runs from 0 to 255
         * @param {number} b - runs from 0 to 255
         * @returns {Object} A color value object with number values where h runs from 0 to 360 degrees and s and v run from 0 to 100
         * <pre>
            {
                h: hue,
                s: saturation,
                v: value
            }
           </pre> 
         * @description Use this function to convert color values from r, g, b number values into h, s, v number values.
         */
        rgb2hsv: function (obj, g, b) {
            var r = null;
            if (typeof obj === "number") {
                r = obj;
            } else if (obj &&
                typeof obj === "object" &&
                typeof obj.r === "number" &&
                typeof obj.g === "number" &&
                typeof obj.b === "number") {
                r = obj.r;
                g = obj.g;
                b = obj.b;
            }
            Log.call(Log.l.u2, "Colors.", "r=" + r + " g=" + g + " b=" + b);
            if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
                Log.ret(Log.l.u2, "invalid params");
                return null;
            }
            r = r / 255.0;
            g = g / 255.0;
            b = b / 255.0;
            var minRgb = Math.min(r, Math.min(g, b));
            var maxRgb = Math.max(r, Math.max(g, b));

            // Black-gray-white
            if (minRgb === maxRgb) {
                Log.ret(Log.l.u2, "h=" + 0 + " s=" + 0 + " v=" + minRgb * 100);
                return { h: 0, s: 0, v: minRgb * 100 };
            }

            // Colors other than black-gray-white:
            var d = (r === minRgb) ? g - b : ((b === minRgb) ? r - g : b - r);
            var hTemp = (r === minRgb) ? 3 : ((b === minRgb) ? 1 : 5);
            var h = 60 * (hTemp - d / (maxRgb - minRgb));
            var s = (maxRgb - minRgb) / maxRgb * 100;
            var v = maxRgb * 100;
            Log.ret(Log.l.u2, "h=" + h + " s=" + s + " v=" + v);
            return { h: h, s: s, v: v };
        },
        /**
         * @function hsv2rgb
         * @memberof Colors
         * @param {number} h - runs from 0 to 360 degrees
         * @param {number} s - runs from 0 to 100
         * @param {number} v - runs from 0 to 100
         * @returns {Object} A color value object with number values 0-255 for each color part in the format:
         * <pre>
            {
                r: red,
                g: green,
                b: blue
            }
           </pre> 
         * @description Use this function to convert color values from h, s, v number values into r, g, b number values.
         *  For further informtions see the algorithm by Eugene Vishnevsky at {@link http://www.cs.rit.edu/~ncs/color/t_convert.html HSV to RGB color conversion}
         */
        hsv2rgb: function (obj, s, v) {
            var h = null;
            if (typeof obj === "number") {
                h = obj;
            } else if (obj &&
                typeof obj === "object" &&
                typeof obj.h === "number" &&
                typeof obj.s === "number" &&
                typeof obj.v === "number") {
                h = obj.h;
                s = obj.s;
                v = obj.v;
            }
            Log.call(Log.l.u2, "Colors.", "h=" + h + " s=" + s + " v=" + v);
            var r, g, b, i, f, p, q, t;

            // Make sure our arguments stay in-range
            h = Math.max(0, Math.min(360, h));
            s = Math.max(0, Math.min(100, s));
            v = Math.max(0, Math.min(100, v));

            // We accept saturation and value arguments from 0 to 100 because that"s
            // how Photoshop represents those values. Internally, however, the
            // saturation and value are calculated from a range of 0 to 1. We make
            // That conversion here.
            s /= 100;
            v /= 100;

            if (s === 0) {
                // Achromatic (grey)
                r = g = b = v;
                Log.ret(Log.l.u2, "r=" + Math.round(r * 255) + " g=" + Math.round(g * 255) + " b=" + Math.round(b * 255));
                return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
            }

            h /= 60; // sector 0 to 5
            i = Math.floor(h);
            f = h - i; // factorial part of h
            p = v * (1 - s);
            q = v * (1 - s * f);
            t = v * (1 - s * (1 - f));

            switch (i) {
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;

                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;

                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;

                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;

                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;

                default: // case 5:
                    r = v;
                    g = p;
                    b = q;
            }
            Log.ret(Log.l.u2, "r=" + Math.round(r * 255) + " g=" + Math.round(g * 255) + " b=" + Math.round(b * 255));
            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
        },
        /**
         * @function rgb2hex
         * @memberof Colors
         * @param {number} r - A value of 0-255 for the red part of the color value. 
         * @param {number} g - A value of 0-255 for the green part of the color value. 
         * @param {number} b - A value of 0-255 for the blue part of the color value. 
         * @returns {string} A color value hexadecimal string in the format: "#rrggbb"
         * @description Use this function to convert color values from format to r, g, b number values into a hex string.
         */
        rgb2hex: function (obj, g, b) {
            var r = null;
            if (typeof obj === "number") {
                r = obj;
            } else if (obj &&
                typeof obj === "object" &&
                typeof obj.r === "number" &&
                typeof obj.g === "number" &&
                typeof obj.b === "number") {
                r = obj.r;
                g = obj.g;
                b = obj.b;
            }
            Log.call(Log.l.u2, "Colors.", "r=" + r + " g=" + g + " b=" + b);
            if (typeof r === "undefined" || r === null) {
                Log.ret(Log.l.u2, "invalid params");
                return "";
            }
            var rgb = [r.toString(16), g.toString(16), b.toString(16)];
            for (var i = 0; i < 3; i++) {
                if (rgb[i].length === 1) rgb[i] = "0" + rgb[i];
            }
            Log.ret(Log.l.u2, "#" + rgb[0] + rgb[1] + rgb[2]);
            return "#" + rgb[0] + rgb[1] + rgb[2];
        },
        rgbStr2hex: function (rgbStr) {
            Log.call(Log.l.u2, "Colors.", "rgbStr=" + rgbStr);
            var rgb = Colors.rgbStr2rgb(rgbStr);
            var ret = Colors.rgb2hex(rgb.r, rgb.g, rgb.b);
            Log.ret(Log.l.u2, ret);
            return ret;
        },
        /**
         * @class ColorsClass 
         * @memberof Colors
         * @param {Object} colorSettings - Initialization color settings
         * @param {string} colorSettings.accentColor - Accent color of the app.
         * @param {string} colorSettings.textColor - Foreground color of data presentation elements in the app.
         * @param {string} colorSettings.labelColor - Foreground color of label elements in the app.
         * @param {string} colorSettings.backgroundColor - Background color of page elements in the app.
         * @param {string} colorSettings.masterHostBackgroundColor - Background color of master elements in the app.
         * @param {string} colorSettings.navigationColor - Background color of navigation surface.
         * @param {string} colorSettings.selectionBackgroundColor - Background color of master elements in the app.
         * @param {string} colorSettings.tileTextColor - Foreground color of tile elements.
         * @param {string} colorSettings.tileBackgroundColor - Background color of tile elements.
         * @param {string} colorSettings.dashboardColor - Background color of dashboard elements in the app.
         * @param {boolean} forceColors - Force redefinition of color attributes.
         * @description This class is used by the application frame object to redefine UI colors. 
         *  A change of the accentColor setting will lead automatic recalculation of all other colors if not specified in colorSettings.
         *  Allowed colorSettings values are in the format "#rrggbb"
         */
        ColorsClass: WinJS.Class.define(
            // Define the constructor function for the ColorsClass.
            function ColorsClass(colorSettings, forceColors) {
                Log.call(Log.l.trace, "Colors.", "");
                this._accentColor = colorSettings.accentColor;
                if (Colors._prevAccentColor === this._accentColor ||
                    Colors._prevAccentColor === null) {
                    Log.print(Log.l.trace, "accentColor=" + this._accentColor + " not changed");
                } else {
                    Log.print(Log.l.trace, "accentColor=" + this._accentColor + " changed");
                    if (typeof colorSettings.tileBackgroundColor != "undefined") {
                        Log.print(Log.l.trace, "delete colorSettings.tileBackgroundColor");
                        delete colorSettings.tileBackgroundColor;
                    }
                }

                // get r, g, b
                this._rgb = Colors.hex2rgb(this._accentColor);

                // get h, s, k
                this._hsv = Colors.rgb2hsv(this._rgb.r, this._rgb.g, this._rgb.b);

                // color of page text
                if (typeof colorSettings.textColor != "undefined" &&
                    colorSettings.textColor &&
                    Colors._prevIsDarkTheme === Colors.isDarkTheme && !Colors.isDarkTheme) {
                    this._textColor = colorSettings.textColor;
                } else {
                    var textColorRgb = Colors.hsv2rgb(
                        (this._hsv.h + 196) % 360,
                        Colors.isDarkTheme ? (this._hsv.s * 0.12) : this._hsv.s * 0.24,
                        Colors.isDarkTheme ? 92 : 44
                    );
                    this._textColor = Colors.rgb2hex(textColorRgb.r, textColorRgb.g, textColorRgb.b);
                }

                // color of page background
                var backgroundColorRgb;
                if (typeof colorSettings.backgroundColor != "undefined" &&
                    colorSettings.backgroundColor) {
                    this._backgroundColorInitial = colorSettings.backgroundColor;
                } else {
                    backgroundColorRgb = Colors.hsv2rgb(
                        (this._hsv.h + 196) % 360,
                        6,
                        96
                    );
                    this._backgroundColorInitial = Colors.rgb2hex(backgroundColorRgb.r, backgroundColorRgb.g, backgroundColorRgb.b);
                }
                if (!Colors.isDarkTheme) {
                    this._backgroundColor = this._backgroundColorInitial;
                } else {
                    backgroundColorRgb = Colors.hex2rgb(this._backgroundColorInitial);
                    var hsvBackgroundColor = Colors.rgb2hsv(backgroundColorRgb);
                    if (hsvBackgroundColor.v > 50) {
                        backgroundColorRgb = Colors.hsv2rgb(
                            hsvBackgroundColor.h,
                            hsvBackgroundColor.s,
                            100 - hsvBackgroundColor.v
                        );
                        this._backgroundColor = Colors.rgb2hex(backgroundColorRgb.r, backgroundColorRgb.g, backgroundColorRgb.b);
                    } else {
                        this._backgroundColor = this._backgroundColorInitial;
                    }
                }

                // color of master host background
                var masterHostBackgroundColorRgb;
                if (typeof colorSettings.masterHostBackgroundColor != "undefined" &&
                    colorSettings.masterHostBackgroundColor) {
                    this._masterHostBackgroundColorInitial = colorSettings.masterHostBackgroundColor;
                } else {
                    masterHostBackgroundColorRgb = Colors.hsv2rgb(
                        this._hsv.h,
                        3,
                        92
                    );
                    this._masterHostBackgroundColorInitial = Colors.rgb2hex(masterHostBackgroundColorRgb.r, masterHostBackgroundColorRgb.g, masterHostBackgroundColorRgb.b);
                }
                if (!Colors.isDarkTheme) {
                    this._masterHostBackgroundColor = this._masterHostBackgroundColorInitial;
                } else {
                    masterHostBackgroundColorRgb = Colors.hex2rgb(this._masterHostBackgroundColorInitial);
                    var hsvMasterHostBackgroundColor = Colors.rgb2hsv(masterHostBackgroundColorRgb);
                    if (hsvMasterHostBackgroundColor.v > 50) {
                        masterHostBackgroundColorRgb = Colors.hsv2rgb(
                            hsvMasterHostBackgroundColor.h,
                            hsvMasterHostBackgroundColor.s,
                            100 - hsvMasterHostBackgroundColor.v
                        );
                        this._masterHostBackgroundColor = Colors.rgb2hex(masterHostBackgroundColorRgb.r, masterHostBackgroundColorRgb.g, masterHostBackgroundColorRgb.b);
                    } else {
                        this._masterHostBackgroundColor = this._masterHostBackgroundColorInitial;
                    }
                }

                // color of static text labels
                if (typeof colorSettings.labelColor != "undefined" &&
                    colorSettings.labelColor &&
                    Colors._prevIsDarkTheme === Colors.isDarkTheme && !Colors.isDarkTheme) {
                    this._labelColor = colorSettings.labelColor;
                } else {
                    var labelColorRgb = Colors.hsv2rgb(
                        this._hsv.h,
                        0,
                        Colors.isDarkTheme ? 75 : 33
                    );
                    this._labelColor = Colors.rgb2hex(labelColorRgb.r, labelColorRgb.g, labelColorRgb.b);
                }

                // color of navigation surface
                var navigationColorRgb;
                if (typeof colorSettings.navigationColor != "undefined" &&
                    colorSettings.navigationColor) {
                    this._navigationColorInitial = colorSettings.navigationColor;
                } else {
                    navigationColorRgb = Colors.hsv2rgb(
                        this._hsv.h,
                        this._hsv.s * 0.7,
                        this._hsv.v * 0.85
                    );
                    this._navigationColorInitial = Colors.rgb2hex(navigationColorRgb.r, navigationColorRgb.g, navigationColorRgb.b);
                }
                if (!Colors.isDarkTheme) {
                    this._navigationColor = this._navigationColorInitial;
                } else {
                    navigationColorRgb = Colors.hex2rgb(this._navigationColorInitial);
                    var hsvNavigationColor = Colors.rgb2hsv(navigationColorRgb);
                    if (hsvNavigationColor.v < 50) {
                        navigationColorRgb = Colors.hsv2rgb(
                            hsvNavigationColor.h,
                            hsvNavigationColor.s,
                            100 - hsvNavigationColor.v
                        );
                        this._navigationColor = Colors.rgb2hex(navigationColorRgb.r, navigationColorRgb.g, navigationColorRgb.b);
                    } else {
                        this._navigationColor = this._navigationColorInitial;
                    }
                }
                // color of selection background
                if (typeof colorSettings.selectionBackgroundColor != "undefined" &&
                    colorSettings.selectionBackgroundColor && !Colors.isDarkTheme) {
                    this._selectionBackgroundColor = colorSettings.selectionBackgroundColor;
                } else {
                    this._selectionBackgroundColor = Colors.isDarkTheme ? this._navigationColor : this._accentColor;
                }

                // color of dashboard surface
                var dashboardColorRgb;
                if (typeof colorSettings.dashboardColor != "undefined" &&
                    colorSettings.dashboardColor) {
                    this._dashboardColorInitial = colorSettings.dashboardColor;
                } else {
                    dashboardColorRgb = Colors.hsv2rgb(
                        this._hsv.h,
                        this._hsv.s * 0.7, //Colors.isDarkTheme ? Math.min(100, this._hsv.s * 1.33) : this._hsv.s / 2.66,
                        this._hsv.v * 0.85//Colors.isDarkTheme ? 40 : 95
                    );
                    this._dashboardColorInitial = Colors.rgb2hex(dashboardColorRgb.r, dashboardColorRgb.g, dashboardColorRgb.b);
                }
                if (!Colors.isDarkTheme) {
                    this._dashboardColor = this._dashboardColorInitial;
                } else {
                    dashboardColorRgb = Colors.hex2rgb(this._dashboardColorInitial);
                    var hsvDashboardColor = Colors.rgb2hsv(dashboardColorRgb);
                    if (hsvDashboardColor.v < 50) {
                        dashboardColorRgb = Colors.hsv2rgb(
                            hsvDashboardColor.h,
                            hsvDashboardColor.s,
                            100 - hsvDashboardColor.v
                        );
                    } else {
                        this._dashboardColor = this._dashboardColorInitial;
                    }
                    this._dashboardColor = Colors.rgb2hex(dashboardColorRgb.r, dashboardColorRgb.g, dashboardColorRgb.b);
                }

                if (typeof colorSettings.tileBackgroundColor != "undefined" &&
                    colorSettings.tileBackgroundColor) {
                    this._tileBackgroundColor = colorSettings.tileBackgroundColor;
                } else {
                    var rgbTileBkgComp = Colors.hsv2rgb((this._hsv.h + 196) % 360, this._hsv.s * 0.11, this._hsv.v * 0.95);
                    this._tileBackgroundColor = Colors.rgb2hex(rgbTileBkgComp.r, rgbTileBkgComp.g, rgbTileBkgComp.b);
                    var hsvTileBkgComp = Colors.rgb2hsv(rgbTileBkgComp.r, rgbTileBkgComp.g, rgbTileBkgComp.b);
                    var rgbTileBorderComp;
                    if (Colors.isDarkTheme) {
                        rgbTileBorderComp = Colors.hsv2rgb(hsvTileBkgComp.h, hsvTileBkgComp.s / 4, Math.min(100, hsvTileBkgComp.v * 1.05));
                    } else {
                        rgbTileBorderComp = Colors.hsv2rgb(hsvTileBkgComp.h, Math.min(100, hsvTileBkgComp.s * 2), hsvTileBkgComp.v / 1.25);
                    }
                    this._tileBorderColor = Colors.rgb2hex(rgbTileBorderComp.r, rgbTileBorderComp.g, rgbTileBorderComp.b);
                }
                if (typeof colorSettings.tileTextColor != "undefined" &&
                    colorSettings.tileTextColor) {
                    this._tileTextColor = colorSettings.tileTextColor;
                } else {
                    var tileTextColorRgb = Colors.hsv2rgb(
                        (this._hsv.h + 196) % 360,
                        this._hsv.s * 0.24,
                        44
                    );
                    this._tileTextColor = Colors.rgb2hex(tileTextColorRgb.r, tileTextColorRgb.g, tileTextColorRgb.b);
                }

                if (typeof AppData._persistentStates.showAppBkg != "undefined" &&
                    Colors._prevShowAppBkg === AppData._persistentStates.showAppBkg &&
                    !forceColors) {
                    Log.print(Log.l.trace, "showAppBkg=" + AppData._persistentStates.showAppBkg + " not changed");
                } else {
                    // show background image
                    var appBkg = document.body.querySelector(".app-bkg");
                    if (appBkg && appBkg.style) {
                        appBkg.style.visibility = AppData._persistentStates.showAppBkg ? "visible" : "hidden";
                        if (AppData._persistentStates.showAppBkg && this._tileBackgroundColor &&
                            this._tileBackgroundColor.substr(0, 1) === "#") {
                            var rgbAppBkg = Colors.hex2rgb(this._tileBackgroundColor);
                            var opacity;
                            if (Colors.isDarkTheme) {
                                opacity = 0.6;
                            } else {
                                opacity = 0.9;
                            }
                            this._tileBackgroundColor = "rgba(" + rgbAppBkg.r + "," + rgbAppBkg.g + "," + rgbAppBkg.b + "," + opacity + ")";
                        }
                    }
                }
                Colors._colorsClass = this;

                var loadCssPromise;
                // apply changes in visual style
                if (Colors._prevIsDarkTheme !== null && Colors._prevIsDarkTheme === Colors.isDarkTheme) {
                    Log.print(Log.l.trace, "isDarkTheme=" + Colors.isDarkTheme + " not changed");
                    loadCssPromise = WinJS.Promise.as();
                } else {
                    var baseCssList = [];
                    baseCssList.push(Colors.loadCSSfile("css/syscolors.css"));
                    baseCssList.push(Colors.loadCSSfile(Colors.isDarkTheme ? "lib/WinJS/css/ui-dark.min.css" : "lib/WinJS/css/ui-light.min.css"));
                    baseCssList.push(Colors.loadCSSfile("css/opensans.css"));
                    loadCssPromise = WinJS.Promise.join(baseCssList).then(function() {
                        if (Colors.isDarkTheme) {
                            if (WinJS.Utilities.hasClass(document.body, "cnv-ui-light")) {
                                WinJS.Utilities.removeClass(document.body, "cnv-ui-light");
                            }
                            if (!WinJS.Utilities.hasClass(document.body, "cnv-ui-dark")) {
                                WinJS.Utilities.addClass(document.body, "cnv-ui-dark");
                            }
                        } else {
                            if (WinJS.Utilities.hasClass(document.body, "cnv-ui-dark")) {
                                WinJS.Utilities.removeClass(document.body, "cnv-ui-dark");
                            }
                            if (!WinJS.Utilities.hasClass(document.body, "cnv-ui-light")) {
                                WinJS.Utilities.addClass(document.body, "cnv-ui-light");
                            }
                        }
                        var appCssList = [];
                        appCssList.push(Colors.loadCSSfile("css/default.css"));
                        appCssList.push(Colors.loadCSSfile("css/index.css"));
                        return WinJS.Promise.join(appCssList);
                    }).then(function() {
                        Colors.changeCSS(".splash-screen-container", "background-color", Colors.navigationColor);
                        return Colors.loadCSSfile("css/theme.css");
                    }).then(function() {
                        if (Application.extraPath) {
                            return Colors.loadCSSfile(Application.extraPath + "css/theme.css");
                        } else {
                            return WinJS.Promise.as();
                        }
                    });
                }
                var that = this;
                this._loadCssPromise = loadCssPromise.then(function() {
                    WinJS.Promise.timeout(50).then(function() {
                        Colors.changeCSS(".win-button, .win-dropdown, .win-h1, .win-h2, .win-h3, .win-h4, .win-h5, .win-h6, .win-link, .win-textarea, .win-textbox, .win-type-base, .win-type-body, .win-type-caption, .win-type-header, .win-type-subheader, .win-type-subtitle, .win-type-title",
                            "font-family",
                            '"TT Interphases Pro", "Onest", "Open Sans", "Segoe UI", "Segoe UI Web", "-apple-system", "BlinkMacSystemFont", "Roboto", "Helvetica Neue", sans-serif, "Segoe MDL2 Assets", "Symbols", "Segoe UI Emoji"');
                        Colors.changeCSS(".win-listview.win-selectionstylefilled .win-selected .win-selectionbackground, .win-itemcontainer.win-selectionstylefilled.win-selected .win-selectionbackground", "background-color", Colors.selectionBackgroundColor);
                        Colors.changeCSS(".accent-background-color", "background-color", Colors.accentColor);
                        Colors.changeCSS(".accent-color", "color", Colors.accentColor);
                        Colors.changeCSS(".win-selectionstylefilled .win-selected .win-textbox:focus", "border-color", Colors.accentColor + " !important");
                        Colors.changeCSS(".win-selectionstylefilled .win-selected .win-textarea:focus", "border-color", Colors.accentColor + " !important");
                        //Colors.changeCSS(".row-bkg-gray", "opacity", Colors.isDarkTheme ? 0.2 : 0.1);
                        //Colors.changeCSS(".masterhost-container .pagecontrol", "background-color", Colors.isDarkTheme ? "#101010" : "#fcfcfc");
                        Colors.changeCSS(".masterhost-container .pagecontrol", "background-color", Colors.masterHostBackgroundColor);
                        Colors.changeCSS(".masterhost-background", "background-color", Colors.masterHostBackgroundColor);
                        Colors.changeCSS(".contenthost-background", "background-color", Colors.backgroundColor);
                        //Colors.changeCSS(".list-container", "background-color", Colors.isDarkTheme ? "rgba(250,250,250,0.1)" : "rgba(32,32,32,0.1)");
                        //Colors.changeCSS(".win-selectionstylefilled .win-container:hover .row-bkg", "background-color", Colors.isDarkTheme ? "rgba(250,250,250,0.1)" : "rgba(32,32,32,0.1)");
                        //Colors.changeCSS(".navigationbar-container", "background-color", Colors.isDarkTheme ? "#101010" : "#fcfcfc");
                        if (AppData._persistentStates.inputBorderBottom) {
                            if (!WinJS.Utilities.hasClass(document.body, "cnv-input-border-bottom")) {
                                WinJS.Utilities.addClass(document.body, "cnv-input-border-bottom");
                            }
                            //Colors.changeCSS(".field_line", "border-bottom-color", "transparent");
                        } else {
                            if (WinJS.Utilities.hasClass(document.body, "cnv-input-border-bottom")) {
                                WinJS.Utilities.removeClass(document.body, "cnv-input-border-bottom");
                            }
                            //Colors.changeCSS(".field_line", "border-bottom-color", Colors.isDarkTheme ? "#393939" : "#e6e6e6");
                        }
                        Colors.changeCSS(".loader", "border-top-color",  (Colors.isDarkTheme ? Colors.navigationColor : Colors.accentColor));
                        var mandatoryColorRgb = Colors.hsv2rgb(that._hsv.h, Colors.isDarkTheme ? 36 : 8, Colors.isDarkTheme ? 54 : 100);
                        var mandatoryColor = Colors.rgb2hex(mandatoryColorRgb.r, mandatoryColorRgb.g, mandatoryColorRgb.b);
                        Colors.changeCSS(".mandatory-bkg", "background-color", mandatoryColor);
                        mandatoryColorRgb = Colors.hsv2rgb(that._hsv.h, Colors.isDarkTheme ? 36 : 6, Colors.isDarkTheme ? 44 : 100);
                        mandatoryColor = Colors.rgb2hex(mandatoryColorRgb.r, mandatoryColorRgb.g, mandatoryColorRgb.b);
                        Colors.changeCSS(".mandatory-bkg:hover", "background-color", mandatoryColor);
                        mandatoryColorRgb = Colors.hsv2rgb(that._hsv.h, Colors.isDarkTheme ? 18 : 4, 100);
                        mandatoryColor = Colors.rgb2hex(mandatoryColorRgb.r, mandatoryColorRgb.g, mandatoryColorRgb.b);
                        Colors.changeCSS(".mandatory-bkg:focus", "background-color", mandatoryColor);
                    });

                    if (Colors._prevAccentColor === that._accentColor &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "accentColor=" + that._accentColor + " and isDarkTheme=" + Colors.isDarkTheme + " not changed");
                    } else {
                        if (typeof WinJS.UI._Accents.setAccentColor === "function") {
                            WinJS.UI._Accents.setAccentColor(that._rgb.r, that._rgb.g, that._rgb.b);
                        }
                    }
                    if (Colors._prevTextColor === that._textColor &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "textColor=" + that._textColor + " not changed");
                    } else {
                        document.body.style.color = that._textColor;
                        WinJS.Promise.timeout(50).then(function () {
                            Colors.changeCSS("#navigationbar_horizontal", "border-bottom-color", Colors.textColor);
                            Colors.changeCSS(".app-logo-container", "border-bottom-color", Colors.textColor);
                            Colors.changeCSS(".window-text-color", "color", Colors.textColor);
                            Colors.changeCSS(".navigationbar-container", "color", Colors.textColor);
                            Colors.changeCSS(".caption-field", "color", Colors.textColor);
                            //Colors.changeCSS(".half-circle-textcolor", "border-bottom-color", Colors.textColor + " !important");
                            Colors.changeCSS(".text-textcolor", "color", Colors.textColor + " !important");
                        });
                    }
                    if (Colors._prevLabelColor === that._labelColor &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "labelColor=" + that._labelColor + " not changed");
                    } else {
                        WinJS.Promise.timeout(50).then(function () {
                            Colors.changeCSS(".label", "color", Colors.labelColor);
                            Colors.changeCSS(".id-label", "color", Colors.labelColor);
                            Colors.changeCSS(".label-color", "color", Colors.labelColor);

                        });
                    }
                    if (Colors._prevBackgroundColor === that._backgroundColor &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "backgroundColor=" + that._backgroundColor + " not changed");
                    } else {
                        document.body.style.backgroundColor = that._backgroundColor;
                        WinJS.Promise.timeout(50).then(function () {
                            Colors.changeCSS(".row-bkg", "background-color",
                                AppData._persistentStates.showAppBkg ? "transparent" : Colors.backgroundColor);
                        });
                    }
                    if (Colors._prevInputBorderBottom === AppData._persistentStates.inputBorderBottom &&
                        Colors._prevInputBorderRadius === AppData._persistentStates.inputBorderRadius &&
                        Colors._prevInputBorder === AppData._persistentStates.inputBorder &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "inputBorder=" + AppData._persistentStates.inputBorder + " not changed");
                    } else {
                        WinJS.Promise.timeout(50).then(function () {
                            if (AppData._persistentStates.inputBorderBottom) {
                                var borderWidth = AppData._persistentStates.inputBorder || 1;
                                Colors.changeCSS("input.win-textbox, textarea.win-textarea",
                                    "border-width", "0 0 " + borderWidth + "px" + " 0");
                                //Colors.changeCSS("span.input_field, span.input_small_right, span.input_small_left, span.input_threequarter_left, span.input_quarter_right",
                                //    "border-bottom-style", "solid");
                                Colors.changeCSS("span.input_field, span.input_small_right, span.input_small_left, span.input_threequarter_left, span.input_quarter_right",
                                    "border-bottom-width", AppData._persistentStates.inputBorder + "px");
                                //Colors.changeCSS("span.input_field, span.input_small_right, span.input_small_left, span.input_threequarter_left, span.input_quarter_right",
                                //    "border-bottom-color", Colors.isDarkTheme ? "#393939" : "#e6e6e6");
                            } else {
                                Colors.changeCSS("input.win-textbox, textarea.win-textarea",
                                    "border-width", AppData._persistentStates.inputBorder + "px");
                                //Colors.changeCSS("span.input_field, span.input_small_right, span.input_small_left, span.input_threequarter_left, span.input_quarter_right",
                                //    "border-bottom-style", "none");
                                //Colors.changeCSS("span.input_field, span.input_small_right, span.input_small_left, span.input_threequarter_left, span.input_quarter_right",
                                //    "border-bottom-width", "0");
                                //Colors.changeCSS("span.input_field, span.input_small_right, span.input_small_left, span.input_threequarter_left, span.input_quarter_right",
                                //    "border-bottom-color", "transparent");
                            }
                            Colors.changeCSS("input.win-checkbox, input.win-radio, select.win-dropdown",
                                "border-width", AppData._persistentStates.inputBorder + "px");
                            Colors.changeCSS(".color_picker_trigger", "border-width", AppData._persistentStates.inputBorder + "px");
                            if (AppData._persistentStates.inputBorderRadius) {
                                Colors.changeCSS(".use-border-radius", "border-radius", AppData._persistentStates.inputBorderRadius + "px");
                                if (!AppData._persistentStates.inputBorderBottom) {
                                    Colors.changeCSS("input.win-textbox, textarea.win-textarea", "border-radius", AppData._persistentStates.inputBorderRadius + "px");
                                }
                                Colors.changeCSS("button.win-button", "border-radius", AppData._persistentStates.inputBorderRadius + "px");
                                Colors.changeCSS(".win-button.win-button-file::-ms-value", "border-radius", AppData._persistentStates.inputBorderRadius + "px");
                                Colors.changeCSS(".win-dropdown", "border-radius", AppData._persistentStates.inputBorderRadius + "px");
                                Colors.changeCSS(".win-progress-bar", "border-radius", AppData._persistentStates.inputBorderRadius + "px");
                                Colors.changeCSS(".color_picker_trigger", "border-radius", AppData._persistentStates.inputBorderRadius + "px");
                            }
                            NavigationBar.createSplitViewPaneResizeHelper();
                        });
                    }
                    if (Colors._tileTextColor === that._tileTextColor &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "tileTextColor=" + that._tileTextColor + " not changed");
                    } else {
                        WinJS.Promise.timeout(50).then(function () {
                            Colors.changeCSS(".text-tile-textcolor", "color", Colors.tileTextColor + " !important");
                            Colors.changeCSS(".tile-backgroundcolor .tile-separator-left", "border-left-color", Colors.tileTextColor + " !important");
                            Colors.changeCSS(".tile-backgroundcolor .tile-separator-right", "border-right-color", Colors.tileTextColor + " !important");
                        });
                    }
                    if (Colors._prevTileBackgroundColor === that._tileBackgroundColor &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "tileBackgroundColor=" + that._tileBackgroundColor + " not changed");
                    } else {
                        WinJS.Promise.timeout(50).then(function () {
                            Colors.changeCSS(".tile-backgroundcolor", "background-color", Colors.tileBackgroundColor + " !important");
                            Colors.changeCSS(".tile-header.tile-backgroundcolor", "background-color", Colors.tileBackgroundColor + " !important");
                        });
                    }
                    if (Colors._prevNavigationColor === that._navigationColor &&
                        Colors._prevIsDarkTheme === Colors.isDarkTheme &&
                        !forceColors) {
                        Log.print(Log.l.trace, "navigationColor=" + that._navigationColor + "and isDarkTheme=" + Colors.isDarkTheme + " not changed");
                    } else {
                        WinJS.Promise.timeout(50).then(function () {
                            Colors.changeCSS(".navigation-background-color", "background-color", Colors.navigationColor);
                            Colors.changeCSS(".titlearea-bkg", "background-color", Colors.navigationColor);
                            //Colors.changeCSS(".titlearea-bkg", "color", "#ffffff");
                            Colors.changeCSS(".half-circle-textcolor", "border-bottom-color", Colors.navigationColor + " !important");
                            Colors.changeCSS(".header-separator", "border-bottom-color", Colors.navigationColor);
                            //Colors.changeCSS("#navigationbar_horizontal", "border-bottom-color", Colors.navigationColor);
                            Colors.changeCSS("#navigationbar_vertical", "border-right-color", Colors.navigationColor);
                            //Colors.changeCSS(".navigationbar-container", "color", Colors.navigationColor);
                            Colors.changeCSS(".tile-header.tile-backgroundcolor", "border-top-color", Colors.navigationColor);
                            Colors.changeCSS(".tile-navigationcolor", "background-color", Colors.navigationColor + " !important");
                            Colors.changeCSS(".tile-header.tile-navigationcolor", "background-color", Colors.navigationColor + " !important");
                            Colors.changeCSS(".half-circle-navigationcolor", "border-bottom-color", Colors.navigationColor);
                            Colors.changeCSS(".text-navigationcolor", "border-bottom-color", Colors.navigationColor);
                            Colors.changeCSS(".win-splitviewcommand-label", "color", Colors.navigationColor);
                            //Colors.changeCSS(".logo-title", "color", Colors.navigationColor);
                            //Colors.changeCSS(".win-selectionstylefilled.win-listview .win-selected", "background-color", "black");
                            Colors.changeCSS("#navigationbar_horizontal .win-selected, #navigationbar_vertical .win-selected",
                                "color", Colors.navigationColor);
                            var rgb = Colors.hex2rgb(Colors.navigationColor);
                            Colors.changeCSS("button.win-splitviewpanetoggle", "color",
                                (rgb.r + rgb.g + rgb.b) / 3 >= 128 ? "#000000 !important" : "#ffffff !important");
                        });
                        // special handling of app statusbar on iOS >= 7
                        Log.print(Log.l.trace, "initialize StatusBar");
                        try {
                            if (typeof StatusBar === "object") {
                                if (typeof StatusBar.show === "function") {
                                    StatusBar.show();
                                }
                                if (typeof StatusBar.overlaysWebView === "function") {
                                    StatusBar.overlaysWebView(false);
                                }
                                if (typeof StatusBar.backgroundColorByHexString === "function") {
                                    StatusBar.backgroundColorByHexString(that._navigationColor);
                                }
                                var rgb = Colors.hex2rgb(Colors.navigationColor);
                                if (rgb.r + rgb.g + rgb.b < 128 * 3) {
                                    if (typeof StatusBar.styleLightContent === "function") {
                                        StatusBar.styleLightContent();
                                    }
                                } else {
                                    if (typeof StatusBar.styleDefault === "function") {
                                        StatusBar.styleDefault();
                                    }
                                }
                            }
                        } catch (ex1) {
                            Log.print(Log.l.error, "status bar error " + ex1.message);
                        }
                    }
                    Colors._prevAccentColor = that._accentColor;
                    Colors._prevTextColor = that._textColor;
                    Colors._prevLabelColor = that._labelColor;
                    Colors._prevNavigationColor = that._navigationColorInitial;
                    Colors._prevDashboardColor = that._dashboardColorInitial;
                    Colors._prevBackgroundColor = that._backgroundColorInitial;
                    Colors._prevMasterHostBackgroundColor = that._masterHostBackgroundColorInitial;
                    Colors._prevSelectionBackgroundColor = that._selectionBackgroundColor;
                    Colors._prevTileTextColor = that._tileTextColor;
                    Colors._prevTileBackgroundColor = that._tileBackgroundColor;
                    Colors._prevIsDarkTheme = Colors.isDarkTheme;
                    Colors._prevInputBorder = AppData._persistentStates.inputBorder;
                    Colors._prevInputBorderRadius = AppData._persistentStates.inputBorderRadius;
                    Colors._prevInputBorderBottom = AppData._persistentStates.inputBorderBottom;
                    Colors._prevShowAppBkg = AppData._persistentStates.showAppBkg;


                    if (NavigationBar.ListView) {
                        // updateLayout of navigation bar viewport elements
                        NavigationBar.ListView.updateLayout();
                    }
                });
                Log.ret(Log.l.trace);
            }, {
                _loadCssPromise: null,
                _accentColor: null,
                _textColor: null,
                _labelColor: null,
                _navigationColor: null,
                _navigationColorInitial: null,
                _dashboardColor: null,
                _dashboardColorInitial: null,
                _backgroundColor: null,
                _backgroundColorInitial: null,
                _masterHostBackgroundColor: null,
                _masterHostBackgroundColorInitial: null,
                _selectionBackgroundColor: null,
                _tileTextColor: null,
                _tileBackgroundColor: null,
                _tileBorderColor: null
            }
        ),
        changeSVGStroke: function(svgRoot, strokeWidth, color, useStrokeColor) {
            if (svgRoot) {
                var curWidth;
                var viewBox = svgRoot.viewBox;
                if (viewBox && viewBox.baseVal && viewBox.baseVal.width) {
                    curWidth = strokeWidth * viewBox.baseVal.width / 10000.0;
                } else if (svgRoot.clientWidth) {
                    curWidth = strokeWidth * svgRoot.clientWidth / 10000.0;
                } else {
                    curWidth = strokeWidth / 100.0;
                }
                var svgElements = ["path", "rect", "line", "polygon", "circle", "ellipse"];
                // set stroke of svg elements
                for (var i = 0; i < svgElements.length; i++) {
                    var paths = svgRoot.getElementsByTagName(svgElements[i]);
                    if (!paths || !paths.length) {
                        paths = svgRoot.getElementsByTagName(svgElements[i].toUpperCase());
                    }
                    if (paths) {
                        for (var k = 0; k < paths.length; k++) {
                            var prevColor = paths[k].getAttribute("stroke");
                            if (!useStrokeColor && (!prevColor || prevColor === "none")) {
                                Log.print(Log.l.u2, "ignore transparent fill color in element[" + k + "]");
                            } else {
                                paths[k].setAttribute("stroke-width", curWidth);
                            }
                        }
                    }
                }
            }
        },
        changeSVGColor: function (svgRoot, color, useFillColor, useStrokeColor) {
            if (svgRoot && color && (useFillColor || useStrokeColor)) {
                var svgElements = ["path", "rect", "line", "polygon", "circle", "ellipse"];
                // set color of svg elements
                for (var i = 0; i < svgElements.length; i++) {
                    var paths = svgRoot.getElementsByTagName(svgElements[i]);
                    if (!paths || !paths.length) {
                        paths = svgRoot.getElementsByTagName(svgElements[i].toUpperCase());
                    }
                    if (paths) {
                        for (var k = 0; k < paths.length; k++) {
                            var prevColor;
                            if (useFillColor) {
                                prevColor = paths[k].getAttribute("fill");
                                if (typeof prevColor === "undefined" || prevColor === "none") {
                                    Log.print(Log.l.u2, "ignore transparent fill color in element[" + k + "]");
                                } else {
                                    paths[k].setAttribute("fill", color);
                                }
                            }
                            if (useStrokeColor) {
                                prevColor = paths[k].getAttribute("stroke");
                                if (typeof prevColor === "undefined" || prevColor === "none") {
                                    Log.print(Log.l.u2, "ignore transparent stroke color in element[" + k + "]");
                                } else {
                                    paths[k].setAttribute("stroke", color);
                                }
                            }
                        }
                    }
                }
            }
        },
        loadSVGImage: function (svgInfo) {
            var ret = null;
            Log.call(Log.l.u1, "Colors.", "fileName=" + svgInfo.fileName);
            if (typeof Colors._cachedSVGText[svgInfo.fileName] === "undefined") {
                if (Colors._loadingSVGFile[svgInfo.fileName]) {
                    Log.print(Log.l.u1, "wait for loading of image " + svgInfo.fileName);
                    ret = WinJS.Promise.timeout(50).then(function waitforSVGFile() {
                        Log.call(Log.l.u1, "Colors.", "fileName=" + svgInfo.fileName);
                        Log.ret(Log.l.u1);
                        return Colors.loadSVGImage(svgInfo);
                    });
                } else {
                    // load SVG images from file
                    var url = "images/" + svgInfo.fileName + ".svg";
                    Log.print(Log.l.u1, "load image from " + url);
                    try {
                        Colors._loadingSVGFile[svgInfo.fileName] = true;
                        ret = WinJS.xhr({ url: url }).then(function xhrSuccess(res) {
                            Log.call(Log.l.u1, "Colors.", "fileName=" + svgInfo.fileName);
                            delete Colors._loadingSVGFile[svgInfo.fileName];
                            var responseText = res.responseText;
                            var svgText = null;
                            Log.print(Log.l.u1, "image ok!");
                            try {
                                if (responseText) {
                                    var pos = responseText.indexOf("<svg");
                                    if (pos < 0) {
                                        pos = responseText.indexOf("<SVG");
                                    }
                                    if (pos >= 0) {
                                        svgText = responseText.substr(pos);
                                        pos = responseText.indexOf("/svg>");
                                        if (pos < 0) {
                                            pos = responseText.indexOf("/SVG>");
                                        }
                                        if (pos >= 0) {
                                            svgText = svgText.substr(0, pos + 5);
                                        }
                                    }
                                    //svgText = responseText.search(/\<svg.*\/svg\>/i);
                                    if (svgText) {
                                        svgText = svgText.replace(/\<title.*\/title\>/i, "");
                                        svgText = svgText.replace(/\<desc.*\/desc\>/i, "");
                                    }
                                }
                                // save SVG text in cache
                                Colors._cachedSVGText[svgInfo.fileName] = svgText;
                                Log.ret(Log.l.u1);
                                return Colors.loadSVGImage(svgInfo);
                            } catch (exception) {
                                delete Colors._loadingSVGFile[svgInfo.fileName];
                                Log.ret(Log.l.error, "image parse exception " + exception.message);
                                return WinJS.Promise.as();
                            }
                        }, function (err) {
                            delete Colors._loadingSVGFile[svgInfo.fileName];
                            Log.print(Log.l.error, "image load error for " + url + ": " + err);
                            return WinJS.Promise.as();
                        });
                    } catch (ex) {
                        Log.print(Log.l.error, "xhr error " + ex.message);
                        return WinJS.Promise.as();
                    }
                }
            } else {
                Log.print(Log.l.u1, "already in cache");
                // use the cached SVG text
                var insertSvgImage = function (info) {
                    var fileName = info.fileName;
                    var color = info.color;
                    var size = info.size;
                    var useFillColor = info.useFillColor;
                    var useStrokeColor = info.useStrokeColor;
                    var element = info.element;
                    var complete = info.complete;
                    var strokeWidth = info.strokeWidth;
                    if (typeof useFillColor === "undefined") {
                        useFillColor = true;
                    }
                    if (typeof useStrokeColor === "undefined") {
                        useStrokeColor = true;
                    }
                    var svgText = Colors._cachedSVGText[fileName];
                    if (svgText) {
                        var svgObject;
                        if (element) {
                            svgObject = element;
                        } else {
                            svgObject = document.body.querySelector("#" + fileName);
                        }
                        if (svgObject) {
                            svgObject.innerHTML = svgText;
                            var svgRoot = svgObject.firstChild;
                            if (svgRoot) {
                                if (typeof size !== "undefined") {
                                    var width = 0;
                                    var height = 0;
                                    if (size) {
                                        if (typeof size === "number") {
                                            width = size;
                                            height = size;
                                        } else if (typeof size === "object") {
                                            width = size.width;
                                            height = size.height;
                                        }
                                    }
                                    if (!width) {
                                        width = 24;
                                    }
                                    if (!height) {
                                        height = 24;
                                    }
                                    svgRoot.setAttribute("width", width.toString());
                                    svgRoot.setAttribute("height", height.toString());
                                }
                                if (typeof color !== "undefined") {
                                    Colors.changeSVGColor(svgRoot, color, useFillColor, useStrokeColor);
                                }
                                if (typeof strokeWidth !== "undefined") {
                                    Colors.changeSVGStroke(svgRoot, strokeWidth, color, useStrokeColor);
                                }
                                Log.print(Log.l.u1, "completed fileName=" + fileName);
                                if (typeof complete === "function") {
                                    complete(info);
                                }
                            }
                        }
                    }
                    return WinJS.Promise.as();
                };
                ret = insertSvgImage(svgInfo);
            }
            Log.ret(Log.l.u1);
            return ret;
        },
        /**
         * @callback Colors~complete
         * @param {Object} svgInfo - Informations about the inserted SVG graphics document
         * @param {string} svgInfo.fileName - File name (without .svg extension) of the SVG graphics document
         * @param {string} svgInfo.color - Foreground color 
         * @param {number} svgInfo.size - Size (width and height) in px
         * @param {Object} svgInfo.element - The HTML parent element of the SVG graphics document. 
         */
        /**
         * @function loadSVGImageElements
         * @memberof Colors
         * @param {Object} rootElement - The root HTML element to query for elements to load SVG graphics into. 
         * @param {string} className - A class name to query for elements to load SVG graphics into.  
         * @param {number} size - The size (width and height) in px to be used for the SVG graphics documents. 
         * @param {string} color - The color to be used for the path elements in SVG graphics documents.   
         * @param {string} attribute - An attribute name to be used to retrieve the SVG graphics documents file name.   
         *  If no attribute is specified, the id attribute of the HTML elements will be used.
         * @param {Colors~complete} complete - A callback function that is called after the SVG graphics documents file is loaded into the DOM.
         * @description Use this function to convert color values from format to r, g, b number values into a hex string.
         */
        loadSVGImageElements: function (rootElement, className, size, color, attribute, complete, extraOptions) {
            var ret = null;
            var js = {};
            var numJoined = 0;
            Log.call(Log.l.u1, "Colors.", "className=" + className + " size=" + (size ? size.toString() : "null") + " color=" + color);
            if (rootElement) {
                var newElementList = rootElement.querySelectorAll("." + className);
                if (newElementList && newElementList.length > 0) {
                    for (var i = 0; i < newElementList.length; i++) {
                        var id;
                        var element = newElementList[i];
                        if (typeof attribute === "string") {
                            id = element[attribute] || element.getAttribute(attribute);
                        } else {
                            id = element.id;
                        }
                        if (id && id.length > 0 && id.substr(0, 2) !== "{{") {
                            if (typeof size !== "undefined" &&
                                !size && element.style) {
                                size = parseInt(element.style.width);
                            }
                            // insert svg object before span element
                            if (element && !(element.firstElementChild || element.firstChild)) {
                                element.style.display = "inline";
                                var options = {
                                    fileName: id,
                                    color: color,
                                    size: size,
                                    element: element,
                                    complete: complete
                                };
                                if (typeof extraOptions === "object" && typeof extraOptions[id] === "object") {
                                    var extraOption = extraOptions[id];
                                    for (var prop in extraOption) {
                                        if (extraOption.hasOwnProperty(prop)) {
                                            Log.print(Log.l.trace,
                                                "use extraOptions[" + id + "]." + prop + "=" + extraOption[prop]);
                                            options[prop] = extraOption[prop];
                                        }
                                    }
                                }
                                // load the image file
                                js[id] = Colors.loadSVGImage(options);
                                numJoined++;
                            }
                        }
                    }
                }
            }
            if (numJoined > 1) {
                ret = WinJS.Promise.join(js);
            } else {
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.u1);
            return ret;
        },
        /**
         * @property {string} accentColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the accent color to be used by the app UI.
         *  Changing the accent color will automatically update all depending UI element colors of the app.
         *
         *  Style classes (style attribute):
         *
         *  accent-color (color), accent-background-color (background-color)
         */
        accentColor: {
            get: function() { return Colors._colorsClass && Colors._colorsClass._accentColor; },
            set: function(color) {
                Log.call(Log.l.trace, "Colors.accentColor.", "color=" + color);
                if (Colors._colorsClass &&
                    Colors._prevAccentColor !== color) {
                    Colors._colorsClass._accentColor = color;
                    Colors._colorsClass._labelColor = null;
                    Colors._colorsClass._backgroundColor = null;
                    Colors._colorsClass._backgroundColorInitial = null;
                    Colors._colorsClass._textColor = null;
                    Colors._colorsClass._tileBackgroundColor = null;
                    Colors._colorsClass._tileTextColor = null;
                    Colors._colorsClass._navigationColor = null;
                    Colors._colorsClass._navigationColorInitial = null;
                    Colors._colorsClass._dashboardColor = null;
                    Colors._colorsClass._dashboardColorInitial = null;
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} textColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the text color to be used by the app to display data in static text elements.
         *
         *  Style classes (attribute):
         *
         *  window-text-color (color), text-text-color (color !important)
         */
        textColor: {
            get: function() { return Colors._colorsClass && Colors._colorsClass._textColor; },
            set: function(color) {
                Log.call(Log.l.trace, "Colors.textColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._textColor = color;
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} labelColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the text color to be used for labels.
         *
         * Style classes (attribute):
         *
         * label-color (color)
         */
        labelColor: {
            get: function() { return Colors._colorsClass && Colors._colorsClass._labelColor; },
            set: function(color) {
                Log.call(Log.l.trace, "Colors.labelColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._labelColor = color;
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} navigationColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the background color to be used for navigation elements.
         *
         *  Style classes (attribute):
         *
         *  text-navigationcolor (color), navigation-background-color (background-color)
         */
        navigationColor: {
            get: function() { return Colors._colorsClass && Colors._colorsClass._navigationColor; },
            set: function(color) {
                Log.call(Log.l.trace, "Colors.navigationColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._navigationColorInitial = color;
                    if (!Colors.isDarkTheme) {
                        Colors._colorsClass._navigationColor = Colors._colorsClass._navigationColorInitial;
                    } else {
                        var navigationColorRgb = Colors.hex2rgb(Colors._colorsClass._navigationColorInitial);
                        var hsvNavigationColor = Colors.rgb2hsv(navigationColorRgb);
                        if (hsvNavigationColor.v < 50) {
                            navigationColorRgb = Colors.hsv2rgb(
                                hsvNavigationColor.h,
                                hsvNavigationColor.s,
                                100 - hsvNavigationColor.v
                            );
                            Colors._colorsClass._navigationColor = Colors.rgb2hex(navigationColorRgb.r, navigationColorRgb.g, navigationColorRgb.b);
                        } else {
                            Colors._colorsClass._navigationColor = Colors._colorsClass._navigationColorInitial;
                        }
                    }
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
        * @property {string} dashboardColor - Hexadecimal color value string in the format "#rrggbb".
        * @memberof Colors
        * @description Read/Write. Retrieves or sets the background color to be used for dashboard elements.
        */
        dashboardColor: {
            get: function () { return Colors._colorsClass && Colors._colorsClass._dashboardColor; },
            set: function (color) {
                Log.call(Log.l.trace, "Colors.dashboardColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._dashboardColorInitial = color;
                    if (!Colors.isDarkTheme) {
                        Colors._colorsClass._dashboardColor = Colors._colorsClass._dashboardColorInitial;
                    } else {
                        var dashboardColorRgb = Colors.hex2rgb(Colors._colorsClass._dashboardColorInitial);
                        var hsvDashboardColor = Colors.rgb2hsv(dashboardColorRgb);
                        if (hsvDashboardColor.v < 50) {
                            dashboardColorRgb = Colors.hsv2rgb(
                                hsvDashboardColor.h,
                                hsvDashboardColor.s,
                                100 - hsvDashboardColor.v
                            );
                            Colors._colorsClass._dashboardColor = Colors.rgb2hex(dashboardColorRgb.r, dashboardColorRgb.g, dashboardColorRgb.b);
                        } else {
                            Colors._colorsClass._dashboardColor = Colors._colorsClass._dashboardColorInitial;
                        }
                    }
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} backgroundColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the page background color of the app.
         *
         *  Style class (attribute):
         *
         *  contenthost-background (background-color)
         */
        backgroundColor: {
            get: function() { return Colors._colorsClass && Colors._colorsClass._backgroundColor; },
            set: function(color) {
                Log.call(Log.l.trace, "Colors.backgroundColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._backgroundColorInitial = color;
                    if (!Colors.isDarkTheme) {
                        Colors._colorsClass._backgroundColor = Colors._colorsClass._backgroundColorInitial;
                    } else {
                        var backgroundColorRgb = Colors.hex2rgb(Colors._colorsClass._backgroundColorInitial);
                        var hsvBackgroundColor = Colors.rgb2hsv(backgroundColorRgb);
                        if (hsvBackgroundColor.v > 50) {
                            backgroundColorRgb = Colors.hsv2rgb(
                                hsvBackgroundColor.h,
                                hsvBackgroundColor.s,
                                100 - hsvBackgroundColor.v
                            );
                            Colors._colorsClass._backgroundColor = Colors.rgb2hex(backgroundColorRgb.r, backgroundColorRgb.g, backgroundColorRgb.b);
                        } else {
                            Colors._colorsClass._backgroundColor = Colors._colorsClass._backgroundColorInitial;
                        }
                    }
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} selectionBackgroundColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the master background color of the app.
         *
         *  Style class (attribute):
         *
         *  selection-background (background-color)
         */
        selectionBackgroundColor: {
            get: function() { return Colors._colorsClass && Colors._colorsClass._selectionBackgroundColor; },
            set: function(color) {
                Log.call(Log.l.trace, "Colors.selectionBackgroundColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._selectionBackgroundColor = color;
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} masterHostBackgroundColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the master background color of the app.
         *
         *  Style class (attribute):
         *
         *  masterhost-background (background-color)
         */
        masterHostBackgroundColor: {
            get: function() { return Colors._colorsClass && Colors._colorsClass._masterHostBackgroundColor; },
            set: function(color) {
                Log.call(Log.l.trace, "Colors.masterHostBackgroundColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._masterHostBackgroundColorInitial = color;
                    if (!Colors.isDarkTheme) {
                        Colors._colorsClass._masterHostBackgroundColor = Colors._colorsClass._masterHostBackgroundColorInitial;
                    } else {
                        var masterHostBackgroundColorRgb = Colors.hex2rgb(Colors._colorsClass._masterHostBackgroundColorInitial);
                        var hsvMasterHostBackgroundColor = Colors.rgb2hsv(masterHostBackgroundColorRgb);
                        if (hsvMasterHostBackgroundColor.v > 50) {
                            masterHostBackgroundColorRgb = Colors.hsv2rgb(
                                hsvMasterHostBackgroundColor.h,
                                hsvMasterHostBackgroundColor.s,
                                100 - hsvMasterHostBackgroundColor.v
                            );
                            Colors._colorsClass._masterHostBackgroundColor = Colors.rgb2hex(masterHostBackgroundColorRgb.r, masterHostBackgroundColorRgb.g, masterHostBackgroundColorRgb.b);
                        } else {
                            Colors._colorsClass._masterHostBackgroundColor = Colors._colorsClass._masterHostBackgroundColorInitial;
                        }
                    }
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} tileTextColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the text color of tile elements.
         */
        tileTextColor: {
            get: function () { return Colors._colorsClass && Colors._colorsClass._tileTextColor; },
            set: function (color) {
                Log.call(Log.l.trace, "Colors.tileTextColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._tileTextColor = color;
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} tileBackgroundColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the background color of tile elements.
         */
        tileBackgroundColor: {
            get: function () { return Colors._colorsClass && Colors._colorsClass._tileBackgroundColor; },
            set: function (color) {
                Log.call(Log.l.trace, "Colors.tileBackgroundColor.", "color=" + color);
                if (Colors._colorsClass) {
                    Colors._colorsClass._tileBackgroundColor = color;
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {string} tileBorderColor - Hexadecimal color value string in the format "#rrggbb".
         * @memberof Colors
         * @description Read-only. Retrieves the border color of tile elements.
         */
        tileBorderColor: {
            get: function () { return Colors._colorsClass && Colors._colorsClass._tileBorderColor; }
        },
        /**
         * @property {boolean} isDarkTheme - True if the app is displayed in dark UI theme. Otherwise false.
         * @memberof Colors
         * @description Read/Write. Retrieves or sets if the app is displayed in dark UI theme.
         *  Changing the theme will automatically redraw all UI element of the app.
         *
         *  Style class set to document.body when dark UI theme is active:
         *  cnv-ui-dark
         */
        isDarkTheme: {
            get: function () { return AppData._persistentStates.isDarkTheme; },
            set: function(isDarkTheme) {
                Log.call(Log.l.trace, "Colors.backgroundColor.", "isDarkTheme=" + isDarkTheme);
                AppData._persistentStates.isDarkTheme = isDarkTheme;
                if (Colors._prevIsDarkTheme === isDarkTheme) {
                    // extra ignored
                } else {
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {number} inputBorder - Border size of HTML input elements in px.
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the border size of HTML input elements in px.
         */
        inputBorder: {
            get: function () { return AppData._persistentStates.inputBorder; },
            set: function (inputBorder) {
                Log.call(Log.l.trace, "Colors.backgroundColor.", "inputBorder=" + inputBorder);
                AppData._persistentStates.inputBorder = inputBorder;
                if (Colors._prevInputBorder === inputBorder) {
                    // extra ignored
                } else {
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {number} inputBorderRadius - Border radius of HTML input elements in px.
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the border size of HTML input elements in px.
         */
        inputBorderRadius: {
            get: function () { return AppData._persistentStates.inputBorderRadius; },
            set: function (inputBorderRadius) {
                Log.call(Log.l.trace, "Colors.backgroundColor.", "inputBorder=" + inputBorderRadius);
                AppData._persistentStates.inputBorderRadius = inputBorderRadius;
                if (Colors._prevInputBorderRadius === inputBorderRadius) {
                    // extra ignored
                } else {
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @property {number} inputBorderBottom - HTML input elements show only bottom-line.
         * @memberof Colors
         * @description Read/Write. Retrieves or sets the border size of HTML input elements in px.
         */
        inputBorderBottom: {
            get: function () { return AppData._persistentStates.inputBorderBottom; },
            set: function (inputBorderBottom) {
                Log.call(Log.l.trace, "Colors.backgroundColor.", "inputBorderBottom=" + inputBorderBottom);
                AppData._persistentStates.inputBorderBottom = inputBorderBottom;
                if (Colors._prevInputBorderBottom === inputBorderBottom) {
                    // extra ignored
                } else {
                    Colors.updateColors();
                }
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @function updateColors
         * @memberof Colors
         * @description Use this function to update all UI elements with new color settings and save the color settings in persistent application state.
         */
        updateColors: function () {
            Log.call(Log.l.trace, "Colors.", "");
            var ret;
            if (Colors._colorsClass &&
                (Colors._prevAccentColor !== Colors._colorsClass._accentColor ||
                 Colors._prevTextColor !== Colors._colorsClass._textColor ||
                 Colors._prevLabelColor !== Colors._colorsClass._labelColor ||
                 Colors._prevNavigationColor !== Colors._colorsClass._navigationColorInitial ||
                 Colors._prevBackgroundColor !== Colors._colorsClass._backgroundColorInitial ||
                 Colors._prevMasterHostBackgroundColor !== Colors._colorsClass._masterHostBackgroundColorInitial ||
                 Colors._prevSelectionBackgroundColor !== Colors._colorsClass._selectionBackgroundColor ||
                 Colors._prevTileTextColor !== Colors._colorsClass._tileTextColor ||
                 Colors._prevTileBackgroundColor !== Colors._colorsClass._tileBackgroundColor ||
                 Colors._prevDashboardColor !== Colors._colorsClass._dashboardColor ||
                 Colors._prevIsDarkTheme !== Colors.isDarkTheme ||
                 Colors._prevInputBorder !== AppData._persistentStates.inputBorder ||
                 Colors._prevInputBorderRadius !== AppData._persistentStates.inputBorderRadius ||
                 Colors._prevInputBorderBottom !== AppData._persistentStates.inputBorderBottom)) {
                var colorSettings;
                if (!AppData._persistentStates.individualColors) {
                    colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                } else {
                    colorSettings = {
                        accentColor: Colors._colorsClass._accentColor,
                        textColor: Colors._colorsClass._textColor,
                        labelColor: Colors._colorsClass._labelColor,
                        navigationColor: Colors._colorsClass._navigationColorInitial,
                        backgroundColor: Colors._colorsClass._backgroundColorInitial,
                        masterHostBackgroundColor: Colors._colorsClass._masterHostBackgroundColorInitial,
                        selectionBackgroundColor: Colors._colorsClass._selectionBackgroundColor,
                        tileTextColor: Colors._colorsClass._tileTextColor,
                        tileBackgroundColor: Colors._colorsClass._tileBackgroundColor,
                        dashboardColor:
                            Colors._colorsClass._dashboardColorInitial ||
                            Colors._colorsClass._navigationColorInitial //similar to navigationColor
                    };
                }
                ret = new Colors.ColorsClass(colorSettings, true);
                var promise = ret._loadCssPromise || WinJS.Promise.timeout(0);
                promise.then(function() {
                    Colors.customColorsSet = false;
                    if (!AppData._persistentStates.colorSettings) {
                        AppData._persistentStates.colorSettings = {};
                    }
                    AppData._persistentStates.colorSettings.accentColor = Colors.accentColor;
                    AppData._persistentStates.colorSettings.textColor = Colors.textColor;
                    AppData._persistentStates.colorSettings.labelColor = Colors.labelColor;
                    AppData._persistentStates.colorSettings.navigationColor = Colors._colorsClass._navigationColorInitial;
                    AppData._persistentStates.colorSettings.backgroundColor = Colors._colorsClass._backgroundColorInitial;
                    AppData._persistentStates.colorSettings.masterHostBackgroundColor = Colors._colorsClass._masterHostBackgroundColorInitial;
                    AppData._persistentStates.colorSettings.selectionBackgroundColor = Colors.selectionBackgroundColor;
                    AppData._persistentStates.colorSettings.tileTextColor = Colors.tileTextColor;
                    AppData._persistentStates.colorSettings.tileBackgroundColor = Colors.tileBackgroundColor;
                    AppData._persistentStates.colorSettings.dashboardColor =
                        Colors._colorsClass._dashboardColorInitial ||
                        Colors._colorsClass._navigationColorInitial; 
                    Application.pageframe.savePersistentStates();
                    Application.pageframe.updateLayout();
                });
            } else {
                ret = null;
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        _prevAccentColor: null,
        _prevTextColor: null,
        _prevLabelColor: null,
        _prevNavigationColor: null,
        _prevDashboardColor: null,
        _prevBackgroundColor: null,
        _prevMasterHostBackgroundColor: null,
        _prevSelectionBackgroundColor: null,
        _prevTileTextColor: null,
        _prevTileBackgroundColor: null,
        _prevIsDarkTheme: null,
        _prevInputBorder: null,
        _prevInputBorderRadius: null,
        _prevInputBorderBottom: null,
        _colorsClass: null,
        _cachedSVGText: {},
        _loadingSVGFile: {},
        customColorsSet: false
    });
})();
