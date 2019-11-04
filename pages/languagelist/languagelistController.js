// controller for page: listLocal
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/lib/convey/scripts/colors.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/languagelist/languagelistService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("LanguageList", {
        images: [],
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "LanguageList.Controller.");
            Application.Controller.apply(this, [pageElement, {
                showStart: true,
                count: 0,
                organizerLogoSrc: ""
            }]);
            this.languages = null;

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 120000;

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#languagelist.listview");

            var continueButton = pageElement.querySelector(".languagelist .list-header .nx-button--centered");
            if (continueButton && continueButton.style) {
                if (continueButton.firstElementChild && continueButton.firstElementChild.style) {
                    continueButton.firstElementChild.style.color = Colors.kioskButtonBackgroundColor;
                }
            }

            this.dispose = function () {
                if (listView && listView.winControl) {
                    // remove ListView dataSource
                    listView.winControl.itemDataSource = null;
                }
                if (that.languages) {
                    // free languages list
                    that.languages = null;
                }
            }

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
                    Log.print(Log.l.trace, "timeout occurred, check for selection");
                    // Don't delete empty contacts now
                    var contactId = AppData.getRecordId("Kontakt");
                    Log.print(Log.l.trace, "contactId=" + contactId);
                    if (contactId && !that.binding.clickOkDisabled) {
                        Log.print(Log.l.trace, "ignore unfinished selection!");
                        if (Application.navigateByIdOverride("start") === "productlist") {
                            AppData.setRecordId("Kontakt", null);
                            that.loadData();
                        } else {
                            Application.navigateById("start", event);
                        }
                    }
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            var layout = null;

            var navigateAfterPrefetch = function () {
                Log.call(Log.l.trace, "LanguageList.Controller.");
                if (AppData._prefetchedProductView) {
                    Application.navigateById("productlist");
                } else {
                    WinJS.Promise.timeout(250).then(function () {
                        that.navigateAfterPrefetch();
                    });
                }
                Log.ret(Log.l.trace);
            }
            this.navigateAfterPrefetch = navigateAfterPrefetch;

            // define handlers
            this.eventHandlers = {
                clickBack: function(event) {
                    Log.call(Log.l.trace, "LanguageList.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "LanguageList.Controller.");
                    that.navigateAfterPrefetch();
                    Log.ret(Log.l.trace);
                },
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "LanguageList.Controller.");
                    that.waitForIdleAction();
                    if (listView && listView.winControl) {
                        var listControl = listView.winControl;
                        if (listControl.selection) {
                            var selectionCount = listControl.selection.count();
                            if (selectionCount === 1) {
                                // Only one item is selected, show the page
                                listControl.selection.getItems().done(function (items) {
                                    var item = items[0];
                                    if (item.data &&
                                        item.data.LanguageID &&
                                        item.data.LanguageID !== AppData._persistentStates.languageId) {
                                        AppData.setErrorMsg(that.binding);
                                        AppData._persistentStates.languageId = item.data.LanguageID;
                                        Application.pageframe.savePersistentStates();
                                        Application.pageframe.reCheckForLanguage(function() {
                                            WinJS.Resources.processAll(pageElement).then(function() {
                                                that.prefetchProductView();
                                            });
                                        }, function() {
                                            var errorResponse = "Error: failed to switch language!";
                                            AppData.setErrorMsg(that.binding, errorResponse);
                                        });
                                    }
                                });
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "LanguageList.Controller.");
                    if (listView && listView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState);
                        // single list selection
                        if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.single) {
                            listView.winControl.selectionMode = WinJS.UI.SelectionMode.single;
                        }
                        // direct selection on each tap
                        if (listView.winControl.tapBehavior !== WinJS.UI.TapBehavior.directSelect) {
                            listView.winControl.tapBehavior = WinJS.UI.TapBehavior.directSelect;
                        }
                        if (listView.winControl.loadingState === "itemsLoading") {
                            if (!layout) {
                                layout = new Application.LanguageListLayout.LanguagesLayout;
                                listView.winControl.layout = { type: layout, orientation: WinJS.UI.Orientation.vertical };
                            }
                        } else if (listView.winControl.loadingState === "itemsLoaded") {
                            var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                            var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                            var maxIndex = 2 * indexOfLastVisible - indexOfFirstVisible + 1;
                            if (maxIndex >= that.binding.count) {
                                maxIndex = that.binding.count - 1;
                            }
                            for (var i = indexOfFirstVisible; i <= maxIndex; i++) {
                                var element = listView.winControl.elementFromIndex(i);
                                if (element) {
                                    var listImageConainer = element.querySelector(".list-image-container");
                                    if (listImageConainer) {
                                        that.loadPicture(listImageConainer.docId, listImageConainer);
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onHeaderVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "LanguageList.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        var visible = eventInfo.detail.visible;
                        if (visible) {
                            var contentHeader = listView.querySelector(".content-header");
                            if (contentHeader) {
                                var halfCircle = contentHeader.querySelector(".half-circle");
                                if (halfCircle && halfCircle.style) {
                                    if (halfCircle.style.visibility === "hidden") {
                                        halfCircle.style.visibility = "";
                                        WinJS.UI.Animation.enterPage(halfCircle);
                                    }
                                }
                            }
                        }
                    }
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

            var showPicture = function (imageContainer, imageData, bDoAnimation) {
                Log.call(Log.l.trace, "LanguageList.Controller.");
                var ret = WinJS.Promise.as().then(function () {
                    var element = imageContainer.firstElementChild || imageContainer.firstChild;
                    if (element) {
                        if (element.className === "list-image") {
                            Log.print(Log.l.trace, "extra ignored");
                        } else {
                            Log.print(Log.l.trace, "insert image");
                            var img = new Image();
                            imageContainer.insertBefore(img, element);
                            WinJS.Utilities.addClass(img, "list-image");
                            img.src = imageData;
                            if (bDoAnimation) {
                                return WinJS.UI.Animation.fadeIn(img);
                            }
                        }
                    }
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.showPicture = showPicture;
            var fadeAnimantion = function (element, bIn) {
                Log.call(Log.l.trace, "Start.Controller.");
                if (element && that.binding) {
                    var fnAnimation = bIn ? WinJS.UI.Animation.fadeIn : WinJS.UI.Animation.fadeOut;
                    fnAnimation(element).done(function () {
                        if (!that.binding || !that.binding.showStart) {
                            Log.print(Log.l.trace, "finished");
                        } else {
                            Log.print(Log.l.trace, "go on with animation");
                            that.animationPromise = WinJS.Promise.timeout(1000).then(function () {
                                that.fadeAnimantion(element, !bIn);
                            });
                        }
                    });
                }
                Log.ret(Log.l.trace);
            }
            this.fadeAnimantion = fadeAnimantion;
            var loadPicture = function (pictureId, element) {
                Log.call(Log.l.trace, "LanguageList.Controller.", "pictureId=" + pictureId);
                var ret = null;
                if (LanguageList.images.length > 0) {
                    for (var i = 0; i < LanguageList.images.length; i++) {
                        var imageItem = LanguageList.images[i];
                        if (imageItem && imageItem.LandflaggeID === pictureId) {
                            ret = that.showPicture(element, imageItem.picture);
                            break;
                        }
                    }
                }
                if (!ret) {
                    ret = LanguageList.languageDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "languageDocView: success!");
                        if (json.d) {
                            var docContent =  json.d.DocContentDOCCNT1;
                            if (docContent) {
                                var sub = docContent.search("\r\n\r\n");
                                if (sub >= 0) {
                                    var format = "data:image/";
                                    switch (json.d.wFormat) {
                                        case 5:
                                            format += "gif";
                                            break;
                                        case 53:
                                            format += "png";
                                            break;
                                        default:
                                            format += "jpeg";
                                            break;
                                    }
                                    var picture = format + ";base64," + docContent.substr(sub + 4);
                                    var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                                    var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                                    if (LanguageList.images.length > (indexOfLastVisible - indexOfFirstVisible) * 3) {
                                        Log.print(Log.l.trace, "indexOfFirstVisible=" + indexOfFirstVisible + " indexOfLastVisible=" + indexOfLastVisible + " images.length=" + LanguageList.images.length + " hit maximum!");
                                        LanguageList.images.splice(0, 1);
                                    }
                                    LanguageList.images.push({
                                        type: "item",
                                        LandflaggeID: json.d.DOC1LandflaggeVIEWID,
                                        picture: picture
                                    });
                                    that.showPicture(element, picture, true);
                                }
                            }
                        } else {
                            that.waitForIdleAction();
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        that.waitForIdleAction();
                    }, pictureId);
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadPicture = loadPicture;

            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "selectionchanged", this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
                this.addRemovableEventListener(listView, "headervisibilitychanged", this.eventHandlers.onHeaderVisibilityChanged.bind(this));
            }

            var prefetchProductView = function() {
                Log.call(Log.l.trace, "LanguageList.Controller.");
                AppData._prefetchedProductView = null;
                AppData.setErrorMsg(that.binding);
                var contactId = AppData.getRecordId("Kontakt");
                var ret = new WinJS.Promise.as().then(function() {
                    if (!contactId) {
                        var newContact = {
                            //no UUID in this case!
                            //HostName: (window.device && window.device.uuid),
                            //Use ScanFlag to mark for delayed barcode scan!
                            ScanFlag: -1,
                            MitarbeiterID: AppData.getRecordId("Mitarbeiter"),
                            VeranstaltungID: AppData.getRecordId("Veranstaltung"),
                            Nachbearbeitet: 1
                        };
                        Log.print(Log.l.trace, "insert new contactView for MitarbeiterID=" + newContact.MitarbeiterID);
                        return LanguageList.contactView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "LanguageList.contactView: insert success!");
                            // contactData returns object already parsed from json data in response
                            if (json && json.d && json.d.KontaktVIEWID) {
                                contactId = json.d.KontaktVIEWID;
                                AppData.setRecordId("Kontakt", contactId);
                                if (AppData._userRemoteDataPromise) {
                                    Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                    AppData._userRemoteDataPromise.cancel();
                                }
                                AppData._userRemoteDataPromise = WinJS.Promise.timeout(100).then(function () {
                                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + 100 + "s is over!");
                                    AppData._curGetUserRemoteDataId = 0;
                                    AppData.getUserRemoteData();
                                    //Log.print(Log.l.info, "getCRVeranstOption: Now, timeout=" + 100 + "s is over!");
                                    //AppData.getCRVeranstOption();
                                });
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newContact);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    if (!contactId) {
                        // error message already returned
                        return WinJS.Promise.as();
                    } else {
                        return LanguageList.productView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "LanguageList.productView: select success!");
                            // productView returns object already parsed from json data in response
                            if (json && json.d) {
                                AppData._prefetchedProductView = json;
                            } else {
                                that.waitForIdleAction();
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            that.waitForIdleAction();
                        });
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.prefetchProductView = prefetchProductView;

            var loadData = function() {
                Log.call(Log.l.trace, "LanguageList.Controller.");
                AppData.setErrorMsg(that.binding);
                if (that.languages) {
                    that.languages.length = 0;
                }
                var ret = new WinJS.Promise.as().then(function () {
                    return LanguageList.languageView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "LanguageList.languageView: select success!");
                        if (json && json.d && json.d.results) {
                            var results = json.d.results;
                            that.binding.count = results.length;
                            if (!that.languages) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                that.languages = new WinJS.Binding.List(results);
                                if (listView.winControl) {
                                    // add ListView dataSource
                                    listView.winControl.itemDataSource = that.languages.dataSource;
                                }
                            }
                        } else {
                            that.waitForIdleAction();
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    });
                }).then(function () {
                    that.prefetchProductView();
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Colors.loadSVGImageElements(pageElement, "languagelist-navigate-image", 512, Colors.kioskProductTitleColor, "title", function (svgInfo) {
                    if (svgInfo && svgInfo.element && svgInfo.element.title === "hand_touch") {
                        that.fadeAnimantion(svgInfo.element.firstElementChild ||
                            svgInfo.element.firstChild, true);
                    }
                });
                Colors.loadSVGImageElements(pageElement, "languagelist-navigate-image-black", 512, "#000000", "title", function (svgInfo) {
                });
                Log.print(Log.l.trace, "Splash time over");
                if (AppHeader.controller && AppHeader.controller.binding) {
                    that.binding.organizerLogoSrc = AppHeader.controller.binding.organizerLogoSrc;
                }
                return Application.pageframe.hideSplashScreen();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
                if (AppHeader.controller && AppHeader.controller.binding) {
                    that.binding.organizerLogoSrc = AppHeader.controller.binding.organizerLogoSrc;
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();







