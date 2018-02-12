// implements a color picker control via SVG
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/colors.js" />

/**
 * The class in this namespace provides a color picker control to be used for interactive selection of color values.
 * @namespace ColorPicker
 */

(function () {
    "use strict";

    WinJS.Namespace.define("ColorPicker", {
        getColorFromNumber: function (number) {
            Log.call(Log.l.u2, "ColorPicker.", "number=" + number);
            var r = 255;
            var g = 0;
            var b = number;
            if (b > 255) {
                r = r - (b - 255);
                b = 255;
            }
            if (r < 0) {
                g = g - r;
                r = 0;
            }
            if (g > 255) {
                b = b - (g - 255);
                g = 255;
            }
            if (b < 0) {
                r = r - b;
                b = 0;
            }
            if (r > 255) {
                g = g - (r - 255);
                r = 255;
            }

            r = Math.floor(r);
            g = Math.floor(g);
            b = Math.floor(b);
            Log.ret(Log.l.u2,"r=" + r + " g=" + g + " b=" + b);
            return {
                r: r,
                g: g,
                b: b
            };
        },
        getSVGRectTag: function(id, x, y, width, height, rgb) {
            return "<rect id='" + id +
                "' x='" + x.toString() + "' y='" + y.toString() + "' width='" + width.toString() + "' height='" + height.toString() +
                "' fill='rgb(" + rgb.r.toString() + "," + rgb.g.toString() + "," + rgb.b.toString() + ")' />";
        },
        /**
         * @class ColorPickerClass 
         * @memberof ColorPicker
         * @param {Object} element - A HTML element to host the color picker control
         * @param {number} size - Number of the color selection cells per row to be used in the picker.
         * @param {number} px - Width and height of the color selection cells to be used in the picker.
         * @param {string} color - Preselected color value "#rrggbb".
         * @param {function} A Setter to be called on color selection change.
         * @description Use this class to display a color picker control. Example:
         *  <pre>
            var colorPicker = new ColorPicker.ColorPickerClass(
                        element, 10, 28, "#ff0000",
                        function (color) { 
                            // callback function for change of color property
                            // do anything with the newly selected color value
                        }
                    );
           </pre>
         */
        ColorPickerClass: WinJS.Class.define(
            // Define the constructor function for the ColorPickerClass.
            function ColorPickerClass(element, size, px, color, setter) {
                Log.call(Log.l.trace, "ColorPicker.", "id=" + element.id + " size=" + size + " px=" + px + " color=" + color);
                var colorContainer = element.querySelector(".color_container");
                if (colorContainer && colorContainer.colorPicker &&
                    typeof colorContainer.colorPicker._dispose === "function") {
                    colorContainer.colorPicker._dispose();
                    colorContainer.colorPicker = null;
                    element.innerHTML = "";
                }
                this._element = element;
                this._px = px;
                this._widthCell = Math.round(px * 5 / 4); //Math.round(px * 5 / 4);
                this._size = size;
                this._setter = setter;

                this._eventHandlerRemover = [];
                var that = this;
                this.addRemovableEventListener = function (e, eventName, handler, capture) {
                    e.addEventListener(eventName, handler, capture);
                    that._eventHandlerRemover.push(function () {
                        e.removeEventListener(eventName, handler);
                    });
                };

                this._createColorsContainer(color);
                Log.ret(Log.l.trace);
            }, {
                _element: null,
                _setter: null,
                _color: null,
                _triggerElement: null,
                _size: 0,
                _widthCell: 0,
                _px: 0,
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
                _createColorsContainer: function (color) {
                    var cpTrigger, cpOverallContainer, colorcontainer, graphicscontainer;
                    Log.call(Log.l.trace, "ColorPicker.ColorPickerClass.");
                    var element = this._element;
                    var rgbColor = Colors.hex2rgb(color);

                    var px = this._px;
                    var widthCell = this._widthCell;
                    var size = this._size;

                    var widthContainer = widthCell * size;
                    var heightContainer = widthCell * (2 * size);
                    var borderContainer = px / 8;

                    if (!element.childElementCount) {
                        // create div inside parent element to trigger popup of actual color picker
                        cpTrigger = document.createElement("div");
                        cpTrigger.id = element.id;
                        cpTrigger.className = "color_picker_trigger";
                        cpTrigger.style.backgroundColor = color;
                        cpTrigger.style.borderColor = Colors.isDarkTheme ? "black" : "white";

                        this.addRemovableEventListener(cpTrigger, "click", this.clickTrigger.bind(this));
                        element.appendChild(cpTrigger);
                        this._triggerElement = cpTrigger;

                        // create div for surrounding container of color picker SVG graphics
                        cpOverallContainer = document.createElement("div");
                        cpOverallContainer.id = element.id;
                        cpOverallContainer.className = "color_picker_container";
                        cpOverallContainer.style.display = "none";
                        element.appendChild(cpOverallContainer);

                        // create div for color selection, later overlays SVG graphics
                        colorcontainer = document.createElement("div");
                        colorcontainer.id = element.id;
                        colorcontainer.className = "color_container";
                        colorcontainer.setAttribute(
                            "style",
                            "width: " +
                            (widthContainer - borderContainer).toString() +
                            "px; " +
                            "height: " +
                            (heightContainer - borderContainer).toString() +
                            "px; " +
                            "position: relative; left: 0px; top: -" +
                            heightContainer.toString() +
                            "px;"
                        );
                        this.addRemovableEventListener(colorcontainer, "click", this.clickColor.bind(this));
                        colorcontainer.colorPicker = this;
                        cpOverallContainer.appendChild(colorcontainer);
                    } else {
                        // find div inside parent element to trigger popup of actual color picker
                        cpTrigger = this._triggerElement;
                        if (cpTrigger && cpTrigger.style) {
                            cpTrigger.style.backgroundColor = color;
                        }
                        cpOverallContainer = element.querySelector(".color_picker_container");
                        colorcontainer = element.querySelector(".color_container");
                        graphicscontainer = element.querySelector(".graphics_container");
                        if (graphicscontainer) {
                            graphicscontainer.parentNode.removeChild(graphicscontainer);
                            graphicscontainer.innerHTML = "";
                            graphicscontainer = null;
                        }
                    }
                    if (cpOverallContainer && colorcontainer) {
                        // create SVG graphics string
                        var strSvg = "<svg xmlns='http://www.w3.org/2000/svg'" +
                            " xml:space='preserve' shape-rendering='geometricPrecision'" +
                            " text-rendering='geometricPrecision' image-rendering='optimizeQuality'" +
                            " fill-rule='nonzero' clip-rule='evenodd'" +
                            " xmlns:xlink='http://www.w3.org/1999/xlink'" +
                            " width='" +
                            widthContainer.toString() +
                            "px'" +
                            " height='" +
                            heightContainer.toString() +
                            "px'" +
                            " viewBox='0 0 " +
                            widthContainer.toString() +
                            " " +
                            heightContainer.toString() +
                            "'>";
                        var iPre = 0;
                        var minDist = 256 * 256;
                        var x = 0;
                        var size2 = 2 * size;
                        var maxBSize = 1530; //256 * 5 = 1530 ?!; 
                        for (var i = 0; i < size; i++) {
                            var y = 0;
                            //create color
                            var rgb = ColorPicker.getColorFromNumber((maxBSize / size) * (i + 1));
                            var dist =
                                (rgbColor.r - rgb.r) * (rgbColor.r - rgb.r) +
                                    (rgbColor.g - rgb.g) * (rgbColor.g - rgb.g) +
                                    (rgbColor.b - rgb.b) * (rgbColor.b - rgb.b);
                            if (dist < minDist) {
                                iPre = i;
                                minDist = dist;
                            }
                            for (var j = 0; j < size2; j++) {
                                var id = element.id + "_color_" + i.toString() + "_" + j.toString();
                                strSvg = strSvg + ColorPicker.getSVGRectTag(id, x, y, px, px, rgb);
                                y += widthCell;
                            }
                            x += widthCell;
                        }
                        strSvg = strSvg + "</svg>";

                        // create div for SVG graphics
                        graphicscontainer = document.createElement("svg");
                        graphicscontainer.className = "graphics_container";
                        graphicscontainer.setAttribute(
                            "style",
                            "width: " +
                            widthContainer.toString() +
                            "px; " +
                            "height: " +
                            heightContainer.toString() +
                            "px; " +
                            "position: relative; left: 0px; top: " +
                            borderContainer.toString() +
                            "px;"
                        );
                        graphicscontainer.innerHTML = strSvg;
                        cpOverallContainer.insertBefore(graphicscontainer, colorcontainer);

                        this.selectMaincolor(colorcontainer, iPre);
                    }
                    this._color = color;
                    Log.ret(Log.l.trace);
                },
                color: {
                    get: function() {
                         return this._color;
                    },
                    set: function(color) {
                        this._createColorsContainer(color);
                    }
                },
                triggerElement: {
                    get: function() { return this._triggerElement; }
                },
                clickTrigger: function(eventObject) {
                    Log.call(Log.l.trace, "ColorPicker.ColorPickerClass.");
                    var element = eventObject.srcElement || eventObject.target;
                    if (element) {
                        var tmpCpContainer = this._element && this._element.querySelector("#" + element.id + " .color_picker_container");
                        if (tmpCpContainer.style) {
                            tmpCpContainer.style.display = (tmpCpContainer.style.display === "none") ? "inline-block" : "none";
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickColor: function(eventObject) {
                    Log.call(Log.l.trace, "ColorPicker.ColorPickerClass.");
                    var element = eventObject.srcElement || eventObject.target;
                    if (element) {
                        var colorPicker = element.colorPicker;
                        if (colorPicker) {
                            var widthCell = colorPicker._widthCell;
                            var pt = Application.pageframe.screenToClient(
                                element,
                                Application.pageframe.getMsgCursorPos(eventObject)
                            );
                            console.log(pt);
                            var row = Math.floor(pt.y / (widthCell)); //pt.y
                            var col = Math.floor(pt.x / (widthCell)); //pt.x
                            //Zeile Spalten anpassen @byhung
                            row = row - 1;
                            col = col - 1;
                            Log.print(Log.l.trace,
                                "clickColor: x=" + pt.x.toString() + " y=" + pt.y.toString() +
                                " row=" + row.toString() + " col=" + col.toString()
                            );
                            if (col >= 0 && col <= colorPicker._size) {
                                if (row === 0) {
                                    colorPicker.selectMaincolor(element, col);
                                } else if (row > 0 && row <= 2*colorPicker._size &&
                                    colorPicker._triggerElement) {
                                    var id = element.id + "_color_" + col.toString() + "_" + row.toString();
                                    var rect = this._element && this._element.querySelector("#" + id);
                                    if (rect) {
                                        var fill = rect.getAttribute("fill");
                                        var rgb = Colors.rgbStr2rgb(fill);
                                        var color = Colors.rgb2hex(rgb.r, rgb.g, rgb.b);
                                        Log.print(Log.l.trace,
                                            "clickColor: id=" + id +
                                            " fill=" + fill +
                                            " r=" + rgb.r.toString() + " g=" + rgb.g.toString() + " b=" + rgb.b.toString() +
                                            " color=" + color
                                        );
                                        if (colorPicker._triggerElement.style) {
                                            colorPicker._triggerElement.style.backgroundColor = color;
                                        }
                                        colorPicker._color = color;
                                        colorPicker.clickTrigger(eventObject);
                                        if (colorPicker._setter) {
                                            colorPicker._setter(color);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                selectMaincolor: function(element, i) {
                    Log.call(Log.l.trace, "ColorPicker.ColorPickerClass.", "i=" + i);
                    if (element) {
                        var colorPicker = element.colorPicker;
                        if (colorPicker) {
                            var size = colorPicker._size;
                            var id = element.id + "_color_" + i.toString() + "_0";
                            var rect = this._element && this._element.querySelector("#" + id);
                            if (rect) {
                                var fill = rect.getAttribute("fill");
                                var rgb = Colors.rgbStr2rgb(fill);
                                var r = rgb.r;
                                var g = rgb.g;
                                var b = rgb.b;
                                var newR = rgb.r;
                                var newG = rgb.g;
                                var newB = rgb.b;
                                var size1 = size - 1;
                                var size2 = 2*size - 1;

                                for (var j = 0; j <= size1; j++) {
                                    for (var k = 0; k <= size2; k++) {
                                        if (r === 255) {
                                            newR = Math.round(Math.abs(r - ((255 / (size1)) * (j))));
                                        } else {
                                            var helpR1 = Math.round(Math.abs(255 - ((255 / (size1)) * (j))));
                                            newR = Math.round(Math.abs(r - ((r / (size1)) * (j))));
                                            var helpR2 = helpR1 - newR;
                                            newR += ((helpR2 / (size2)) * (k));
                                            newR = Math.round(newR);
                                        }

                                        if (g === 255) {
                                            newG = Math.round(Math.abs(g - ((255 / (size1)) * (j))));
                                        } else {
                                            var helpG1 = Math.round(Math.abs(255 - ((255 / (size1)) * (j))));
                                            newG = Math.round(Math.abs(g - ((g / (size1)) * (j))));
                                            var helpG2 = helpG1 - newG;
                                            newG += ((helpG2 / (size2)) * (k));
                                            newG = Math.round(newG);
                                        }

                                        if (b === 255) {
                                            newB = Math.round(Math.abs(b - ((255 / (size1)) * (j))));
                                        } else {
                                            var helpB1 = Math.round(Math.abs(255 - ((255 / (size1)) * (j))));
                                            newB = Math.round(Math.abs(b - ((b / (size1)) * (j))));
                                            var helpB2 = helpB1 - newB;
                                            newB += ((helpB2 / (size2)) * (k));
                                            newB = Math.round(newB);
                                        }
                                        var row = k + 1;
                                        id = element.id + "_color_" + j.toString() + "_" + row.toString();
                                        rect = this._element && this._element.querySelector("#" + id);
                                        if (rect) {
                                            rect.setAttribute("fill", "rgb(" + newR + "," + newG + "," + newB + ")");
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            }
        )
    });
})();
