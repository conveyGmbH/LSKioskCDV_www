// Image Tools capsulated in Promise
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />

/**
 * Use the functions in this namespace to access SQLite databases encapsulated in a WinJS Promise Object.
 * @namespace ImgTools
 */

(function () {
    "use strict";

    function schedule(f, arg, priority) {
        WinJS.Utilities.Scheduler.schedule(function() {
            f(arg);
        }, priority, null, "ImgTools.crop");
    }

    WinJS.Namespace.define("ImgTools", {
        Crop: WinJS.Class.define(function (data, square) {
            Log.call(Log.l.trace, "ImgTools.Crop.");
            var element = document.createElement("div");
            var image = new Image();
            element.appendChild(image);
            var canvas = document.createElement("canvas");
            element.appendChild(canvas);

            var closeButton = document.createElement("span");
            var okButton = document.createElement("span");

            var dataUrlMimeType = "data:image/jpeg;base64,";
            if (data.substr(0, dataUrlMimeType.length) !== dataUrlMimeType) {
                data = dataUrlMimeType + data;
            }
            var handleRadius = 20;
            var minSide = 100;

            var left = 0;
            var top = 0;
            var width = 0;
            var height = 0;
            var scale = 1;


            var dragL = false;
            var dragR = false;
            var dragT = false;
            var dragB = false;
            var dragTL = false;
            var dragBL = false;
            var dragTR = false;
            var dragBR = false;
            var dragWholeRect = false;

            var rect = {}

            var mouseX, mouseY;
            var startX, startY;

            var that = this;

            function drawCircle(x, y, radius) {
                var ctx = canvas.getContext("2d");
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.beginPath();
                ctx.arc(x-0.14, y-0.14, radius+1, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = "#e7e7ff";
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
            }

            function drawHandles() {
                drawCircle(rect.left, rect.top, handleRadius);
                drawCircle(rect.left + rect.width, rect.top, handleRadius);
                drawCircle(rect.left + rect.width, rect.top + rect.height, handleRadius);
                drawCircle(rect.left, rect.top + rect.height, handleRadius);
                if (!square) {
                    drawCircle(rect.left, rect.top + rect.height / 2, handleRadius);
                    drawCircle(rect.left + rect.width, rect.top + rect.height / 2, handleRadius);
                    drawCircle(rect.left + rect.width / 2, rect.top, handleRadius);
                    drawCircle(rect.left + rect.width / 2, rect.top + rect.height, handleRadius);
                }
            }


            function drawRectInCanvas() {
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.fillStyle = "rgba(64, 64, 64, 0.6)";
                ctx.rect(0, 0, canvas.width, rect.top);
                ctx.rect(0, rect.top, rect.left, rect.height);
                ctx.rect(rect.left + rect.width, rect.top, canvas.width - (rect.left + rect.width), rect.height);
                ctx.rect(0, rect.top + rect.height, canvas.width, canvas.height - rect.height);
                ctx.fill();
                ctx.beginPath();
                ctx.lineWidth = "6";
                //ctx.fillStyle = "rgba(231, 231, 255, 0.2)";
                ctx.strokeStyle = "#e7e7ff";
                ctx.rect(rect.left, rect.top, rect.width, rect.height);
                //ctx.fill();
                ctx.stroke();
                drawHandles();
            }
            //drawRectInCanvas() connected functions -- END

            function mouseUp(e) {
                dragTL = dragTR = dragBL = dragBR = false;
                if (!square) {
                    dragL = dragR = dragT = dragB = false;
                }
                dragWholeRect = false;
            }

            //mousedown connected functions -- START
            function checkInRect(x, y, r) {
                return (x > r.left && x < (r.width + r.left)) && (y > r.top && y < (r.top + r.height));
            }

            function checkCloseEnough(p1, p2) {
                return Math.abs(p1 - p2) < handleRadius;
            }

            function getMousePos(evt) {
                var clx, cly;
                if (evt.type === "touchstart" || evt.type === "touchmove") {
                    clx = evt.touches[0].clientX;
                    cly = evt.touches[0].clientY;
                } else {
                    clx = evt.clientX;
                    cly = evt.clientY;
                }
                var boundingRect = canvas.getBoundingClientRect();
                return {
                    x: clx - boundingRect.left,
                    y: cly - boundingRect.top
                };
            }

            function mouseDown(e) {
                var pos = getMousePos(e);
                mouseX = pos.x;
                mouseY = pos.y;
                startX = mouseX;
                startY = mouseY;
                // 1. top left
                if (checkCloseEnough(mouseX, rect.left) && checkCloseEnough(mouseY, rect.top)) {
                    dragTL = true;
                }
                // 2. top right
                else if (checkCloseEnough(mouseX, rect.left + rect.width) && checkCloseEnough(mouseY, rect.top)) {
                    dragTR = true;
                }
                // 3. bottom left
                else if (checkCloseEnough(mouseX, rect.left) && checkCloseEnough(mouseY, rect.top + rect.height)) {
                    dragBL = true;
                }
                // 4. bottom right
                else if (checkCloseEnough(mouseX, rect.left + rect.width) && checkCloseEnough(mouseY, rect.top + rect.height)) {
                    dragBR = true;
                }
                // 5. left
                else if (!square && checkCloseEnough(mouseX, rect.left) && checkCloseEnough(mouseY, rect.top + rect.height / 2)) {
                    dragL = true;
                }
                // 6. right
                else if (!square && checkCloseEnough(mouseX, rect.left + rect.width) && checkCloseEnough(mouseY, rect.top + rect.height / 2)) {
                    dragR = true;
                }
                // 7. top
                else if (!square && checkCloseEnough(mouseX, rect.left + rect.width / 2) && checkCloseEnough(mouseY, rect.top)) {
                    dragT = true;
                }
                // 8. top
                else if (!square && checkCloseEnough(mouseX, rect.left + rect.width / 2) && checkCloseEnough(mouseY, rect.top + rect.height)) {
                    dragB = true;
                }
                // 9. inside movable rectangle
                else if (checkInRect(mouseX, mouseY, rect)) {
                    dragWholeRect = true;
                }
                drawRectInCanvas();
            }
            //mousedown connected functions -- END

            function mouseMove(e) {
                var newSide, newWidth, newHeight;
                var pos = getMousePos(e);
                mouseX = pos.x;
                mouseY = pos.y;
                var dx = mouseX - startX;
                var dy = mouseY - startY;
                if (dragWholeRect) {
                    e.preventDefault();
                    e.stopPropagation();
                    if ((rect.left + dx) > 0 && (rect.left + dx + rect.width) < canvas.width) {
                        rect.left += dx;
                    }
                    if ((rect.top + dy) > 0 && (rect.top + dy + rect.height) < canvas.height) {
                        rect.top += dy;
                    }
                } else if (dragL) {
                    e.preventDefault();
                    e.stopPropagation();
                    newWidth = rect.width - dx;
                    if (newWidth >= minSide) {
                        rect.left += dx;
                        rect.width = newWidth;
                    }
                } else if (dragTL) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (square) {
                        newSide = (Math.abs(rect.left + rect.width - mouseX) + Math.abs(rect.height + rect.top - mouseY)) / 2;
                        if (newSide >= minSide) {
                            rect.left = rect.left + rect.width - newSide;
                            rect.top = rect.height + rect.top - newSide;
                            rect.width = rect.height = newSide;
                        }
                    } else {
                        newWidth = rect.width - dx;
                        newHeight = rect.height - dy;
                        if (newWidth >= minSide) {
                            rect.left += dx;
                            rect.width = newWidth;
                        }
                        if (newHeight >= minSide) {
                            rect.top += dy;
                            rect.height = newHeight;
                        }
                    }
                } else if (dragR) {
                    e.preventDefault();
                    e.stopPropagation();
                    newWidth = rect.width + dx;
                    if (newWidth >= minSide) {
                        rect.width = newWidth;
                    }
                } else if (dragTR) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (square) {
                        newSide = (Math.abs(mouseX - rect.left) + Math.abs(rect.height + rect.top - mouseY)) / 2;
                        if (newSide >= minSide) {
                            rect.top = rect.height + rect.top - newSide;
                            rect.width = rect.height = newSide;
                        }
                    } else {
                        newWidth = rect.width + dx;
                        newHeight = rect.height - dy;
                        if (newWidth >= minSide) {
                            rect.width = newWidth;
                        }
                        if (newHeight >= minSide) {
                            rect.top += dy;
                            rect.height = newHeight;
                        }
                    }
                } else if (dragT) {
                    e.preventDefault();
                    e.stopPropagation();
                    newHeight = rect.height - dy;
                    if (newHeight >= minSide) {
                        rect.top += dy;
                        rect.height = newHeight;
                    }
                } else if (dragBL) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (square) {
                        newSide = (Math.abs(rect.left + rect.width - mouseX) + Math.abs(rect.top - mouseY)) / 2;
                        if (newSide >= minSide) {
                            rect.left = rect.left + rect.width - newSide;
                            rect.width = rect.height = newSide;
                        }
                    } else {
                        newWidth = rect.width - dx;
                        newHeight = rect.height + dy;
                        if (newWidth >= minSide) {
                            rect.left += dx;
                            rect.width = newWidth;
                        }
                        if (newHeight >= minSide) {
                            rect.height = newHeight;
                        }
                    }
                } else if (dragB) {
                    e.preventDefault();
                    e.stopPropagation();
                    newHeight = rect.height + dy;
                    if (newHeight >= minSide) {
                        rect.height = newHeight;
                    }
                } else if (dragBR) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (square) {
                        newSide = (Math.abs(rect.left - mouseX) + Math.abs(rect.top - mouseY)) / 2;
                        if (newSide >= minSide) {
                            rect.width = rect.height = newSide;
                        }
                    } else {
                        newWidth = rect.width + dx;
                        newHeight = rect.height + dy;
                        if (newWidth >= minSide) {
                            rect.width = newWidth;
                        }
                        if (newHeight >= minSide) {
                            rect.height = newHeight;
                        }
                    }
                }
                startX = mouseX;
                startY = mouseY;
                drawRectInCanvas();
            }

            function initRect() {
                //BORDER OF SIZE 6
                if (square) {
                    var newSide;
                    if (width > height) {
                        newSide = height - handleRadius;
                        rect.top = handleRadius / 2;
                        rect.left = (width - newSide) / 2 + handleRadius / 2;
                    } else {
                        newSide = width - handleRadius;
                        rect.top = (height - newSide) / 2 + handleRadius / 2;
                        rect.left = handleRadius / 2;
                    }
                    rect.height = newSide - handleRadius;
                    rect.width = newSide - handleRadius;
                } else {
                    rect.left = handleRadius / 2;
                    rect.top = handleRadius / 2;
                    rect.width = width - handleRadius;
                    rect.height = height - handleRadius;
                }
            }

            function initButtonStyle(button) {
                if (button.style) {
                    button.style.width = "40px";
                    button.style.height = "40px";
                    button.style.margin = "0 20px";
                    button.style.fontFamily = "Symbols";
                    button.style.color = "#ffffff";
                    button.style.fontSize = "32px";
                    button.style.textAlign = "center";
                    button.style.cursor = "default";
                }
            }
            function initElement() {
                var navigationButtonsDiv = document.createElement("div");
                if (navigationButtonsDiv.style) {
                    navigationButtonsDiv.style.height = "48px";
                    navigationButtonsDiv.style.width = "100%";
                    navigationButtonsDiv.style.paddingTop = "4px";
                    navigationButtonsDiv.style.zIndex = "9999998";
                    navigationButtonsDiv.style.textAlign = "center";
                    navigationButtonsDiv.style.userSelect = "none";
                    navigationButtonsDiv.style.display = "block";
                    navigationButtonsDiv.style.position = "absolute";
                    navigationButtonsDiv.style.bottom = "0";
                    navigationButtonsDiv.style.backgroundColor = "rgba(0,0,0,0.2)";
                }
                initButtonStyle(closeButton);
                if (closeButton.style) {
                    closeButton.style.display = square ? "none" : "block";
                    closeButton.style.position = "absolute";
                    closeButton.style.left = "0";
                }
                closeButton.textContent = "\uE1C5"; // undo clip rect
                //closeButton.textContent = "\uE1D9"; // maximize
                //closeButton.textContent = "\uE106"; // cancel
                //closeButton.textContent = "\uE0BA"; // back
                navigationButtonsDiv.appendChild(closeButton);
                var okButtonBkg = document.createElement("span");
                if (okButtonBkg.style) {
                    okButtonBkg.style.height = "80px";
                    okButtonBkg.style.width = "80px";
                    okButtonBkg.style.borderWidth = "40px";
                    okButtonBkg.style.borderRadius = "40px";
                    okButtonBkg.style.display = "block";
                    okButtonBkg.style.position = "absolute";
                    okButtonBkg.style.right = "0";
                    okButtonBkg.style.bottom = "-20px";
                    okButtonBkg.style.backgroundColor = "#ffffff";
                }
                navigationButtonsDiv.appendChild(okButtonBkg);
                initButtonStyle(okButton);
                if (okButton.style) {
                    okButton.style.display = "block";
                    okButton.style.position = "absolute";
                    okButton.style.right = "0";
                    okButton.style.color = "#000000";
                }
                okButton.textContent = "\uE0E7"; // save
                navigationButtonsDiv.appendChild(okButton);
                element.appendChild(navigationButtonsDiv);

                if (element.style) {
                    element.style.display = "block";
                    element.style.position = "absolute";
                    element.style.zIndex = "10099";
                    element.style.left = "0";
                    element.style.top = "0";
                    element.style.width = "100%";
                    element.style.height = "100%";
                    element.style.backgroundColor = "#000000";
                    element.style.color = "#ffffff";
                }
                document.body.appendChild(element);
            }

            var resized = function (ev) {
                if (image && image.naturalWidth && image.naturalHeight && element) {
                    var maxWidth = element.clientWidth;
                    var maxHeight = element.clientHeight - 52;
                    var prevLeft = left;
                    var prevTop = top;
                    var prevScale = scale;

                    if (image.naturalWidth * maxHeight >= maxWidth * image.naturalHeight) {
                        scale = maxWidth / image.naturalWidth;
                        width = maxWidth;
                        height = scale * image.naturalHeight;
                        left = 0;
                        top = (maxHeight - height) / 2;
                    } else {
                        scale = maxHeight / image.naturalHeight;
                        width = scale * image.naturalWidth;
                        height = maxHeight;
                        left = (maxWidth - width) / 2;
                        top = 0;
                    }
                    if (image.style) {
                        image.style.display = "block";
                        image.style.position = "absolute";
                        image.style.left = left + "px";
                        image.style.top = top + "px";
                        image.style.width = width + "px";
                        image.style.height = height + "px";
                    }
                    canvas.height = height;
                    canvas.width = width;
                    if (canvas.style) {
                        canvas.style.display = "block";
                        canvas.style.position = "absolute";
                        canvas.style.top = top + "px";
                        canvas.style.left = left + "px";
                    }
                    if (prevScale) {
                        var scaling = scale / prevScale;
                        rect.top *= scaling;
                        rect.left *= scaling;
                        rect.height *= scaling;
                        rect.width *= scaling;
                    }
                    drawRectInCanvas();
                }
            };
            window.addEventListener("resize", resized);

            var priority = WinJS.Utilities.Scheduler.currentPriority;
            var complete = null;
            var cancel = null;
            function onCloseButtonClick(e) {
                if (typeof cancel === "function") {
                    e.preventDefault();
                    e.stopPropagation();
                    complete(null);
                }
            }
            function onOkButtonClick(e) {
                if (typeof complete === "function") {
                    e.preventDefault();
                    e.stopPropagation();
                    var cropCanvas = document.createElement('canvas');
                    cropCanvas.width = rect.width;
                    cropCanvas.height = rect.height;
                    var ctx = cropCanvas.getContext("2d");
                    ctx.drawImage(image, -rect.left, -rect.top, width, height);
                    // The resized file ready for upload
                    var cropData = cropCanvas.toDataURL("image/jpeg", 0.5);
                    // Remove the prefix such as "data:" + contentType + ";base64," , in order to meet the Cordova API.
                    var arr = cropData.split(",");
                    cropData = cropData.substr(arr[0].length + 1);
                    complete(cropData);
                }
            }
            var init = function () {
                return new WinJS.Promise(function (c, e) {
                    complete = c;
                    cancel = e;
                    var run = function () {
                        if (typeof data !== "string") {
                            schedule(e, "invalid image data", priority);
                        } else {
                            image.onload = function () {
                                initElement();
                                resized();
                                canvas.addEventListener('mousedown', mouseDown, false);
                                canvas.addEventListener('mouseup', mouseUp, false);
                                canvas.addEventListener('mouseleave', mouseUp, false);
                                canvas.addEventListener('mousemove', mouseMove, false);
                                canvas.addEventListener('touchstart', mouseDown);
                                canvas.addEventListener('touchmove', mouseMove);
                                canvas.addEventListener('touchend', mouseUp);
                                closeButton.addEventListener('click', onCloseButtonClick);
                                okButton.addEventListener('click', onOkButtonClick);
                                initRect();
                                drawRectInCanvas();
                                //schedule(c, result, priority);
                            }
                            image.onerror = function (error) {
                                schedule(e, error, priority);
                            }
                            image.src = data;
                        }
                    }
                    schedule(run, null, priority);
                });
            }
            this.init = init;

            var dispose = function() {
                if (that._disposed) {
                    return;
                }
                that._disposed = true;
                window.removeEventListener("resize", resized);
                canvas.removeEventListener('mousedown', mouseDown);
                canvas.removeEventListener('mouseup', mouseUp);
                canvas.removeEventListener('mouseleave', mouseUp);
                canvas.removeEventListener('mousemove', mouseMove);
                canvas.removeEventListener('touchstart', mouseDown);
                canvas.removeEventListener('touchmove', mouseMove);
                canvas.removeEventListener('touchend', mouseUp);
                closeButton.removeEventListener('click', onCloseButtonClick);
                okButton.removeEventListener('click', onOkButtonClick);
                document.body.removeChild(element);
                canvas = null;
                image = null;
                element = null;
            }
            this.dispose = dispose;

            Log.ret(Log.l.trace);
        }, {
            _disposed: false
        }),
        crop: function (data, square) {
            var run;
            return new WinJS.Promise(function (c, e) {
                var priority = WinJS.Utilities.Scheduler.currentPriority;
                run = function () {
                    var crop = new ImgTools.Crop(data, square);
                    var ret = crop.init().then(function (result) {
                        crop.dispose();
                        schedule(c, result, priority);
                    });
                    ret.onerror = function(error) {
                        crop.dispose();
                        schedule(e, error, priority);
                    }
                    return ret;
                }
                schedule(run, null, priority);
            });
        }
    });
})();



