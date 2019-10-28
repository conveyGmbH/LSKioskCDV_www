// service for page: dbinit
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("DBInit", {
        _loginRequest: {
            get: function () {
                return AppData.getFormatView("LoginRequest", 0, false, true);
            }
        },
        loginRequest: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "loginView.");
                var ret = DBInit._loginRequest.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _loginView: {
            get: function () {
                return AppData.getFormatView("Mitarbeiter_Anmeldung", 0, false, true);
            }
        },
        loginView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "loginView.");
                var ret = DBInit._loginView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _CR_VERANSTOPTION_View: {
            get: function () {
                return AppData.getFormatView("CR_VERANSTOPTION", 0, false);
            }
        },
        CR_VERANSTOPTION_ODataView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "CR_VERANSTOPTION_ODataView.");
                var ret = DBInit._CR_VERANSTOPTION_View.select(complete,
                    error,
                    restriction,
                    {
                        ordered: true,
                        orderAttribute: "INITOptionTypeID"
                    });
                Log.ret(Log.l.trace);
                return ret;

            }
        }
    });
})();
