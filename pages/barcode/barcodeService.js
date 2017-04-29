// service for page: start
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Barcode", {
        _contactEdit: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20434);
            }
        },
        contactView: {
            select: function(complete, error, recordId) {
                Log.call(Log.l.trace, "Barcode.contactView.");
                var ret = Barcode._contactView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "Barcode.contactView.");
                var ret = Barcode._contactEdit.update(complete, error, recordId, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            deleteRecord: function (complete, error, recordId) {
                Log.call(Log.l.trace, "Barcode.contactView.");
                var ret = Barcode._contactEdit.deleteRecord(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
                Titel: "",
                Vorname: "",
                Vorname2: "",
                Name: "",
                Firmenname: "",
                Strasse: "",
                PLZ: "",
                Stadt: "",
                TelefonFestnetz: "",
                TelefonMobil: "",
                Fax: "",
                EMail: "",
                Bemerkungen: "",
                WebAdresse: "",
                Freitext1: "",
                HostName: "",
                INITAnredeID: 0,
                INITLandID: 0,
                CreatorSiteID: "",
                CreatorRecID: "",
                Nachbearbeitet: 1,
                Request_Barcode: "",
                IMPORT_CARDSCANID: "",
                Flag_NoEdit: ""
            }
        }
    });
})();
