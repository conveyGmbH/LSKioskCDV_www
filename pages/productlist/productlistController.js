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
                version: Application.version,
                isGrouped: false,
                continueText: AppData._persistentStates.kioskUsesCamera ? getResourceText("productlist.camera") : getResourceText("productlist.barcode")
            }]);
            this.nextUrl = null;
            this.loading = false;
            this.groupLoading = false;
            this.indexOfFirstVisible = -1;
            this.products = null;
            this.selection = [];
            this.prevSelectionIndices = [];
            this.productSelectionGroup = {};

            // idle wait Promise and wait time:
            this.restartPromise = null;
            this.idleWaitTimeMs = 60000;

            this.reloadPromise = null;
            this.reloadWaitTimeMs = 500;

            this.scrollIntoViewDelay = 50;
            this.scrollIntoViewPromise = null;

            this.hasSelLimit = false;

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#productlist.listview");
            var groupView = pageElement.querySelector("#productgroups.listview");
            var sezoom = pageElement.querySelector("#sezoom");

            this.dispose = function () {
                that.cancelPromises();
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
                    } else if (that.hasSelLimit) {
                        Log.print(Log.l.trace, "releoad due to selLimit");
                        that.loadData();
                    }
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
                    if (!item.ProduktSelektionsMaxSel || item.ProduktSelektionsMaxSel < 0) {
                        item.ProduktSelektionsMaxSel = 1;
                    }
                    if (!that.productSelectionGroup[item.ProduktSelektionsGruppeID]) {
                        that.productSelectionGroup[item.ProduktSelektionsGruppeID] = {
                            indexes: [],
                            selIndexes: [],
                            maxSel: item.ProduktSelektionsMaxSel,
                            mandatory: !!item.ProduktSelektionsMandatory,
                            show: false
                        };
                    }
                    var curGroup = that.productSelectionGroup[item.ProduktSelektionsGruppeID];
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
                if (item.SelLimit) {
                    Log.print(Log.l.u1, "SelLimit=" + item.SelLimit + " SelCount=" + item.SelCount);
                    that.hasSelLimit = true;
                    if (item.SelCount >= item.SelLimit) {
                        Log.print(Log.l.u1, "limit exceeded!");
                        item.disabled = true;
                    }
                }
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
                if (!item.Sortierung) {
                    item.IsHidden = true;
                } else {
                    item.IsHidden = false;
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
                        size = { width: item.Width, height: height, showGroup: item.showGroup };
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
                                    if (item && (!item.SelLimit || item.SelCount < item.SelLimit)) {
                                        Log.print(Log.l.trace, "only " + item.SelCount + " of limit " + item.SelLimit + " in group selected!");
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
                if (that.prevSelectionIndices && that.prevSelectionIndices.length > 0) {
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
                Log.ret(Log.l.trace);
            }
            this.checkOkDisabled = checkOkDisabled;

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
                                            that.setSelectionGroupIndex(that.productSelectionGroup[item.ProduktSelektionsGruppeID], index, true);
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
                that.checkOkDisabled();
                that.waitForIdleAction();
                Log.ret(Log.l.trace);
            }
            this.addSelection = addSelection;

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
                    if (eventInfo && !eventInfo.detail) {
                        that.scrollIntoView();
                    }
                    Log.ret(Log.l.trace);
                },
                onGroupItemInvoked: function(eventInfo) {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        Log.print(Log.l.trace, "groupIndex=" + eventInfo.detail.itemIndex);
                        if (that.products && that.products.groups) {
                            var item = that.products.groups.getAt(eventInfo.detail.itemIndex);
                            if (item && that.productSelectionGroup) {
                                var curGroup = that.productSelectionGroup[item.ProduktSelektionsGruppeID];
                                if (curGroup && curGroup.indexes) {
                                    var itemIndex = curGroup.indexes[0];
                                    Log.print(Log.l.trace, "itemIndex=" + itemIndex);
                                    that.indexOfFirstVisible = itemIndex;
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
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
                                    if (that.products) {
                                        that.nextUrl = ProductList.productView.getNextUrl(json);
                                        var results = json.d.results;
                                        results.forEach(function (item, index) {
                                            that.resultConverter(item, that.binding.count);
                                            that.binding.count = that.products.push(item);
                                        });
                                        that.addSelection(results);
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
                                            if (row.ProduktSelektionsGruppeID) {
                                                Log.print(Log.l.trace, "deselected prevIndex=" + prevIndex + " from ProduktSelektionsGruppeID=" + row.ProduktSelektionsGruppeID);
                                                that.setSelectionGroupIndex(productSelectionGroup[row.ProduktSelektionsGruppeID], prevIndex, false);
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
                                            if (row.ProduktSelektionsGruppeID) {
                                                Log.print(Log.l.trace, "selected selIndex=" + selIndex + " from ProduktSelektionsGruppeID=" + row.ProduktSelektionsGruppeID);
                                                that.setSelectionGroupIndex(productSelectionGroup[row.ProduktSelektionsGruppeID], selIndex, true);
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
                                var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                                var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                                var maxIndex = 2 * indexOfLastVisible - indexOfFirstVisible + 1;
                                if (maxIndex >= that.binding.count) {
                                    maxIndex = that.binding.count - 1;
                                }
                                for (i = indexOfFirstVisible; i <= maxIndex; i++) {
                                    var element = listView.winControl.elementFromIndex(i);
                                    if (element) {
                                        var size = itemInfo(i);
                                        var itemBox = element.parentElement;
                                        if (itemBox && itemBox.style) {
                                            var winContainer = itemBox.parentElement;
                                            if (size.width && winContainer) {
                                                var w = size.width + 20;
                                                if (itemBox.clientWidth !== w) {
                                                    itemBox.style.width = w.toString() + "px";
                                                }
                                                if (winContainer.style && winContainer.clientWidth !== w) {
                                                    winContainer.style.width = w.toString() + "px";
                                                }
                                            }
                                            if (size.height > 1 && winContainer) {
                                                var h = size.height + 120;
                                                if (itemBox.clientHeight !== h) {
                                                    itemBox.style.height = h.toString() + "px";
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
                                    if (that.products) {
                                        that.nextUrl = ProductList.productView.getNextUrl(json);
                                        var results = json.d.results;
                                        results.forEach(function (item, index) {
                                            that.resultConverter(item, that.binding.count);
                                            that.binding.count = that.products.push(item);
                                        });
                                        that.addSelection(results);
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
                Log.call(Log.l.trace, "ProductList.Controller.");
                if (that._disposed || that.scrollIntoViewPromise || that.indexOfFirstVisible < 0) {
                    Log.ret(Log.l.trace, "extra ignored");
                    return;
                }
                if (that.loading || listView && listView.winControl && listView.winControl.loadingState !== "complete") {
                    that.scrollIntoViewPromise = WinJS.Promise.timeout(that.scrollIntoViewDelay).then(function () {
                        that.scrollIntoViewPromise = null;
                        that.scrollIntoView();
                    });
                    Log.ret(Log.l.trace, "still loading");
                    return;
                }
                that.scrollIntoViewPromise = WinJS.Promise.timeout(that.scrollIntoViewDelay).then(function delayedscrollIntoView() {
                    Log.call(Log.l.trace, "ProductList.Controller.");
                    that.scrollIntoViewPromise = null;
                    if (listView && listView.winControl && that.products && that.products.length > 0) {
                        if (that.indexOfFirstVisible < that.products.length - 3) {
                            Log.print(Log.l.trace, "set indexOfFirstVisible=" + that.indexOfFirstVisible + " current indexOfFirstVisible=" + listView.winControl.indexOfFirstVisible + " products.length=" + that.products.length);
                            listView.winControl.indexOfFirstVisible = that.indexOfFirstVisible;
                            WinJS.Promise.timeout(50).then(function () {
                                Log.print(Log.l.trace, "resulted indexOfFirstVisible=" + listView.winControl.indexOfFirstVisible);
                                if (listView && listView.winControl && listView.winControl.indexOfFirstVisible === that.indexOfFirstVisible) {
                                    Log.print(Log.l.trace, "adjust group header");
                                    if (listView && listView.winControl) {
                                        var scrollPosition = listView.winControl.scrollPosition;
                                        if (scrollPosition > 100) {
                                            listView.winControl.scrollPosition = scrollPosition - 100;
                                        } else {
                                            listView.winControl.scrollPosition = 0;
                                        }
                                    }
                                    that.indexOfFirstVisible = -1;
                                } else {
                                    Log.print(Log.l.trace, "try again");
                                    if (listView && listView.winControl) {
                                        var scrollPosition = listView.winControl.scrollPosition;
                                        listView.winControl.scrollPosition = scrollPosition + 50;
                                    }
                                    that.scrollIntoView();
                                }
                            });
                        } else {
                            var newindexOfFirstVisible = that.indexOfFirstVisible - 3;
                            Log.print(Log.l.trace, "set indexOfFirstVisible=" + newindexOfFirstVisible + " current indexOfFirstVisible=" + listView.winControl.indexOfFirstVisible + " products.length=" + that.products.length);
                            listView.winControl.indexOfFirstVisible = newindexOfFirstVisible;
                            WinJS.Promise.timeout(50).then(function () {
                                Log.print(Log.l.trace, "resulted indexOfFirstVisible=" + listView.winControl.indexOfFirstVisible);
                                if (listView && listView.winControl.indexOfFirstVisible === newindexOfFirstVisible) {
                                    Log.print(Log.l.trace, "adjust group header");
                                    if (listView && listView.winControl) {
                                        var scrollPosition = listView.winControl.scrollPosition;
                                        listView.winControl.scrollPosition = scrollPosition + 800;
                                    }
                                    that.indexOfFirstVisible = -1;
                                } else {
                                    Log.print(Log.l.trace, "try again");
                                    if (listView && listView.winControl) {
                                        var scrollPosition = listView.winControl.scrollPosition;
                                        listView.winControl.scrollPosition = scrollPosition + 50;
                                    }
                                    that.scrollIntoView();
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                });
                Log.ret(Log.l.trace);
            }
            this.scrollIntoView = scrollIntoView;

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
                    var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                    var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                    if (ProductList.images.length > (indexOfLastVisible - indexOfFirstVisible) * 4) {
                        Log.print(Log.l.trace, "indexOfFirstVisible=" + indexOfFirstVisible + " indexOfLastVisible=" + indexOfLastVisible + " images.length=" + ProductList.images.length + " hit maximum!");
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
                                var picture = "data:image/jpeg;base64," + docContent.substr(sub + 4);
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
                if (sezoom && sezoom.winControl && sezoom.winControl.zoomedOut) {
                    Log.print(Log.l.trace, "zoomedOut: extra ignored!")
                } else if (that.scrollDelayPromise) {
                    Log.print(Log.l.trace, "scrollDelayPromise: extra ignored!")
                } else if (that.scrollIntoViewPromise) {
                    Log.print(Log.l.trace, "scrollIntoViewPromise: extra ignored!")
                } else if (listView && listView.winControl && listView.winControl.loadingState !== "complete") {
                    Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState + ": extra ignored!")
                } else if (that.products && that.products.length > 0) {
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
                            if (listImageConainer && listImageConainer.docId) {
                                that.loadPicture(listImageConainer.docId, listImageConainer);
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.updatePicturesInView = updatePicturesInView;


            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "selectionchanged", this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
                this.addRemovableEventListener(listView, "headervisibilitychanged", this.eventHandlers.onHeaderVisibilityChanged.bind(this));
                this.addRemovableEventListener(listView, "footervisibilitychanged", this.eventHandlers.onFooterVisibilityChanged.bind(this));

                this.addRemovableEventListener(groupView, "iteminvoked", this.eventHandlers.onGroupItemInvoked.bind(this));
                this.addRemovableEventListener(groupView, "loadingstatechanged", this.eventHandlers.onGroupLoadingStateChanged.bind(this));
                this.addRemovableEventListener(groupView, "footervisibilitychanged", this.eventHandlers.onGroupFooterVisibilityChanged.bind(this));
            }
            var loadData = function () {
                var ret;
                Log.call(Log.l.trace, "ProductList.Controller.");
                function handleProductViewResult(json) {
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
                        Log.print(Log.l.trace, "create new Binding.List of length=" + results.length);
                        results.forEach(function (item, index) {
                            that.resultConverter(item, index);
                        });
                        // Now, we call WinJS.Binding.List to get the bindable list
                        var products = new WinJS.Binding.List(results);
                        that.products = products.createGrouped(groupKey, groupData, groupSorter);
                        if (sezoom && sezoom.winControl) {
                            sezoom.winControl.initiallyZoomedOut = !that.binding.isGrouped;
                            sezoom.winControl.onzoomchanged = that.eventHandlers.onZoomChanged;
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
                        that.products.length = 0;
                        results.forEach(function (item, index) {
                            that.resultConverter(item, index);
                            that.products.push(item);
                        });
                    }
                    that.binding.count = that.products.length;
                    that.addSelection(results);
                }
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
                        handleProductViewResult(AppData._prefetchedProductView);
                        AppData._prefetchedProductView = null;
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
                            return ProductList.productView.select(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "ProductList.productView: select success!");
                                // productView returns object already parsed from json data in response
                                if (json && json.d) {
                                    handleProductViewResult(json);
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
                Log.ret(Log.l.trace);
                return ret;
            }
            this.insertData = insertData;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
               // if (AppData._persistentStates.kioskUsesCamera) {
                    Colors.loadSVGImageElements(pageElement, "action-image", 80, "#ffffff");
                // }
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, Colors.textColor);
                return that.loadData();
            });
            Log.ret(Log.l.trace);
        })
    });
})();







