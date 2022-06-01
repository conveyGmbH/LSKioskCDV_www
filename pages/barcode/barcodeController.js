// controller for page: barcode
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/barcode/barcodeService.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />
/// <reference path="~/plugins/phonegap-plugin-barcodescanner/www/barcodescanner.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Barcode", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Barcode.Controller.");
            Application.Controller.apply(this, [pageElement, {
                states: {
                    errorMessage: "",
                    barcode: null
                },
                dataContact: getEmptyDefaultValue(Barcode.contactView.defaultValue),
                showProgress: false,
                showScanAgain: !AppData.generalData.useBarcodeScanner,
                showManualEdit: true
            }]);

            this.refreshPromise = null;
            this.refreshWaitTimeMs = 250;

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 60000;

            this.failurePromise = null;
            this.failureWaitTimeMs = 6000;

            this.animationPromise = null;

            // previous remote state message
            this.prevFlag_NoEdit = null;

            var that = this;

            this.dispose = function() {
                that.cancelPromises();
            };

            var updateStates = function (states) {
                Log.call(Log.l.trace, "Barcode.Controller.", "errorMessage=" + (states && states.errorMessage) + "");
                // nothing to do for now
                if (states && that.binding.states) {
                    that.binding.states.errorMessage = states.errorMessage;
                    if (states.errorMessage && states.errorMessage !== "") {
                        var headerComment = pageElement.querySelector(".header-comment");
                        if (headerComment && headerComment.style) {
                            headerComment.style.visibility = "visible";
                        }
                    }
                    if (typeof states.barcode !== "undefined") {
                        that.binding.states.barcode = states.barcode;
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.updateStates = updateStates;

            var cancelPromises = function () {
                Log.call(Log.l.trace, "Barcode.Controller.");
                if (that.animationPromise) {
                    Log.print(Log.l.trace, "cancel previous animation Promise");
                    that.animationPromise.cancel();
                    that.animationPromise = null;
                }
                if (that.restartPromise) {
                    Log.print(Log.l.trace, "cancel previous restart Promise");
                    that.restartPromise.cancel();
                    that.restartPromise = null;
                }
                if (that.failurePromise) {
                    Log.print(Log.l.trace, "cancel previous failure Promise");
                    that.failurePromise.cancel();
                    that.failurePromise = null;
                }
                Log.ret(Log.l.trace);
            }
            this.cancelPromises = cancelPromises;

            var deleteAndNavigate = function (targetPage) {
                Log.call(Log.l.trace, "Barcode.Controller.", "targetPage=" + that.targetPage);
                that.cancelPromises();
                var contactId = AppData.getRecordId("Kontakt");
                Log.print(Log.l.trace, "contactId=" + contactId);
                if (contactId) {
                    Log.print(Log.l.trace, "delete existing contactID=" + contactId);
                    Barcode.contactView.deleteRecord(function(json) {
                        // this callback will be called asynchronously
                        Log.print(Log.l.trace, "contactView: deleteRecord success!");
                        AppData.setRecordId("Kontakt", null);
                        if (that.refreshPromise) {
                            Log.print(Log.l.trace, "cancel previous refresh Promise");
                            that.refreshPromise.cancel();
                            that.refreshPromise = null;
                        }
                        that.cancelPromises();
                        Application.navigateById(targetPage);
                    }, function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, contactId);
                }
                Log.ret(Log.l.trace);
            }
            this.deleteAndNavigate = deleteAndNavigate;

            var waitForIdleAction = function() {
                Log.call(Log.l.trace, "Barcode.Controller.", "idleWaitTimeMs=" + that.idleWaitTimeMs);
                that.cancelPromises();
                that.restartPromise = WinJS.Promise.timeout(that.idleWaitTimeMs).then(function() {
                    Log.print(Log.l.trace, "timeout occurred, navigate back to start page!");
                    if (that.refreshPromise) {
                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                        that.refreshPromise.cancel();
                        that.refreshPromise = null;
                    }
                    that.cancelPromises();
                    Application.navigateById("start");
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            var waitForFailureAction = function () {
                Log.call(Log.l.trace, "Barcode.Controller.", "failureWaitTimeMs=" + that.failureWaitTimeMs);
                that.cancelPromises();
                that.failurePromise = WinJS.Promise.timeout(that.failureWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "timeout occurred, navigate to failed page!");
                    if (that.refreshPromise) {
                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                        that.refreshPromise.cancel();
                        that.refreshPromise = null;
                    }
                    that.cancelPromises();
                    Application.navigateById("failed");
                });
                Log.ret(Log.l.trace);
            };
            this.waitForFailureAction = waitForFailureAction;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    if (that.refreshPromise) {
                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                        that.refreshPromise.cancel();
                        that.refreshPromise = null;
                    }
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    //if (WinJS.Navigation.canGoBack === true) {
                    //    that.cancelPromises();
                    //    WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    //}
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    if (that.refreshPromise) {
                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                        that.refreshPromise.cancel();
                        that.refreshPromise = null;
                    }
                    that.cancelPromises();
                    Application.navigateById("contact", event);
                    Log.ret(Log.l.trace);
                },
                // only for navigation tests:
                clickFinished: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    if (that.refreshPromise) {
                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                        that.refreshPromise.cancel();
                        that.refreshPromise = null;
                    }
                    that.cancelPromises();
                    Application.navigateById("finished", event);
                    Log.ret(Log.l.trace);
                },
                clickFailed: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    if (that.refreshPromise) {
                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                        that.refreshPromise.cancel();
                        that.refreshPromise = null;
                    }
                    that.cancelPromises();
                    Application.navigateById("failed", event);
                    Log.ret(Log.l.trace);
                },
                clickStart: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    // cancel navigates now directly back to start
                    // now, don't delete contact in case of error
                    //that.deleteAndNavigate("start");
                    if (that.refreshPromise) {
                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                        that.refreshPromise.cancel();
                        that.refreshPromise = null;
                    }
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickScan: function(event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    that.cancelPromises();
                    that.scanBarcode();
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                }
            };

            var setDataContact = function (newDataContact) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.dataContact = newDataContact;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
                AppBar.triggerDisableHandlers();
            }
            this.setDataContact = setDataContact;

            var loadData = function () {
                Log.call(Log.l.trace, "Contact.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    var recordId = AppData.getRecordId("Kontakt");
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        return Barcode.contactView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactView: success!");
                            if (json && json.d && json.d.KontaktVIEWID) {
                                that.setDataContact(json.d);
                                AppBar.triggerDisableHandlers();
                                if (that.binding.dataContact.Request_Barcode) {
                                    that.binding.showProgress = true;
                                }
                                if (that.binding.dataContact.EMail &&
                                    that.binding.dataContact.EMail.length > 0) {
                                    Log.print(Log.l.trace, "contactView: EMail=" + that.binding.dataContact.EMail + " => navigate to finished page!");
                                    if (that.refreshPromise) {
                                        Log.print(Log.l.trace, "cancel previous refresh Promise");
                                        that.refreshPromise.cancel();
                                        that.refreshPromise = null;
                                    }
                                    that.cancelPromises();
                                    if (that.binding.dataContact.ExistsProductMail ||
                                        that.binding.dataContact.ProductLimitExceeded) {
                                        Application.navigateById("failed", event);
                                    } else {
                                        Application.navigateById("finished", event);
                                    }
                                } else {
                                    if (that.binding.dataContact.Name &&
                                        that.binding.dataContact.Name.length &&
                                        !that.binding.dataContact.EMail) {
                                        that.binding.dataContact.Flag_NoEdit = "NO EMAIL";
                                    }
                                    if (that.binding.dataContact.Flag_NoEdit &&
                                        that.binding.dataContact.Flag_NoEdit !== " " &&
                                        that.binding.dataContact.Flag_NoEdit !== "OK" &&
                                        that.binding.dataContact.Flag_NoEdit !== that.prevFlag_NoEdit) {
                                        Log.print(Log.l.trace, "contactView: Flag_NoEdit=" + that.binding.dataContact.Flag_NoEdit);
                                        that.prevFlag_NoEdit = that.binding.dataContact.Flag_NoEdit;
                                        that.waitForFailureAction();
                                    } else if (that.binding.dataContact.Flag_NoEdit !== that.prevFlag_NoEdit) {
                                        that.prevFlag_NoEdit = that.binding.dataContact.Flag_NoEdit;
                                        if (!that.restartPromise) {
                                            that.waitForIdleAction();
                                        }
                                    }
                                    Log.print(Log.l.trace, "contactView: reload again!");
                                    if (that.refreshPromise) {
                                        that.refreshPromise.cancel();
                                    }
                                    that.refreshPromise = WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                                        that.loadData();
                                    });
                                }
                            } else {
                                Log.print(Log.l.trace, "contactView: no data found!");
                                if (that.refreshPromise) {
                                    Log.print(Log.l.trace, "cancel previous refresh Promise");
                                    that.refreshPromise.cancel();
                                    that.refreshPromise = null;
                                }
                                that.cancelPromises();
                                Application.navigateById("start", event);
                            }
                        }, function (errorResponse) {
                            //AppData.setErrorMsg(that.binding, errorResponse);
                            Log.print(Log.l.trace, "contactView: reload again!");
                            if (that.refreshPromise) {
                                that.refreshPromise.cancel();
                            }
                            that.refreshPromise = WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                                that.loadData();
                            });
                        }, recordId);
                    } else {
                        // ignore that here
                        //var err = { status: 0, statusText: "no record selected" };
                        //AppData.setErrorMsg(that.binding, err);
                        Log.print(Log.l.trace, "contactView: no record selected!");
                        if (that.refreshPromise) {
                            Log.print(Log.l.trace, "cancel previous refresh Promise");
                            that.refreshPromise.cancel();
                            that.refreshPromise = null;
                        }
                        that.cancelPromises();
                        Application.navigateById("start", event);
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    Log.print(Log.l.trace, "Data loaded");
                    AppBar.notifyModified = true;
                    that.waitForIdleAction();
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            var translateAnimantion = function (element, bIn) {
                Log.call(Log.l.trace, "Contact.Controller.");
                if (element && that.binding) {
                    var fnAnimation = bIn ? WinJS.UI.Animation.enterContent : WinJS.UI.Animation.exitContent;
                    var animationOptions = { top: bIn ? "-50px" : "50px", left: "0px" };
                    fnAnimation(element, animationOptions, {
                        mechanism: "transition"
                    }).done(function () {
                        if (!that.binding || that.binding.showProgress) {
                            Log.print(Log.l.trace, "finished");
                        } else {
                            Log.print(Log.l.trace, "go on with animation");
                            that.animationPromise = WinJS.Promise.timeout(1000).then(function () {
                                that.translateAnimantion(element, !bIn);
                            });
                        }
                    });
                }
                Log.ret(Log.l.trace);
            }
            this.translateAnimantion = translateAnimantion;


            var insertBarcodedata = function (barcode, isVcard) {
                Log.call(Log.l.trace, "Barcode.Controller.");
                that.updateStates({ errorMessage: "Request", barcode: barcode });
                var ret = new WinJS.Promise.as().then(function () {
                    var recordId = AppData.getRecordId("Kontakt");
                    if (!recordId) {
                        Log.print(Log.l.error, "no KontaktVIEWID");
                        return WinJS.Promise.as();
                    }
                    if (isVcard) {
                        var newBarcodeVCard = {
                            KontaktID: recordId,
                            Button: 'VCARD_TODO',
                            Barcode2: barcode
                        };
                        Log.print(Log.l.trace, "insert new barcodeDataVCard for KontaktID=" + newBarcodeVCard.KontaktID);
                        return Barcode.barcodeVCardView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "barcodeVCardView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.updateStates({ errorMessage: "OK" });
                                AppData.generalData.setRecordId("IMPORT_CARDSCAN", json.d.IMPORT_CARDSCANVIEWID);
                                AppData._barcodeType = "vcard";
                                AppData._barcodeRequest = barcode;
                                // accelarate replication
                                WinJS.Promise.timeout(0).then(function() {
                                    // do the following in case of success:
                                    // go on to questionnaire
                                    if (Barcode.waitingScans > 0) {
                                        Barcode.dontScan = true;
                                    } else {
                                        // accelarate replication
                                        if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                            var numFastReqs = 10;
                                            AppRepl.replicator.run(numFastReqs);
                                        }
                                    }
                                });
                                that.refreshPromise = WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                                    that.loadData();
                                });
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            }
                            return WinJS.Promise.as();
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newBarcodeVCard);
                    } else {
                        var newBarcode = {
                            Request_Barcode: barcode,
                            KontaktID: recordId
                        };
                        //load of format relation record data
                        Log.print(Log.l.trace, "insert new barcodeView for KontaktID=" + newBarcode.KontaktID);
                        return Barcode.barcodeView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "barcodeView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.updateStates({ errorMessage: "OK" });
                                AppData.generalData.setRecordId("ImportBarcodeScan", json.d.ImportBarcodeScanVIEWID);
                                AppData._barcodeType = "barcode";
                                AppData._barcodeRequest = barcode;
                                // accelarate replication
                                WinJS.Promise.timeout(0).then(function () {
                                    // do the following in case of success:
                                    // go on to questionnaire
                                    if (Barcode.waitingScans > 0) {
                                        Barcode.dontScan = true;
                                    } else {
                                        // accelarate replication
                                        if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                            var numFastReqs = 10;
                                            AppRepl.replicator.run(numFastReqs);
                                        }
                                    }
                                });
                                that.refreshPromise = WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                                    that.loadData();
                                });
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newBarcode);
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.insertBarcodedata = insertBarcodedata;

            var onBarcodeSuccess = function (result) {
                Log.call(Log.l.trace, "Barcode.Controller.");
                Barcode.dontScan = false;
                if (result.cancelled) {
                    // go back to start
                    WinJS.Promise.timeout(0).then(function () {
                        // go back to start
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    });
                    Log.ret(Log.l.trace, "User cancelled");
                    return;
                }
                if (!result.text) {
                    that.updateStates({ errorMessage: "Barcode scanner returned no data!" });
                    Log.ret(Log.l.trace, "no data returned");
                    return;
                }
                WinJS.Promise.timeout(0).then(function () {
                    var tagVcard = "BEGIN:VCARD";
                    var tagLsad = "#LSAD";
                    var tagLs64 = "#LS64";
                    var tagLstx = "#LSTX";
                    Log.call(Log.l.trace, "working on barcode data...");
                    var isVcard;
                    var finalBarcode;
                    if (result.text.substr(0, tagVcard.length) === tagVcard) {
                        Log.print(Log.l.trace, "plain VCARD, save already utf-8 string data as VCARD");
                        isVcard = true;
                        finalBarcode = result.text;
                    } else if (result.text.substr(0, tagLsad.length) === tagLsad) {
                        Log.print(Log.l.trace, "endcoded VCARD, save already encoded base 64 string");
                        isVcard = true;
                        finalBarcode = result.text;
                    } else if (result.text.substr(0, tagLs64.length) === tagLs64) {
                        Log.print(Log.l.trace, "endcoded VCARD with #LS64 prefix, save already encoded base 64 string with #LSAD prefix");
                        isVcard = true;
                        finalBarcode = tagLsad + result.text.substr(tagLs64.length);
                    } else if (result.text.indexOf("\n") >= 0) {
                        Log.print(Log.l.trace, "save string data as plain text address");
                        isVcard = true;
                        finalBarcode = tagLstx + result.text;
                    } else {
                        isVcard = false;
                        var i = result.text.indexOf("|");
                        if (i >= 0) {
                            var countPipe = 1;
                            for (; i < result.text.length; i++) {
                                if (result.text[i] === "|") {
                                    countPipe++;
                                    if (countPipe === 4) {
                                        isVcard = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (!isVcard) {
                            Log.print(Log.l.trace, "save string data as Id-Barcode");
                        }
                        finalBarcode = result.text;
                    }
                    that.insertBarcodedata(finalBarcode, isVcard);
                    Log.ret(Log.l.trace);
                });
                Log.ret(Log.l.trace);
            }
            this.onBarcodeSuccess = onBarcodeSuccess;


            var onBarcodeError = function (error) {
                Log.call(Log.l.error, "Barcode.Controller.");
                Barcode.dontScan = false;
                that.updateStates({ errorMessage: JSON.stringify(error) });
                WinJS.Promise.timeout(2000).then(function () {
                    // go back to start
                    WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                });
                Log.ret(Log.l.error);
            }
            this.onBarcodeError = onBarcodeError;

            var scanBarcode = function () {
                Log.call(Log.l.trace, "Barcode.Controller.");
                if (AppData.generalData.useBarcodeScanner && Barcode) {
                    Barcode.dontScan = true;
                    if (!Barcode.listening) {
                        Barcode.startListenDelayed(250);
                    }
                } else if (typeof cordova !== "undefined" &&
                    cordova.plugins && cordova.plugins.barcodeScanner &&
                    typeof cordova.plugins.barcodeScanner.scan === "function") {

                    if (typeof device === "object" && device.platform === "Android") {
                        Log.print(Log.l.trace, "Android: calling barcodeScanner.scan...");
                        cordova.plugins.barcodeScanner.scan(onBarcodeSuccess, onBarcodeError, {
                            preferFrontCamera: false,
                            prompt: getResourceText("barcode.placement"),
                            formats: "QR_CODE,DATA_MATRIX,CODE_128,ITF,CODE_39,EAN_8,EAN_13,UPC_E,UPC_A,AZTEC,PDF_417",
                            resultDisplayDuration: 0,
                            disableAnimations: true
                        });
                    } else {
                        Log.print(Log.l.trace, "NOT Android: calling barcodeScanner.scan...");
                        cordova.plugins.barcodeScanner.scan(onBarcodeSuccess, onBarcodeError,{
                            rotationDegree: that.binding.generalData.videoRotation
                        }
                        /*
                        , {
                            preferFrontCamera: false,
                            prompt: getResourceText("barcode.placement"),
                            formats: "QR_CODE,DATA_MATRIX,CODE_128,ITF,CODE_39,EAN_8,EAN_13,UPC_E,UPC_A,AZTEC,PDF_417",
                            resultDisplayDuration: 0,
                            disableAnimations: true
                        }
                        */
                        );
                    }
                } else {
                    Log.print(Log.l.error, "barcodeScanner.scan not supported...");
                    if (Barcode.controller) {
                        Barcode.controller.updateStates({ errorMessage: "Barcode scanner plugin not supported" });
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.scanBarcode = scanBarcode;

            AppData.setErrorMsg(that.binding);

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                if (AppData._persistentStates.kioskUsesCamera) {
                    Colors.loadSVGImageElements(pageElement, "action-image", 80, "#ffffff");
                }
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, Colors.textColor);
                Colors.loadSVGImageElements(pageElement, "barcode-image");
                Colors.loadSVGImageElements(pageElement, "scanning-image", 65, Colors.textColor, "id", function (svgInfo) {
                    if (svgInfo && svgInfo.element) {
                        that.translateAnimantion(svgInfo.element.firstElementChild ||
                                                 svgInfo.element.firstChild, true);
                    }
                });
                if (!Barcode.dontScan) {
                    that.scanBarcode();
                } else {
                    that.loadData();
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();







