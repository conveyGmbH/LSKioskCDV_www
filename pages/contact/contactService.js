// services for page: contact
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Contact", {
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
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Contact._contactView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;

            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Contact._contactEdit.update(complete, error, recordId, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
                Titel: "",
                Vorname: "",
                Vorname2: "",
                Name: "",
                Position: "",
                Firmenname: "",
                Strasse: "",
                PLZ: "",
                Stadt: "",
                TelefonFestnetz: "",
                TelefonMobil: "",
                Fax: "",
                EMail: "",
                WebAdresse: "",
                Bemerkungen: "",
                Freitext1: "",
                HostName: (window.device && window.device.uuid),
                INITAnredeID: 0,
                INITLandID: 0,
                CreatorSiteID: "",
                CreatorRecID: ""
            }
        }
    });
})();
