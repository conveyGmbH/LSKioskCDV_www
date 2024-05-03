// controller for page: listLocal
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
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
                showBarcode: false,
                showCamera: false,
                version: Application.version,
                isGrouped: false,
                continueText: AppData._persistentStates.kioskUsesCamera ? getResourceText("productlist.camera") : getResourceText("productlist.barcode"),
                zoomedOut: true,
                showMainGroups: false,
                showSubGroups: false,
                eventLogoSrc: ""
            }]);
            this.nextUrl = null;
            this.loading = false;
            this.groupLoading = false;
            this.productSelGrpID = -1;
            this.products = null;
            this.productsFiltered = null;
            this.productsBase = null;
            this.selection = [];
            this.prevSelectionIndices = [];
            this.productSelectionGroup = {};
            this.mainGroups = null;
            this.subGroups = null;

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 120000;

            this.reloadPromise = null;
            this.reloadWaitTimeMs = 500;

            this.scrollIntoViewDelay = 10;
            this.scrollIntoViewPromise = null;

            this.updatePicturesInViewPromise = null;

           // this.hasSelLimit = false;

            var that = this;

            // MainGroups ListView control
            var productMainGroups = pageElement.querySelector("#productmaingroups.listview");
            // SubGroups ListView control
            var productSubGroups = pageElement.querySelector("#productsubgroups.listview");

            // ListView control
            var listView = pageElement.querySelector("#productlist.listview");
            var groupView = pageElement.querySelector("#productgroups.listview");
            var sezoom = pageElement.querySelector("#sezoom");
            var maxLeadingPages = null;
            var maxTrailingPages = null;

            this.dispose = function () {
                that.cancelPromises();
                if (productMainGroups && productMainGroups.winControl) {
                    // remove ListView dataSource
                    productMainGroups.winControl.itemDataSource = null;
                }
                if (productSubGroups && productSubGroups.winControl) {
                    // remove ListView dataSource
                    productSubGroups.winControl.itemDataSource = null;
                }
                if (groupView && groupView.winControl) {
                    // remove ListView dataSource
                    groupView.winControl.itemDataSource = null;
                }
                if (listView && listView.winControl) {
                    // remove ListView dataSource
                    listView.winControl.itemDataSource = null;
                }
                if (that.products) {
                    // free products list
                    that.products = null;
                }
                if (that.productsFiltered) {
                    // free products list
                    that.productsFiltered = null;
                }
                if (that.productsBase) {
                    // free products list
                    that.productsBase = null;
                }
                if (that.selection) {
                    // free selection
                    that.selection = null;
                }
            };

            var cancelPromises = function () {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (that.checkLoadingStatePromise) {
                    Log.print(Log.l.trace, "cancel previous checkLoadingState Promise");
                    that.checkLoadingStatePromise.cancel();
                    that.checkLoadingStatePromise = null;
                }
                if (that.scrollIntoViewPromise) {
                    Log.print(Log.l.trace, "cancel previous scrollIntoView Promise");
                    that.scrollIntoViewPromise.cancel();
                    that.scrollIntoViewPromise = null;
                }
                if (that.reloadPromise) {
                    Log.print(Log.l.trace, "cancel previous reload Promise");
                    that.reloadPromise.cancel();
                    that.reloadPromise = null;
                }
                if (that.restartPromise) {
                    Log.print(Log.l.trace, "cancel previous restart Promise");
                    that.restartPromise.cancel();
                    that.restartPromise = null;
                }
                Log.ret(Log.l.trace);
            }
            this.cancelPromises = cancelPromises;

            var waitForReloadAction = function () {
                Log.call(Log.l.trace, "ProductList.Controller.", "reloadWaitTimeMs=" + that.reloadWaitTimeMs);
                that.cancelPromises();
                that.reloadPromise = WinJS.Promise.timeout(that.reloadWaitTimeMs).then(function () {
                    Log.print(Log.l.trace, "now reload data!");
                    that.loadData();
                });
                Log.ret(Log.l.trace);
            };
            this.waitForReloadAction = waitForReloadAction;

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
                    } /*else if (that.hasSelLimit) {
                        Log.print(Log.l.trace, "releoad due to selLimit");
                        that.loadData();
                    }*/
                });
                Log.ret(Log.l.trace);
            };
            this.waitForIdleAction = waitForIdleAction;

            var progress = null;
            var counter = null;
            var grouplayout = null;
            var layout = null;

            if (groupView && groupView.winControl) {
                grouplayout = new Application.ProductListLayout.GroupsLayout;
                groupView.winControl.layout = {
                    type: grouplayout,
                    orientation: WinJS.UI.Orientation.vertical
                };
            }
            if (listView && listView.winControl) {
                layout = new Application.ProductListLayout.ProductsLayout;
                listView.winControl.layout = {
                    type: layout,
                    orientation: WinJS.UI.Orientation.vertical,
                    groupHeaderPosition: "top"
                };
            }

            var mainGroupsResultConverter = function(item, index) {
                Log.call(Log.l.u1, "ProductList.Controller.", "index=" + index);
                item.groupBorderColor = Colors.kioskProductBackgroundColor;
                var rgb = Colors.hex2rgb(Colors.kioskProductBackgroundColor);
                if (rgb.r > 127 && rgb.g > 127 && rgb.b > 127) {
                    item.groupColor = "#000000";
                } else {
                    item.groupColor = "#ffffff";
                }
                Log.ret(Log.l.u1);
            };
            that.mainGroupsResultConverter = mainGroupsResultConverter;

            var subGroupsResultConverter = function(item, index) {
                Log.call(Log.l.u1, "ProductList.Controller.", "index=" + index);
                item.groupBorderColor = Colors.kioskProductBackgroundColor;
                var rgb = Colors.hex2rgb(Colors.kioskProductBackgroundColor);
                if (rgb.r > 127 && rgb.g > 127 && rgb.b > 127) {
                    item.groupColor = "#000000";
                } else {
                    item.groupColor = "#ffffff";
                }
                Log.ret(Log.l.u1);
            };
            that.subGroupsResultConverter = subGroupsResultConverter;

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
                if (item.ProduktSelGrpID) {
                    if (!item.ProduktSelektionsMaxSel || item.ProduktSelektionsMaxSel < 0) {
                        item.ProduktSelektionsMaxSel = 1;
                    }
                    if (!that.productSelectionGroup[item.ProduktSelGrpID]) {
                        that.productSelectionGroup[item.ProduktSelGrpID] = {
                            indexes: [],
                            selIndexes: [],
                            maxSel: item.ProduktSelektionsMaxSel,
                            mandatory: !!item.ProduktSelektionsMandatory,
                            show: false
                        };
                    }
                    var curGroup = that.productSelectionGroup[item.ProduktSelGrpID];
                    if (curGroup.indexes && curGroup.selIndexes) {
                        curGroup.indexes.push(index);
                        if (curGroup.selIndexes.indexOf(index) >= 0) {
                            Log.print(Log.l.u1, "item[" + index + "] is already selected!");
                        } else if (curGroup.selIndexes.length < curGroup.maxSel) {
                            Log.print(Log.l.u1, "yet " + (curGroup.maxSel - curGroup.selIndexes.length).toString() + " items selectable");
                        } else {
                            Log.print(Log.l.u1, "already " + curGroup.selIndexes.length + " other item(s) in group selected!");
                            item.disabled = true;
                        }
                    }
                }
                /*if (item.SelLimit) {
                    Log.print(Log.l.u1, "SelLimit=" + item.SelLimit + " SelCount=" + item.SelCount);
                    that.hasSelLimit = true;
                    if (item.SelCount >= item.SelLimit) {
                        Log.print(Log.l.u1, "limit exceeded!");
                        item.disabled = true;
                    }
                }*/
                if (item.Width) {
                    item.StyleWidth = item.Width + "px";
                } else {
                    item.StyleWidth = "1840px";
                }
                item.StylePaddingY = "0";
                if (item.Height) {
                    item.StyleHeight = item.Height + "px";
                    if (item.MaxHeight) {
                        item.PaddingY = (item.MaxHeight - item.Height) / 2;
                        item.StylePaddingY = item.PaddingY + "px";
                    }
                } else {
                    item.StyleHeight = "0";
                }
                if (item.Width && item.Height) {
                    item.DocID = item.ProduktID;
                } else {
                    item.DocID = null;
                }
                item.preload = 1;
                item.groupBkgColor = Colors.kioskProductBackgroundColor;
                var rgb = Colors.hex2rgb(item.groupBkgColor);
                if (rgb.r > 127 && rgb.g > 127 && rgb.b > 127) {
                    item.groupColor = "#000000";
                } else {
                    item.groupColor = "#ffffff";
                }
                Log.ret(Log.l.u1);
            }
            this.resultConverter = resultConverter;

            var productFilter = function(item) {
                return ((!AppData.mainGroupId || AppData.mainGroupId === item.INITFragengruppeID1) &&
                    (!AppData.subGroupId || AppData.subGroupId === item.INITFragengruppeID));
            }

            var groupIndex = function (item) {
                var index = 0;
                if (typeof item.ProduktGruppeIndex === "string") {
                    index = parseInt(item.ProduktGruppeIndex);
                } else if (typeof item.ProduktGruppeIndex === "number") {
                    index = item.ProduktGruppeIndex;
                }
                return index;
            };

            var groupKey = function (item) {
                var index = groupIndex(item);
                // always return string!
                //var ret = (index + 1000).toString().substr(1);
                return index.toString();
            };

            var groupData = function(item) {
                return item;
            };

            var groupSorter = function(left, right) {
                return groupIndex(left) - groupIndex(right);
            };

            var itemInfo = function (itemIndex) {
                var size = { width: 445, height: 250 };
                if (that.products) {
                    // Get the item from the data source
                    var item = that.products.getAt(itemIndex);
                    if (item) {
                        if (!item.Width) {
                            item.Width = 1840;
                        }
                        if (!item.Height) {
                            item.Height = 0;
                        }
                        var height = item.Height;
                        if (item.PaddingY) {
                            height += 2 * item.PaddingY;
                        }
                        // Get the size based on the item type
                        size = { 
                            width: item.Width, 
                            height: height
                        };
                    }
                }
                return size;
            };

            var setSelectionGroupIndex = function(selGroup, index, selected) {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (selGroup && index >= 0) {
                    if (selected) {
                        selGroup.selIndexes.push(index);
                        WinJS.Promise.timeout(0).then(function disableSelection() {
                            Log.call(Log.l.trace, "ProductList.Controller.");
                            if (selGroup && selGroup.indexes) {
                                for (var di = 0; di < selGroup.indexes.length; di++) {
                                    var sgi = selGroup.indexes[di];
                                    if (selGroup.selIndexes.indexOf(sgi) >= 0) {
                                        Log.print(Log.l.u2, "item[" + sgi + "] is already selected!");
                                    } else if (selGroup.selIndexes.length < selGroup.maxSel) {
                                        Log.print(Log.l.u2, "yet " + selGroup.maxSel - selGroup.selIndexes.length + " items selectable");
                                    } else {
                                        Log.print(Log.l.trace, "already " + selGroup.selIndexes.length + " other item(s) in group selected!");
                                        var item = that.products.getAt(sgi);
                                        if (item) {
                                            item.disabled = true;
                                            that.products.setAt(sgi, item);
                                        }
                                    }
                                }
                            }
                            Log.ret(Log.l.trace);
                        });
                    } else {
                        var prevIndex = selGroup.selIndexes.indexOf(index);
                        if (prevIndex >= 0) {
                            selGroup.selIndexes.splice(prevIndex, 1);
                        }
                        WinJS.Promise.timeout(0).then(function enableSelection() {
                            Log.call(Log.l.trace, "ProductList.Controller.");
                            if (selGroup && selGroup.indexes) {
                                for (var ei = 0; ei < selGroup.indexes.length; ei++) {
                                    var item = that.products.getAt(selGroup.indexes[ei]);
                                    if (item) { /* && (!item.SelLimit || item.SelCount < item.SelLimit)*/
                                        //Log.print(Log.l.trace, "only " + item.SelCount + " of limit " + item.SelLimit + " in group selected!");
                                        Log.print(Log.l.trace, "item in group selected!");
                                        item.disabled = false;
                                        that.products.setAt(selGroup.indexes[ei], item);
                                    }
                                }
                            }
                            Log.ret(Log.l.trace);
                        });
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.setSelectionGroupIndex = setSelectionGroupIndex;
            
            var checkOkDisabled = function() {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (that.selection && that.selection.length > 0) {
                    var bMandatoryMissing = false;
                    for (var groupId in that.productSelectionGroup) {
                        if (that.productSelectionGroup.hasOwnProperty(groupId)) {
                            var curGroup = that.productSelectionGroup[groupId];
                            if (curGroup.mandatory && !curGroup.selIndexes.length) {
                                bMandatoryMissing = true;
                                break;
                            }
                        }
                    }
                    if (bMandatoryMissing) {
                        that.binding.clickOkDisabled = true;
                        that.binding.clickOkDisabledInvert = false;
                    } else {
                        that.binding.clickOkDisabled = false;
                        that.binding.clickOkDisabledInvert = true;
                    }
                } else {
                    that.binding.clickOkDisabled = true;
                    that.binding.clickOkDisabledInvert = false;
                }
                if (that.binding.clickOkDisabled) {
                    that.binding.showBarcode = false;
                    that.binding.showCamera = false;
                } else if (AppData._persistentStates.useBarcodeScanner) {
                    that.binding.showBarcode = true;
                    that.binding.showCamera = false;
                } else {
                    that.binding.showBarcode = true;
                    that.binding.showCamera = true;
                }
                Log.ret(Log.l.trace);
            }
            this.checkOkDisabled = checkOkDisabled;

            var addSelectionToListView = function (startIndex) {
                Log.call(Log.l.trace, "ProductList.Controller.");
                that.prevSelectionIndices = [];
                if (listView && listView.winControl && that.products && that.selection) {
                    var selection = listView.winControl.selection;
                    if (selection) {
                        var curSelectionIndices = selection.getIndices() || [];
                        for (var i = 0; i < that.selection.length; i++) {
                            if (curSelectionIndices.indexOf(i) < 0) {
                                var row = that.selection[i];
                                for (var index = startIndex || 0; index < that.products.length; index++) {
                                    var item = that.products.getAt(index);
                                    if (row && row.ProduktID === item.ProduktID) {
                                        Log.print(Log.l.trace, "selection[" + i + "] ProductID=" + item.ProduktID + ", selected list index=" + index);
                                        if (item.ProduktSelGrpID) {
                                            that.setSelectionGroupIndex(that.productSelectionGroup[item.ProduktSelGrpID], index, true);
                                        }
                                        var prevNotifyModified = AppBar.notifyModified;
                                        AppBar.notifyModified = false;
                                        selection.add(index);
                                        that.prevSelectionIndices.push(index);
                                        AppBar.notifyModified = prevNotifyModified;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                that.checkOkDisabled();
                that.waitForIdleAction();
                Log.ret(Log.l.trace);
            }
            this.addSelectionToListView = addSelectionToListView;

            // define handlers
            this.eventHandlers = {
                clickBack: function(event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    // cancel navigates now directly back to start
                    that.cancelPromises();
                    if (Application.navigateByIdOverride("start") === "productlist") {
                        AppData.setRecordId("Kontakt", null);
                        that.loadData();
                    } else {
                        Application.navigateById("start", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickStart: function (event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    // cancel navigates now directly back to start
                    that.cancelPromises();
                    if (Application.navigateByIdOverride("start") === "productlist") {
                        AppData.setRecordId("Kontakt", null);
                        that.loadData();
                    } else {
                        Application.navigateById("start", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickScan: function (event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    that.cancelPromises();
                    Application.navigateById("barcode", event);
                    Log.ret(Log.l.trace);
                },
                clickCamera: function (event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    that.cancelPromises();
                    Application.navigateById("camera", event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    that.cancelPromises();
                    Application.navigateById("contact", event);
                    Log.ret(Log.l.trace);
                },
                clickZoomOut: function (event) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (sezoom && sezoom.winControl) {
                        sezoom.winControl.zoomedOut = true;
                    }
                    Log.ret(Log.l.trace);
                },
                onZoomChanged: function(eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.", "zoomedOut=" + (eventInfo && eventInfo.detail));
                    if (sezoom && sezoom.winControl) {
                        that.binding.zoomedOut = sezoom.winControl.zoomedOut;
                        if (sezoom.winControl.zoomedOut) {
                            that.binding.showSubGroups = false;
                            that.binding.showMainGroups = that.mainGroups && that.mainGroups.length > 0;
                        } else {
                            that.binding.showMainGroups = false;
                            that.binding.showSubGroups = that.subGroups && that.subGroups.length > 0;
                        }
                    }
                    WinJS.Promise.timeout(150).then(function() {
                        var pageControl = pageElement.winControl;
                        if (pageControl && pageControl.updateLayout) {
                            pageControl.prevWidth = 0;
                            pageControl.prevHeight = 0;
                            pageControl.updateLayout.call(pageControl, pageElement).then(function () {
                                if (!that.binding.zoomedOut && that.productSelGrpID >= 0) {
                                    that.scrollIntoViewDelayed();
                                }
                            });
                        } 
                    });
                    Log.ret(Log.l.trace);
                },
                onGroupItemInvoked: function(eventInfo) {
                    Log.call(Log.l.info, "ProductList.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        Log.print(Log.l.info, "groupIndex=" + eventInfo.detail.itemIndex);
                        if (that.products && that.products.groups) {
                            var item = that.products.groups.getAt(eventInfo.detail.itemIndex);
                            if (item) {
                                that.productSelGrpID = item.ProduktSelGrpID;
                                Log.print(Log.l.info, "productSelGrpID=" + that.productSelGrpID);
                            }
                        }
                    }
                    Log.ret(Log.l.info);
                },
                onGroupLoadingStateChanged: function (eventInfo) {
                    var i;
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (groupView && groupView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + groupView.winControl.loadingState);
                        if (groupView.winControl.loadingState === "itemsLoading") {
                            /*
                            if (!grouplayout) {
                                grouplayout = new Application.ProductListLayout.GroupsLayout;
                                groupView.winControl.layout = {
                                    type: grouplayout,
                                    orientation: WinJS.UI.Orientation.vertical
                                };
                            }
                            */
                        } else if (groupView.winControl.loadingState === "complete") {
                            if (that.groupLoading) {
                                progress = groupView.querySelector(".group-footer .progress");
                                counter = groupView.querySelector(".group-footer .counter");
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.groupLoading = false;
                            }
                            /*
                            if (AppData._prefetchedProductView) {
                                AppData._prefetchedProductView = null;
                                WinJS.Promise.timeout(250).then(function() {
                                    groupView.style.visibility = "";
                                    WinJS.UI.Animation.enterContent(groupView);
                                });
                            }
                             */
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onGroupFooterVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (eventInfo && eventInfo.detail && groupView) {
                        progress = groupView.querySelector(".group-footer .progress");
                        counter = groupView.querySelector(".group-footer .counter");
                        var visible = eventInfo.detail.visible;
                        if (visible && that.nextUrl) {
                            that.groupLoading = true;
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
                                    if (that.products && that.productsBase) {
                                        that.nextUrl = ProductList.productView.getNextUrl(json);
                                        var results = json.d.results;
                                        var prevCount = that.productsBase.length;
                                        results.forEach(function (item, index) {
                                            that.resultConverter(item, that.binding.count);
                                            that.productsBase.push(item);
                                            that.binding.count = that.products.length;
                                        });
                                        that.addSelectionToListView(prevCount);
                                    }
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
                                that.groupLoading = false;
                                that.waitForIdleAction();
                            }, null, that.nextUrl);
                        } else {
                            if (progress && progress.style) {
                                progress.style.display = "none";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "inline";
                            }
                            that.groupLoading = false;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onMainGroupsSelectionChanged: function(eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    var listControl = productMainGroups.winControl;
                    if (listControl && listControl.selection && that.mainGroups) {
                        var selectionCount = listControl.selection.count();
                        if (selectionCount === 1) {
                            // Only one item is selected, show the page
                            listControl.selection.getItems().done(function (items) {
                                var curIndex = items[0].index;
                                // sync other list
                                var item = that.mainGroups.getAt(curIndex);
                                if (item) {
                                    if (AppData.mainGroupId !== item.INITFragengruppeID) {
                                        AppData.mainGroupId = item.INITFragengruppeID;
                                        WinJS.Promise.timeout(0).then(function() {
                                            //that.selectProductView();
                                            that.productsBase.notifyReload();
                                            return WinJS.Promise.timeout(50);
                                        }).then(function() {
                                            that.addSelectionToListView();
                                        });
                                    }
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onSubGroupsSelectionChanged: function(eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (listView &&
                        listView.winControl &&
                        that.products &&
                        that.products.length > 0) {

                        for (var i = 1; i < that.products.length; i++) {
                            var scrollPosition = 0;
                            var element = listView.winControl.elementFromIndex(i);
                            if (element) {
                                var itemBox = element.parentElement;
                                if (itemBox) {
                                    var winContainer = itemBox.parentElement;
                                    if (winContainer) {
                                        var winItemsBlock = winContainer.parentElement;
                                        if (winItemsBlock) {
                                            var winItemsContainer = winItemsBlock.parentElement;
                                            if (winItemsContainer) {
                                                var winGroupHeaderContainer = winItemsContainer.previousElementSibling;
                                                scrollPosition = winGroupHeaderContainer && winGroupHeaderContainer.offsetTop ||
                                                    winItemsContainer.offsetTop;
                                            }
                                        }
                                    }
                                }
                            }
                            if (scrollPosition > listView.winControl.scrollPosition) {
                                var item = that.products.getAt(i-1);
                                if (item && item.ProduktSelGrpID >= 0) {
                                    that.productSelGrpID = item.ProduktSelGrpID;
                                    Log.print(Log.l.info, "productSelGrpID=" + that.productSelGrpID);
                                }
                                break;
                            }
                        }
                    }
                    var listControl = productSubGroups.winControl;
                    if (listControl && listControl.selection && that.subGroups) {
                        var selectionCount = listControl.selection.count();
                        if (selectionCount === 1) {
                            // Only one item is selected, show the page
                            listControl.selection.getItems().done(function (items) {
                                var curIndex = items[0].index;
                                // sync other list
                                var item = that.subGroups.getAt(curIndex);
                                if (item) {
                                    if (AppData.subGroupId !== item.INITFragengruppeID) {
                                        AppData.subGroupId = item.INITFragengruppeID;
                                        WinJS.Promise.timeout(0).then(function() {
                                            //that.selectProductView();
                                            that.productsBase.notifyReload();
                                            return WinJS.Promise.timeout(50);
                                        }).then(function() {
                                            that.addSelectionToListView();
                                            //if (!that.binding.zoomedOut && that.productSelGrpID >= 0) {
                                            //    that.scrollIntoViewDelayed();
                                            //}
                                        });
                                    }
                                }
                            });
                        }
                    }
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
                            that.waitForReloadAction();
                        } else if (listView && listView.winControl) {
                            var listControl = listView.winControl;
                            if (listControl.selection && that.selection && that.products) {
                                var i, selIndex, prevIndex, row;
                                var productSelectionGroup = that.productSelectionGroup || {};
                                var prevSelectionIndices = that.prevSelectionIndices || [];
                                var curSelectionIndices = listControl.selection.getIndices() || [];
                                for (i = 0; i < prevSelectionIndices.length; i++) {
                                    prevIndex = prevSelectionIndices[i];
                                    selIndex = curSelectionIndices.indexOf(prevIndex);
                                    if (selIndex < 0) {
                                        // get from Binding.List
                                        row = that.products.getAt(prevIndex);
                                        if (row) {
                                            if (row.ProduktSelGrpID) {
                                                Log.print(Log.l.trace, "deselected prevIndex=" + prevIndex + " from ProduktSelGrpID=" + row.ProduktSelGrpID);
                                                that.setSelectionGroupIndex(productSelectionGroup[row.ProduktSelGrpID], prevIndex, false);
                                            }
                                            that.deleteData(row.ProduktID);
                                        }
                                    }
                                }
                                for (i = 0; i < curSelectionIndices.length; i++) {
                                    selIndex = curSelectionIndices[i];
                                    prevIndex = prevSelectionIndices.indexOf(selIndex);
                                    if (prevIndex < 0) {
                                        // get from Binding.List
                                        row = that.products.getAt(selIndex);
                                        if (row) {
                                            if (row.ProduktSelGrpID) {
                                                Log.print(Log.l.trace, "selected selIndex=" + selIndex + " from ProduktSelGrpID=" + row.ProduktSelGrpID);
                                                that.setSelectionGroupIndex(productSelectionGroup[row.ProduktSelGrpID], selIndex, true);
                                            }
                                            that.insertData(row.ProduktID);
                                        }
                                    }
                                }
                                that.prevSelectionIndices = curSelectionIndices;
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    var i;
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (listView && listView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState);
                        // multi list selection
                        if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.multi) {
                            listView.winControl.selectionMode = WinJS.UI.SelectionMode.multi;
                        }
                        // direct selection on each tap
                        if (listView.winControl.tapBehavior !== WinJS.UI.TapBehavior.toggleSelect) {
                            listView.winControl.tapBehavior = WinJS.UI.TapBehavior.toggleSelect;
                        }
                        // Double the size of the buffers on both sides
                        if (!maxLeadingPages) {
                            maxLeadingPages = listView.winControl.maxLeadingPages * 4;
                            listView.winControl.maxLeadingPages = maxLeadingPages;
                        }
                        if (!maxTrailingPages) {
                            maxTrailingPages = listView.winControl.maxTrailingPages * 4;
                            listView.winControl.maxTrailingPages = maxTrailingPages;
                        }
                        if (listView.winControl.loadingState === "itemsLoading") {
                            /*
                            if (!layout) {
                                layout = new Application.ProductListLayout.ProductsLayout;
                                listView.winControl.layout = {
                                    type: layout,
                                    orientation: WinJS.UI.Orientation.vertical,
                                    groupHeaderPosition: "top"
                                };
                            }
                            */
                        } else if (listView.winControl.loadingState === "itemsLoaded") {
                            if (that.products && that.products.length > 0) {
                                for (i = 0; i < that.products.length; i++) {
                                    var element = listView.winControl.elementFromIndex(i);
                                    if (element) {
                                        var size = itemInfo(i);
                                        var itemBox = element.parentElement;
                                        if (itemBox && itemBox.style) {
                                            var winContainer = itemBox.parentElement;
                                            if (winContainer) {
                                                if (size.width > 0) {
                                                    var widthAdd = 0;
                                                    var style = window.getComputedStyle(winContainer);
                                                    if (style) {
                                                        var marginLeft = style.getPropertyValue("margin-left");
                                                        if (marginLeft) {
                                                            widthAdd += parseInt(marginLeft);
                                                        }
                                                        var marginRight = style.getPropertyValue("margin-right");
                                                        if (marginRight) {
                                                            widthAdd += parseInt(marginRight);
                                                        }
                                                    }
                                                    if (winContainer.style) {
                                                        winContainer.style.display = "";
                                                    }
                                                    var w = size.width + widthAdd;
                                                    if (itemBox.clientWidth !== w) {
                                                        itemBox.style.width = w.toString() + "px";
                                                    }
                                                    if (winContainer.style && winContainer.clientWidth !== w) {
                                                        winContainer.style.width = w.toString() + "px";
                                                    }
                                                }
                                                if (size.height > 1) {
                                                    var h = size.height + 120;
                                                    if (itemBox.clientHeight !== h) {
                                                        itemBox.style.height = h.toString() + "px";
                                                    }
                                                }
                                            }
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
                                var winItemsBlock = null;
                                var winItemsContainerList = listView.querySelectorAll(".win-itemscontainer");
                                if (winItemsContainerList) for (i = 0; i < winItemsContainerList.length; i++) {
                                    var winItemsContainer = winItemsContainerList[i];
                                    var winItemsBlockList = winItemsContainer.querySelectorAll(".win-itemsblock");
                                    var itemsContainerHeight = 0;
                                    if (winItemsBlockList) for (var j = 0; j < winItemsBlockList.length; j++) {
                                        itemsContainerHeight += winItemsBlockList[j].offsetHeight;
                                    }
                                    if (itemsContainerHeight > 0) {
                                        winItemsContainer.style.height = itemsContainerHeight + "px";
                                    }
                                    winItemsContainer.style.width = (listView.clientWidth - 60).toString() + "px";
                                }
                            }
                            Colors.loadSVGImageElements(listView, "checkmark-image", 136, "#ffffff");
                        } else if (listView.winControl.loadingState === "complete") {
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
                            that.updatePicturesInView();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onHeaderVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (eventInfo && eventInfo.detail && listView) {
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
                    if (eventInfo && eventInfo.detail && listView) {
                        progress = listView.querySelector(".list-footer .progress");
                        counter = listView.querySelector(".list-footer .counter");
                        var visible = eventInfo.detail.visible;
                        if (visible && that.nextUrl) {
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
                                    if (that.products && that.productsBase) {
                                        that.nextUrl = ProductList.productView.getNextUrl(json);
                                        var results = json.d.results;
                                        var prevCount = that.productsBase.length;
                                        results.forEach(function (item, index) {
                                            that.resultConverter(item, that.binding.count);
                                            that.binding.count = that.productsBase.push(item);
                                        });
                                        that.addSelectionToListView();
                                    }
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
                                that.waitForIdleAction();
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
                    return that.binding.clickOkDisabled;
                },
                clickStart: function () {
                    return that.binding.clickOkDisabled;
                },
                clickScan: function () {
                    return that.binding.clickOkDisabled;
                },
                clickZoomOut: function() {
                    if (sezoom && sezoom.winControl) {
                        return sezoom.winControl.zoomedOut;
                    } else {
                        return true;
                    }
                }
            };

            var scrollIntoView = function () {
                var scrollPosition = 0, indexOfFirstVisible = -1;
                Log.call(Log.l.info, "ProductList.Controller.", "productSelGrpID=" + that.productSelGrpID);
                if (that._disposed || that.productSelGrpID < 0) {
                    Log.ret(Log.l.info, "extra ignored");
                    return;
                }
                if (listView && listView.winControl && that.products && that.products.length > 0) {
                    for (var i = 0; i < that.products.length; i++) {
                        var item = that.products.getAt(i);
                        if (item && item.ProduktSelGrpID === that.productSelGrpID) {
                            indexOfFirstVisible = i;
                            Log.print(Log.l.info, "found indexOfFirstVisible=" + indexOfFirstVisible);
                            break;
                        }
                    }
                    if (indexOfFirstVisible >= 0) {
                        var element = listView.winControl.elementFromIndex(indexOfFirstVisible);
                        if (element) {
                            var itemBox = element.parentElement;
                            if (itemBox) {
                                var winContainer = itemBox.parentElement;
                                if (winContainer) {
                                    var winItemsBlock = winContainer.parentElement;
                                    if (winItemsBlock) {
                                        var winItemsContainer = winItemsBlock.parentElement;
                                        if (winItemsContainer) {
                                            var previousElementSibling = winItemsContainer.previousElementSibling;
                                            if (previousElementSibling) {
                                                scrollPosition = previousElementSibling.offsetTop;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (listView.winControl.scrollPosition !== scrollPosition) {
                            Log.print(Log.l.info, "set scrollPosition=" + scrollPosition + " current scrollPosition=" + listView.winControl.scrollPosition + " products.length=" + that.products.length);
                            listView.winControl.scrollPosition = scrollPosition;
                        } else {
                            Log.print(Log.l.info, "already in scrollPosition");
                        }
                    } else {
                        Log.print(Log.l.info, "no group selected");
                    }
                } else {
                    Log.print(Log.l.info, "empty list");
                }
                Log.ret(Log.l.info);
            }
            this.scrollIntoView = scrollIntoView;

            var scrollIntoViewDelayed = function () {
                var repeat;
                Log.call(Log.l.info, "ProductList.Controller.", "productSelGrpID=" + that.productSelGrpID);
                if (that._disposed || that.scrollIntoViewPromise || that.scrollIntoViewLaterPromise || that.productSelGrpID < 0) {
                    Log.ret(Log.l.info, "extra ignored");
                    return;
                }
                that.scrollIntoViewPromise = WinJS.Promise.timeout(that.scrollIntoViewDelay).then(function delayedscrollIntoView1() {
                    if (that.loading ||
                        listView && listView.winControl && listView.winControl.loadingState === "itemsLoading" ) {
                        repeat = false;
                    } else {
                        that.scrollIntoView();
                        repeat = true;
                    }
                    return WinJS.Promise.timeout(that.scrollIntoViewDelay);
                }).then(function delayedscrollIntoView2() {
                    if (repeat) {
                        if (that.loading ||
                            listView && listView.winControl && listView.winControl.loadingState === "itemsLoading") {
                            repeat = false;
                        } else {
                            that.scrollIntoView();
                        }
                        return WinJS.Promise.timeout(that.scrollIntoViewDelay);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function delayedscrollIntoView3() {
                    if (repeat) {
                        if (that.loading ||
                            listView && listView.winControl && listView.winControl.loadingState === "itemsLoading") {
                            repeat = false;
                        } else {
                            that.scrollIntoView();
                        }
                        return WinJS.Promise.timeout(that.scrollIntoViewDelay);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function delayedscrollIntoViewFinal() {
                    that.scrollIntoViewPromise = null;
                    if (!repeat) {
                        that.scrollIntoViewDelayed();
                    }
                });
                Log.ret(Log.l.info);
            }
            this.scrollIntoViewDelayed = scrollIntoViewDelayed;

            var showPicture = function (imageContainer, imageData, bDoAnimation) {
                Log.call(Log.l.trace, "ProductList.Controller.");
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
                        var preloadBkg = imageContainer.querySelector(".nx-proitem__preload-bg-color");
                        if (preloadBkg && preloadBkg.style) {
                            preloadBkg.style.opacity = 0;
                        }
                        if (bDoAnimation) {
                            Log.ret(Log.l.trace, "calling Animation.fadeIn");
                            return WinJS.UI.Animation.fadeIn(img);
                        }
                    }
                }
                Log.ret(Log.l.trace);
                return WinJS.Promise.as();;
            }
            this.showPicture = showPicture;

            var loadPicture = function (pictureId, imageContainer) {
                Log.call(Log.l.trace, "ProductList.Controller.", "pictureId=" + pictureId);
                var ret = null;
                var element = imageContainer.firstElementChild || imageContainer.firstChild;
                if (element && element.className === "list-image") {
                    Log.print(Log.l.trace, "already loaded -- extra ignored");
                    ret = WinJS.Promise.as();
                }
                if (!ret && ProductList.images.length > 0) {
                    for (var i = 0; i < ProductList.images.length; i++) {
                        var imageItem = ProductList.images[i];
                        if (imageItem && imageItem.DOC1ProduktID === pictureId) {
                            if (imageItem.picture) {
                                ret = that.showPicture(imageContainer, imageItem.picture);
                            } else {
                                Log.print(Log.l.trace, "in loading -- extra ignored");
                                ret = WinJS.Promise.as();
                            }
                            break;
                        }
                    }
                }
                if (!ret) {
                    if (ProductList.images.length > 64) {
                        ProductList.images.splice(0, 1);
                    }
                    ProductList.images.push({
                        type: "item",
                        DOC1ProduktID: pictureId
                    });
                    ret = ProductList.productDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "productDocView: success!");
                        if (json.d) {
                            var docContent =  json.d.DocContentDOCCNT1;
                            if (docContent) {
                                var sub = docContent.search("\r\n\r\n");
                                var docType = AppData.getDocType(json.d.wFormat);
                                var picture = "data:" + docType + ";base64," + docContent.substr(sub + 4);
                                for (var i = ProductList.images.length - 1; i >= 0; i--) {
                                    var imageItem = ProductList.images[i];
                                    if (imageItem && imageItem.DOC1ProduktID === json.d.DOC1ProduktVIEWID) {
                                        imageItem.picture = picture;
                                        break;
                                    }
                                }
                                that.showPicture(imageContainer, picture, true);
                            }
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, pictureId);
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadPicture = loadPicture;

            var updatePicturesInView = function () {
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (that.updatePicturesInViewPromise) {
                    that.updatePicturesInViewPromise.cancel();
                }
                that.updatePicturesInViewPromise = WinJS.Promise.timeout(250).then(function() {
                    if (sezoom && sezoom.winControl && sezoom.winControl.zoomedOut) {
                        Log.print(Log.l.trace, "zoomedOut: extra ignored!");
                    } else if (that.scrollIntoViewPromise) {
                        Log.print(Log.l.trace, "scrollIntoViewPromise: extra ignored!");
                    } else if (listView && listView.winControl && listView.winControl.loadingState !== "complete") {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState + ": extra ignored!")
                    } else if (listView && listView.winControl && that.products && that.products.length > 0) {
                        var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                        var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                        var maxIndex = indexOfLastVisible + 20;
                        if (maxIndex >= that.binding.count) {
                            maxIndex = that.binding.count - 1;
                        }
                        for (var i = indexOfFirstVisible; i <= maxIndex; i++) {
                            var element = listView.winControl.elementFromIndex(i);
                            if (element) {
                                var listImageConainer = element.querySelector(".list-image-container");
                                if (listImageConainer && listImageConainer.docId) {
                                    that.loadPicture(listImageConainer.docId, listImageConainer);
                                }
                            }
                        }
                    }
                    that.updatePicturesInViewPromise = null;
                });
                Log.ret(Log.l.trace);
            }
            this.updatePicturesInView = updatePicturesInView;


            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "selectionchanged", this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
                this.addRemovableEventListener(listView, "headervisibilitychanged", this.eventHandlers.onHeaderVisibilityChanged.bind(this));
                this.addRemovableEventListener(listView, "footervisibilitychanged", this.eventHandlers.onFooterVisibilityChanged.bind(this));
            }
            if (groupView) {
                this.addRemovableEventListener(groupView, "iteminvoked", this.eventHandlers.onGroupItemInvoked.bind(this));
                this.addRemovableEventListener(groupView, "loadingstatechanged", this.eventHandlers.onGroupLoadingStateChanged.bind(this));
                this.addRemovableEventListener(groupView, "footervisibilitychanged", this.eventHandlers.onGroupFooterVisibilityChanged.bind(this));
            }
            if (productMainGroups) {
                this.addRemovableEventListener(productMainGroups, "selectionchanged", this.eventHandlers.onMainGroupsSelectionChanged.bind(this));
            }
            if (productSubGroups) {
                this.addRemovableEventListener(productSubGroups, "selectionchanged", this.eventHandlers.onSubGroupsSelectionChanged.bind(this));
            }
            var selectMainGroups = function() {
                return ProductList.productMainGroupView.select(function(json) {
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.print(Log.l.trace, "ProductList.productView: select success!");
                    // productView returns object already parsed from json data in response
                    if (json && json.d && json.d.results && json.d.results.length > 0) {
                        var results = json.d.results;
                        /*[ {
                            CR_V_FragengruppeVIEWID: 0,
                            VeranstaltungID: json.d.results[0].VeranstaltungID,
                            INITFragengruppeID: "NOT NULL",
                            TITLE: getResourceText("productlist.products"),
                            LanguageSpecID: AppData.getLanguageId()
                        }].concat(json.d.results);*/
                        var selIndex = 0;
                        if (!that.mainGroups) {
                            results.forEach(function(item, index) {
                                if (item.INITFragengruppeID === AppData.mainGroupId) {
                                    selIndex = index;
                                }
                                that.mainGroupsResultConverter(item, index);
                            });
                            that.mainGroups = new WinJS.Binding.List(results);
                        } else {
                            that.mainGroups.length = 0;
                            results.forEach(function(item, index) {
                                if (item.INITFragengruppeID === AppData.mainGroupId) {
                                    selIndex = index;
                                }
                                that.mainGroupsResultConverter(item, index);
                                that.mainGroups.push(item);
                            });
                        }
                        if (productMainGroups && productMainGroups.winControl) {
                            productMainGroups.winControl.itemDataSource = that.mainGroups.dataSource;
                            if (productMainGroups.winControl.selection) {
                                productMainGroups.winControl.selection.set(selIndex);
                            }
                            
                        }
                    } else if (that.mainGroups) {
                        that.mainGroups.length = 0;
                    }
                    if (that.binding.zoomedOut) {
                        that.binding.showSubGroups = false;
                        that.binding.showMainGroups = that.mainGroups && that.mainGroups.length > 0;
                    } else {
                        that.binding.showMainGroups = false;
                        that.binding.showSubGroups = that.subGroups && that.subGroups.length > 0;
                    }
                },
                function(errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    AppData.setErrorMsg(that.binding, errorResponse);
                });
            };
            that.selectMainGroups = selectMainGroups;

            var selectSubGroups = function() {
                return ProductList.productSubGroupView.select(function(json) {
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.print(Log.l.trace, "ProductList.productView: select success!");
                    // productView returns object already parsed from json data in response
                    if (json && json.d && json.d.results && json.d.results.length > 0) {
                        var results = [ {
                            CR_V_FragengruppeVIEWID: 0,
                            VeranstaltungID: json.d.results[0].VeranstaltungID,
                            INITFragengruppeID: null,
                            TITLE: getResourceText("productlist.products"),
                            LanguageSpecID: AppData.getLanguageId()
                        }].concat(json.d.results);
                        var selIndex = 0;
                        if (!that.subGroups) {
                            results.forEach(function(item, index) {
                                if (item.INITFragengruppeID === AppData.subGroupId) {
                                    selIndex = index;
                                }
                                that.subGroupsResultConverter(item, index);
                            });
                            that.subGroups = new WinJS.Binding.List(results);
                        } else {
                            that.subGroups.length = 0;
                            results.forEach(function(item, index) {
                                if (item.INITFragengruppeID === AppData.subGroupId) {
                                    selIndex = index;
                                }
                                that.subGroupsResultConverter(item, index);
                                that.subGroups.push(item);
                            });
                        }
                        if (productSubGroups && productSubGroups.winControl) {
                            productSubGroups.winControl.itemDataSource = that.subGroups.dataSource;
                            if (productSubGroups.winControl.selection) {
                                productSubGroups.winControl.selection.set(selIndex);
                            }
                            
                        }
                    } else if (that.subGroups) {
                        that.subGroups.length = 0;
                    }
                    if (that.binding.zoomedOut) {
                        that.binding.showSubGroups = false;
                        that.binding.showMainGroups = that.mainGroups && that.mainGroups.length > 0;
                    } else {
                        that.binding.showMainGroups = false;
                        that.binding.showSubGroups = that.subGroups && that.subGroups.length > 0;
                    }
                },
                function(errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    AppData.setErrorMsg(that.binding, errorResponse);
                });
            };
            that.selectSubGroups = selectSubGroups;

            var selectProductView = function() {
                return ProductList.productView.select(function (json) {
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.print(Log.l.trace, "ProductList.productView: select success!");
                    // productView returns object already parsed from json data in response
                    if (json && json.d) {
                        that.handleProductViewResult(json);
                    } else {
                        that.binding.count = 0;
                        that.nextUrl = null;
                        if (listView) {
                            progress = listView.querySelector(".list-footer .progress");
                            counter = listView.querySelector(".list-footer .counter");
                            if (progress && progress.style) {
                                progress.style.display = "none";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "inline";
                            }
                        }
                        if (groupView) {
                            progress = groupView.querySelector(".group-footer .progress");
                            counter = groupView.querySelector(".group-footer .counter");
                            if (progress && progress.style) {
                                progress.style.display = "none";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "inline";
                            }
                        }
                        that.waitForIdleAction();
                    }
                }, function (errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    AppData.setErrorMsg(that.binding, errorResponse);
                    if (listView) {
                        progress = listView.querySelector(".list-footer .progress");
                        counter = listView.querySelector(".list-footer .counter");
                        if (progress && progress.style) {
                            progress.style.display = "none";
                        }
                        if (counter && counter.style) {
                            counter.style.display = "inline";
                        }
                    }
                    if (groupView) {
                        progress = groupView.querySelector(".group-footer .progress");
                        counter = groupView.querySelector(".group-footer .counter");
                        if (progress && progress.style) {
                            progress.style.display = "none";
                        }
                        if (counter && counter.style) {
                            counter.style.display = "inline";
                        }
                    }
                    that.loading = false;
                    that.groupLoading = false;
                    that.waitForIdleAction();
                });
            }
            that.selectProductView = selectProductView;

            var handleProductViewResult = function(json) {
                that.nextUrl = ProductList.productView.getNextUrl(json);
                var results = json.d.results;
                var prevIsGrouped = that.binding.isGrouped;
                var newIsGrouped = false;
                for (var i = 0; i < results.length; i++) {
                    if (results[i] && results[i].ProduktGruppeIndex) {
                        newIsGrouped = true;
                        break;
                    }
                }
                Log.print(Log.l.trace, "newIsGrouped=" + newIsGrouped + " (prev isGrouped=" + that.binding.isGrouped + ")");
                that.binding.isGrouped = newIsGrouped;
                if (that.binding.isGrouped !== prevIsGrouped) {
                    // free products list on grouped change!
                    that.products = null;
                }
                if (!that.products) {
                    that.binding.zoomedOut = that.binding.isGrouped;
                    Log.print(Log.l.trace, "create new Binding.List of length=" + results.length);
                    results.forEach(function(item, index) {
                        that.resultConverter(item, index);
                    });
                    // Now, we call WinJS.Binding.List to get the bindable list
                    that.productsBase = new WinJS.Binding.List(results);
                    that.productsFiltered = that.productsBase.createFiltered(productFilter);
                    that.products = that.productsFiltered.createGrouped(groupKey, groupData, groupSorter);
                    if (sezoom && sezoom.winControl) {
                        sezoom.winControl.onzoomchanged = that.eventHandlers.onZoomChanged;
                        if (sezoom.winControl.zoomedOut !== that.binding.zoomedOut) {
                            sezoom.winControl.zoomedOut = that.binding.zoomedOut;
                        }
                        sezoom.winControl.locked = !that.binding.isGrouped;
                    }
                    if (listView && listView.winControl) {
                        // multi list selection
                        listView.winControl.selectionMode = WinJS.UI.SelectionMode.multi;

                        // direct selection on each tap
                        listView.winControl.tapBehavior = WinJS.UI.TapBehavior.toggleSelect;

                        // add ListView dataSource
                        listView.winControl.itemDataSource = that.products.dataSource;
                        listView.winControl.groupDataSource = that.products.groups.dataSource;
                        if (groupView && groupView.winControl) {
                            groupView.winControl.itemDataSource = that.products.groups.dataSource;
                        }
                    }
                } else {
                    that.productsBase.length = 0;
                    results.forEach(function(item, index) {
                        that.resultConverter(item, index);
                        that.productsBase.push(item);
                    });
                }
                that.binding.count = that.products.length;
                that.addSelectionToListView();
            };
            that.handleProductViewResult = handleProductViewResult;

            var loadData = function () {
                var ret;
                Log.call(Log.l.trace, "ProductList.Controller.");
                AppBar.notifyModified = false;
                that.loading = true;
                that.groupLoading = true;
                if (listView) {
                    progress = listView.querySelector(".list-footer .progress");
                    counter = listView.querySelector(".list-footer .counter");
                    if (progress && progress.style) {
                        progress.style.display = "inline";
                    }
                    if (counter && counter.style) {
                        counter.style.display = "none";
                    }
                }
                if (groupView) {
                    progress = groupView.querySelector(".group-footer .progress");
                    counter = groupView.querySelector(".group-footer .counter");
                    if (progress && progress.style) {
                        progress.style.display = "inline";
                    }
                    if (counter && counter.style) {
                        counter.style.display = "none";
                    }
                }
                if (AppData._prefetchedProductView && groupView && groupView.style) {
                    //groupView.style.visibility = "hidden";
                    WinJS.Promise.timeout(10).then(function() {
                        that.handleProductViewResult(AppData._prefetchedProductView);
                        AppData._prefetchedProductView = null;
                        return WinJS.Promise.join({
                            mainGroupsPromise: that.selectMainGroups(),
                            subGroupsPromise: that.selectSubGroups()
                        });
                    }).then(function () {
                        Log.print(Log.l.trace, "Data loaded");
                        AppBar.notifyModified = true;
                    });
                    ret = WinJS.Promise.as();
                } else {
                    AppData.setErrorMsg(that.binding);
                    var isNewContact = false;
                    var contactId = AppData.getRecordId("Kontakt");
                    ret = new WinJS.Promise.as().then(function () {
                        if (!contactId) {
                            isNewContact = true;
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
                        that.selection = [];
                        if (!contactId || isNewContact) {
                            // message already returned in case of error
                            // no selection needed in case of new contact
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
                        that.prevSelectionIndices = [];
                        that.productSelectionGroup = {};
                        if (!contactId) {
                            // error message already returned
                            return WinJS.Promise.as();
                        } else {
                            return WinJS.Promise.join({
                                mainGroupsPromise: that.selectMainGroups(),
                                subGroupsPromise: that.selectSubGroups(),
                                productPromise: that.selectProductView()
                            });
                        }
                    }).then(function () {
                        Log.print(Log.l.trace, "Data loaded");
                        AppBar.notifyModified = true;
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var deleteData = function (productId) {
                var ret;
                Log.call(Log.l.info, "ProductList.Controller.", "ProduktID=" + productId);
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
                        that.checkOkDisabled();
                        AppBar.triggerDisableHandlers();
                    },
                    function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        //AppData.setErrorMsg(that.binding, errorResponse);
                        that.waitForReloadAction();
                    },
                    selectionId);
                } else {
                    //AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                    ret = WinJS.Promise.as();
                    that.waitForReloadAction();
                }
                Log.ret(Log.l.info);
                return ret;
            }
            this.deleteData = deleteData;
            
            var insertData = function (productId) {
                var ret;
                Log.call(Log.l.info, "ProductList.Controller.", "ProduktID=" + productId);
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
                            that.checkOkDisabled();
                            AppBar.triggerDisableHandlers();
                        } else {
                            //AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        //AppData.setErrorMsg(that.binding, errorResponse);
                        that.waitForReloadAction();
                    }, newSelection);
                } else {
                    //AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                    ret = WinJS.Promise.as();
                    that.waitForReloadAction();
                }
                Log.ret(Log.l.info);
                return ret;
            }
            this.insertData = insertData;

            AppData.subGroupId = null;
            AppData.mainGroupId = null;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
               // if (AppData._persistentStates.kioskUsesCamera) {
                    Colors.loadSVGImageElements(pageElement, "action-image", 80, "#ffffff");
                // }
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, Colors.textColor);
                if (AppHeader.controller && AppHeader.controller.binding) {
                    that.binding.eventLogoSrc = AppHeader.controller.binding.eventLogoSrc;
                }
                return that.loadData();
            });
            Log.ret(Log.l.trace);
        })
    });
})();







