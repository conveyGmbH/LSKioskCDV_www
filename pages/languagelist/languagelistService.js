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
                    LanguageID: [1031,1033]
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
        }
    });
})();

