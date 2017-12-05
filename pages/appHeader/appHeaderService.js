// services for page: contact
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("AppHeader", {
        _eventLogoView: {
            get: function () {
                return AppData.getFormatView("Veranstaltung", 20523);
            }
        },
        eventLogoView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "userPhotoView.");
                var ret = AppHeader._eventLogoView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
