// service for page: listLocal
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ProductList", {
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "ProductList.contactView.");
                var ret = ProductList._contactView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            deleteRecord: function (complete, error, recordId) {
                Log.call(Log.l.trace, "ProductList.contactView.");
                var ret = ProductList._contactView.deleteRecord(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _productView: {
            get: function () {
                return AppData.getFormatView("Produktname", 20482);
            }
        },
        productView: {
            select: function (complete, error) {
                Log.call(Log.l.trace, "ProductList.");
                var ret = ProductList._productView.select(complete, error, {
                    // select restriction
                    LanguageSpecID: AppData.getLanguageId(),
                    KontaktID: AppData.getRecordId("Kontakt")
                }, {
                    // select options
                    ordered: true,
                    orderAttribute: "Sortierung"
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ProductList.");
                var ret = ProductList._productView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ProductList.");
                var ret = ProductList._productView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _productDocView: {
            get: function () {
                return AppData.getFormatView("DOC1Produkt", 0);
            }
        },
        productDocView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "ProductList.productDocView.");
                var ret = ProductList._productDocView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _productSelectionView: {
            get: function () {
                return AppData.getFormatView("ProduktAuswahl", 0);
            }
        },
        productSelectionView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ProductList.productSelectionView.");
                var ret = ProductList._productSelectionView.select(complete, error, restriction);
                Log.ret(Log.l.trace);
                return ret;
            },
            deleteRecord: function (complete, error, recordId) {
                Log.call(Log.l.trace, "ProductList.productSelectionView.");
                var ret = ProductList._productSelectionView.deleteRecord(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "ProductList.productSelectionView.");
                var ret = ProductList._productSelectionView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _productMainGroupView: {
            get: function () {
                return AppData.getFormatView("CR_V_Fragengruppe", 20577);
            }
        },
        productMainGroupView: {
            select: function (complete, error) {
                Log.call(Log.l.trace, "ProductList.");
                var ret = ProductList._productMainGroupView.select(complete, error, {
                    // select restriction
                    LanguageSpecID: AppData.getLanguageId()
                }, {
                    // select options
                    ordered: true
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();

