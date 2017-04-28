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
                dataContact: getEmptyDefaultValue(Barcode.contactView.defaultValue)
            }]);

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 60000;

            this.failurePromise = null;
            this.failureWaitTimeMs = 5000;

            // previous remote state message
            this.prevFlag_NoEdit = null;

            var that = this;

            this.dispose = function() {
            };

            var cancelPromises = function() {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (that.restartPromise) {
                    Log.print(Log.l.trace, "cancel previous restart Promise");
                    that.restartPromise.cancel();
                }
                if (that.failurePromise) {
                    Log.print(Log.l.trace, "cancel previous failure Promise");
                    that.failurePromise.cancel();
                }
                Log.ret(Log.l.trace);
            }
            this.cancelPromises = cancelPromises;

            var deleteAndNavigate = function(targetPage) {
                Log.call(Log.l.trace, "ProductList.Controller.", "targetPage=" + that.targetPage);
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
                Log.call(Log.l.trace, "ProductList.Controller.", "idleWaitTimeMs=" + that.idleWaitTimeMs);
                that.cancelPromises();
                that.restartPromise = WinJS.Promise.timeout(that.idleWaitTimeMs).then(function() {
                    Log.print(Log.l.trace, "timeout occurred, navigate back to start page!");
                    Application.navigateById("start");
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            var waitForFailureAction = function () {
                Log.call(Log.l.trace, "ProductList.Controller.", "failureWaitTimeMs=" + that.failureWaitTimeMs);
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
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickDelete: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    // cancel navigates now directly back to start
                    // now, don't delete contact in case of error
                    //that.deleteAndNavigate("start");
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Barcode.Controller.");
                    that.cancelPromises();
                    Application.navigateById("finished", event);
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
                },
                clickOk: function() {
                    if (that.binding.dataContact
                        //for testing always enabled!
                        //&&
                        //(that.binding.dataContact.IMPORT_CARDSCANID ||
                        // that.binding.dataContact.Request_Barcode)
                        ) {
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
                            if (json && json.d) {
                                that.setDataContact(json.d);
                                AppBar.triggerDisableHandlers();
                                if (that.binding.dataContact.EMail) {
                                    Log.print(Log.l.trace, "contactView: EMail=" + that.binding.dataContact.EMail + " => navigate to finished page!");
                                    that.cancelPromises();
                                    Application.navigateById("finished", event);
                                } else {
                                    if (that.binding.dataContact.Flag_NoEdit &&
                                        that.binding.dataContact.Flag_NoEdit !== " " &&
                                        that.binding.dataContact.Flag_NoEdit !== "OK" &&
                                        that.binding.dataContact.Flag_NoEdit !== that.prevFlag_NoEdit) {
                                        Log.print(Log.l.trace, "contactView: Flag_NoEdit=" + that.binding.dataContact.Flag_NoEdit);
                                        that.prevFlag_NoEdit = that.binding.dataContact.Flag_NoEdit;
                                        that.waitForFailureAction();
                                    } 
                                    Log.print(Log.l.trace, "contactView: reload again!");
                                    WinJS.Promise.timeout(100).then(function () {
                                        that.loadData();
                                    });
                                }
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, recordId);
                    } else {
                        // ignore that here
                        //var err = { status: 0, statusText: "no record selected" };
                        //AppData.setErrorMsg(that.binding, err);
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            // save data
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
                        ret = WinJS.Promise.timeout(100).then(function () {
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

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, "#00417F");
                Colors.loadSVGImageElements(pageElement, "barcode-image");
            }).then(function () {
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







