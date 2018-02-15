// controller for page: listLocal
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/lib/convey/scripts/colors.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/productlist/productlistService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ProductList", {
        images: [],
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "ProductList.Controller.");
            Application.Controller.apply(this, [pageElement, {
                count: 0,
                clickOkDisabled: true,
                clickOkDisabledInvert: false,
                version: Application.version
            }]);
            this.nextUrl = null;
            this.loading = false;
            this.products = null;
            this.selection = [];
            this.prevSelectionIndices = [];
            this.productSelectionGroup = {};

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 300000;

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#productlist.listview");

            this.dispose = function () {
                that.cancelPromises();
                if (listView && listView.winControl) {
                    // remove ListView dataSource
                    listView.winControl.itemDataSource = null;
                }
                if (that.products) {
                    // free products list
                    that.products = null;
                }
                if (that.selection) {
                    // free selection
                    that.selection = null;
                }
                if (that.prevSelectionIndices) {
                    // free prevSelectionIndices
                    that.prevSelectionIndices = null;
                }
            };

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

            var waitForIdleAction = function() {
                Log.call(Log.l.trace, "ProductList.Controller.", "idleWaitTimeMs=" + that.idleWaitTimeMs);
                that.cancelPromises();
                that.restartPromise = WinJS.Promise.timeout(that.idleWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "timeout occurred, check for selectionCount!");
                    // Don't delete empty contacts now
                    var contactId = AppData.getRecordId("Kontakt");
                    Log.print(Log.l.trace, "contactId=" + contactId);
                    if (contactId && !that.binding.clickOkDisabled) {
                        AppData.setRecordId("Kontakt", null);
                        that.loadData();
                    }
                    /*
                    var contactId = AppData.getRecordId("Kontakt");
                    Log.print(Log.l.trace, "contactId=" + contactId);
                    if (contactId && !that.binding.clickOkDisabled) {
                        Log.print(Log.l.trace, "delete existing contactID=" + contactId);
                        ProductList.contactView.deleteRecord(function (json) {
                            // this callback will be called asynchronously
                            Log.print(Log.l.trace, "contactView: deleteRecord success!");
                            AppData.setRecordId("Kontakt", null);
                            that.loadData();
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, contactId);
                    }
                     */
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            var progress = null;
            var counter = null;
            var layout = null;

            var resultConverter = function (item, index) {
                Log.call(Log.l.u1, "ProductList.Controller.", "index=" + index);
                // convert result: set background color
                if (item.Farbe) {
                    var r = item.Farbe & 0xff;
                    var g = Math.floor(item.Farbe / 0x100) & 0xff;
                    var b = Math.floor(item.Farbe / 0x10000) & 0xff;
                    item.color = Colors.rgb2hex(r, g, b);
                    Log.print(Log.l.u1, "color=" + item.color);
                } else {
                    item.color = "transparent";
                }
                item.disabled = false;
                if (item.ProduktSelektionsGruppeID) {
                    if (!that.productSelectionGroup[item.ProduktSelektionsGruppeID]) {
                        that.productSelectionGroup[item.ProduktSelektionsGruppeID] = {
                            indexes: [],
                            selIndex: -1
                        };
                    }
                    that.productSelectionGroup[item.ProduktSelektionsGruppeID].indexes.push(index);
                    if (that.productSelectionGroup[item.ProduktSelektionsGruppeID].selIndex >= 0 &&
                        that.productSelectionGroup[item.ProduktSelektionsGruppeID].selIndex !== index) {
                        Log.print(Log.l.u1, "other item in group selected!");
                        item.disabled = true;
                    }
                }
                if (item.SelLimit) {
                    Log.print(Log.l.u1, "SelLimit=" + item.SelLimit + " SelCount=" + item.SelCount);
                    if (item.SelCount >= item.SelLimit) {
                        Log.print(Log.l.u1, "limit exceeded!");
                        item.disabled = true;
                    }
                }
                Log.ret(Log.l.u1);
            }
            this.resultConverter = resultConverter;
            
            var setSelectionGroupIndex = function(selGroup, index) {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (selGroup) {
                    if (index >= 0) {
                        selGroup.selIndex = index;
                        WinJS.Promise.timeout(0).then(function () {
                            if (selGroup && selGroup.indexes) {
                                for (var di = 0; di < selGroup.indexes.length; di++) {
                                    if (selGroup.indexes[di] !== index) {
                                        var item = that.products.getAt(selGroup.indexes[di]);
                                        if (item) {
                                            item.disabled = true;
                                            that.products.setAt(selGroup.indexes[di], item);
                                        }
                                    }
                                }
                            }
                        });
                    } else {
                        selGroup.selIndex = -1;
                        WinJS.Promise.timeout(0).then(function () {
                            if (selGroup && selGroup.indexes) {
                                for (var ei = 0; ei < selGroup.indexes.length; ei++) {
                                    var item = that.products.getAt(selGroup.indexes[ei]);
                                    if (item && (!item.SelLimit || item.SelCount < item.SelLimit)) {
                                        item.disabled = false;
                                        that.products.setAt(selGroup.indexes[ei], item);
                                    }
                                }
                            }
                        });
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.setSelectionGroupIndex = setSelectionGroupIndex;

            var addSelection = function (results) {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (listView && listView.winControl) {
                    var selection = listView.winControl.selection;
                    if (that.selection && selection) {
                        for (var i = 0; i < that.selection.length; i++) {
                            var row = that.selection[i];
                            if (!row.selected) {
                                for (var index = 0; index < results.length; index++) {
                                    var item = results[index];
                                    if (row && row.ProduktID === item.ProduktID) {
                                        Log.print(Log.l.trace, "selection[" + i + "] ProductID=" + item.ProduktID + ", selected list index=" + index);
                                        if (item.ProduktSelektionsGruppeID) {
                                            that.setSelectionGroupIndex(that.productSelectionGroup[item.ProduktSelektionsGruppeID], index);
                                        }
                                        var prevNotifyModified = AppBar.notifyModified;
                                        selection.add(index);
                                        that.prevSelectionIndices.push(index);
                                        AppBar.notifyModified = prevNotifyModified;
                                        row.selected = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                if (that.prevSelectionIndices && that.prevSelectionIndices.length > 0) {
                    that.binding.clickOkDisabled = false;
                    that.binding.clickOkDisabledInvert = true;
                } else {
                    that.binding.clickOkDisabled = true;
                    that.binding.clickOkDisabledInvert = false;
                }
                Log.ret(Log.l.trace);
            }
            this.addSelection = addSelection;

            // define handlers
            this.eventHandlers = {
                clickBack: function(event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    that.cancelPromises();
                    Application.navigateById("start", event);
                    //if (WinJS.Navigation.canGoBack === true) {
                    //    WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    //}
                    Log.ret(Log.l.trace);
                },
                clickScan: function (event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    that.cancelPromises();
                    Application.navigateById("barcode", event);
                    Log.ret(Log.l.trace);
                },
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    that.waitForIdleAction();
                    if (!AppBar.notifyModified) {
                        Log.print(Log.l.trace, "modify ignored");
                    } else {
                        var contactId = AppData.getRecordId("Kontakt");
                        Log.print(Log.l.trace, "contactId=" + contactId);
                        if (!contactId) {
                            AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            WinJS.Promise.timeout(0).then(function() {
                                that.loadData();
                            });
                        } else if (listView && listView.winControl) {
                            var listControl = listView.winControl;
                            if (listControl.selection && that.selection && that.products) {
                                var i, selIndex, prevIndex, row;
                                var curSelectionIndices = listControl.selection.getIndices();
                                for (i = 0; i < that.prevSelectionIndices.length; i++) {
                                    prevIndex = that.prevSelectionIndices[i];
                                    selIndex = curSelectionIndices.indexOf(prevIndex);
                                    if (selIndex < 0) {
                                        // get from Binding.List
                                        row = that.products.getAt(prevIndex);
                                        if (row.ProduktSelektionsGruppeID) {
                                            Log.print(Log.l.trace, "deselected prevIndex=" + prevIndex + " from ProduktSelektionsGruppeID=" + row.ProduktSelektionsGruppeID);
                                            that.setSelectionGroupIndex(that.productSelectionGroup[row.ProduktSelektionsGruppeID], -1);
                                        }
                                        that.deleteData(row.ProduktID);
                                    }
                                }
                                for (i = 0; i < curSelectionIndices.length; i++) {
                                    selIndex = curSelectionIndices[i];
                                    prevIndex = that.prevSelectionIndices.indexOf(selIndex);
                                    if (prevIndex < 0) {
                                        // get from Binding.List
                                        row = that.products.getAt(selIndex);
                                        if (row.ProduktSelektionsGruppeID) {
                                            Log.print(Log.l.trace, "selected selIndex=" + selIndex + " from ProduktSelektionsGruppeID=" + row.ProduktSelektionsGruppeID);
                                            that.setSelectionGroupIndex(that.productSelectionGroup[row.ProduktSelektionsGruppeID], selIndex);
                                        }
                                        that.insertData(row.ProduktID);
                                    }
                                }
                                that.prevSelectionIndices = curSelectionIndices;
                            }
                        }
                        if (that.prevSelectionIndices && that.prevSelectionIndices.length > 0) {
                            that.binding.clickOkDisabled = false;
                            that.binding.clickOkDisabledInvert = true;
                        } else {
                            that.binding.clickOkDisabled = true;
                            that.binding.clickOkDisabledInvert = false;

                        }
                        AppBar.triggerDisableHandlers();
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function(eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (listView && listView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState);
                        // single list selection
                        if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.multi) {
                            listView.winControl.selectionMode = WinJS.UI.SelectionMode.multi;
                        }
                        // direct selection on each tap
                        if (listView.winControl.tapBehavior !== WinJS.UI.TapBehavior.toggleSelect) {
                            listView.winControl.tapBehavior = WinJS.UI.TapBehavior.toggleSelect;
                        }
                        if (listView.winControl.loadingState === "itemsLoading") {
                            if (!layout) {
                                layout = new Application.ProductListLayout.ProductsLayout;
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
                                    if (element.firstElementChild) {
                                        if (element.firstElementChild.disabled) {
                                            if (!WinJS.Utilities.hasClass(element, "win-nonselectable")) {
                                                WinJS.Utilities.addClass(element, "win-nonselectable");
                                            }
                                        } else {
                                            if (WinJS.Utilities.hasClass(element, "win-nonselectable")) {
                                                WinJS.Utilities.removeClass(element, "win-nonselectable");
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (listView.winControl.loadingState === "complete") {
                            Colors.loadSVGImageElements(listView, "checkmark-image", 136, "#ffffff");
                            if (that.loading) {
                                progress = listView.querySelector(".list-footer .progress");
                                counter = listView.querySelector(".list-footer .counter");
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onHeaderVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
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
                },
                onFooterVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        progress = listView.querySelector(".list-footer .progress");
                        counter = listView.querySelector(".list-footer .counter");
                        var visible = eventInfo.detail.visible;
                        if (visible && that.products && that.nextUrl) {
                            that.loading = true;
                            if (progress && progress.style) {
                                progress.style.display = "inline";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "none";
                            }
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "calling selectNext ProductList.productView...");
                            ProductList.productView.selectNext(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "ProductList.productView: selectNext success!");
                                // productView returns object already parsed from json data in response
                                if (json && json.d) {
                                    that.nextUrl = ProductList.productView.getNextUrl(json);
                                    var results = json.d.results;
                                    results.forEach(function(item, index) {
                                        that.resultConverter(item, that.binding.count);
                                        that.binding.count = that.products.push(item);
                                    });
                                    that.addSelection(results);
                                } else {
                                    that.nextUrl = null;
                                }
                            }, function(errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                AppData.setErrorMsg(that.binding, errorResponse);
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                            }, null, that.nextUrl);
                        } else {
                            if (progress && progress.style) {
                                progress.style.display = "none";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "inline";
                            }
                            that.loading = false;
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
                },
                clickScan: function (event) {
                    return that.binding.clickOkDisabled;
                }
            };

            var showPicture = function (imageContainer, imageData, bDoAnimation) {
                Log.call(Log.l.u1, "ProductList.Controller.");
                var ret = WinJS.Promise.as().then(function () {
                    var element = imageContainer.firstElementChild || imageContainer.firstChild;
                    if (element) {
                        if (element.className === "list-image") {
                            Log.print(Log.l.u1, "extra ignored");
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
                Log.ret(Log.l.u1);
                return ret;
            }
            this.showPicture = showPicture;

            var loadPicture = function (pictureId, element) {
                Log.call(Log.l.u1, "ProductList.Controller.", "pictureId=" + pictureId);
                var ret = null;
                if (ProductList.images.length > 0) {
                    for (var i = 0; i < ProductList.images.length; i++) {
                        var imageItem = ProductList.images[i];
                        if (imageItem && imageItem.DOC1ProduktID === pictureId) {
                            ret = that.showPicture(element, imageItem.picture);
                            break;
                        }
                    }
                }
                if (!ret) {
                    ret = ProductList.productDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "productDocView: success!");
                        if (json.d) {
                            var docContent =  json.d.DocContentDOCCNT1;
                            if (docContent) {
                                var sub = docContent.search("\r\n\r\n");
                                var picture = "data:image/jpeg;base64," + docContent.substr(sub + 4);
                                var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                                var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                                if (ProductList.images.length > (indexOfLastVisible - indexOfFirstVisible) * 3) {
                                    Log.print(Log.l.trace, "indexOfFirstVisible=" + indexOfFirstVisible + " indexOfLastVisible=" + indexOfLastVisible + " images.length=" + ProductList.images.length + " hit maximum!");
                                    ProductList.images.splice(0, 1);
                                }
                                ProductList.images.push({
                                    type: "item",
                                    DOC1ProduktID: json.d.DOC1ProduktVIEWID,
                                    picture: picture
                                });
                                that.showPicture(element, picture, true);
                            }
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, pictureId);
                }
                Log.ret(Log.l.u1);
                return ret;
            }
            this.loadPicture = loadPicture;


            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "selectionchanged", this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
                this.addRemovableEventListener(listView, "headervisibilitychanged", this.eventHandlers.onHeaderVisibilityChanged.bind(this));
                this.addRemovableEventListener(listView, "footervisibilitychanged", this.eventHandlers.onFooterVisibilityChanged.bind(this));
            }
            var loadData = function() {
                Log.call(Log.l.trace, "ProductList.Controller.");
                AppBar.notifyModified = false;
                that.loading = true;
                progress = listView.querySelector(".list-footer .progress");
                counter = listView.querySelector(".list-footer .counter");
                if (progress && progress.style) {
                    progress.style.display = "inline";
                }
                if (counter && counter.style) {
                    counter.style.display = "none";
                }
                AppData.setErrorMsg(that.binding);
                if (that.products) {
                    that.products.length = 0;
                }
                that.prevSelectionIndices = [];
                that.productSelectionGroup = {};
                var contactId = AppData.getRecordId("Kontakt");
                var ret = new WinJS.Promise.as().then(function () {
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
                        return ProductList.contactView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "contactView: insert success!");
                            // contactData returns object already parsed from json data in response
                            if (json && json.d && json.d.KontaktVIEWID) {
                                contactId = json.d.KontaktVIEWID;
                                AppData.setRecordId("Kontakt", contactId);
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
                        return ProductList.productSelectionView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "ProductList.productSelectionView: select success!");
                            // productSelectionView returns object already parsed from json data in response
                            if (json && json.d) {
                                var results = json.d.results;
                                Log.print(Log.l.trace, "count=" + results.count);
                                that.selection = results;
                            }
                            return WinJS.Promise.as();
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            return WinJS.Promise.as();
                        }, {
                            KontaktID: contactId
                        });
                    }
                }).then(function () {
                    if (!contactId) {
                        // error message already returned
                        return WinJS.Promise.as();
                    } else {
                        return ProductList.productView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "ProductList.productView: select success!");
                            // productView returns object already parsed from json data in response
                            if (json && json.d) {
                                that.nextUrl = ProductList.productView.getNextUrl(json);
                                var results = json.d.results;
                                if (!that.products) {
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                    });
                                    // Now, we call WinJS.Binding.List to get the bindable list
                                    that.products = new WinJS.Binding.List(results);
                                    if (listView.winControl) {
                                        // add ListView dataSource
                                        listView.winControl.itemDataSource = that.products.dataSource;
                                    }
                                } else {
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                        that.products.push(item);
                                    });
                                }
                                that.binding.count = that.products.length;
                                that.addSelection(results);
                            } else {
                                that.binding.count = 0;
                                that.nextUrl = null;
                                progress = listView.querySelector(".list-footer .progress");
                                counter = listView.querySelector(".list-footer .counter");
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            progress = listView.querySelector(".list-footer .progress");
                            counter = listView.querySelector(".list-footer .counter");
                            if (progress && progress.style) {
                                progress.style.display = "none";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "inline";
                            }
                            that.loading = false;
                        });
                    }
                }).then(function () {
                    AppBar.notifyModified = true;
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var deleteData = function (productId) {
                var ret;
                Log.call(Log.l.trace, "ProductList.Controller.", "ProduktID=" + productId);
                var selectionId = null;
                for (var j = 0; j < that.selection.length; j++) {
                    var item = that.selection[j];
                    if (productId === item.ProduktID) {
                        selectionId = item.ProduktAuswahlVIEWID;
                        Log.print(Log.l.trace, "selectionId=" + selectionId);
                        break;
                    }
                }
                if (selectionId) {
                    // delete from selection in DB
                    ret = ProductList.productSelectionView.deleteRecord(function(json) {
                            // this callback will be called asynchronously
                            // when the response is available
                        Log.print(Log.l.trace, "productSelectionView: delete success!");
                        for (var k = 0; k < that.selection.length; k++) {
                            if (selectionId === that.selection[k].ProduktAuswahlVIEWID) {
                                Log.print(Log.l.trace, "remove selection[" + k + "]=" + that.selection[k].ProduktAuswahlVIEWID);
                                that.selection.splice(k, 1);
                                break;
                            }
                        }
                    },
                    function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        //AppData.setErrorMsg(that.binding, errorResponse);
                        WinJS.Promise.timeout(1000).then(function() {
                            that.loadData();
                        });
                    },
                    selectionId);
                } else {
                    //AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                    ret = WinJS.Promise.as();
                    WinJS.Promise.timeout(1000).then(function () {
                        that.loadData();
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.deleteData = deleteData;
            
            var insertData = function (productId) {
                var ret;
                Log.call(Log.l.trace, "ProductList.Controller.", "ProduktID=" + productId);
                var contactId = AppData.getRecordId("Kontakt");
                Log.print(Log.l.trace, "contactId=" + contactId);
                if (productId && contactId) {
                    var newSelection = {
                        KontaktID: contactId,
                        ProduktID: productId
                    };
                    // insert into selection in DB
                    ret = ProductList.productSelectionView.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "productSelectionView: insert success!");
                        // contactData returns object already parsed from json data in response
                        if (json && json.d && json.d.ProduktID === productId) {
                            // add to cached selection array
                            Log.print(Log.l.trace, "add selection[" + that.selection.length + "]=" + json.d.ProduktAuswahlVIEWID);
                            that.selection.push(json.d);
                        } else {
                            //AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        //AppData.setErrorMsg(that.binding, errorResponse);
                        WinJS.Promise.timeout(1000).then(function () {
                            that.loadData();
                        });
                    }, newSelection);
                } else {
                    //AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                    ret = WinJS.Promise.as();
                    WinJS.Promise.timeout(1000).then(function () {
                        that.loadData();
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.insertData = insertData;
            
            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();







