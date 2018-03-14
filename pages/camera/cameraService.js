// service for page: camera
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Camera", {
        _cardscanView: {
            get: function () {
                return AppData.getFormatView("IMPORT_CARDSCAN", 0);
            }
        },
        cardscanView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "cardscanView.");
                var ret = Camera._cardscanView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _doc1cardscanView: {
            get: function () {
                return AppData.getFormatView("DOC1IMPORT_CARDSCAN", 0);
            }
        },
        doc1cardscanView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "cardscanView.");
                var ret = Camera._doc1cardscanView.insertWithId(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();

