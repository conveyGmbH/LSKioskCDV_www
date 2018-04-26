// controller for page: contact
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/lib/hammer/scripts/hammer.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/contact/contactService.js" />
/// <reference path="~/www/pages/contactList/contactListController.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("Contact", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Contact.Controller.");
            Application.Controller.apply(this, [pageElement, {
                clickOkDisabled: true,
                dataContact: getEmptyDefaultValue(Contact.contactView.defaultValue),
                InitAnredeItem: { InitAnredeID: 0, TITLE: "" },
                isSaved: false
            }, commandList]);
            var that = this;

            // select combo
            var initAnrede = pageElement.querySelector("#InitAnrede");
            var initLand = pageElement.querySelector("#InitLand");

            this.dispose = function () {
                if (initAnrede && initAnrede.winControl) {
                    initAnrede.winControl.data = null;
                }
                if (initLand && initLand.winControl) {
                    initLand.winControl.data = null;
                }
            }


            var setDataContact = function (newDataContact) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.dataContact = newDataContact;
                if (that.binding.dataContact.EMail &&
                    that.binding.dataContact.EMail.search(/@.*[.]/i) >= 0 &&
                    that.binding.dataContact.INITLandID &&
                    that.binding.dataContact.INITAnredeID &&
                    that.binding.dataContact.Vorname &&
                    that.binding.dataContact.Name &&
                    that.binding.dataContact.Firmenname
                    ) {
                    that.binding.clickOkDisabled = false;
                } else {
                    that.binding.clickOkDisabled = true;
                }
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
                AppBar.triggerDisableHandlers();
            }
            this.setDataContact = setDataContact;

            var getRecordId = function () {
                Log.call(Log.l.trace, "Contact.Controller.");
                var recordId = AppData.getRecordId("Kontakt");
                if (!recordId) {
                    that.setDataContact(getEmptyDefaultValue(Contact.contactView.defaultValue));
                }
                Log.ret(Log.l.trace, recordId);
                return recordId;
            }
            this.getRecordId = getRecordId;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Contact.Controller.");
                    if (!Application.showMaster() && WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "Contact.Controller.");
                    that.saveData(function (response) {
                        Log.print(Log.l.trace, "contact saved");
                        if (that.binding.dataContact.ExistsProductMail ||
                            that.binding.dataContact.ProductLimitExceeded) {
                            Application.navigateById("failed", event);
                        } else {
                            Application.navigateById("finished", event);
                        }
                    }, function (errorResponse) {
                        Log.print(Log.l.error, "error saving employee");
                    });
                    AppBar.triggerDisableHandlers();
                    Log.ret(Log.l.trace);
                },
                clickStart: function (event) {
                    Log.call(Log.l.trace, "Contact.Controller.");
                    // cancel navigates now directly back to start
                    // now, don't delete contact in case of error
                    //that.deleteAndNavigate("start");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                onKeyUp: function (e) {
                    Log.call(Log.l.u2, "Contact.Controller.");
                    if (that.binding.dataContact &&
                        that.binding.dataContact.EMail &&
                        that.binding.dataContact.EMail.search(/@.*[.]/i) >= 0 &&
                        that.binding.dataContact.INITLandID &&
                        that.binding.dataContact.INITAnredeID &&
                        that.binding.dataContact.Vorname &&
                        that.binding.dataContact.Name &&
                        that.binding.dataContact.Firmenname) {
                        that.binding.clickOkDisabled = false;
                    } else {
                        that.binding.clickOkDisabled = true;
                    }
                    Log.ret(Log.l.u2);
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
                clickForward: function () {
                    return AppBar.busy;
                }
            }

            var loadData = function () {
                Log.call(Log.l.trace, "Contact.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!AppData.initAnredeView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initAnredeData...");
                        //@nedra:25.09.2015: load the list of INITAnrede for Combobox
                        return AppData.initAnredeView.select(function (json) {
                            Log.print(Log.l.trace, "initAnredeView: success!");
                            if (json && json.d && json.d.results) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                if (initAnrede && initAnrede.winControl) {
                                    initAnrede.winControl.data = new WinJS.Binding.List(json.d.results);
                                }
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        if (initAnrede && initAnrede.winControl &&
                            (!initAnrede.winControl.data || !initAnrede.winControl.data.length)) {
                            initAnrede.winControl.data = new WinJS.Binding.List(AppData.initAnredeView.getResults());
                        }
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    if (!AppData.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        //@nedra:25.09.2015: load the list of INITLand for Combobox
                        return AppData.initLandView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "initLandView: success!");
                            if (json && json.d && json.d.results) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                if (initLand && initLand.winControl) {
                                    initLand.winControl.data = new WinJS.Binding.List(json.d.results);
                                }
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        if (initLand && initLand.winControl &&
                            (!initLand.winControl.data || !initLand.winControl.data.length)) {
                            initLand.winControl.data = new WinJS.Binding.List(AppData.initLandView.getResults());
                        }
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    var recordId = getRecordId();
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        return Contact.contactView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactView: success!");
                            if (json && json.d) {
                                // now always edit!
                                that.setDataContact(json.d);
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, recordId);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    AppBar.notifyModified = true;
                    return WinJS.Promise.as();
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
                var dataContact = that.binding.dataContact;
                // set Nachbearbeitet empty!
                if (!dataContact.Nachbearbeitet) {
                    dataContact.Nachbearbeitet = null;
                } else {
                    dataContact.Nachbearbeitet = 1;
                }
                var recordId = getRecordId();
                if (recordId && dataContact && dataContact.KontaktVIEWID && !AppBar.busy &&
                     (AppBar.modified || !that.binding.isSaved && !that.binding.clickOkDisabled)) {
                    AppBar.busy = true;
                    ret = Contact.contactView.update(function (response) {
                        that.binding.isSaved = true;
                        AppBar.busy = false;
                        // called asynchronously if ok
                        Log.print(Log.l.info, "contactData update: success!");
                        AppBar.modified = false;
                    }, function (errorResponse) {
                        AppBar.busy = false;
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        error(errorResponse);
                    }, recordId, dataContact).then(function () {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        return Contact.contactView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactView: success!");
                            if (json && json.d) {
                                // now always edit!
                                that.setDataContact(json.d);
                                complete(json.d);
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                            error(errorResponse);
                        }, recordId);
                    });
                } else if (AppBar.busy) {
                    ret = WinJS.Promise.timeout(100).then(function () {
                        return that.saveData(complete, error);
                    });
                } else {
                    ret = new WinJS.Promise.as().then(function () {
                        complete(dataContact);
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.saveData = saveData;

            var contactForm = pageElement.querySelector(".contact-form");
            if (contactForm) {
                this.addRemovableEventListener(contactForm, "change", this.eventHandlers.onKeyUp.bind(this));
            }

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                Colors.loadSVGImageElements(pageElement, "contact-image", 100, Colors.textColor);
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, Colors.textColor);
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
            });

            Log.ret(Log.l.trace);
        })
    });
})();


