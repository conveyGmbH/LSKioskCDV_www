// controller for page: confirm
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/confirm/confirmService.js" />
/// <reference path="~/www/lib/jQueryQRCode/scripts/jquery.qrcode.min.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Confirm", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Confirm.Controller.");
            
            Application.Controller.apply(this, [pageElement, {
                check1: false,
                check2: false,
                check3: false,
                incomplete: true
            }]);

            var that = this;

            this.dispose = function () {
                that.cancelPromises();
            }

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 300000;

            var cancelPromises = function () {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (that.restartPromise) {
                    Log.print(Log.l.trace, "cancel previous restart Promise");
                    that.restartPromise.cancel();
                    that.restartPromise = null;
                }
                Log.ret(Log.l.trace);
            }
            this.cancelPromises = cancelPromises;

            var waitForIdleAction = function () {
                Log.call(Log.l.trace, "ProductList.Controller.", "idleWaitTimeMs=" + that.idleWaitTimeMs);
                that.cancelPromises();
                that.restartPromise = WinJS.Promise.timeout(that.idleWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "timeout occurred, check for selectionCount!");
                    Application.navigateById("start", event);
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Confirm.Controller.");
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    //if (WinJS.Navigation.canGoBack === true) {
                    //    WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    //}
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Confirm.Controller.");
                    that.cancelPromises();
                    Application.navigateById("barcode", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function () {
                    that.binding.incomplete = !that.binding.check1 || !that.binding.check2 || !that.binding.check3;
                    return that.binding.incomplete;
                }
            };

            var loadQrCodes = function() {
				var ret = new WinJS.Promise.as().then(function() {
                    var qrcodeContainers = pageElement.querySelectorAll(".confirm-qrcode-container");
                    if (qrcodeContainers) {
						for (var i=0; i < qrcodeContainers.length; i++) {
							var qrcodeContainer = qrcodeContainers[i];
							var id = qrcodeContainer.id;
							var value = getResourceText(id);
							var qrcodeViewer = document.createElement("div");
							WinJS.Utilities.addClass(qrcodeViewer, "confirm-qrcode");
							$(qrcodeViewer).qrcode({
								text: value,
								width: 80,
								height: 80,
								correctLevel: 0 //QRErrorCorrectLevel.M
							});
                            qrcodeContainer.appendChild(qrcodeViewer);
							if (qrcodeContainer.childElementCount > 1) {
								var oldElement = qrcodeContainer.firstElementChild;
								if (oldElement) {
									qrcodeContainer.removeChild(oldElement);
									oldElement.innerHTML = "";
								}
							}
						}
				    }
				});
				return ret;
			};
			this.loadQrCodes = loadQrCodes;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                var none;
                Colors.loadSVGImageElements(pageElement, "confirm-qrcode-container-svg", {
                    width: 85,
                    height: 85
                }, none, none, none, {
                    useFillColor: false,
                    useStrokeColor: false
                });
                return that.loadQrCodes();
            }).then(function () {
		        that.waitForIdleAction();
                AppBar.notifyModified = true;
            });
            Log.ret(Log.l.trace);
        })
    });
})();







