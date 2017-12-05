// controller for page: contact
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/appHeader/appHeaderService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("AppHeader", {
        controller: null
    });
    WinJS.Namespace.define("AppHeader", {
        Controller: WinJS.Class.define(function Controller(pageElement) {
            Log.call(Log.l.trace, "AppHeader.Controller.");
            this.element = pageElement.querySelector("#appHeaderController.data-container");
            if (this.element) {
                this.element.winControl = this;
            }
            this.pageData.generalData = AppData.generalData;
            this.pageData.appSettings = AppData.appSettings;
            this.pageData.eventLogoSrc = "";
            this.pageData.organizerLogoSrc = "";

            AppHeader.controller = this;

            var that = this;

            // First, we call WinJS.Binding.as to get the bindable proxy object
            that.binding = WinJS.Binding.as(that.pageData);


            var showLogo = function(name, format, data) {
                Log.call(Log.l.trace, "AppHeader.Controller.");
                var src;
                var docType = AppData.getDocType(format);
                if (docType) {
                    src = "data:" + docType + ";base64," + data;
                } else {
                    src = "";
                }
                if (that.binding) {
                    that.binding[name + "Src"] = src;
                }
                Log.ret(Log.l.trace);
            }


            // Then, do anything special on this page
            var loadData = function () {
                Log.call(Log.l.trace, "AppHeader.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    var eventId = AppData.getRecordId("Veranstaltung");
                    if (eventId) {
                        // todo: load image data and set src of img-element
                        Log.print(Log.l.trace, "calling select contactView...");
                        return AppHeader.eventLogoView.select(function (json) {
                            Log.print(Log.l.trace, "userPhotoView: success!");
                            if (json && json.d) {
                                var sub;
                                var eventDocFormat = json.d.VeranstaltungwFormat;
                                var eventDocContent = json.d.VeranstaltungDOC1CNT1;
                                var organizerDocFormat = json.d.VeranstalterwFormat;
                                var organizerDocContent = json.d.VeranstalterDOC1CNT1;

                                if (eventDocContent) {
                                    sub = eventDocContent.search("\r\n\r\n");
                                    if (sub >= 0) {
                                        showLogo("eventLogo", eventDocFormat, eventDocContent.substr(sub + 4));
                                    }
                                }
                                if (organizerDocContent) {
                                    sub = organizerDocContent.search("\r\n\r\n");
                                    if (sub >= 0) {
                                        showLogo("organizerLogo", organizerDocFormat, organizerDocContent.substr(sub + 4));
                                    }
                                }
                            }
                        }, function (errorResponse) {
                            // ignore this here
                        }, eventId);
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            // Finally, wire up binding
            WinJS.Resources.processAll(that.element).then(function () {
                return WinJS.Binding.processAll(that.element, that.binding);
            }).then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                var noSize;
                if (!that.binding.eventLogoSrc) {
                    Colors.loadSVGImageElements(pageElement, "event-logo-image", { width: 250, height: 51 }, "#FFFFFF");
                }
                if (!that.binding.organizerLogoSrc) {
                    Colors.loadSVGImageElements(pageElement, "logo-image", noSize, "#FFFFFF");
                }
                Log.print(Log.l.trace, "Data loaded");
            });


            Log.ret(Log.l.trace);
        }, {
            pageData: {
                generalData: AppData.generalData,
                appSettings: AppData.appSettings
            }
        })
    });
})();


