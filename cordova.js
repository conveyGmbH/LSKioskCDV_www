(function () {
    "use strict";

    if (typeof cordova === "undefined") {
        var event; // The custom event that will be created

        if (document.createEvent) {
            event = document.createEvent("HTMLEvents");
            event.initEvent("deviceready", true, true);
        } else {
            event = document.createEventObject();
            event.eventType = "deviceready";
        }
        event.eventName = "deviceready";

        $(document).ready(function () {
            function checkForDeviceReady() {
                window.setTimeout(function () {
                    if (typeof WinJS !== "object") {
                        checkForDeviceReady();
                    } else {
                        if (document.dispatchEvent) {
                            document.dispatchEvent(event);
                        } else {
                            document.fireEvent("on" + event.eventType, event);
                        }
                    }
                }, 100);
            }
            checkForDeviceReady();
        });
    }
})();
