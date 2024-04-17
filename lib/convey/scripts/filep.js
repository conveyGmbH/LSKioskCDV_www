// file reader capsulated in Promise
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />

/**
 * Use the functions in this namespace to read file encapsulated in a WinJS Promise Object.
 * @namespace FileP
 */

(function () {
    "use strict";


    WinJS.Utilities._require([
        'WinJS/Core/_Global',
        'WinJS/Core/_Base',
        'WinJS/Promise',
        'WinJS/Scheduler'
    ], function fileInit(_Global, _Base, Promise, Scheduler) {
        "use strict";

        function schedule(f, arg, priority) {
            Scheduler.schedule(function file_callback() {
                f(arg);
            }, priority, null, "FileP.file");
        }

        /**
         * @function loadFile
         * @param {Object} file - file opened by fileEntry.file().
         * @returns {Object} A {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object that returns the response object when it completes.
         * @description Use this function to decompress a buffer.
         */
        function loadFile(dataDirectory, fileName, bUseRootDir) {
            Log.call(Log.l.trace, "FileP.", "dataDirectory=" + dataDirectory + " fileName=" + fileName + " bUseRootDir=" + bUseRootDir);
            var run;
            var ret = new Promise(
                function (c, e, p) {
                    var priority = Scheduler.currentPriority;
                    run = function (that) {
                        var filePath;
                        var readFileFromDirEntry = function (dirEntry) {
                            if (dirEntry) {
                                Log.print(Log.l.info, "resolveLocalFileSystemURL: dirEntry open!");
                                dirEntry.getFile(filePath, {
                                    create: false,
                                    exclusive: false
                                },
                                function(fileEntry) {
                                    if (fileEntry) {
                                        Log.print(Log.l.info, "resolveLocalFileSystemURL: fileEntry open!");
                                        fileEntry.file(function(file) {
                                            var reader = new FileReader();
                                            reader.onerror = function(errorResponse) {
                                                Log.print(Log.l.error, "Failed read file " + JSON.stringify(err));
                                                schedule(e, errorResponse, priority);
                                            };
                                            reader.onloadend = function() {
                                                Log.print(Log.l.info, "Successful file read!");
                                                schedule(c, reader.result, priority);
                                            };
                                            reader.readAsArrayBuffer(file);
                                        },
                                        function(errorResponse) {
                                            Log.print(Log.l.error, "file read error: " + JSON.stringify(errorResponse));
                                            schedule(e, errorResponse, priority);
                                        });
                                    } else {
                                        var err = "file read error NO fileEntry!";
                                        Log.print(Log.l.error, err);
                                        schedule(e, err, priority);
                                    }
                                },
                                function(errorResponse) {
                                    Log.print(Log.l.error, "getFile(" + filePath + ") error: " + JSON.stringify(errorResponse));
                                    schedule(e, errorResponse, priority);
                                });
                            } else {
                                var err = "file read error NO dirEntry!";
                                Log.print(Log.l.error, err);
                                schedule(e, err, priority);
                            }
                        }
                        if (bUseRootDir) {
                            filePath = decodeURI(dataDirectory + "/" + fileName);
                            if (typeof window.requestFileSystem === "function") {
                                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
                                    readFileFromDirEntry(fs.root);
                                }, function(errorResponse) {
                                    Log.print(Log.l.error, "requestFileSystem error: " + JSON.stringify(errorResponse));
                                    schedule(e, errorResponse, priority);
                                });
                            } else {
                                var err = "requestFileSystem is undefined!";
                                Log.print(Log.l.error, err);
                                schedule(e, err, priority);
                            }
                        } else {
                            filePath = fileName;
                            if (typeof window.resolveLocalFileSystemURL === "function") {
                                window.resolveLocalFileSystemURL(dataDirectory, readFileFromDirEntry, function(errorResponse) {
                                    Log.print(Log.l.error, "resolveLocalFileSystemURL error: " + JSON.stringify(errorResponse));
                                    schedule(e, errorResponse, priority);
                                });
                            } else {
                                var err = "resolveLocalFileSystemURL is undefined is undefined!";
                                Log.print(Log.l.error, err);
                                schedule(e, err, priority);
                            }
                        }
                    }
                    schedule(run, this, priority);
                }
            );
            Log.ret(Log.l.trace);
            return ret;
        }

        function deleteFile(dataDirectory, fileName, bUseRootDir) {
            Log.call(Log.l.trace, "FileP.", "dataDirectory=" + dataDirectory + " fileName=" + fileName + " bUseRootDir=" + bUseRootDir);
            var run;
            var ret = new Promise(
                function (c, e, p) {
                    var priority = Scheduler.currentPriority;
                    run = function (that) {
                        var filePath;
                        var deleteFileFromDirEntry = function (dirEntry) {
                            if (dirEntry) {
                                Log.print(Log.l.info, "resolveLocalFileSystemURL: dirEntry open!");
                                dirEntry.getFile(filePath, {
                                    create: false,
                                    exclusive: false
                                },
                                function(fileEntry) {
                                    if (fileEntry) {
                                        Log.print(Log.l.info, "resolveLocalFileSystemURL: fileEntry open!");
                                        fileEntry.remove(function() {
                                            Log.print(Log.l.info, "file deleted!");
                                            schedule(c, null, priority);
                                        },
                                        function(errorResponse) {
                                            Log.print(Log.l.error, "file delete: Failed remove file " + filePath + " error: " + JSON.stringify(errorResponse));
                                            schedule(e, errorResponse, priority);
                                        },
                                        function() {
                                            Log.print(Log.l.trace, "file delete: extra ignored!");
                                            schedule(c, null, priority);
                                        });
                                    } else {
                                        var err = "file read error NO fileEntry!";
                                        Log.print(Log.l.error, err);
                                        schedule(e, err, priority);
                                    }
                                },
                                function(errorResponse) {
                                    Log.print(Log.l.error, "getFile(" + filePath + ") error: " + JSON.stringify(errorResponse));
                                    schedule(e, errorResponse, priority);
                                });
                            } else {
                                var err = "file read error NO dirEntry!";
                                Log.print(Log.l.error, err);
                                schedule(e, err, priority);
                            }
                        }
                        if (bUseRootDir) {
                            filePath = decodeURI(dataDirectory + "/" + fileName);
                            if (typeof window.requestFileSystem === "function") {
                                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
                                    deleteFileFromDirEntry(fs.root);
                                }, function(errorResponse) {
                                    Log.print(Log.l.error, "requestFileSystem error: " + JSON.stringify(errorResponse));
                                    schedule(e, errorResponse, priority);
                                });
                            } else {
                                var err = "requestFileSystem is undefined!";
                                Log.print(Log.l.error, err);
                                schedule(e, err, priority);
                            }
                        } else {
                            filePath = fileName;
                            if (typeof window.resolveLocalFileSystemURL === "function") {
                                window.resolveLocalFileSystemURL(dataDirectory, deleteFileFromDirEntry, function(errorResponse) {
                                    Log.print(Log.l.error, "resolveLocalFileSystemURL error: " + JSON.stringify(errorResponse));
                                    schedule(e, errorResponse, priority);
                                });
                            } else {
                                var err = "resolveLocalFileSystemURL is undefined is undefined!";
                                Log.print(Log.l.error, err);
                                schedule(e, err, priority);
                            }
                        }
                    }
                    schedule(run, this, priority);
                }
            );
            Log.ret(Log.l.trace);
            return ret;
        }


        WinJS.Namespace.define("FileP", {
            load: loadFile,
            delete: deleteFile
        });
    });

})();