// service for page: listLocal
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("LanguageList", {
        _languageView: {
            get: function () {
                return AppData.getFormatView("Landflagge", 20485);
            }
        },
        languageView: {
            select: function (complete, error) {
                Log.call(Log.l.trace, "LanguageList.");
                var ret = LanguageList._languageView.select(complete, error, {
                    // select restriction
                    LanguageSpecID: AppData.getLanguageId(),
                    LanguageID: [1031, 1033],
                    Taste:[1, 2]
                }, {
                    // select options
                    ordered: true,
                    orderAttribute: "Taste"
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _languageDocView: {
            get: function () {
                return AppData.getFormatView("DOC1Landflagge", 0);
            }
        },
        languageDocView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "LanguageList.productDocView.");
                var ret = LanguageList._languageDocView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "ProductList.contactView.");
                var ret = LanguageList._contactView.insert(complete, error, viewResponse);
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
                var ret = LanguageList._productView.select(complete, error, {
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
            }
        }
    });
})();

