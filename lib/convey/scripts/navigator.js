// implements the page navigaten
// implements the page navigaten
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/WinJS/scripts/ui.js" />
/// <reference path="../../../lib/convey/scripts/strings.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/appbar.js" />
/// <reference path="../../../lib/convey/scripts/dataService.js" />
/// <reference path="../../../lib/convey/scripts/fragmentController.js" />

(function () {
    "use strict";

    var nav = WinJS.Navigation;

    WinJS.Namespace.define("Application", {
        _navigationBarGroups: [],
        /**
         * @property {Object[]} navigationBarGroups - Array of top level menu items for page navigation
         * @property {string} navigationBarGroups[].id - Page id for navigation
         * @property {number} navigationBarGroups[].group - Group number to group second level navigation bar items
         * @property {string} navigationBarGroups[].svg - File name of SVG document (without .svg extension) of {@link https://msdn.microsoft.com/en-us/library/windows/apps/mt590912.aspx WinJS.UI.SplitViewCommand} object symbol
         * @property {boolean} navigationBarGroups[].disabled - Initial command disable/enable state.
         * @memberof Application
         * @description Read/Write. Retrieves or sets the top level menu items for page navigation in the app.
         *  The top level navigation is realized by a {@link https://msdn.microsoft.com/en-us/library/windows/apps/dn919970.aspx WinJS.UI.SplitView} object.
         *  Initialize this member first in you application startup code, usually at the top of index.js script, e.g. like this:
         <pre>
        // static array of menu groups for the split view pane
        Application.navigationBarGroups = [
            { id: "start", group: 1, svg: "home", disabled: false },
            { id: "mypage1", group: 2, svg: group2_symbol", disabled: true },
            { id: "info", group: 3, svg: "gearwheel", disabled: true }  
        ];
         </pre>
         *  After database login the actual enable/disable state of command items is selected from the user management in the database
         */
        navigationBarGroups: {
            get: function () {
                return Application._navigationBarGroups;
            },
            set: function (newNavigationBarGroups) {
                Application._navigationBarGroups = newNavigationBarGroups;
            }
        },
        _navigationBarPages: [],
        /**
         * @property {Object[]} navigationBarGroups - Array of second level menu items for page navigation
         * @property {string} navigationBarGroups[].id - Page id for navigation
         * @property {number} navigationBarGroups[].group - Group number to group second level navigation bar items
         * @property {boolean} navigationBarGroups[].disabled - Initial command disable/enable state.
         * @memberof Application
         * @description Read/Write. Retrieves or sets the top level menu items for page navigation in the app.
         *  The top level navigation is realized by a {@link https://msdn.microsoft.com/en-us/library/windows/apps/dn919970.aspx WinJS.UI.SplitView} object.
         *  Initialize this member first in you application startup code, usually at the top of index.js script, e.g. like this: 
         <pre>
        // static array of pages for the navigation bar
        Application.navigationBarPages = [
            { id: "start", group: -1, disabled: false },
            { id: "mypage1", group: 2, disabled: false },
            { id: "mypage2", group: 2, disabled: false },
            { id: "mypage3", group: 2, disabled: false },
            { id: "mypage4", group: -2, disabled: false },
            { id: "info", group: 3, disabled: false },
            { id: "settings", group: 3, disabled: false },
            { id: "account", group: 3, disabled: false }
        ];
         </pre>
         *  After database login the actual enable/disable state of command items is selected from the user management in the database
         *  Use negative group numbers for pages in the same top level menu group as the positive number if you don't want these pages be visible in secondary page menu of navigation bar ListView.
         */
        navigationBarPages: {
            get: function () {
                return Application._navigationBarPages;
            },
            set: function (newNavigationBarPages) {
                Application._navigationBarPages = newNavigationBarPages;
            }
        },
        _navigationMasterDetail: [],
        /**
         * @property {Object[]} navigationMasterDetail - Array of master/detail view page id relations
         * @property {string} navigationBarGroups[].id - Page id for navigation
         * @property {string} navigationBarGroups[].master - Page id of master view
         * @memberof Application
         * @description Read/Write. Retrieves or sets the relation of pages as pairs of master and detail views for page navigation in the app.
         *  By navigating to a page id with related master view page, the master view page ist automatically loaded into the master contenthost.
         *  Initialize this member first in you application startup code, usually at the top of index.js script, e.g. like this: 
         <pre>
        // static array of pages master/detail relations
        Application.navigationBarPages = [
            { id: "mypage1", master: "mymasterpage" },
            { id: "mypage3", master: "mymasterpage" }
        ];
         </pre>
         */
        navigationMasterDetail: {
            get: function () {
                return Application._navigationMasterDetail;
            },
            set: function (newNavigationMasterDetail) {
                Application._navigationMasterDetail = newNavigationMasterDetail;
            }
        },
        /**
         * @function getFragmentPath
         * @param {string} fragmentId - Id of fragment
         * @returns {string} The full path of the fragment HTML file
         * @memberof Application
         * @description Use this function to get the full path of a fragment HTML file from the fragment id.
         */
        getFragmentPath: function (fragmentId) {
            Log.call(Log.l.u2, "Application.", "fragmentId=" + fragmentId);
            var ret = "fragments/" + fragmentId + "/" + fragmentId + ".html";
            Log.ret(Log.l.u2, ret);
            return ret;
        },
        /**
         * @function getFragmentId
         * @param {string} fragmentPath - The full path of the fragment HTML file
         * @returns {string} The fragment id
         * @memberof Application
         * @description Use this function to get the fragment id from the full path of a fragment HTML file.
         */
        getFragmentId: function (fragmentPath) {
            Log.call(Log.l.u2, "Application.", "fragmentpath=" + fragmentPath);
            var fragmentId = null;
            if (fragmentPath && fragmentPath.indexOf("fragments/") === 0) {
                var len = fragmentPath.substr(10).indexOf("/");
                if (len > 0) {
                    fragmentId = fragmentPath.substr(10, len);
                }
            }
            Log.ret(Log.l.u2, fragmentId);
            return fragmentId;
        },
        /**
         * @function getPagePath
         * @param {string} pageId - Id of page
         * @returns {string} The full path of the page HTML file
         * @memberof Application
         * @description Use this function to get the full path of a page's HTML file from the page id.
         */
        getPagePath: function (pageId) {
            Log.call(Log.l.u2, "Application.", "pageId=" + pageId);
            var ret = "pages/" + pageId + "/" + pageId + ".html";
            Log.ret(Log.l.u2, ret);
            return ret;
        },
        /**
         * @function getPageId
         * @param {string} pagePath - The full path of the page HTML file
         * @returns {string} The page id
         * @memberof Application
         * @description Use this function to get the page id from the full path of a page HTML file.
         */
        getPageId: function (pagePath) {
            Log.call(Log.l.u2, "Application.", "pagepath=" + pagePath);
            var pageId = null;
            if (pagePath && pagePath.indexOf("pages/") === 0) {
                var len = pagePath.substr(6).indexOf("/");
                if (len > 0) {
                    pageId = pagePath.substr(6, len);
                }
            }
            Log.ret(Log.l.u2, pageId);
            return pageId;
        },
        _initPage: null,
        /**
         * @property {string} initPage - Id of inital page
         * @memberof Application
         * @description Read/Write. Retrieves or sets the intial page to navigate to on app startup.
         */
        initPage: {
            get: function () {
                return Application._initPage;
            },
            set: function (newInitPage) {
                Application._initPage = newInitPage;
            }
        },
        _startPage: null,
        /**
         * @property {string} startPage - Id of home page
         * @memberof Application
         * @description Read/Write. Retrieves or sets the home page of the app.
         */
        startPage: {
            get: function () {
                return Application._startPage;
            },
            set: function (newStartPage) {
                Application._startPage = newStartPage;
            }
        },
        prevNavigateNewId: {
            get: function () {
                return AppData._persistentStates.prevNavigateNewId;
            },
            set: function (newPrevNavigateNewId) {
                AppData._persistentStates.prevNavigateNewId = newPrevNavigateNewId;
            }
        },
        navigateNewId: {
            get: function () {
                return Application.prevNavigateNewId;
            }
        },
        _navigateByIdOverride: null,
        /**
         * @property {function} navigateByIdOverride - Hook function for page id navigation
         * @memberof Application
         * @description Read/Write. Retrieves or sets an optional hook function for page id navigation.
         *  This function is called from the framework before page navigation to allow page id manipulation, e.g.:
         <pre>
            Application.navigateByIdOverride = function (id, event) {
                if (id === "pageX") {
                    // do something special here...
                    id = "pageY";
                }
                return id;
            };
         </pre>
         */
        navigateByIdOverride: {
            get: function () {
                return Application._navigateByIdOverride;
            },
            set: function (newNavigateByIdOverride) {
                Application._navigateByIdOverride = newNavigateByIdOverride;
            }
        },
        /**
         * @function navigateById
         * @param {string} id - The page id to navigate to
         * @param {Object} event - The event info if called from an event handler
         * @memberof Application
         * @description Use this function to navigate to another page.
         */
        navigateById: function (id, event) {
            Log.call(Log.l.trace, "Application.", "id=" + id);
            if (typeof Application._navigateByIdOverride === "function") {
                id = Application._navigateByIdOverride(id, event);
            }
            var newLocation = Application.getPagePath(id);
            if (Application.navigator._lastPage === newLocation) {
                Log.print(Log.l.trace, "already navigated to page location=" + newLocation);
            } else if (Application.navigator._nextPage === newLocation) {
                Log.print(Log.l.trace, "just navigating to page location=" + newLocation);
            } else if (Application.navigator._nextPage) {
                Log.print(Log.l.trace, "just navigating to page location=" + Application.navigator._nextPage + " - try later again...");
                WinJS.Promise.timeout(50).then(function () {
                    Application.navigateById(id, event);
                });
            } else {
                nav.navigate(newLocation, event);
            }
            Log.ret(Log.l.trace);
        },

        showDetail: function () {
            if (Application.navigator && Application.navigator._nextMaster &&
                Application.navigator._masterMaximized && !Application.navigator._masterHidden) {
                WinJS.Promise.timeout(50).then(function () {
                    Application.navigator._hideMaster();
                });
                return true;
            }
            return false;
        },

        showMaster: function () {
            if (Application.navigator && Application.navigator._nextMaster &&
                Application.navigator._masterMaximized && Application.navigator._masterHidden) {
                if (nav.history && nav.history.backStack) {
                    for (var i = nav.history.backStack.length - 1; i >= 0; i--) {
                        if (nav.history.backStack[i] &&
                            nav.history.backStack[i].location === nav.location) {
                            nav.history.backStack.splice(i, nav.history.backStack.length - i);
                            break;
                        }
                    }
                    
                }
                WinJS.Promise.timeout(50).then(function () {
                    Application.navigator._showMaster();
                });
                return true;
            }
            return false;
        },
        /**
         * @function loadFragmentById
         * @param {Object} element - A HTML element of current page to host the fragment
         * @param {string} id - The fragment id to load
         * @param {Object} options - The event info if called from an event handler
         * @param {Object} event - The event info if called from an event handler
         * @memberof Application
         * @description Use this function to load a fragment into an element of the current page.
         *  The options object is routed through to the fragment controller class contructor and can be used to intitialize the fragment controller with paramters from the calling parent page controller.
         */
        loadFragmentById: function (element, id, options, event) {
            Log.call(Log.l.trace, "Application.", "id=" + id);
            var ret;
            if (Application.navigator) {
                ret = Application.navigator.loadFragment(element, Application.getFragmentPath(id), options);
            } else {
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        /**
         * @class PageControlNavigator 
         * @memberof Application
         * @param {Object} element - The HTML parent element where page content is hosted in the application
         * @param {Object} options - Initialization options
         * @param {string} options.home - Full path of the page HTML file of the home page
         * @description This class implementats the page navigation of the application.
         *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/jj126158.aspx WinJS.UI.Pages.PageControl} object for more details about page navigation.
         */
        PageControlNavigator: WinJS.Class.define(
            // Define the constructor function for the PageControlNavigator.
            function PageControlNavigator(element, options) {
                Log.call(Log.l.trace, "Application.PageControlNavigator.");
                this._master = document.querySelector("#masterhost") || document.createElement("div");
                this._master.appendChild(this._createMasterElement());

                this._element = element || document.createElement("div");
                this._element.appendChild(this._createPageElement());

                this.home = options.home;

                this._eventHandlerRemover = [];

                var that = this;
                function addRemovableEventListener(e, eventName, handler, capture) {
                    e.addEventListener(eventName, handler, capture);
                    that._eventHandlerRemover.push(function () {
                        e.removeEventListener(eventName, handler);
                    });
                };

                addRemovableEventListener(nav, "beforenavigate", this._beforenavigate.bind(this), false);
                addRemovableEventListener(nav, "navigating", this._navigating.bind(this), false);
                addRemovableEventListener(nav, "navigated", this._navigated.bind(this), false);

                window.onresize = this._resized.bind(this);

                /**
                 * @member navigator
                 * @memberof Application
                 * @description Read-only. Retrieves the PageControlNavigator object
                 */
                Application.navigator = this;
                Log.ret(Log.l.trace);
            }, {
                home: "",
                _element: null,
                _master: null,
                _fragments: {},
                _lastNavigationPromise: WinJS.Promise.as(),
                _beforeNavigatePromise: WinJS.Promise.as(),
                _lastViewstate: 0,
                _lastPage: "",
                _lastMaster: null,
                _nextMaster: null,
                _nextPage: null,
                _nextPageElement: null,
                _navBarPos: null,
                _prevAppBarHidden: null,
                _masterHidden: false,
                _masterMaximized: false,
                _splitViewRoot: null,
                _splitViewPane: null,
                _sliptViewContent: null,
                splitViewRoot: {
                    get: function() {
                        if (!this._splitViewRoot) {
                            this._splitViewRoot = document.querySelector("#root-split-view");
                        }
                        return this._splitViewRoot;
                    }
                },
                splitViewPane: {
                    get: function() {
                        if (!this._splitViewPane && this.splitViewRoot) {
                            this._splitViewPane = this.splitViewRoot.querySelector("#root-split-view-pane");
                        }
                        return this._splitViewPane;
                    }
                },
                splitViewContent: {
                    get: function () {
                        if (!this._splitViewContent && this.splitViewRoot) {
                            this._splitViewContent = this.splitViewRoot.querySelector(".win-splitview-content");
                        }
                        return this._splitViewContent;
                    }
                },

                // This is the currently loaded Page object.
                /**
                 * @property {Object} pageControl - A PageControl object
                 * @memberof Application.PageControlNavigator
                 * @description Read-only. Retrieves the {@link https://msdn.microsoft.com/en-us/library/windows/apps/jj126158.aspx WinJS.UI.Pages.PageControl} object of the current page.
                 */
                pageControl: {
                    get: function () { return this.pageElement && this.pageElement.winControl; }
                },

                // This is the root element of the current page.
                /**
                 * @property {Object} pageElement - A HTML element
                 * @memberof Application.PageControlNavigator
                 * @description Read-only. Retrieves the HTML root element of the current page.
                 */
                pageElement: {
                    get: function () { return this._element.firstElementChild; }
                },

                // This is the currently loaded Master Page object.
                /**
                 * @property {Object} pageControl - A PageControl object
                 * @memberof Application.PageControlNavigator
                 * @description Read-only. Retrieves the {@link https://msdn.microsoft.com/en-us/library/windows/apps/jj126158.aspx WinJS.UI.Pages.PageControl} object of the current master view if present.
                 */
                masterControl: {
                    get: function () { return this.masterElement && this.masterElement.winControl; }
                },

                // This is the root element of the current Master page.
                /**
                 * @property {Object} pageElement - A HTML element
                 * @memberof Application.PageControlNavigator
                 * @description Read-only. Retrieves the HTML root element of the current master view if present.
                 */
                masterElement: {
                    get: function () { return this._master.firstElementChild; }
                },

                /**
                 * @function getFragmentControl
                 * @param {string} elementId - The id attribute of the HTML element in the current page hosting a fragment
                 * @returns {Object} The fragment controller object
                 * @memberof Application.PageControlNavigator
                 * @description Use this function to get the fragment controller object of the fragment currently loaded into a HTML element with the given id in the current page.
                 */
                getFragmentControl: function (elementId) {
                    var fragmentElement = this.getFragmentElement(elementId);
                    return fragmentElement && fragmentElement.winControl;
                },

                /**
                 * @function getFragmentElement
                 * @param {string} elementId - The id attribute of the HTML element in the current page hosting a fragment
                 * @returns {Object} The fragments HTML root element
                 * @memberof Application.PageControlNavigator
                 * @description Use this function to get the fragments HTML root element of the fragment currently loaded into a HTML element with the given id in the current page.
                 */
                getFragmentElement: function (elementId) {
                    var fragment = this._fragments[elementId];
                    return fragment && fragment._element && fragment._element.firstElementChild;
                },

                getFragmentKeys: function () {
                    var keys;
                    if (this._fragments) {
                        if (Object.keys) {
                            keys = Object.keys(this._fragments);
                        } else {
                            keys = [];
                            var k;
                            for (k in this._fragments) {
                                if (Object.prototype.hasOwnProperty.call(this._fragments, k)) {
                                    keys.push(k);
                                }
                            }
                        }
                    } else {
                        keys = [];
                    }
                    return keys;
                },

                /**
                 * @function getFragmentIdFromLocation
                 * @param {string} location - The full path of a fragment's HTML file
                 * @returns {Object} The fragment id from the the full path of a fragment's HTML file.
                 * @memberof Application.PageControlNavigator
                 * @description Use this function to get the fragment id from the the full path of a fragment's HTML file.
                 */
                getFragmentIdFromLocation: function (location) {
                    var id = null;
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var keys = this.getFragmentKeys();
                    if (keys && keys.length > 0) {
                        for (var j = 0; j < keys.length; j++) {
                            var fragment = this._fragments[keys[j]];
                            if (fragment && fragment._location === location) {
                                id = keys[j];
                                break;
                            }
                        }
                    }
                    Log.ret(Log.l.u1, "id=" + id);
                    return id;
                },

                /**
                 * @function getFragmentControlFromLocation
                 * @param {string} location - The full path of a fragment's HTML file
                 * @returns {Object} The fragment controller object.
                 * @memberof Application.PageControlNavigator
                 * @description Use this function to get the fragment controller object of the fragment currently loaded into a HTML element with the given full path of a fragment's HTML file.
                 */
                getFragmentControlFromLocation: function (location) {
                    var fragmentElement = null;
                    var elementId = this.getFragmentIdFromLocation(location);
                    if (elementId) {
                        fragmentElement = this.getFragmentElement(elementId);
                    }
                    return fragmentElement && fragmentElement.winControl;
                },

                /**
                 * @function getFragmentElementFromLocation
                 * @param {string} location - The full path of a fragment's HTML file
                 * @returns {Object} The fragments HTML root element
                 * @memberof Application.PageControlNavigator
                 * @description Use this function to get the fragments HTML root element of the fragment currently loaded into a HTML element with the given full path of a fragment's HTML file.
                 */
                getFragmentElementFromLocation: function (location) {
                    var fragment = null;
                    var elementId = this.getFragmentIdFromLocation(location);
                    if (elementId) {
                        fragment = this._fragments[elementId];
                    }
                    return fragment && fragment._element && fragment._element.firstElementChild;
                },

                /**
                 * @function loadFragment
                 * @param {Object} element - The HTML element to host the fragment
                 * @param {string} location - The full path of a fragment's HTML file
                 * @param {Object} options - Intialization options for the fragment
                 * @returns {WinJS.Promise} The fulfillment of the loading process is returned in a {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object.
                 * @memberof Application.PageControlNavigator
                 * @description Loads a fragment into a HTML element with the given full path of a fragment's HTML file.
                 */
                loadFragment: function (element, location, options) {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.", "id=" + element.id);
                    var that = this;
                    var detail = {
                        element: element,
                        location: location,
                        options: options,
                        setPromise: function(promise) {
                            return promise.then(function() {
                                return that._loaded(element.id);
                            });
                        }
                    }
                    var ret = this._loading({ detail: detail });
                    Log.ret(Log.l.trace, "");
                    return ret;
                },

                // Calculates position and size of master element
                /**
                 * @function resizeMasterElement
                 * @param {Object} element - The HTML root element of the master view page
                 * @returns {WinJS.Promise} The fulfillment of the layout update processing is returned in a {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object.
                 * @memberof Application.PageControlNavigator
                 * @description Calculates position and size of master view element and processes the layout update.
                 */
                resizeMasterElement: function (element) {
                    var ret;
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var splitViewContent = Application.navigator && Application.navigator.splitViewContent;
                    if (element && element.style && splitViewContent) {
                        // current window size
                        var left = 0;
                        var top = 0;
                        var width = splitViewContent.clientWidth;
                        var height = splitViewContent.clientHeight;
                        if (width > 899) {
                            width = 450;
                            if (this._masterMaximized) {
                                if (this._masterHidden) {
                                    this._masterHidden = false;
                                    this._prevAppBarHidden = null;
                                    this.masterElement.style.visibility = "";
                                } else {
                                    WinJS.UI.Animation.enterContent(this.pageElement);
                                }
                                this._masterMaximized = false;
                            }
                        } else if (width >= 699) {
                            width = width / 2;
                            if (this._masterMaximized) {
                                if (this._masterHidden) {
                                    this._masterHidden = false;
                                    this._prevAppBarHidden = null;
                                    this.masterElement.style.visibility = "";
                                } else {
                                    WinJS.UI.Animation.enterContent(this.pageElement);
                                }
                                this._masterMaximized = false;
                            }
                        } else {
                            if (this._nextMaster) {
                                this._masterMaximized = true;
                            } else {
                                this._masterMaximized = false;
                            }
                        }
                        // hide AppBar if master is maximized
                        if (AppBar.barControl &&
                            (this._prevAppBarHidden === null || this._masterMaximized === null ||
                             this._prevAppBarHidden !== this._masterMaximized)) {
                            this._prevAppBarHidden = this._masterMaximized;
                            var closedDisplayMode = AppBar.barControl.closedDisplayMode;
                            if (this._masterMaximized && !this._masterHidden) {
                                AppBar.barControl.disabled = true;
                                closedDisplayMode = "none";
                            } else {
                                if (AppBar._commandList && AppBar._commandList.length > 0) {
                                    var existsSecondary = false;
                                    var existsPrimary = false;
                                    for (var i = 0; i < AppBar._commandList.length; i++) {
                                        if (AppBar._commandList[i].section === "primary") {
                                            existsPrimary = true;
                                        } else if (AppBar._commandList[i].section === "secondary") {
                                            existsSecondary = true;
                                        }
                                    }
                                    AppBar.barControl.disabled = false;
                                    if (existsPrimary) {
                                        if (!existsSecondary && AppBar._appBar._hideOverflowButton) {
                                            closedDisplayMode = "full";
                                        } else {
                                            closedDisplayMode = "compact";
                                        }
                                    } else {
                                        closedDisplayMode = "minimal";
                                    }
                                } else {
                                    AppBar.barControl.disabled = true;
                                    closedDisplayMode = "none";
                                }
                            }
                            AppBar.barControl.close();
                            if (AppBar.barControl.closedDisplayMode !== closedDisplayMode) {
                                AppBar.barControl.closedDisplayMode = closedDisplayMode;
                                // calling _resize() again later...
                                WinJS.Promise.timeout(0).then(function () {
                                    Application.navigator._resized();
                                });
                            }
                        }
                        if (this._nextMaster) {
                            element.style.zIndex = "1";
                        } else {
                            element.style.zIndex = "-9990";
                        }
                        element.style.left = left.toString() + "px";
                        element.style.top = top.toString() + "px";
                        element.style.width = width.toString() + "px";
                        element.style.height = height.toString() + "px";
                        var contentarea = element.querySelector(".contentarea");
                        if (contentarea) {
                            contentarea.style.height = height.toString() + "px";
                            contentarea.style.width = width.toString() + "px";
                        }
                        if (width > 499) {
                            // remove class: view-size-small  
                            WinJS.Utilities.removeClass(element, "view-size-small");
                        } else {
                            // add class: view-size-small    
                            WinJS.Utilities.addClass(element, "view-size-small");
                        }
                        if (width > 699) {
                            // remove class: view-size-medium-small  
                            WinJS.Utilities.removeClass(element, "view-size-medium-small");
                        } else {
                            // add class: view-size-medium-small    
                            WinJS.Utilities.addClass(element, "view-size-medium-small");
                        }
                        if (width > 899) {
                            // remove class: view-size-medium    
                            WinJS.Utilities.removeClass(element, "view-size-medium");
                        } else {
                            // add class: view-size-medium
                            WinJS.Utilities.addClass(element, "view-size-medium");
                        }
                        if (width > 1099) {
                            // remove class: view-size-bigger
                            WinJS.Utilities.removeClass(element, "view-size-bigger");
                        } else {
                            // add class: view-size-bigger
                            WinJS.Utilities.addClass(element, "view-size-bigger");
                        }
                        if (element.winControl && element.winControl.updateLayout) {
                            ret = element.winControl.updateLayout.call(element.winControl, element);
                        }
                    }
                    Log.ret(Log.l.u1, "");
                    return ret;
                },

                // Calculates position and size of page element
                /**
                 * @function resizePageElement
                 * @param {Object} element - The HTML root element of the current page
                 * @returns {WinJS.Promise} The fulfillment of the layout update processing is returned in a {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object.
                 * @memberof Application.PageControlNavigator
                 * @description Calculates position and size of page element and processes the layout update.
                 */
                resizePageElement: function (element) {
                    var ret = null;
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var splitViewContent = Application.navigator && Application.navigator.splitViewContent;
                    if (element && element.style && splitViewContent) {
                        var i;

                        // current window size
                        var left = 0;
                        var top = 0;
                        var width = splitViewContent.clientWidth;
                        var height = splitViewContent.clientHeight;

                        // calculate content element dimensions
                        if (this._nextMaster && !this._masterHidden) {
                            left += this.masterElement.clientWidth;
                            width -= this.masterElement.clientWidth;
                        }

                        // NavigationBar element
                        var navBarElement = null;
                        var navBarVisible = false;
                        if (this._nextPage) {
                            // check for coming NavigationBar on page transitions
                            var newPageId = Application.getPageId(this._nextPage);
                            var group = null;
                            for (i = 0; i < NavigationBar.pages.length; i++) {
                                if (NavigationBar.pages[i].id === newPageId) {
                                    group = NavigationBar.pages[i].group;
                                    break;
                                }
                            }
                            if (group > 0 || !group && NavigationBar.data && NavigationBar.data.length > 0) {
                                navBarVisible = true;
                            } 
                        } else if (NavigationBar.data && NavigationBar.data.length > 0) {
                            navBarVisible = true;
                        }
                        if (navBarVisible) {
                            if (NavigationBar.orientation === "horizontal") {
                                top += NavigationBar._horzHeight;
                                height -= NavigationBar._horzHeight;
                                navBarElement = NavigationBar.ListView && NavigationBar.ListView.listElement;
                            } else {
                                left += NavigationBar._vertWidth;
                                width -= NavigationBar._vertWidth;
                            }
                        }
                        element.style.zIndex = "1";
                        element.style.left = left.toString() + "px";
                        element.style.top = top.toString() + "px";
                        element.style.width = width.toString() + "px";
                        element.style.height = height.toString() + "px";
                        var contentarea = element.querySelector(".contentarea");
                        if (contentarea) {
                            contentarea.style.height = height.toString() + "px";
                            contentarea.style.width = width.toString() + "px";
                        }
                        if (width > 499) {
                            // remove class: view-size-small  
                            WinJS.Utilities.removeClass(element, "view-size-small");
                            if (navBarElement) {
                                WinJS.Utilities.removeClass(navBarElement, "view-size-small");
                            }
                        } else {
                            // add class: view-size-small    
                            WinJS.Utilities.addClass(element, "view-size-small");
                            if (navBarElement) {
                                WinJS.Utilities.addClass(navBarElement, "view-size-small");
                            }
                        }
                        if (width > 699) {
                            // remove class: view-size-medium-small  
                            WinJS.Utilities.removeClass(element, "view-size-medium-small");
                            if (navBarElement) {
                                WinJS.Utilities.removeClass(navBarElement, "view-size-medium-small");
                            }
                        } else {
                            // add class: view-size-medium-small    
                            WinJS.Utilities.addClass(element, "view-size-medium-small");
                            if (navBarElement) {
                                WinJS.Utilities.addClass(navBarElement, "view-size-medium-small");
                            }
                        }
                        if (width > 899) {
                            // remove class: view-size-medium    
                            WinJS.Utilities.removeClass(element, "view-size-medium");
                            if (navBarElement) {
                                WinJS.Utilities.removeClass(navBarElement, "view-size-medium");
                            }
                        } else {
                            // add class: view-size-medium
                            WinJS.Utilities.addClass(element, "view-size-medium");
                            if (navBarElement) {
                                WinJS.Utilities.addClass(navBarElement, "view-size-medium");
                            }
                        }
                        if (width > 1099) {
                            // remove class: view-size-bigger
                            WinJS.Utilities.removeClass(element, "view-size-bigger");
                            if (navBarElement) {
                                WinJS.Utilities.removeClass(navBarElement, "view-size-bigger");
                            }
                        } else {
                            // add class: view-size-bigger
                            WinJS.Utilities.addClass(element, "view-size-bigger");
                            if (navBarElement) {
                                WinJS.Utilities.addClass(navBarElement, "view-size-bigger");
                            }
                        }
                        if (element.winControl && element.winControl.updateLayout) {
                            ret = element.winControl.updateLayout.call(element.winControl, element);
                        }
                    }
                    this._updateFragmentsLayout();
                    Log.ret(Log.l.u1, "");
                    return ret;
                },

                // This function disposes the page navigator and its contents.
                dispose: function () {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    if (this._disposed) {
                        return;
                    }

                    this._disposed = true;
                    WinJS.Utilities.disposeSubTree(this._element);
                    for (var i = 0; i < this._eventHandlerRemover.length; i++) {
                        this._eventHandlerRemover[i]();
                    }
                    this._eventHandlerRemover = null;
                    Log.ret(Log.l.trace);
                },

                // Checks for valid state of current page before navigation via canUnload() function
                _beforeload: function (args) {
                    var id = args.detail.element.id;
                    Log.call(Log.l.trace, "Application.PageControlNavigator.", "id=" + id);
                    var fragment = this._fragments[id];

                    this._fragments[id]._inBeforeLoadPromise = true;
                    var that = this;
                    if (fragment._element &&
                        fragment._element.firstElementChild &&
                        fragment._element.firstElementChild.winControl &&
                        typeof fragment._element.firstElementChild.winControl.canUnload === "function") {
                        this._fragments[id]._beforeLoadPromise = fragment._element.firstElementChild.winControl.canUnload(function(response) {
                                    Log.print(Log.l.trace,
                                        "from PageControlNavigator: _beforeload(" + id + ") canUnload true!");
                                    return WinJS.Promise.timeout(0).then(function() {
                                        if (that._fragments[id]._inBeforeLoadPromise &&
                                            that._fragments[id]._beforeLoadPromise &&
                                            typeof that._fragments[id]._beforeLoadPromise._completed === "function") {
                                            // called asynchronously if ok
                                            Log.print(Log.l.trace,
                                                "from PageControlNavigator (true): _beforeload(" +
                                                id +
                                                ") calling _completed()");
                                            that._fragments[id]._beforeLoadPromise._completed();
                                            that._fragments[id]._inBeforeLoadPromise = false;
                                        }
                                    });
                                },
                                function(errorResponse) {
                                    Log.print(Log.l.trace,
                                        "from PageControlNavigator: _beforeload(" + id + ") canUnload false!");
                                    return WinJS.Promise.timeout(0).then(function() {
                                        if (that._fragments[id]._inBeforeLoadPromise &&
                                            that._fragments[id]._beforeLoadPromise &&
                                            typeof that._fragments[id]._beforeLoadPromise.cancel === "function") {
                                            // called asynchronously if not allowed
                                            Log.print(Log.l.trace,
                                                "from PageControlNavigator (false): _beforeload(" +
                                                id +
                                                ") calling cancel()");
                                            that._fragments[id]._beforeLoadPromise.cancel();
                                            that._fragments[id]._inBeforeLoadPromise = false;
                                        }
                                    });
                                }).then(function() {
                                // handle waitfor asynchronously called return values
                                return WinJS.Promise.timeout(120000).then(function() {
                                    Log.print(Log.l.trace,
                                        "from PageControlNavigator: _beforeload(" + id + ") canUnload timeout!");
                                    if (that._fragments &&
                                        that._fragments[id] &&
                                        that._fragments[id]._inBeforeLoadPromise &&
                                        that._fragments[id]._beforeLoadPromise &&
                                        typeof that._fragments[id]._beforeLoadPromise.cancel === "function") {
                                        Log.print(Log.l.trace,
                                            "from PageControlNavigator (timeout): _beforeload(" +
                                            id +
                                            ") calling cancel()");
                                        that._fragments[id]._beforeLoadPromise.cancel();
                                        that._fragments[id]._inBeforeLoadPromise = false;
                                    }
                                });
                            });
                    } else {
                        this._fragments[id]._beforeLoadPromise = new WinJS.Promise.as().then(function(response) {
                            Log.print(Log.l.trace,
                                "from PageControlNavigator: _beforeload(" + id + ") done!");
                            return WinJS.Promise.timeout(0).then(function() {
                                if (that._fragments[id]._inBeforeLoadPromise &&
                                    that._fragments[id]._beforeLoadPromise &&
                                    typeof that._fragments[id]._beforeLoadPromise._completed === "function") {
                                    // called asynchronously if ok
                                    Log.print(Log.l.trace,
                                        "from PageControlNavigator (true): _beforeload(" +
                                        id +
                                        ") calling _completed()");
                                    that._fragments[id]._beforeLoadPromise._completed();
                                    that._fragments[id]._inBeforeLoadPromise = false;
                                }
                            });
                        });
                    }
                    Log.print(Log.l.trace, "calling setPromise");
                    args.detail.setPromise(this._fragments[id]._beforeLoadPromise);
                    Log.ret(Log.l.trace, "");
                },

                // Responds to navigation by adding new fragments to the DOM of current page.
                _loading: function (args) {
                    var location = args.detail.location;
                    var id = args.detail.element.id;
                    var options = args.detail.options;
                    Log.call(Log.l.trace, "Application.PageControlNavigator.", "id=" + id);

                    if (!this._fragments[id]) {
                        this._fragments[id] = {};
                    }
                    if (!this._fragments[id]._element) {
                        this._fragments[id]._element = args.detail.element || document.createElement("div");
                    }
                    var prevFragmentElement = this.getFragmentElement(id);
                    var prevFragmentAnimationElements = prevFragmentElement ? this._getAnimationElements(0, prevFragmentElement) : null;

                    var newFragmentElement = null;
                    var renderedFragmentElement = null;

                    var that = this;

                    function cleanupOldElement(oldElement) {
                        Log.call(Log.l.trace, "Application.PageControlNavigator.");
                        // Cleanup and remove previous element
                        if (oldElement) {
                            if (oldElement.winControl) {
                                if (oldElement.winControl.unload) {
                                    oldElement.winControl.unload();
                                }
                                oldElement.winControl.dispose();
                            }
                            oldElement.parentNode.removeChild(oldElement);
                            oldElement.innerHTML = "";
                        }
                        Log.ret(Log.l.trace);
                    }
                    function cleanup() {
                        Log.call(Log.l.trace, "Application.PageControlNavigator.");
                        if (that._fragments && that._fragments[id] &&
                            that._fragments[id]._element.childElementCount > 1) {
                            cleanupOldElement(that._fragments[id]._element.firstElementChild);
                        }
                        Log.ret(Log.l.trace);
                    }
                    if (this._fragments[id]._lastNavigationPromise) {
                        this._fragments[id]._lastNavigationPromise.cancel();
                    }
                    this._fragments[id]._lastNavigationPromise = WinJS.Promise.as().then(function() {
                        newFragmentElement = that._createFragmentElement(id);
                        that._fragments[id]._element.appendChild(newFragmentElement);
                        that._fragments[id]._location = location;
                        Log.print(Log.l.trace, "PageControlNavigator: calling render fragment");
                        return WinJS.UI.Fragments.render(location, newFragmentElement);
                    }).then(function(element) {
                        if (element) {
                            if (element.firstElementChild &&
                                element.firstElementChild.style) {
                                element.firstElementChild.style.width = "100%";
                                element.firstElementChild.style.height = "100%";
                                var contentarea = element.querySelector(".contentarea");
                                while (contentarea && contentarea !== element.firstElementChild) {
                                    if (contentarea.style) {
                                        contentarea.style.width = "100%";
                                        contentarea.style.height = "100%";
                                    }
                                    contentarea = contentarea.parentElement;
                                }
                            }
                            renderedFragmentElement = element;
                            Log.print(Log.l.trace, "PageControlNavigator: calling UI.processAll");
                            return WinJS.UI.processAll(element);
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function() {
                        if (renderedFragmentElement) {
                            var pos = location.indexOf(".html");
                            var domain = location.substr(0, pos);
                            if (renderedFragmentElement && Fragments && Fragments[domain]) {
                                var fragmentNameSpace = Fragments[domain].html;
                                renderedFragmentElement.winControl =
                                    new fragmentNameSpace.FragmentControl(renderedFragmentElement);
                                renderedFragmentElement.winControl.ready(renderedFragmentElement, options);
                            }
                        }
                        if (prevFragmentAnimationElements && prevFragmentAnimationElements.length > 0) {
                            Log.print(Log.l.trace, "PageControlNavigator: calling exit previous fragment");
                            return WinJS.UI.Animation.exitContent(prevFragmentAnimationElements);
                        } else {
                            Log.print(Log.l.trace, "from PageControlNavigator: calling no exit animation");
                            return WinJS.Promise.as();
                        }
                    }).then(cleanup, cleanup);
                    var ret = args.detail.setPromise(this._fragments[id]._lastNavigationPromise);
                    Log.ret(Log.l.trace, "");
                    return ret;
                },

                _loaded: function (id) {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.", "id=" + id);
                    var ret = null;
                    var fragmentElement = this.getFragmentElement(id);
                    if (fragmentElement) {
                        fragmentElement.style.visibility = "";
                        var fragmentAnimationElements = this._getAnimationElements(0, fragmentElement);
                        if (fragmentAnimationElements) {
                            ret = WinJS.UI.Animation.enterContent(fragmentAnimationElements).then(function () {
                                if (fragmentElement.winControl) {
                                    fragmentElement.winControl.updateLayout.call(fragmentElement.winControl, fragmentElement);
                                }
                            });
                        }
                    }
                    if (!ret) {
                        ret = WinJS.Promise.as();
                    }
                    Log.ret(Log.l.trace);
                    return ret;
                },

                // Creates a container for a fragment to be loaded into.
                _createFragmentElement: function (id) {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    var element = document.createElement("div");
                    element.setAttribute("dir", window.getComputedStyle(this._fragments[id]._element, null).direction);
                    element.setAttribute("style", "width: 100%; height: 100%; visibility: hidden; overflow-x: hidden; overflow-y: hidden;");

                    Log.ret(Log.l.trace, "");
                    return element;
                },

                // Creates a container for a master page to be loaded into.
                _createMasterElement: function () {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    var element = document.createElement("div");
                    element.setAttribute("dir", window.getComputedStyle(this._master, null).direction);
                    element.setAttribute("style", "position: absolute; visibility: hidden; overflow-x: hidden; overflow-y: hidden;");
                    this._masterHidden = false;
                    this.resizeMasterElement(element);
                    Log.ret(Log.l.trace, "");
                    return element;
                },

                // Creates a container for a new page to be loaded into.
                _createPageElement: function () {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    var element = document.createElement("div");
                    element.setAttribute("dir", window.getComputedStyle(this._element, null).direction);
                    element.setAttribute("style", "position: absolute; visibility: hidden; overflow-x: hidden; overflow-y: hidden;");
                    WinJS.Utilities.addClass(element, "row-bkg");
                    this.resizePageElement(element);
                    Log.ret(Log.l.trace, "");
                    return element;
                },

                _updateFragmentsLayout: function () {
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var keys = this.getFragmentKeys();
                    if (keys && keys.length > 0) {
                        for (var j = 0; j < keys.length; j++) {
                            var fragmentElement = this.getFragmentElement(keys[j]);
                            if (fragmentElement && fragmentElement.winControl) {
                                Log.print(Log.l.trace, "calling updateLayout of fragment id=" + keys[j]);
                                fragmentElement.winControl.updateLayout.call(fragmentElement.winControl, fragmentElement);
                            }
                        }
                    }
                    Log.ret(Log.l.u1, "");
                },

                // Retrieves a list of animation elements for the current page.
                // If the page does not define a list, animate the entire page.
                _getAnimationElements: function (number, pageElement) {
                    var animationElements;
                    if (!number) {
                        number = 0;
                    }
                    Log.call(Log.l.u2, "Application.PageControlNavigator.", "number=" + number);
                    if (!pageElement) {
                        pageElement = this.pageElement;
                    }
                    var pageControl = null;
                    if (pageElement) {
                        pageControl = pageElement.winControl;
                        var selector = ".animationElement";
                        if (number >= 1) {
                            animationElements = pageElement.querySelectorAll(selector + number.toString());
                        } else {
                            animationElements = pageElement.querySelectorAll(selector);
                        }
                        if (!animationElements || !animationElements.length) {
                            if (number === 1) {
                                animationElements = pageElement.querySelectorAll(selector);
                            } else if (number > 1) {
                                animationElements = [];
                            } else {
                                animationElements = [];
                                for (var i = 1; i <= 3; i++) {
                                    var animationElementsNumber = pageElement.querySelectorAll(selector + i.toString());
                                    if (animationElementsNumber && animationElementsNumber.length > 0) {
                                        for (var j = 0; j < animationElementsNumber.length; j++) {
                                            animationElements.push(animationElementsNumber[j]);
                                        }
                                    }
                                }
                            }
                        }
                        if (animationElements && animationElements.length > 0 || number) {
                            Log.ret(Log.l.u2, "");
                            return animationElements;
                        }
                    }
                    if (pageControl &&
                        typeof pageControl.getAnimationElements === "function") {
                        animationElements = pageControl.getAnimationElements();
                        Log.ret(Log.l.u2, "");
                        return animationElements;
                    }
                    Log.ret(Log.l.u2, "");
                    return pageElement;
                },
                _syncNavigationBar: function (newPage) {
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var nextPage;
                    var iPrev = -1;
                    var iCur = -1;
                    var isGroup = false;
                    if (!newPage) {
                        newPage = nav.location;
                    }
                    if (newPage && NavigationBar.data && NavigationBar.ListView) {
                        var group = 0;
                        var i;
                        for (i = 0; i < NavigationBar.pages.length; i++) {
                            nextPage = Application.getPagePath(NavigationBar.pages[i].id);
                            if (newPage === nextPage) {
                                group = NavigationBar.pages[i].group;
                                break;
                            }
                        }
                        if (group < 0) {
                            group = -group;
                        }
                        if (group > 0 && group !== NavigationBar.curGroup) {
                            NavigationBar.setItemsForGroup(group);
                            iCur = group;
                            iPrev = NavigationBar.curGroup;
                            isGroup = true;
                        } else {
                            for (i = 0; i < NavigationBar.data.length; i++) {
                                var item = NavigationBar.data.getAt(i);
                                if (item) {
                                    nextPage = Application.getPagePath(item.id);
                                    if (newPage === nextPage) {
                                        iCur = i;
                                    }
                                    if (this._lastPage === nextPage) {
                                        iPrev = i;
                                    }
                                }
                            }
                            NavigationBar.ListView.setSelIndex(iCur);
                        }
                    }
                    Log.ret(Log.l.u1, "iPrev=" + iPrev + " iCur=" + iCur);
                    return { iPrev: iPrev, iCur: iCur, isGroup: isGroup };
                },

                _navigated: function () {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    var animationDistanceX;
                    var animationDistanceY;
                    var animationOptions;
                    var iPrev = -1;
                    var iCur = -1;
                    var isGroup = false;
                    var navBarPos = this._navBarPos;
                    if (navBarPos) {
                        iPrev = navBarPos.iPrev;
                        iCur = navBarPos.iCur;
                        isGroup = navBarPos.isGroup;
                    }
                    var that = this;

                    function cleanup() {
                        if (that.cleanupPrevPage) {
                            that.cleanupPrevPage();
                            that.cleanupPrevPage = null;
                        }
                        that._nextPage = null;
                    }

                    var lastPage = this._lastPage;
                    this._lastPage = nav.location;
                    if (this._nextPageElement && this._nextPageElement.style) {
                        this._nextPageElement.style.visibility = "";
                    }
                    if (this._nextMaster === this._lastMaster) {
                        Log.print(Log.l.trace, "extra ignored _lastMaster=" + this._lastMaster);
                    } else {
                        this._prevAppBarHidden = null;
                        this._lastMaster = this._nextMaster;
                        if (this._nextMaster && !this._masterHidden) {
                            this.masterElement.style.visibility = "";
                            Log.print(Log.l.trace, "PageControlNavigator: enter next master page");
                            animationDistanceX = -NavigationBar._animationDistanceX;
                            animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                            WinJS.UI.Animation.enterContent(this._getAnimationElements(0, this.masterElement),animationOptions).then(function () {
                                that.resizeMasterElement(that.masterElement);
                            });
                        }
                    }
                    if (lastPage === Application.initPage) {
                        cleanup();
                        WinJS.UI.Animation.fadeIn(this._getAnimationElements(0, this._nextPageElement)).then(function() {
                            that.resizePageElement(that.pageElement);
                        });
                    } else if (NavigationBar.orientation !== "horizontal" ||
                        iPrev < 0 || iCur < 0 || iPrev === iCur ||
                        nav.location === Application.startPage) {
                        WinJS.UI.Animation.enterPage(this._getAnimationElements(0, this._nextPageElement)).then(function () {
                            cleanup();
                            that.resizePageElement(that.pageElement);
                        });
                    } else if (isGroup) {
                        if (iPrev < iCur) {
                            WinJS.UI.Animation.continuumBackwardIn(this._nextPageElement, this._getAnimationElements(0, this._nextPageElement)).then(function () {
                                cleanup();
                                that.resizePageElement(that.pageElement);
                            });
                        } else {
                            WinJS.UI.Animation.continuumForwardIn(this._nextPageElement, this._getAnimationElements(0, this._nextPageElement)).then(function () {
                                cleanup();
                                that.resizePageElement(that.pageElement);
                            });
                        }
                    } else {
                        if (iPrev < iCur) {
                            animationDistanceX = NavigationBar._animationDistanceX;
                            animationDistanceY = NavigationBar._animationDistanceY;
                        } else {
                            animationDistanceX = -NavigationBar._animationDistanceX;
                            animationDistanceY = -NavigationBar._animationDistanceY;
                        }
                        if (NavigationBar.orientation !== "horizontal") {
                            animationOptions = { top: animationDistanceY.toString() + "px", left: "0px" };
                        } else {
                            animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                        }
                        WinJS.UI.Animation.enterContent(
                            this._getAnimationElements(0, this._nextPageElement),
                            animationOptions,
                            { mechanism: "transition" }).then(function () {
                                cleanup();
                                that.resizePageElement(that.pageElement);
                            });
                    }
                    WinJS.Promise.timeout(0).then(function () {
                        if (typeof AppBar._disableCommandFromValue === "function" &&
                            AppBar._disableHandlers &&
                            AppBar._disableHandlers.length > 0) {
                            var newValues = [];
                            for (var i = 0; i < AppBar._disableHandlers.length; i++) {
                                var curHandler = AppBar._disableHandlers[i];
                                if (typeof curHandler === "function") {
                                    newValues.push(curHandler());
                                } else {
                                    newValues.push(false);
                                }
                            }
                            AppBar._disableCommandFromValue(newValues);
                        }
                    });
                    Log.ret(Log.l.trace);
                },

                // Checks for valid state of current page before navigation via canUnload() function
                _beforenavigate: function (args) {
                    var isDisabled = false;
                    var prevPageId = Application.getPageId(nav.location);
                    var pageId = null;
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    if (args && args.detail && args.detail.location) {
                        var i;
                        pageId = Application.getPageId(args.detail.location);
                        if (NavigationBar.pages && NavigationBar.pages.length > 0) {
                            for (i = 0; i < NavigationBar.pages.length; i++) {
                                if (NavigationBar.pages[i] &&
                                    NavigationBar.pages[i].id === pageId) {
                                    if (NavigationBar.pages[i].disabled) {
                                        Log.print(Log.l.trace, "page=" + pageId + " is disabled");
                                        isDisabled = true;
                                    }
                                    break;
                                }
                            }
                        }
                        if (!isDisabled) {
                            if (NavigationBar.groups && NavigationBar.groups.length > 0) {
                                for (i = 0; i < NavigationBar.groups.length; i++) {
                                    if (NavigationBar.groups[i] &&
                                        NavigationBar.groups[i].id === pageId) {
                                        if (NavigationBar.groups[i].disabled) {
                                            Log.print(Log.l.trace, "group=" + pageId + " is disabled");
                                            isDisabled = true;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    this._beforeNavigatePromise = WinJS.Promise.as();
                    this._inBeforeNavigatePromise = true;
                    var that = this;
                    if (isDisabled) {
                        this._beforeNavigatePromise = new WinJS.Promise.as().then(function() {
                            return WinJS.Promise.timeout(0).then(function() {
                                Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate is disabled!");
                                if (that._inBeforeNavigatePromise &&
                                    that._beforeNavigatePromise &&
                                    typeof that._beforeNavigatePromise.cancel === "function") {
                                    // called asynchronously if not allowed
                                    that._beforeNavigatePromise.cancel();
                                    //that._beforeNavigatePromise = null;
                                    that._inBeforeNavigatePromise = false;
                                    if (typeof that._syncNavigationBar === "function") {
                                        that._syncNavigationBar();
                                    }
                                }
                            });
                        });
                    } else {
                        var checkCanUnload = function() {
                            if (!(pageId === "register" || (pageId === "account" && prevPageId === "login")) &&
                                that._element &&
                                that._element.firstElementChild &&
                                that._element.firstElementChild.winControl &&
                                typeof that._element.firstElementChild.winControl.canUnload === "function") {
                                return that._element.firstElementChild.winControl.canUnload(function(response) {
                                    Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate canUnload true!");
                                    return WinJS.Promise.timeout(0).then(function() {
                                        if (that._inBeforeNavigatePromise &&
                                            that._beforeNavigatePromise &&
                                            typeof that._beforeNavigatePromise._completed === "function") {
                                            // called asynchronously if ok
                                            Log.print(Log.l.trace, "from PageControlNavigator (true): _beforenavigate calling _completed()");
                                            that._beforeNavigatePromise._completed();
                                            //that._beforeNavigatePromise = null;
                                            that._inBeforeNavigatePromise = false;
                                        }
                                    });
                                }, function(errorResponse) {
                                    Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate canUnload false!");
                                    return WinJS.Promise.timeout(0).then(function() {
                                        if (that._inBeforeNavigatePromise &&
                                            that._beforeNavigatePromise &&
                                            typeof that._beforeNavigatePromise.cancel === "function") {
                                            // called asynchronously if not allowed
                                            Log.print(Log.l.trace, "from PageControlNavigator (false): _beforenavigate calling cancel()");
                                            that._beforeNavigatePromise.cancel();
                                            //that._beforeNavigatePromise = null;
                                            that._inBeforeNavigatePromise = false;
                                            if (typeof that._syncNavigationBar === "function") {
                                                that._syncNavigationBar();
                                            }
                                        }
                                    });
                                }).then(function() {
                                    // handle waitfor asynchronously called return values
                                    return WinJS.Promise.timeout(120000).then(function() {
                                        Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate canUnload timeout!");
                                        if (that._inBeforeNavigatePromise &&
                                            that._beforeNavigatePromise &&
                                            typeof that._beforeNavigatePromise.cancel === "function") {
                                            Log.print(Log.l.trace, "from PageControlNavigator (timeout): _beforenavigate calling cancel()");
                                            that._beforeNavigatePromise.cancel();
                                            //that._beforeNavigatePromise = null;
                                            that._inBeforeNavigatePromise = false;
                                            if (typeof that._syncNavigationBar === "function") {
                                                that._syncNavigationBar();
                                            }
                                        }
                                    });
                                });
                            } else {
                                return new WinJS.Promise.as().then(function() {
                                    Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate done!");
                                    return WinJS.Promise.timeout(0).then(function () {
                                        if (that._inBeforeNavigatePromise &&
                                            that._beforeNavigatePromise &&
                                            typeof that._beforeNavigatePromise._completed === "function") {
                                            // called asynchronously if ok
                                            Log.print(Log.l.trace, "from PageControlNavigator (true): _beforenavigate calling _completed()");
                                            that._beforeNavigatePromise._completed();
                                            //that._beforeNavigatePromise = null;
                                            that._inBeforeNavigatePromise = false;
                                        }
                                    });
                                });
                            }
                        }
                        var keys = null;
                        if (this._fragments) {
                            if (Object.keys) {
                                keys = Object.keys(this._fragments);
                            } else {
                                keys = [];
                                var k;
                                for (k in this._fragments) {
                                    if (Object.prototype.hasOwnProperty.call(this._fragments, k)) {
                                        keys.push(k);
                                    }
                                }
                            }
                        }
                        if (keys && keys.length > 0) {
                            this._beforeNavigatePromise = new WinJS.Promise.as().then(function () {
                                var fragmentId;
                                var doneFragments = 0;
                                for (var j=0; j < keys.length; j++) {
                                    fragmentId = keys[j];
                                    Log.print(Log.l.trace, "calling _beforeload(" + fragmentId + ")");
                                    var detail = {
                                        element: that._fragments[fragmentId]._element,
                                        setPromise: function(promise) {
                                            return promise.then(function (response) {
                                                doneFragments++;
                                                Log.print(Log.l.trace, "_beforeload success! doneFragments=" + doneFragments + "(countFragments=" + keys.length + ")");
                                                if (doneFragments === keys.length) {
                                                    checkCanUnload();
                                                }
                                            }, function(errorResponse) {
                                                Log.print(Log.l.trace, "_beforeload error!");
                                                WinJS.Promise.timeout(0).then(function () {
                                                    if (that._inBeforeNavigatePromise &&
                                                        that._beforeNavigatePromise &&
                                                        typeof that._beforeNavigatePromise.cancel === "function") {
                                                        // called asynchronously if not allowed
                                                        Log.print(Log.l.trace, "from PageControlNavigator (false): _beforenavigate calling cancel()");
                                                        that._beforeNavigatePromise.cancel();
                                                        //that._beforeNavigatePromise = null;
                                                        that._inBeforeNavigatePromise = false;
                                                        if (typeof that._syncNavigationBar === "function") {
                                                            that._syncNavigationBar();
                                                        }
                                                    }
                                                });
                                            });
                                        }
                                    }
                                    that._beforeload({ detail: detail });
                                }
                                return WinJS.Promise.as();
                            }).then(function () {
                                // handle waitfor asynchronously called return values
                                return WinJS.Promise.timeout(120000).then(function () {
                                    Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate canUnload timeout!");
                                    if (that._inBeforeNavigatePromise &&
                                        that._beforeNavigatePromise &&
                                        typeof that._beforeNavigatePromise.cancel === "function") {
                                        Log.print(Log.l.trace, "from PageControlNavigator (timeout): _beforenavigate calling cancel()");
                                        that._beforeNavigatePromise.cancel();
                                        //that._beforeNavigatePromise = null;
                                        that._inBeforeNavigatePromise = false;
                                        if (typeof that._syncNavigationBar === "function") {
                                            that._syncNavigationBar();
                                        }
                                    }
                                });
                            });
                        } else {
                            this._beforeNavigatePromise = checkCanUnload();
                        }
                    }
                    Log.print(Log.l.trace, "calling setPromise");
                    args.detail.setPromise(this._beforeNavigatePromise);
                    Log.ret(Log.l.trace, "");
                },

                // Responds to navigation by adding new pages to the DOM.
                _navigating: function (args) {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    var prevMasterElement = this.masterElement;
                    var prevMasterAnimationElements = null;
                    var lastMaster = this._lastMaster;

                    var newMasterElement = null;
                    this._nextMaster = null;

                    this._nextPageElement = null;
                    this._nextPage = args.detail.location;

                    //var prevPageElement = this.pageElement;
                    //var prevAnimationElements = this._getAnimationElements();
                    //var lastPage = this._lastPage;

                    var prevFragments = this._fragments;

                    var animationDistanceX;
                    var animationDistanceY;
                    var animationOptions;

                    var that = this;

                    function cleanupOldElement(oldElement) {
                        Log.call(Log.l.trace, "Application.PageControlNavigator.");
                        // Cleanup and remove previous element
                        if (oldElement) {
                            if (oldElement.winControl) {
                                if (oldElement.winControl.unload) {
                                    oldElement.winControl.unload();
                                }
                                oldElement.winControl.dispose();
                            }
                            oldElement.parentNode.removeChild(oldElement);
                            oldElement.innerHTML = "";
                        }
                        Log.ret(Log.l.trace);
                    }
                    var cleanup = function () {
                        Log.call(Log.l.trace, "Application.PageControlNavigator.");
                        while (that._element.childElementCount > 1) {
                            if (prevFragments) {
                                var propertyName;
                                for (propertyName in prevFragments) {
                                    if (prevFragments.hasOwnProperty(propertyName)) {
                                        Log.print(Log.l.trace, "cleanup fragments[" + propertyName + "]");
                                        if (prevFragments[propertyName]._element) {
                                            cleanupOldElement(prevFragments[propertyName]._element.firstElementChild);
                                            delete prevFragments[propertyName];
                                        }
                                    }
                                }
                            }
                            cleanupOldElement(that._element.firstElementChild);
                        }
                        Log.ret(Log.l.trace);
                    }
                    this.cleanupPrevPage = cleanup;

                    if (this._lastNavigationPromise) {
                        this._lastNavigationPromise.cancel();
                    }
                    var i;
                    this._lastNavigationPromise = WinJS.Promise.as().then(function() {
                        var master = null;
                        Log.print(Log.l.trace, "PageControlNavigator: looking for master view");
                        if (Application.navigationMasterDetail) {
                            for (i = 0; i < Application.navigationMasterDetail.length; i++) {
                                var pagePath = Application.getPagePath(Application.navigationMasterDetail[i].id);
                                if (args.detail.location === pagePath &&
                                    Application.navigationMasterDetail[i].master) {
                                    master = Application.navigationMasterDetail[i].master;
                                    Log.print(Log.l.trace, "PageControlNavigator: found master=" + master);
                                    break;
                                }
                            }
                        }
                        if (master) {
                            that._nextMaster = Application.getPagePath(master);
                            if (that._nextMaster === lastMaster) {
                                Log.print(Log.l.trace, "PageControlNavigator: extra ignored lastMaster=" + lastMaster);
                            } else {
                                prevMasterAnimationElements = that._getAnimationElements(0, prevMasterElement);
                                newMasterElement = that._createMasterElement();
                                that._master.appendChild(newMasterElement);
                            }
                        } else {
                            that._nextMaster = null;
                            if (lastMaster) {
                                newMasterElement = that._createMasterElement();
                                that._master.appendChild(newMasterElement);
                            }
                        }
                        if (that._nextMaster && (!lastMaster || that._nextMaster !== lastMaster)) {
                            Log.print(Log.l.trace, "PageControlNavigator: calling _navigating render master");
                            return WinJS.UI.Pages.render(that._nextMaster, newMasterElement, args.detail.state);
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function() {
                        var promise = that.resizeMasterElement(newMasterElement);
                        if (!promise) {
                            promise = WinJS.Promise.as();
                        }
                        return promise;
                    }).then(function() {
                        if (prevMasterAnimationElements && prevMasterAnimationElements.length > 0) {
                            Log.print(Log.l.trace, "PageControlNavigator: exit previous master page");
                            animationDistanceX = -NavigationBar._animationDistanceX;
                            animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                            return WinJS.UI.Animation.exitContent(
                                prevMasterAnimationElements,
                                animationOptions);
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function() {
                        while (that._master.childElementCount > 1) {
                            cleanupOldElement(that.masterElement);
                        }
                        that._navBarPos = that._syncNavigationBar(args.detail.location);
                        that._nextPageElement = that._createPageElement();
                        that._element.appendChild(that._nextPageElement);
                        that._fragments = {};
                        // disable notify before render!
                        AppBar.notifyModified = false;
                        Log.print(Log.l.trace, "PageControlNavigator: calling _navigating render page");
                        return WinJS.UI.Pages.render(args.detail.location, that._nextPageElement, args.detail.state);
                    }).then(function() {
                        var promise = that.resizePageElement(that._nextPageElement);
                        if (!promise) {
                            promise = WinJS.Promise.as();
                        }
                        return promise;
                    /*}).then(function () {
                        if (prevAnimationElements && prevAnimationElements.length > 0) {
                            var nextPage;
                            var iPrev = -1;
                            var iCur = -1;
                            var isGroup = false;
                            Log.print(Log.l.trace, "PageControlNavigator: calling exit previous page");
                            if (NavigationBar.data && NavigationBar.ListView) {
                                var group = 0;
                                for (i = 0; i < NavigationBar.pages.length; i++) {
                                    nextPage = Application.getPagePath(NavigationBar.pages[i].id);
                                    if (args.detail.location === nextPage) {
                                        group = NavigationBar.pages[i].group;
                                        break;
                                    }
                                }
                                if (group <= 0) {
                                    group = 1;
                                }
                                if (group !== NavigationBar.curGroup) {
                                    iCur = group;
                                    iPrev = NavigationBar.curGroup;
                                    isGroup = true;
                                } else {
                                    for (i = 0; i < NavigationBar.data.length; i++) {
                                        var item = NavigationBar.data.getAt(i);
                                        if (item) {
                                            nextPage = Application.getPagePath(item.id);
                                            if (args.detail.location === nextPage) {
                                                iCur = i;
                                            }
                                            if (lastPage === nextPage) {
                                                iPrev = i;
                                            }
                                        }
                                    }
                                }
                            }
                            if (NavigationBar.orientation !== "horizontal" ||
                                iPrev < 0 ||
                                iCur < 0 ||
                                iPrev === iCur ||
                                lastPage === Application.startPage) {
                                Log.print(Log.l.trace, "from PageControlNavigator: calling exitPage animation");
                                return WinJS.UI.Animation.exitPage(
                                    prevAnimationElements);
                            } else if (isGroup) {
                                if (iPrev < iCur) {
                                    return WinJS.UI.Animation.continuumBackwardOut(
                                        prevPageElement,
                                        prevAnimationElements
                                    );
                                } else {
                                    return WinJS.UI.Animation.continuumForwardOut(
                                        prevPageElement,
                                        prevAnimationElements
                                    );
                                }
                            } else {
                                if (iPrev < iCur) {
                                    animationDistanceX = -NavigationBar._animationDistanceX;
                                    animationDistanceY = -NavigationBar._animationDistanceY;
                                } else {
                                    animationDistanceX = NavigationBar._animationDistanceX;
                                    animationDistanceY = NavigationBar._animationDistanceY;
                                }
                                if (NavigationBar.orientation !== "horizontal") {
                                    animationOptions = { top: animationDistanceY.toString() + "px", left: "0px" };
                                } else {
                                    animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                }
                                Log.print(Log.l.trace, "from PageControlNavigator: calling exitContent animation");
                                return WinJS.UI.Animation.exitContent(
                                    prevAnimationElements,
                                    animationOptions);
                            }
                        } else {

                            Log.print(Log.l.trace, "from PageControlNavigator: calling no exit animation");
                            return WinJS.Promise.as();
                        }
                         */
                    }).then(function() {
                        // do nothing in case of success
                    }, cleanup);

                    args.detail.setPromise(this._lastNavigationPromise);
                    Log.ret(Log.l.trace, "");
                },

                // Responds to resize events and call the updateLayout function
                // on the currently loaded page.
                /**
                 * @function _resized
                 * @memberof Application.PageControlNavigator
                 * @protected
                 * @description The framework uses this function to respond to resize events and recalculate and update the positioning of all application UI elements.
                 *  This function is bound to the {@link https://msdn.microsoft.com/en-us/library/windows/apps/hh466035.aspx window.onresize} event handler by default.
                 */
                _resized: function (args) {
                    Log.call(Log.l.u1, "PageControlNavigator.");
                    var width = document.body.clientWidth;
                    var height = document.body.clientHeight;

                    // App background
                    var appBkg = document.querySelector(".app-bkg");
                    if (appBkg) {
                        appBkg.style.width = width.toString() + "px";
                        appBkg.style.height = height.toString() + "px";
                    }

                    // AppHeader element
                    var headerhost = document.querySelector("#headerhost");
                    if (headerhost) {
                        var pageControl = headerhost.winControl;
                        var pageElement = headerhost.firstElementChild || headerhost.firstChild;
                        if (pageElement && pageControl && pageControl.updateLayout) {
                            pageControl.updateLayout.call(pageControl, pageElement);
                        }
                        height -= headerhost.clientHeight;
                    }
                    // in case of no page loaded, set orientation here
                    NavigationBar.updateOrientation();

                    // current size of page
                    if (Application.navigator) {
                        // Resize splitView
                        var splitViewRoot = Application.navigator.splitViewRoot;
                        var splitViewContent = Application.navigator.splitViewContent;
                        if (splitViewRoot && splitViewContent) {
                            if (splitViewRoot.style) {
                                splitViewRoot.style.height = height.toString() + "px";
                            }
                            if (AppBar.barElement && AppBar.barElement.clientHeight > 0) {
                                height -= AppBar.barElement.clientHeight;
                            }
                            if (splitViewContent.style) {
                                splitViewContent.style.height = height.toString() + "px";
                            }
                        }

                        // Resize Navigation bar
                        if (NavigationBar.ListView) {
                            NavigationBar.ListView.updateLayout();
                        }
                        // Resize master element
                        if (Application.navigator.masterElement) {
                            Application.navigator.resizeMasterElement(Application.navigator.masterElement);
                        }
                        // Resize page element
                        if (Application.navigator.pageElement) {
                            Application.navigator.resizePageElement(Application.navigator.pageElement);
                        }
                    }
                    Log.ret(Log.l.u1);
                },

                _hideMaster: function() {
                    Log.call(Log.l.u1, "PageControlNavigator.");
                    if (!this._masterHidden) {
                        this._prevAppBarHidden = null;
                        this._masterHidden = true;
                        if (NavigationBar.ListView) {
                            NavigationBar.ListView.updateLayout();
                        }
                        if (this.pageElement) {
                            this.pageElement.style.visibility = "hidden";
                            this.resizePageElement(this.pageElement);
                            var animationDistanceX = this.masterElement ? this.masterElement.clientWidth: 450;
                            var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                            this.pageElement.style.visibility = "";
                            var that = this;
                            WinJS.UI.Animation.enterContent(this.pageElement, animationOptions).then(function () {
                                if (that.masterElement) {
                                    that.masterElement.style.visibility = "hidden";
                                    that.resizeMasterElement(that.masterElement);
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.u1);
                },

                _showMaster: function () {
                    Log.call(Log.l.u1, "PageControlNavigator.");
                    if (this._masterHidden) {
                        this._prevAppBarHidden = null;
                        this._masterHidden = false;
                        if (NavigationBar.ListView) {
                            NavigationBar.ListView.updateLayout();
                        }
                        if (this.masterElement) {
                            this.masterElement.style.visibility = "";
                        }
                        if (this.pageElement) {
                            var animationDistanceX = this.masterElement ? this.masterElement.clientWidth : 450;
                            var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                            var that = this;
                            WinJS.UI.Animation.exitContent(this.pageElement, animationOptions).then(function () {
                                if (that.masterElement) {
                                    that.resizeMasterElement(that.masterElement);
                                }
                                that.resizePageElement(that.pageElement);
                            });
                        }
                    }
                    Log.ret(Log.l.u1);
                }
            }
        )
    });


    /**
     * Use the methods and properties in this namespace to access the page navigation bar objects.
     * @namespace NavigationBar
     */

    // define a class for the navigation list
    // with ListView member for the listview control
    WinJS.Namespace.define("NavigationBar", {
        /**
         * @class ListViewClass 
         * @memberof NavigationBar
         * @param {Object[]} navigationBarPages - Initialization second level page navigation menu items
         * @param {Object[]} navigationBarGroups - Initialization top level page navigation menu items
         * @param {Object} options - Initialization options
         * @param {Object} options.splitViewDisplayMode - Display mode of top level menu {@link https://msdn.microsoft.com/en-us/library/windows/apps/dn919970.aspx WinJS.UI.SplitView} object.
         * @param {string} options.splitViewDisplayMode.opened - Display mode of opened SplitView menu. 
         *  See {@link https://msdn.microsoft.com/de-de/library/dn919982.aspx WinJS.UI.SplitView.OpenedDisplayMode enumeration}. 
         * @param {string} options.splitViewDisplayMode.closed - Display mode of closed SplitView menu. 
         *  See {@link https://msdn.microsoft.com/en-us/library/windows/apps/mt661893.aspx WinJS.UI.SplitView.ClosedDisplayMode enumeration}. 
         * @description This class is used by the application frame to control the {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211837.aspx WinJS.UI.ListView} objects of second level page navigation menu.
         */
        ListViewClass: WinJS.Class.define(
            // Define the constructor function for the ListViewClass.
            function ListViewClass(navigationBarPages, navigationBarGroups, options) {
                Log.call(Log.l.trace, "NavigationBar.ListViewClass.");
                // save groups array
                if (navigationBarGroups && !NavigationBar.groups) {
                    if (options && options.splitViewDisplayMode) {
                        NavigationBar._splitViewDisplayMode = options.splitViewDisplayMode;
                    } else {
                        NavigationBar._splitViewDisplayMode = null;
                    }
                    var splitViewRoot = Application.navigator && Application.navigator.splitViewRoot;
                    if (splitViewRoot) {
                        splitViewRoot.addEventListener("beforeopen", NavigationBar.handleSplitViewBeforeOpen);
                        splitViewRoot.addEventListener("afteropen", NavigationBar.handleSplitViewAfterOpen);
                        splitViewRoot.addEventListener("afterclose", NavigationBar.handleSplitViewAfterClose);
                    }
                    NavigationBar.groups = navigationBarGroups;
                }

                // save pages array
                if (navigationBarPages && !NavigationBar.pages) {
                    NavigationBar.pages = navigationBarPages;
                }
                // allowed listOrientation values are "horizontal" or "vertical"
                var listOrientation;
                if (!NavigationBar._listViewVert) {
                    if (!NavigationBar._listViewHorz) {
                        listOrientation = "horizontal";
                    } else {
                        listOrientation = "vertical";
                        var navigationbarContainerVertical = document.querySelector(".navigationbar-container-vertical");
                        if (navigationbarContainerVertical && navigationbarContainerVertical.style) {
                            navigationbarContainerVertical.style.width = NavigationBar._vertWidth.toString() + "px";
                        }
                    }
                } else {
                    // finished
                    Log.ret(Log.l.trace, "finished");
                    return;
                }
                Log.print(Log.l.trace, "listOrientation=" + listOrientation);
                this._element = document.querySelector("#navigationbar_" + listOrientation);
                if (this._element) {
                    // set absolute positioning and hide element
                    this._visibility = "hidden";
                    if (this._element.parentNode &&
                        this._element.parentNode.style) {
                        this._element.parentNode.style.visibility = "hidden";
                        this._element.parentNode.style.zIndex = -this._zIndex;
                    }
                    // save the current orientation
                    this._listOrientation = listOrientation;

                    // bind the event handlers
                    this._element.addEventListener("selectionchanged", this.onSelectionChanged.bind(this));
                    this._element.addEventListener("loadingstatechanged", this.onLoadingStateChanged.bind(this));

                    // set initial size and layout type of ListView
                    if (listOrientation === "vertical") {
                        NavigationBar._listViewVert = this;
                        this._zIndex = 10001;
                    } else {
                        NavigationBar._listViewHorz = this;
                        this._zIndex = 10000;
                        if (!NavigationBar._listViewVert) {
                            // instanciate the other direction, too
                            var navigationBar = new NavigationBar.ListViewClass();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }, {
                // DOM element property, returns the DOM element
                /**
                 * @property {Object} listElement - The HTML element of the navigation bar ListView
                 * @memberof NavigationBar.ListViewClass
                 * @description Read-only. Retrieves the HTML element of the navigation bar ListView. 
                 */
                listElement: {
                    get: function() { return this._element; }
                },
                // winControl property, returns the WinJS control
                /**
                 * @property {Object} listControl - The ListView object of the navigation bar ListView
                 * @memberof NavigationBar.ListViewClass
                 * @description Read-only. Retrieves the {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211837.aspx WinJS.UI.ListView} object of the navigation bar list view. 
                 */
                listControl: {
                    get: function() { return this._element && this._element.winControl; }
                },
                // orientation of list property, returns the orientation value
                /**
                 * @property {string} listOrientation - Possible values: "horizontal" or "vertical"
                 * @memberof NavigationBar.ListViewClass
                 * @description Read-only. Retrieves the orientation of the navigation bar ListView. 
                 */
                listOrientation: {
                    get: function() { return this._listOrientation; }
                },
                // calculating positioning of ListView viewport elements
                /**
                 * @function updateLayout
                 * @param {boolean} doAnimation - Uses animation for show/hide of ListView control
                 * @memberof NavigationBar.ListViewClass
                 * @description Call this function to calculation the dimensions and update the layout of the ListView and SplitView controls
                 */
                updateLayout: function (doAnimation) {
                    Log.call(Log.l.u1, "NavigationBar.ListViewClass.");
                    var titlearea = null;
                    var titleHeight = 0;

                    if (Application.navigator) {
                        var splitViewRoot = Application.navigator.splitViewRoot;
                        if (splitViewRoot) {
                            var splitViewContent = Application.navigator.splitViewContent;
                            var width = splitViewContent.clientWidth;
                            var height = splitViewContent.clientHeight;
                            Log.print(Log.l.u1, "splitViewContent: width=" + width + " height=" + height);

                            var splitViewPane = splitViewRoot.querySelector(".win-splitview-pane");
                            if (splitViewPane && splitViewPane.style) {
                                splitViewPane.style.height = splitViewRoot.clientHeight.toString() + "px";
                            }
                            var splitViewControl = splitViewRoot.winControl;
                            if (splitViewControl) {
                                var openedDisplayMode;
                                var closedDisplayMode;
                                if (NavigationBar._splitViewDisplayMode &&
                                    NavigationBar._splitViewDisplayMode.opened &&
                                    NavigationBar._splitViewDisplayMode.closed) {
                                    openedDisplayMode = NavigationBar._splitViewDisplayMode.opened;
                                    closedDisplayMode = NavigationBar._splitViewDisplayMode.closed;
                                    if (!NavigationBar._splitViewClassSet ||
                                        openedDisplayMode !== splitViewControl.openedDisplayMode ||
                                        closedDisplayMode !== splitViewControl.closedDisplayMode) {
                                        if (openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.overlay && window.innerWidth <= 499) {
                                            WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-full");
                                            WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-tablet");
                                            WinJS.Utilities.addClass(splitViewRoot, "rootsplitview-mobile");
                                        } else if (openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.overlay) {
                                            WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-full");
                                            WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-mobile");
                                            WinJS.Utilities.addClass(splitViewRoot, "rootsplitview-tablet");
                                        } else {
                                            WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-mobile");
                                            WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-tablet");
                                            WinJS.Utilities.addClass(splitViewRoot, "rootsplitview-full");
                                        }
                                        NavigationBar._splitViewClassSet = true;
                                    }
                                } else if (window.innerWidth <= 499) {
                                    openedDisplayMode = WinJS.UI.SplitView.OpenedDisplayMode.overlay;
                                    closedDisplayMode = WinJS.UI.SplitView.ClosedDisplayMode.none;
                                    if (!NavigationBar._splitViewClassSet ||
                                        openedDisplayMode !== splitViewControl.openedDisplayMode ||
                                        closedDisplayMode !== splitViewControl.closedDisplayMode) {
                                        WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-full");
                                        WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-tablet");
                                        WinJS.Utilities.addClass(splitViewRoot, "rootsplitview-mobile");
                                        NavigationBar._splitViewClassSet = true;
                                    }
                                } else if (window.innerWidth <= 1149) {
                                    openedDisplayMode = WinJS.UI.SplitView.OpenedDisplayMode.overlay;
                                    closedDisplayMode = WinJS.UI.SplitView.ClosedDisplayMode.inline;
                                    if (!NavigationBar._splitViewClassSet ||
                                        openedDisplayMode !== splitViewControl.openedDisplayMode ||
                                        closedDisplayMode !== splitViewControl.closedDisplayMode) {
                                        WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-full");
                                        WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-mobile");
                                        WinJS.Utilities.addClass(splitViewRoot, "rootsplitview-tablet");
                                        NavigationBar._splitViewClassSet = true;
                                    }
                                } else {
                                    openedDisplayMode = WinJS.UI.SplitView.OpenedDisplayMode.inline;
                                    closedDisplayMode = WinJS.UI.SplitView.ClosedDisplayMode.inline;
                                    if (!NavigationBar._splitViewClassSet ||
                                        openedDisplayMode !== splitViewControl.openedDisplayMode ||
                                        closedDisplayMode !== splitViewControl.closedDisplayMode) {
                                        WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-mobile");
                                        WinJS.Utilities.removeClass(splitViewRoot, "rootsplitview-tablet");
                                        WinJS.Utilities.addClass(splitViewRoot, "rootsplitview-full");
                                        NavigationBar._splitViewClassSet = true;
                                    }
                                }
                                if (closedDisplayMode !== splitViewControl.closedDisplayMode) {
                                    splitViewControl.closedDisplayMode = closedDisplayMode;
                                }
                                if (openedDisplayMode !== splitViewControl.openedDisplayMode) {
                                    splitViewControl.openedDisplayMode = openedDisplayMode;
                                }
                            }
                            var element = NavigationBar.ListView && NavigationBar.ListView.listElement;
                            var listControl = NavigationBar.ListView && NavigationBar.ListView.listControl;
                            if (element && listControl) {
                                // current window dimension
                                if (this._listOrientation === "vertical") {
                                    // set list height to window height
                                    if (element.style) {
                                        var strHeight = height.toString() + "px";
                                        if (element.parentNode && element.parentNode.style) {
                                            element.parentNode.style.height = strHeight;
                                        }
                                        strHeight = height.toString() + "px";
                                        element.style.height = strHeight;
                                    }
                                } else {
                                    /*
                                    // SplitView element
                                    if (splitViewControl &&
                                        (splitViewControl.paneOpened &&
                                         splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.inline ||
                                         !splitViewControl.paneOpened &&
                                         splitViewControl.closedDisplayMode === WinJS.UI.SplitView.ClosedDisplayMode.inline)) {
                                        var splitViewPane = Application.navigator.splitViewPane;
                                        if (splitViewPane && splitViewPane.clientWidth > 0) {
                                            width -= splitViewPane.clientWidth;
                                        }
                                    }
                                     */
                                    var left = 0;
                                    if (Application.navigator._nextMaster && !Application.navigator._masterHidden) {
                                        left += Application.navigator.masterElement.clientWidth;
                                        width -= Application.navigator.masterElement.clientWidth;
                                    }

                                    // set list width to window width, disable horizontal scrolling
                                    var strLeft = left ? left.toString() + "px" : "0";
                                    var strWidth = width.toString() + "px";
                                    if (element.parentNode && element.parentNode.style) {
                                        element.parentNode.style.left = strLeft;
                                        element.parentNode.style.top = "0";
                                        element.parentNode.style.width = strWidth;
                                    }
                                    if (listControl.loadingState === "complete") {
                                        // calculate width for each cell
                                        var containers = element.querySelectorAll(".win-container");
                                        if (containers && containers.length === NavigationBar.data.length) {
                                            var fontWidth = width > 499 ? 10 : 7;
                                            var totalLen = 0;
                                            var maxLen = 0;
                                            var i;
                                            var item;
                                            for (i = 0; i < NavigationBar.data.length; i++) {
                                                item = NavigationBar.data.getAt(i);
                                                if (item) {
                                                    totalLen = totalLen + item.width;
                                                    if (item.width > maxLen) {
                                                        maxLen = item.width;
                                                    }
                                                }
                                            }
                                            if (width < maxLen * NavigationBar.data.length * fontWidth) {
                                                width = maxLen * NavigationBar.data.length * fontWidth;
                                                strWidth = width.toString() + "px";
                                            }
                                            var surface = element.querySelector(".win-surface");
                                            if (surface && surface.style) {
                                                surface.style.width = strWidth;
                                            }
                                            // ListView container elements used in filled ListView
                                            var intemscontainer = element.querySelector(".win-itemscontainer");
                                            if (intemscontainer && intemscontainer.style) {
                                                intemscontainer.style.width = strWidth;
                                            }
                                            for (i = 0; i < NavigationBar.data.length; i++) {
                                                item = NavigationBar.data.getAt(i);
                                                if (item) {
                                                    var widthNavigationbarItem;
                                                    if (totalLen > 0) {
                                                        widthNavigationbarItem = (width * item.width) / totalLen;
                                                    } else {
                                                        widthNavigationbarItem = width / item.length;
                                                    }
                                                    var container = containers[i];
                                                    var strContainerWidth = widthNavigationbarItem.toString() + "px";
                                                    if (container.style) {
                                                        container.style.width = strContainerWidth;
                                                    }
                                                }
                                            }
                                            if (doAnimation) {
                                                if (NavigationBar._orientation !== "vertical") {
                                                    var textElements = element.querySelectorAll(".navigationbar-text");
                                                    if (textElements && textElements.length > 0) {
                                                        var horzHeight = -NavigationBar._horzHeight / 8;
                                                        var offsetIn = { top: horzHeight.toString() + "px", left: "0px" };
                                                        WinJS.UI.Animation.enterContent(textElements, offsetIn);
                                                    }
                                                }
                                            }
                                            if (listControl && listControl.selection && NavigationBar.data) {
                                                var selectionCount = listControl.selection.count();
                                                if (selectionCount === 1) {
                                                    // Only one item is selected, show the page
                                                    listControl.selection.getItems().done(function (items) {
                                                        NavigationBar.ListView.scrollIntoView(items[0].index);
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.u1);
                },
                // event handler for loadingstatechanged event
                onLoadingStateChanged: function(eventInfo) {
                    Log.call(Log.l.trace, "NavigationBar.ListViewClass.");
                    var listControl = this.listControl;
                    if (listControl) {
                        Log.print(Log.l.trace, "listOrientation=" + this.listOrientation + " loadingState=" + listControl.loadingState);
                        if (listControl.loadingState === "complete") {
                            if (NavigationBar.ListView && listControl === NavigationBar.ListView.listControl) {
                                var iCur = -1;
                                // sync current selection
                                for (var i = 0; i < NavigationBar.data.length; i++) {
                                    var item = NavigationBar.data.getAt(i);
                                    if (item) {
                                        var nextPage = Application.getPagePath(item.id);
                                        if (nav.location === nextPage) {
                                            iCur = i;
                                            break;
                                        }
                                    }
                                }
                                NavigationBar.ListView.setSelIndex(iCur);
                                NavigationBar.updateOrientation();
                                NavigationBar.ListView.updateLayout(NavigationBar._playAnimation);
                                NavigationBar._playAnimation = false;
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                scrollIntoView: function (curIndex) {
                    Log.call(Log.l.trace, "NavigationBar.ListViewClass.");
                    WinJS.Promise.timeout(0).then(function() {
                        if (NavigationBar._orientation === "horizontal") {
                            var element = NavigationBar.ListView && NavigationBar.ListView.listElement;
                            var control = NavigationBar.ListView && NavigationBar.ListView.listControl;
                            if (element && control) {
                                var containers = element.querySelectorAll(".win-container");
                                if (containers && containers.length === NavigationBar.data.length && containers[0]) {
                                    var surface = element.querySelector(".win-surface");
                                    if (surface) {
                                        var overflow = surface.clientWidth - element.clientWidth;
                                        if (overflow > 0) {
                                            var containerWidth = containers[0].clientWidth;
                                            var scrollPosition = curIndex * containerWidth - containerWidth / 2;
                                            if (scrollPosition < 0) {
                                                scrollPosition = 0;
                                            } else if (scrollPosition > overflow) {
                                                scrollPosition = overflow;
                                            }
                                            if (control.scrollPosition !== scrollPosition) {
                                                var prevScrollPosition = control.scrollPosition;
                                                var animationDistanceX = scrollPosition - prevScrollPosition;
                                                var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                                control.scrollPosition = scrollPosition;
                                                WinJS.UI.Animation.enterContent(surface, animationOptions);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                    Log.ret(Log.l.trace);
                },
                // event handler for selectionchanged event
                onSelectionChanged: function(eventInfo) {
                    Log.call(Log.l.trace, "NavigationBar.ListViewClass.");
                    // Handle Page Selection
                    var listControl = this.listControl;
                    WinJS.Promise.timeout(0).then(function() {
                        Log.print(Log.l.trace, "from ListViewClass: onSelectionChanged invoked");
                        if (listControl && listControl.selection && NavigationBar.data) {
                            var selectionCount = listControl.selection.count();
                            if (selectionCount === 1) {
                                // Only one item is selected, show the page
                                listControl.selection.getItems().done(function(items) {
                                    var curIndex = items[0].index;
                                    // sync other list
                                    if (NavigationBar._listViewVert &&
                                        NavigationBar._listViewVert.listControl !== listControl) {
                                        if (NavigationBar.orientation === "horizontal") {
                                            NavigationBar._listViewVert.setSelIndex(curIndex);
                                            NavigationBar.ListView.scrollIntoView(curIndex);
                                        } else {
                                            // ignore selectionchanged if not active list
                                            return;
                                        }
                                    } else if (NavigationBar._listViewHorz &&
                                        NavigationBar._listViewHorz.listControl !== listControl) {
                                        if (NavigationBar.orientation === "vertical") {
                                            Log.print(Log.l.trace, "calling setSelIndex(" + curIndex + ")");
                                            NavigationBar._listViewHorz.setSelIndex(curIndex);
                                        } else {
                                            // ignore selectionchanged if not active list
                                            return;
                                        }
                                    } else {
                                        // unusual state
                                        return;
                                    }
                                    var item = NavigationBar.data.getAt(curIndex);
                                    if (item) {
                                        var id = item.id;
                                        if (typeof Application._navigateByIdOverride === "function") {
                                            id = Application._navigateByIdOverride(id, eventInfo);
                                        }
                                        var nextPage = Application.getPagePath(id);
                                        if (nav.location !== nextPage) {
                                            Log.print(Log.l.trace, "NavigationBar.ListViewClass: calling navigate(" + nextPage + ")");
                                            nav.navigate(nextPage, eventInfo);
                                        } else {
                                            Log.print(Log.l.trace, "extra ignored!");
                                        }
                                    }
                                });
                            }
                        }
                    });
                    Log.ret(Log.l.trace);
                },
                // function for single selection via item index
                setSelIndex: function(index) {
                    Log.call(Log.l.trace, "NavigationBar.ListViewClass.", "index=" + index);
                    var listControl = this.listControl;
                    if (listControl && listControl.selection) {
                        var selectionCount = listControl.selection.count();
                        if (selectionCount === 1) {
                            // Only one item is selected, check for same selection
                            listControl.selection.getItems().done(function(items) {
                                if (items[0].index === index) {
                                    // already selected!
                                    return;
                                } else if (listControl && listControl.selection) {
                                    listControl.selection.clear();
                                    if (listControl.itemDataSource && index >= 0) {
                                        listControl.itemDataSource.itemFromIndex(index).done(function(curItem) {
                                            Log.print(Log.l.trace, "calling add selection");
                                            listControl.selection.add(curItem);
                                        });
                                    }
                                }
                            });
                        } else {
                            if (selectionCount > 0) {
                                listControl.selection.clear();
                            }
                            if (listControl.itemDataSource && index >= 0) {
                                listControl.itemDataSource.itemFromIndex(index).done(function(curItem) {
                                    listControl.selection.add(curItem);
                                });
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                // anchor for element istself
                _element: null,
                // orientation of list element
                _listOrientation: null,
                _visibility: null
            }
        ),
        /**
         * @property {string} orientation - Possible values: "horizontal" or "vertical"
         * @memberof NavigationBar
         * @description Read/Write. Retrieves and stes the orientation of the navigation bar ListView. 
         */
        orientation: {
            get: function() {
                return NavigationBar._orientation;
            },
            set: function (newOrientation) {
                Log.call(Log.l.u1, "NavigationBar.orientation.", "newOrientation=" + newOrientation);
                if (!NavigationBar._orientation ||
                    NavigationBar._orientation !== newOrientation ||
                    NavigationBar._listViewHorz &&
                    NavigationBar._listViewHorz._visibility === "hidden" &&
                    NavigationBar._listViewVert &&
                    NavigationBar._listViewVert._visibility === "hidden" ||
                    !NavigationBar.data ||
                    !NavigationBar.data.length) {
                    var thatOut = null;
                    var offsetOut = null;
                    var thatIn = null;
                    var offsetIn = null;
                    var horzHeight, vertWidth;
                    var inElement, outElement;
                    if (NavigationBar._inOrientationChange > 0) {
                        WinJS.Promise.timeout(50).then(function () {
                            // now do complete resize later!
                            Application.navigator._resized();
                        });
                        Log.ret(Log.l.u1, "semaphore set");
                        return;
                    }
                    NavigationBar._orientation = newOrientation;
                    NavigationBar._inOrientationChange++;
                    if (NavigationBar.data &&
                        NavigationBar.data.length > 0) {
                        if (newOrientation === "vertical") {
                            if (NavigationBar._listViewHorz &&
                                NavigationBar._listViewHorz.listElement) {
                                horzHeight = -NavigationBar._horzHeight / 2;
                                offsetOut = { top: horzHeight.toString() + "px", left: "0px" };
                                thatOut = NavigationBar._listViewHorz;
                            }
                            if (NavigationBar._listViewVert &&
                                NavigationBar._listViewVert.listElement) {
                                vertWidth = -NavigationBar._vertWidth;
                                offsetIn = { top: "0px", left: vertWidth.toString() + "px" };
                                thatIn = NavigationBar._listViewVert;
                            }
                        } else {
                            if (NavigationBar._listViewVert &&
                                NavigationBar._listViewVert.listElement) {
                                vertWidth = -NavigationBar._vertWidth;
                                offsetOut = { top: "0px", left: vertWidth.toString() + "px" };
                                thatOut = NavigationBar._listViewVert;
                            }
                            if (NavigationBar._listViewHorz &&
                                NavigationBar._listViewHorz.listElement) {
                                horzHeight = -NavigationBar._horzHeight / 2;
                                offsetIn = { top: horzHeight.toString() + "px", left: "0px" };
                                thatIn = NavigationBar._listViewHorz;
                            }
                        }
                        if (thatOut && offsetOut) {
                            NavigationBar._inOrientationChange++;
                            Log.print(Log.l.trace, "calling hidePanel animation");
                            thatOut._visibility = "hidden";
                            outElement = thatOut.listElement ? thatOut.listElement.parentNode : null;
                            if (outElement && outElement.style) {
                                WinJS.UI.Animation.exitContent(outElement, offsetOut).done(function() {
                                    outElement.style.visibility = "hidden";
                                    outElement.style.zIndex = -thatOut._zIndex;
                                    NavigationBar._inOrientationChange--;
                                    NavigationBar.updateOrientation();
                                    if (NavigationBar.ListView) {
                                        NavigationBar.ListView.updateLayout();
                                    }
                                });
                            }
                        }
                        if (thatIn && offsetIn) {
                            NavigationBar._inOrientationChange++;
                            Log.print(Log.l.trace, "calling showPanel animation");
                            thatIn._visibility = "visible";
                            inElement = thatIn.listElement ? thatIn.listElement.parentNode : null;
                            if (inElement && inElement.style) {
                                inElement.style.visibility = "";
                                inElement.style.zIndex = thatIn._zIndex;
                                WinJS.UI.Animation.enterContent(inElement, offsetIn).done(function () {
                                    NavigationBar._inOrientationChange--;
                                });
                            } 
                        }
                    } else {
                        if (NavigationBar._listViewHorz &&
                            NavigationBar._listViewHorz._visibility !== "hidden" &&
                            NavigationBar._listViewHorz.listElement) {
                            horzHeight = -NavigationBar._horzHeight / 2;
                            offsetOut = { top: horzHeight.toString() + "px", left: "0px" };
                            thatOut = NavigationBar._listViewHorz;
                        } else if (NavigationBar._listViewVert &&
                            NavigationBar._listViewVert._visibility !== "hidden" &&
                            NavigationBar._listViewVert.listElement) {
                            vertWidth = -NavigationBar._vertWidth;
                            offsetOut = { top: "0px", left: vertWidth.toString() + "px" };
                            thatOut = NavigationBar._listViewVert;
                        }
                        if (thatOut && offsetOut) {
                            NavigationBar._inOrientationChange++;
                            Log.print(Log.l.trace, "calling hidePanel animation");
                            thatOut._visibility = "hidden";
                            outElement = thatOut.listElement ? thatOut.listElement.parentNode : null;
                            if (outElement && outElement.style) {
                                WinJS.UI.Animation.exitContent(outElement, offsetOut).done(function () {
                                    outElement.style.visibility = "hidden";
                                    outElement.style.zIndex = -thatOut._zIndex;
                                    NavigationBar._inOrientationChange--;
                                    NavigationBar.updateOrientation();
                                    if (NavigationBar.ListView) {
                                        NavigationBar.ListView.updateLayout();
                                    }
                                });
                            }
                        }
                    }
                    NavigationBar._inOrientationChange--;
                }
                Log.ret(Log.l.u1, "");
            }
        },
        pages: {
            get: function() { return NavigationBar._pages; },
            set: function(pages) {
                Log.call(Log.l.trace, "NavigationBar.pages.");
                NavigationBar._pages = pages;
                Log.ret(Log.l.trace);
            }
        },
        groups: {
            get: function() { return NavigationBar._groups; },
            set: function(groups) {
                Log.call(Log.l.trace, "NavigationBar.groups.");
                NavigationBar._groups = groups;
                NavigationBar.setMenuForGroups();
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @function disablePage
         * @param {string} id - Page id
         * @memberof NavigationBar
         * @description Use this function to disable the navigation to a page specified by the page id.
         */
        disablePage: function (id) {
            var i;
            if (NavigationBar.pages) {
                for (i = 0; i < NavigationBar.pages.length; i++) {
                    if (NavigationBar.pages[i].id === id) {
                        NavigationBar.pages[i].disabled = true;
                        break;
                    }
                }
            }
            if (NavigationBar.data) {
                for (i = 0; i < NavigationBar.data.length; i++) {
                    var item = NavigationBar.data.getAt(i);
                    if (item && item.id === id) {
                        if (!item.disabled) {
                            item.disabled = true;
                            NavigationBar.data.setAt(i, item);
                        }
                        break;
                    }
                }
            }
            if (NavigationBar.groups) {
                for (i = 0; i < NavigationBar.groups.length; i++) {
                    if (NavigationBar.groups[i].id === id) {
                        NavigationBar.groups[i].disabled = true;
                        break;
                    }
                }
            }
            var navCommands = document.querySelector(".nav-commands");
            if (navCommands) {
                var commands = navCommands.children;
                var length = commands ? commands.length : 0;
                if (length > 0) {
                    for (i = length - 1; i >= 0; i--) {
                        var command = commands[i];
                        var commandControl = command.winControl;
                        if (commandControl && commandControl.id === id) {
                            command.disabled = true;
                            WinJS.Utilities.addClass(command, "win-disabled");
                            break;
                        }
                    }
                }
            }
        },
        /**
         * @function enablePage
         * @param {string} id - Page id
         * @memberof NavigationBar
         * @description Use this function to enable the navigation to a page specified by the page id.
         */
        enablePage: function (id) {
            var i, updateMenu = false;
            if (NavigationBar.pages) {
                for (i = 0; i < NavigationBar.pages.length; i++) {
                    if (NavigationBar.pages[i].id === id) {
                        NavigationBar.pages[i].disabled = false;
                        break;
                    }
                }
            }
            if (NavigationBar.data) {
                for (i = 0; i < NavigationBar.data.length; i++) {
                    var item = NavigationBar.data.getAt(i);
                    if (item && item.id === id) {
                        if (item.disabled) {
                            item.disabled = false;
                            NavigationBar.data.setAt(i, item);
                        }
                        break;
                    }
                }
            }
            if (NavigationBar.groups) {
                for (i = 0; i < NavigationBar.groups.length; i++) {
                    if (NavigationBar.groups[i].id === id) {
                        NavigationBar.groups[i].disabled = false;
                        updateMenu = true;
                        break;
                    }
                }
            }
            var navCommands = document.querySelector(".nav-commands");
            if (navCommands) {
                var commands = navCommands.children;
                var length = commands ? commands.length : 0;
                if (length > 0) {
                    for (i = length - 1; i >= 0; i--) {
                        var command = commands[i];
                        var commandControl = command.winControl;
                        if (commandControl && commandControl.id === id) {
                            command.disabled = false;
                            WinJS.Utilities.removeClass(command, "win-disabled");
                            break;
                        }
                    }
                }
            }
            if (updateMenu) {
                NavigationBar.groups = Application.navigationBarGroups;
            }
        },
        /**
         * @property {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211837.aspx WinJS.UI.ListView} ListView - The currently active navigation bar ListView object
         * @memberof NavigationBar
         * @description Read-only. Retrieves The currently active navigation bar ListView object
         */
        ListView: {
            get: function() {
                if (NavigationBar._orientation === "vertical") {
                    return NavigationBar._listViewVert;
                } else if (NavigationBar._orientation === "horizontal") {
                    return NavigationBar._listViewHorz;
                }
                return null;
            }
        },
        /**
         * @property {number} curGroup - The current page group number
         * @memberof NavigationBar
         * @description Read-only. Retrieves the current page group number
         */
        curGroup: {
            get: function() { return NavigationBar._curGroup; },
            set: function(newGroup) {
                Log.call(Log.l.trace, "NavigationBar.curGroup.", "newGroup=" + newGroup);
                NavigationBar._curGroup = newGroup;
                Log.ret(Log.l.trace);
            }
        },
        /**
         * @function updateOrientation
         * @memberof NavigationBar
         * @description Use this function to update the navigation bar orientation as a response to viewport size or orientation changes.
         */
        updateOrientation: function () {
            Log.call(Log.l.trace, "NavigationBar.");
            var orientation;

            if (Application.navigator) {
                if (Application.navigator._nextMaster) {
                    orientation = 0;
                } else {
                    var splitViewPaneInline = false;
                    // SplitView element
                    var splitViewRoot = Application.navigator.splitViewRoot;
                    if (splitViewRoot) {
                        var splitViewControl = splitViewRoot.winControl;
                        if (splitViewControl &&
                            splitViewControl.paneOpened &&
                            splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.inline) {
                            splitViewPaneInline = true;
                        }
                    }
                    if (splitViewPaneInline) {
                        orientation = 0;
                    } else {
                        orientation = Application.getOrientation();
                    }
                }
            }
            if (orientation === 90 || orientation === -90) {
                // device orientation: landscape - show vertival navigation bar, hide horizontal
                // change navigation bar orientation
                NavigationBar.orientation = "vertical";
            } else {
                // device orientation: portrait - show horizontal navigation bar, hide vertival
                // change navigation bar orientation
                NavigationBar.orientation = "horizontal";
            }
            Log.ret(Log.l.trace, "");
        },
        handleNavCommand: function(ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            var command = ev.currentTarget;
            if (command && !command.disabled) {
                var commandControl = command.winControl;
                if (commandControl) {
                    var id = commandControl.id;
                    var msg = "menu " + commandControl._label + " with id=" + id + " was pressed";
                    Log.print(Log.l.trace, msg);
                    if (id && Application.navigator) {
                        if (typeof Application._navigateByIdOverride === "function") {
                            id = Application._navigateByIdOverride(id, ev);
                        }
                        var nextPage = Application.getPagePath(id);
                        if (nav.location !== nextPage) {
                            WinJS.Promise.timeout(0).then(function() {
                                nav.navigate(nextPage, ev);
                            });
                        } else {
                            Log.print(Log.l.trace, "extra ignored!");
                        }
                        var splitViewRoot = Application.navigator.splitViewRoot;
                        if (splitViewRoot) {
                            var splitViewControl = splitViewRoot.winControl;
                            if (splitViewControl &&
                                splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.overlay) {
                                splitViewControl.closePane();
                            }
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, "");
        },
        handleSplitViewBeforeOpen: function(ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            if (Application.navigator) {
                var rootSplitViewPane = Application.navigator.splitViewPane;
                if (rootSplitViewPane && rootSplitViewPane.style) {
                    var splitViewRoot = Application.navigator.splitViewRoot;
                    if (splitViewRoot) {
                        var splitViewControl = splitViewRoot.winControl;
                        if (splitViewControl &&
                            splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.overlay) {
                            rootSplitViewPane.style.marginTop = NavigationBar._horzHeight + "px";
                        } else {
                            rootSplitViewPane.style.marginTop = "0";
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, "");
        },
        handleSplitViewAfterOpen: function (ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            if (Application.navigator) {
                var splitViewRoot = Application.navigator.splitViewRoot;
                if (splitViewRoot) {
                    var splitViewControl = splitViewRoot.winControl;
                    if (splitViewControl &&
                        splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.inline) {
                        Application.navigator._resized();
                    }
                }
            }
            Log.ret(Log.l.trace, "");
        },
        handleSplitViewAfterClose: function (ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            if (Application.navigator) {
                var rootSplitViewPane = Application.navigator.splitViewPane;
                if (rootSplitViewPane && rootSplitViewPane.style) {
                    rootSplitViewPane.style.marginTop = "0";
                }
                var splitViewRoot = Application.navigator.splitViewRoot;
                if (splitViewRoot) {
                    var splitViewControl = splitViewRoot.winControl;
                    if (splitViewControl &&
                        splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.inline) {
                        Application.navigator._resized();
                    }
                }
            }
            Log.ret(Log.l.trace, "");
        },
        showGroupsMenu: function (results, bForceReloadMenu) {
            var i, updateMenu = false;
            Log.call(Log.l.trace, "NavigationBar.");
            var applist = [];
            for (i = 0; i < results.length; i++) {
                var row = results[i];
                if (row && row.Title) {
                    if (applist.indexOf(row.Title) >= 0) {
                        Log.print(Log.l.trace, "extra ignored " + row.Title);
                    } else {
                        Log.print(Log.l.trace, "add applist[" + i + "]=" + row.Title);
                        applist.push(row.Title);
                    }
                    if (row.AlternativeStartApp) {
                        Log.print(Log.l.trace, "reset home page of app to page=" + row.Title);
                        Application.startPage = Application.getPagePath(row.Title);
                    }
                }
            }
            if (applist && applist.length > 0) {
                for (i = 0; i < Application.navigationBarGroups.length; i++) {
                    if (applist.indexOf(Application.navigationBarGroups[i].id) >= 0) {
                        if (Application.navigationBarGroups[i].disabled) {
                            Log.print(Log.l.trace, "enable id=" + Application.navigationBarGroups[i].id);
                            Application.navigationBarGroups[i].disabled = false;
                            updateMenu = true;
                        };
                    } else {
                        if (!Application.navigationBarGroups[i].disabled) {
                            Log.print(Log.l.trace, "disable id=" + Application.navigationBarGroups[i].id);
                            Application.navigationBarGroups[i].disabled = true;
                            updateMenu = true;
                        };
                    }
                }
            } else {
                for (i = 0; i < Application.navigationBarGroups.length; i++) {
                    if (!Application.navigationBarGroups[i].disabled) {
                        Log.print(Log.l.trace, "disable id=" + Application.navigationBarGroups[i].id);
                        Application.navigationBarGroups[i].disabled = true;
                        updateMenu = true;
                    }
                }
            }
            if (updateMenu || bForceReloadMenu) {
                NavigationBar.groups = Application.navigationBarGroups;
            }
            for (i = 0; i < Application.navigationBarGroups.length; i++) {
                if (Application.navigationBarGroups[i].disabled) {
                    NavigationBar.disablePage(Application.navigationBarGroups[i].id);
                } else {
                    NavigationBar.enablePage(Application.navigationBarGroups[i].id);
                }
                if (NavigationBar.pages && NavigationBar.pages.length > 0) {
                    for (var j = 0; j < NavigationBar.pages.length; j++) {
                        if (NavigationBar.pages[j]) {
                            if (NavigationBar.pages[j].group === Application.navigationBarGroups[i].group) {
                                NavigationBar.pages[j].disabled = Application.navigationBarGroups[i].disabled;
                            }
                        }
                    }
                }
            }
            Log.ret(Log.l.trace);
        },
        isPageDisabled: function (name) {
            Log.call(Log.l.trace, "NavigationBar.");
            var ret = false;
            if (NavigationBar.pages) {
                for (var j = 0; j < NavigationBar.pages.length; j++) {
                    if (NavigationBar.pages[j] &&
                        NavigationBar.pages[j].id === name) {
                        ret = NavigationBar.pages[j].disabled;
                    }
                }
            }
            Log.ret(Log.l.trace, ret);
        },
        loadMenuIcons: function () {
            var i;
            Log.call(Log.l.u2, "NavigationBar.");
            var splitViewRoot = Application.navigator && Application.navigator.splitViewRoot;
            if (splitViewRoot) {
                var navCommands = splitViewRoot.querySelector(".nav-commands");
                if (navCommands) {
                    var splitViewCommands = splitViewRoot.querySelectorAll(".win-splitviewcommand");
                    if (splitViewCommands) {
                        for (i = 0; i < splitViewCommands.length; i++) {
                            var splitViewCommand = splitViewCommands[i];
                            if (splitViewCommand && splitViewCommand.winControl) {
                                var splitViewCommandIcon = splitViewCommand.querySelector(".win-splitviewcommand-icon");
                                if (!splitViewCommandIcon.firstElementChild) {
                                    if (NavigationBar.groups && NavigationBar.groups.length > 0) {
                                        for (var j = 0; j < NavigationBar.groups.length; j++) {
                                            if (splitViewCommand.winControl.id === NavigationBar.groups[j].id) {
                                                var svg = NavigationBar.groups[j].svg;
                                                if (svg) {
                                                    var svgObject = document.createElement("div");
                                                    if (svgObject) {
                                                        svgObject.setAttribute("width", "24");
                                                        svgObject.setAttribute("height", "24");
                                                        svgObject.style.display = "inline";
                                                        svgObject.id = svg;

                                                        // insert svg object before span element
                                                        splitViewCommandIcon.appendChild(svgObject);

                                                        // overlay span element over svg object to enable user input
                                                        splitViewCommandIcon.setAttribute("style", "width: 24px; height: 24px;");

                                                        // load the image file
                                                        Colors.loadSVGImage({
                                                            fileName: svg,
                                                            color: Colors.navigationColor,
                                                            element: svgObject,
                                                            size: 24
                                                        });

                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Log.ret(Log.l.u2);
        },
        setMenuForGroups: function () {
            var i;
            Log.call(Log.l.trace, "NavigationBar.");
            var navCommands = document.querySelector(".nav-commands");
            if (navCommands) {
                var commands = navCommands.children;
                var length = commands ? commands.length : 0;
                if (length > 0) {
                    for (i = length - 1; i >= 0; i--) {
                        var command = commands[i];
                        if (command.id !== "dummyMenu") {
                            if (command.winControl) {
                                command.winControl.dispose();
                            }
                            navCommands.removeChild(command);
                        }
                    }
                }
                if (NavigationBar.groups && NavigationBar.groups.length > 0) {
                    for (i = 0; i < NavigationBar.groups.length; i++) {
                        if (!NavigationBar.groups[i].disabled) {
                            var element = document.createElement("div");
                            navCommands.appendChild(element);
                            var navigationLabel = getResourceText("label." + (NavigationBar.groups[i].label || NavigationBar.groups[i].id));
                            var options = {
                                id: NavigationBar.groups[i].id,
                                label: navigationLabel,
                                oninvoked: NavigationBar.handleNavCommand
                            };
                            if (!NavigationBar.groups[i].svg) {
                                options.icon = NavigationBar.groups[i].icon;
                            }
                            var splitViewCommand = new WinJS.UI.SplitViewCommand(element, options);
                        }
                    }
                    WinJS.Promise.timeout(0).then(function() {
                        NavigationBar.loadMenuIcons();
                    });
                }
            }
            Log.ret(Log.l.trace, "");
        },
        // update navigation bar list items depending from group
        setItemsForGroup: function (group) {
            Log.call(Log.l.trace, "NavigationBar.", "group=" + group + " curGroup=" + NavigationBar.curGroup);
            if (NavigationBar.data && group !== NavigationBar.curGroup) {
                var that = null;
                var offset;
                if (NavigationBar.ListView &&
                    NavigationBar.ListView.listElement) {
                    that = NavigationBar.ListView;
                }
                if (NavigationBar._orientation === "vertical") {
                    var vertWidth = -NavigationBar._vertWidth;
                    offset = { top: "0px", left: vertWidth.toString() + "px" };
                } else {
                    var horzHeight = -NavigationBar._horzHeight;
                    offset = { top: horzHeight.toString() + "px", left: "0px" };
                }
                var reloadNavigationData = function () {
                    Log.call(Log.l.trace, "NavigationBar.setItemsForGroup.");
                    var i, j, item;
                    // remove list items from other groups, except group < 0
                    for (j = NavigationBar.data.length - 1; j >= 0; j--) {
                        item = NavigationBar.data.getAt(j);
                        if (item && item.group > 0 && item.group !== group) {
                            // remove items with other group no.
                            Log.print(Log.l.trace, "remove item id=" + item.id);
                            NavigationBar.data.splice(j, 1);
                        }
                    }
                    // insert list items from current groups, if not already in list
                    for (i = 0; i < NavigationBar.pages.length; i++) {
                        if (/*NavigationBar.pages[i].group < 0 ||*/ NavigationBar.pages[i].group === group) {
                            var doInsert = true;
                            for (j = 0; j < NavigationBar.data.length; j++) {
                                item = NavigationBar.data.getAt(j);
                                if (item && item.id === NavigationBar.pages[i].id) {
                                    Log.print(Log.l.trace, "found item id=" + item.id);
                                    doInsert = false;
                                    break;
                                }
                            }
                            if (doInsert === true) {
                                var navigationLabel = getResourceText("label." + NavigationBar.pages[i].id);
                                Log.print(Log.l.trace, "push new item id=" + NavigationBar.pages[i].id);
                                NavigationBar.data.push({
                                    id: NavigationBar.pages[i].id,
                                    group: NavigationBar.pages[i].group,
                                    disabled: NavigationBar.pages[i].disabled,
                                    text: navigationLabel,
                                    width: navigationLabel.length + 4
                                });
                            }
                        }
                    }
                    //NavigationBar._playAnimation = true;
                    NavigationBar.curGroup = group;
                    NavigationBar.updateOrientation();
                    var ret = WinJS.Promise.timeout(0).then(function() {
                        if (NavigationBar.ListView) {
                            NavigationBar.ListView.updateLayout();
                        }
                    });
                    Log.ret(Log.l.trace);
                    return ret;
                };
                if (that && that._visibility !== "hidden") {
                    if (that.listElement &&
                        that.listElement.parentNode) {
                        WinJS.UI.Animation.exitContent(that.listElement.parentNode, offset).done(function() {
                            if (that.listElement.parentNode.style) {
                                that.listElement.parentNode.style.visibility = "hidden";
                                that.listElement.parentNode.style.zIndex = -that._zIndex;
                            }
                            that._visibility = "hidden";
                            reloadNavigationData();
                        });
                    }
                } else {
                    reloadNavigationData();
                }
            }
            Log.ret(Log.l.trace);
        },
        // list object for binding, returns the data source
        data: {
            get: function () {
                if (!NavigationBar._data) {
                    NavigationBar._data = new WinJS.Binding.List([]);
                }
                return NavigationBar._data;
            }
        },
        _data: null,
        _listViewHorz: null,
        _listViewVert: null,
        _orientation: null,
        _inOrientationChange: 0,
        _pages: null,
        _curGroup: 0,
        _animationDistanceX: 160,
        _animationDistanceY: 80,
        _horzHeight: 48,
        _vertWidth: 244,
        _playAnimation: false,
        _splitViewClassSet: false,
        _splitViewDisplayMode: null
    });

})();
