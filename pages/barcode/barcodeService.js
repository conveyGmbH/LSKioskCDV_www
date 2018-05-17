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
                return AppData.getFormatView("Kontakt", 20533);
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
        },
        _barcodeView: {
            get: function () {
                return AppData.getFormatView("ImportBarcodeScan", 0);
            }
        },
        barcodeView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "barcodeView.");
                var ret = Barcode._barcodeView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _barcodeVCardView: {
            get: function () {
                return AppData.getFormatView("IMPORT_CARDSCAN", 0);
            }
        },
        barcodeVCardView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "barcodeVCardView.");
                var ret = Barcode._barcodeVCardView.insert(complete, error, viewResponse, {
                    "Content-Type": "application/json; charset=UTF-8"
                });
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
