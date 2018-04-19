// controller for page: camera
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/camera/cameraService.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/Camera.js" />

/*
 Structure of states to be set from external modules:
 {
    errorMessage: newErrorMessage:
 }
*/

(function () {
    "use strict";

    WinJS.Namespace.define("Camera", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Camera.Controller.");
            Application.Controller.apply(this, [pageElement, {
                states: {
                    errorMessage: ""
                },
                cardscan: { IMPORT_CARDSCANVIEWID: 0 }
            }, commandList]);

            var that = this;

            // First, we call WinJS.Binding.as to get the bindable proxy object
            this.binding = WinJS.Binding.as(this.pageData);

            var updateStates = function(states) {
                Log.call(Log.l.trace, "Camera.Controller.", "errorMessage=" + states.errorMessage + "");
                // nothing to do for now
                that.binding.states.errorMessage = states.errorMessage;
                if (states.errorMessage && states.errorMessage !== "") {
                    var headerComment = pageElement.querySelector(".header-comment");
                    if (headerComment && headerComment.style) {
                        headerComment.style.visibility = "visible";
                    }
                }
                Log.ret(Log.l.trace);
            };
            this.updateStates = updateStates;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function() {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                }
            };

            var insertCameradata = function (imageData, width, height) {
                var err = null;
                Log.call(Log.l.trace, "Camera.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    var contactId = AppData.getRecordId("Kontakt");
                    if (!contactId) {
                        Log.print(Log.l.error, "no contactId");
                        return WinJS.Promise.as();
                    }
                    var newCardscan = {
                        KontaktID: contactId,
                        Button: "OCR_TODO"
                    };
                    Log.print(Log.l.trace, "insert newCardscan for contactId=" + newCardscan.KontaktID);
                    AppData.setErrorMsg(that.binding);
                    that.binding.cardscan.IMPORT_CARDSCANVIEWID = 0;
                    return Camera.cardscanView.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "cardscanView: success!");
                        // cardscanView returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.cardscan = json.d;
                            AppData.generalData.setRecordId("IMPORT_CARDSCAN", that.binding.cardscan.IMPORT_CARDSCANVIEWID);
                        } else {
                            err = { status: 404, statusText: "no data found" };
                            AppData.setErrorMsg(that.binding, err);
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        err = errorResponse;
                        AppData.setErrorMsg(that.binding, err);
                    }, newCardscan);
                }).then(function () {
                    if (err) {
                        return WinJS.Promise.as();
                    }
                    if (imageData.length < 500000) {
                        // keep original 
                        return WinJS.Promise.as();
                    }
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 2560, AppData.generalData.cameraQuality, 0.25);
                }).then(function (resizeData) {
                    if (err) {
                        return WinJS.Promise.as();
                    }
                    if (resizeData) {
                        Log.print(Log.l.trace, "resized");
                        imageData = resizeData;
                    }
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 256, AppData.generalData.cameraQuality);
                }).then(function (ovwData) {
                    if (err) {
                        return WinJS.Promise.as();
                    }

                    // UTC-Zeit in Klartext
                    var now = new Date();
                    var dateStringUtc = now.toUTCString();

                    // decodierte Dateigröße
                    var contentLength = Math.floor(imageData.length * 3 / 4);

                    var newPicture = {
                        DOC1IMPORT_CARDSCANVIEWID: AppData.generalData.getRecordId("IMPORT_CARDSCAN"),
                        wFormat: 3,
                        ColorType: 11,
                        ulWidth: width,
                        ulHeight: height,
                        ulDpm: 0,
                        szOriFileNameDOC1: "Visitenkarte.jpg",
                        DocContentDOCCNT1: "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " +
                            dateStringUtc +
                            "\x0D\x0AContent-Length: " +
                            contentLength +
                            "\x0D\x0A\x0D\x0A" +
                            imageData,
                        ContentEncoding: 4096
                    };
                    if (ovwData) {
                        var contentLengthOvw = Math.floor(ovwData.length * 3 / 4);
                        newPicture.OvwContentDOCCNT3 =
                            "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " +
                            dateStringUtc +
                            "\x0D\x0AContent-Length: " +
                            contentLengthOvw +
                            "\x0D\x0A\x0D\x0A" +
                            ovwData;
                    }
                    //load of format relation record data
                    Log.print(Log.l.trace, "insert new cameraData for DOC1IMPORT_CARDSCANVIEWID=" + newPicture.DOC1IMPORT_CARDSCANVIEWID);
                    return Camera.doc1cardscanView.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "doc1cardscanView: success!");
                        // doc1cardscanView returns object already parsed from json file in response
                        if (json && json.d) {
                            that.updateStates({ errorMessage: "OK" });
                            AppData.generalData.setRecordId("DOC1IMPORT_CARDSCAN", json.d.DOC1IMPORT_CARDSCANVIEWID);
                            return WinJS.Promise.timeout(0).then(function() {
                                // do the following in case of success:
                                // go on to questionnaire
                                Application.navigateById("finished", null, true);
                                // accelarate replication
                                if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                    var numFastReqs = 10;
                                    AppRepl.replicator.run(numFastReqs);
                                }
                            });
                        } else {
                            AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            return WinJS.Promise.as();
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, newPicture);
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.insertCameradata = insertCameradata;

            var onPhotoDataSuccess = function (imageData) {
                Log.call(Log.l.trace, "Camera.Controller.");
                if (imageData) {
                    // Get image handle
                    //
                    var cameraImage = new Image();
                    // Show the captured photo
                    // The inline CSS rules are used to resize the image
                    //
                    cameraImage.src = "data:image/jpeg;base64," + imageData;

                    var width = cameraImage.width;
                    var height = cameraImage.height;
                    Log.print(Log.l.trace, "width=" + width + " height=" + height);

                    // todo: create preview from imageData
                    that.insertCameradata(imageData, width, height);
                } else {
                    Application.navigateById("contact", event);
                }
                Log.ret(Log.l.trace);
            }

            var onPhotoDataFail = function (message) {
                Log.call(Log.l.error, "Camera.Controller.");
                //message: The message is provided by the device's native code
                that.updateStates({ errorMessage: message });

                Application.navigateById("contact", event);
                Log.ret(Log.l.error);
            }

            //start native Camera async
            AppData.setErrorMsg(that.binding);
            var takePhoto = function() {
                Log.call(Log.l.trace, "Camera.Controller.");
                if (that.binding.generalData.useClippingCamera) {
                    var appBarText = getResourceText("camera.appbartext");
                    if (navigator.clippingCamera &&
                        typeof navigator.clippingCamera.getPicture === "function") {
                        navigator.clippingCamera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
                            quality: AppData.generalData.cameraQuality,
                            convertToGrayscale: AppData.generalData.cameraUseGrayscale,
                            maxResolution: 3000000,
                            //aspectRatio: "1600/896",
                            autoShutter: that.binding.generalData.autoShutterTime,
                            appBarSize: 96,
                            appBarText: appBarText
                        });
                    }
                } else {
                    if (navigator.camera &&
                        typeof navigator.camera.getPicture === "function") {
                        // shortcuts for camera definitions
                        //pictureSource: navigator.camera.PictureSourceType,   // picture source
                        //destinationType: navigator.camera.DestinationType, // sets the format of returned value
                        Log.print(Log.l.trace, "calling camera.getPicture...");
                        // Take picture using device camera and retrieve image as base64-encoded string
                        navigator.camera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
                            destinationType: Camera.DestinationType.DATA_URL,
                            sourceType: Camera.PictureSourceType.CAMERA,
                            allowEdit: true,
                            quality: AppData.generalData.cameraQuality,
                            targetWidth: -1,
                            targetHeight: -1,
                            encodingType: Camera.EncodingType.JPEG,
                            saveToPhotoAlbum: false,
                            cameraDirection: Camera.Direction.BACK,
                            convertToGrayscale: AppData.generalData.cameraUseGrayscale,
                            variableEditRect: true
                        });
                    } else {
                        Log.print(Log.l.error, "camera.getPicture not supported...");
                        that.updateStates({ errorMessage: "Camera plugin not supported" });
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.takePhoto = takePhoto;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                that.takePhoto();
            });
            Log.ret(Log.l.trace);
        })
    });
})();
