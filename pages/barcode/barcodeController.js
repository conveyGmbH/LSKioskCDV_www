// controller for page: barcode
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/barcode/barcodeService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Barcode", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Barcode.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataContact: getEmptyDefaultValue(Barcode.contactView.defaultValue),
                showProgress: false
            }]);

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

            var cancelPromises = function() {
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

            var deleteAndNavigate = function(targetPage) {
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
                    // Application.navigateById("start");
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            var waitForFailureAction = function () {
                Log.call(Log.l.trace, "Barcode.Controller.", "failureWaitTimeMs=" + that.failureWaitTimeMs);
                that.cancelPromises();
                that.failurePromise = WinJS.Promise.timeout(that.failureWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "timeout occurred, navigate to failed page!");
                    Application.navigateById("failed");
                });
                Log.ret(Log.l.trace);
            };
            this.waitForFailureAction = waitForFailureAction;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    //if (WinJS.Navigation.canGoBack === true) {
                    //    that.cancelPromises();
                    //    WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    //}
                    Log.ret(Log.l.trace);
                },
                /*
                // only for navigation tests:
                clickFinished: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    that.cancelPromises();
                    Application.navigateById("finished", event);
                    Log.ret(Log.l.trace);
                },
                clickFailed: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    that.cancelPromises();
                    Application.navigateById("failed", event);
                    Log.ret(Log.l.trace);
                },
                 */
                clickStart: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    // cancel navigates now directly back to start
                    // now, don't delete contact in case of error
                    //that.deleteAndNavigate("start");
                    that.cancelPromises();
                    Application.navigateById("start", event);
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
                                    that.cancelPromises();
                                    if (that.binding.dataContact.ExistsProductMail ||
                                        that.binding.dataContact.ProductLimitExceeded) {
                                        that.cancelPromises();
                                        Application.navigateById("failed", event);
                                    } else {
                                        that.cancelPromises();
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
                                    WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                                        that.loadData();
                                    });
                                }
                            } else {
                                Log.print(Log.l.trace, "contactView: no data found!");
                                that.cancelPromises();
                                Application.navigateById("start", event);
                            }
                        }, function (errorResponse) {
                            //AppData.setErrorMsg(that.binding, errorResponse);
                            Log.print(Log.l.trace, "contactView: reload again!");
                            WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                                that.loadData();
                            });
                        }, recordId);
                    } else {
                        // ignore that here
                        //var err = { status: 0, statusText: "no record selected" };
                        //AppData.setErrorMsg(that.binding, err);
                        Log.print(Log.l.trace, "contactView: no record selected!");
                        that.cancelPromises();
                        Application.navigateById("start", event);
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            // save data
            /*
            var saveData = function (complete, error) {
                Log.call(Log.l.trace, "Contact.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret;
                if (that.binding.dataContact &&
                    !that.binding.dataContact.EMail) {
                    ret = new WinJS.Promise.as().then(function () {
                        var err = { status: 0, statusText: getResourceText("barcode.emailNeeded") };
                        AppData.setErrorMsg(that.binding, err);
                        error(err);
                    });
                } else {
                    var dataContact = that.binding.dataContact;
                    if (dataContact && AppBar.modified && !AppBar.busy) {
                        var recordId = AppData.getRecordId("Kontakt");
                        if (recordId) {
                            AppBar.busy = true;
                            ret = Barcode.contactView.update(function (response) {
                                AppBar.busy = false;
                                // called asynchronously if ok
                                Log.print(Log.l.info, "contactData update: success!");
                                AppBar.modified = false;
                                AppData.getContactData();
                                complete(response);
                            }, function (errorResponse) {
                                AppBar.busy = false;
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                AppData.setErrorMsg(that.binding, errorResponse);
                                error(errorResponse);
                            }, recordId, dataContact);
                        } else {
                            var err = { status: 0, statusText: "no record selected" };
                            AppData.setErrorMsg(that.binding, err);
                            return WinJS.Promise.as();
                        }
                    } else if (AppBar.busy) {
                        ret = WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                            return that.saveData(complete, error);
                        });
                    } else {
                        ret = new WinJS.Promise.as().then(function () {
                            complete(dataContact);
                        });
                    }
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.saveData = saveData;
             */

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

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, "#00417F");
                Colors.loadSVGImageElements(pageElement, "barcode-image");
                Colors.loadSVGImageElements(pageElement, "scanning-image", 65, "#00417F", "id", function (svgInfo) {
                    if (svgInfo && svgInfo.element) {
                        that.translateAnimantion(svgInfo.element.firstElementChild ||
                                                 svgInfo.element.firstChild, true);
                    }
                });
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
                AppBar.notifyModified = true;
                that.waitForIdleAction();
            });
            Log.ret(Log.l.trace);
        })
    });
})();







