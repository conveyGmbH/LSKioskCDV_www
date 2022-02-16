// implements the page navigation
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
        _maxViewSize: {
            small: 499,
            mediumSmall: 699,
            medium: 899,
            bigger: 1099,
            biggest: 1499
        },
        expandSubMenuModes: {
            get: function() {
                return {
                    all: "all",
                    toggle: "toggle",
                    single: "single"
                }
            }
        },
        maxViewSize: {
            get: function() {
                return Application._maxViewSize;
            }
        },
        baseHref: {
            get: function() {
                return Application._baseHref;
            },
            set: function(newBaseHref) {
                Application._baseHref = newBaseHref;
            }
        },
        startPageId: {
            get: function() {
                return Application.getPageId(Application.startPage);
            }
        },
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
            get: function() {
                return Application._navigationBarGroups;
            },
            set: function(newNavigationBarGroups) {
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
            get: function() {
                return Application._navigationBarPages;
            },
            set: function(newNavigationBarPages) {
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
            get: function() {
                return Application._navigationMasterDetail;
            },
            set: function(newNavigationMasterDetail) {
                Application._navigationMasterDetail = newNavigationMasterDetail;
            }
        },
        getBackStackIndex: function(pagePath) {
            var ret = -1;
            Log.call(Log.l.trace, "Application.", "pagePath=" + pagePath);
            if (pagePath === nav.location) {
                ret = 0;
            } else if (pagePath &&
                nav.history && 
                nav.history.backStack &&
                nav.history.backStack.length > 0) {
                for (var i = nav.history.backStack.length - 1; i >= 0; i--) {
                    var item = nav.history.backStack[i];
                    if (item && item.location) {
                        if (item.location === pagePath) {
                            ret = nav.history.backStack.length - i;
                            break;
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, ret);
            return ret;
        },
        getForwardStackIndex: function(pagePath) {
            var ret = -1;
            Log.call(Log.l.trace, "Application.", "pagePath=" + pagePath);
            if (pagePath === nav.location) {
                ret = 0;
            } else if (pagePath &&
                nav.history && 
                nav.history.forwardStack &&
                nav.history.forwardStack.length > 0) {
                for (var i = nav.history.forwardStack.length - 1; i >= 0; i--) {
                    var item = nav.history.forwardStack[i];
                    if (item && item.location) {
                        if (item.location === pagePath) {
                            ret = nav.history.forwardStack.length - i;
                            break;
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, ret);
            return ret;
        },
        /**
         * @function getFragmentPath
         * @param {string} fragmentId - Id of fragment
         * @returns {string} The full path of the fragment HTML file
         * @memberof Application
         * @description Use this function to get the full path of a fragment HTML file from the fragment id.
         */
        getFragmentPath: function(fragmentId) {
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
        getFragmentId: function(fragmentPath) {
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
        getPagePath: function(pageId) {
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
        getPageId: function(pagePath) {
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
            get: function() {
                return Application._initPage;
            },
            set: function(newInitPage) {
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
            get: function() {
                return Application._startPage;
            },
            set: function(newStartPage) {
                Application._startPage = newStartPage;
            }
        },
        prevNavigateNewId: {
            get: function() {
                return AppData._persistentStates.prevNavigateNewId;
            },
            set: function(newPrevNavigateNewId) {
                AppData._persistentStates.prevNavigateNewId = newPrevNavigateNewId;
            }
        },
        navigateNewId: {
            get: function() {
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
            get: function() {
                return Application._navigateByIdOverride;
            },
            set: function(newNavigateByIdOverride) {
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
        navigateById: function(id, event, removeBackStack) {
            Log.call(Log.l.trace, "Application.", "id=" + id + " removeBackStack=" + removeBackStack);
            if (Application.navigator) {
                var splitViewRoot = Application.navigator.splitViewRoot;
                if (splitViewRoot) {
                    var splitViewControl = splitViewRoot.winControl;
                    if (splitViewControl &&
                        splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.overlay) {
                        splitViewControl.closePane();
                    }
                }
            }
            var ret = WinJS.Promise.timeout(0).then(function() {
                Application.navigateByIdEx(id, event, removeBackStack);
            });
            Log.ret(Log.l.trace);
            return ret;
        },
        navigateByIdEx: function(id, event, removeBackStack) {
            Log.call(Log.l.trace, "Application.", "id=" + id + " removeBackStack=" + removeBackStack);
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
                WinJS.Promise.timeout(50).then(function() {
                    Application.navigateById(id, event, removeBackStack);
                });
            } else {
                if (Application.navigator) {
                    Application.navigator._removeBackStack = !!removeBackStack;
                }
                nav.navigate(newLocation, event, removeBackStack);
            }
            Log.ret(Log.l.trace);
        },

        prevPageInGroup: function(id) {
            Log.call(Log.l.trace, "Application.", "id=" + id);
            var prevPageId = null;
            var group = this.groupFromPageId(id);
            if (group) {
                for (var i = 0; i < NavigationBar.pages.length; i++) {
                    if (NavigationBar.pages[i].group === group) {
                        if (NavigationBar.pages[i].id === id) {
                            break;
                        } else {
                            prevPageId = NavigationBar.pages[i].id;
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, prevPageId);
            return prevPageId;
        },

        nextPageInGroup: function(id) {
            Log.call(Log.l.trace, "Application.", "id=" + id);
            var bFound = false;
            var nextPageId = null;
            var group = this.groupFromPageId(id);
            if (group) {
                for (var i = 0; i < NavigationBar.pages.length; i++) {
                    if (NavigationBar.pages[i].group === group) {
                        if (NavigationBar.pages[i].id === id) {
                            bFound = true;
                        } else if (bFound) {
                            nextPageId = NavigationBar.pages[i].id;
                            break;
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, nextPageId);
            return nextPageId;
        },

        groupFromPageId: function(id) {
            Log.call(Log.l.trace, "Application.", "id=" + id);
            var group = null;
            for (var i = 0; i < NavigationBar.pages.length; i++) {
                if (NavigationBar.pages[i].id === id) {
                    var bGroupDisabled = false;
                    if (NavigationBar.groups && NavigationBar.groups.length > 0) {
                        for (var j = 0; j < NavigationBar.groups.length; j++) {
                            if (NavigationBar.groups[j] &&
                                NavigationBar.groups[j].group === NavigationBar.pages[i].group &&
                                NavigationBar.groups[j].disabled) {
                                Log.print(Log.l.trace, "group=" + NavigationBar.groups[j].group + " is disabled");
                                bGroupDisabled = true;
                                break;
                            }
                        }
                    }
                    if (!bGroupDisabled) {
                        group = NavigationBar.pages[i].group;
                        break;
                    }
                }
            }
            Log.ret(Log.l.trace, group);
            return group;
        },

        showDetail: function(f) {
            if (Application.navigator &&
                Application.navigator._nextMaster &&
                Application.navigator._masterMaximized &&
                !Application.navigator._masterHidden) {
                WinJS.Promise.timeout(50)
                    .then(function() {
                        Application.navigator._hideMaster()
                            .then(function() {
                                if (typeof f === "function") {
                                    f();
                                }
                            });
                    });
                return true;
            }
            return false;
        },

        showMaster: function(f) {
            if (Application.navigator &&
                Application.navigator._nextMaster &&
                Application.navigator._masterMaximized &&
                Application.navigator._masterHidden) {
                if (nav.history && nav.history.backStack) {
                    for (var i = nav.history.backStack.length - 1; i >= 0; i--) {
                        if (nav.history.backStack[i] &&
                            nav.history.backStack[i].location === nav.location) {
                            nav.history.backStack.splice(i, nav.history.backStack.length - i);
                            break;
                        }
                    }

                }
                WinJS.Promise.timeout(50)
                    .then(function() {
                        Application.navigator._showMaster()
                            .then(function() {
                                if (typeof f === "function") {
                                    f();
                                }
                            });
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
        loadFragmentById: function(element, id, options, event) {
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
                    that._eventHandlerRemover.push(function() {
                        e.removeEventListener(eventName, handler);
                    });
                };

                addRemovableEventListener(nav, "beforenavigate", this._beforenavigate.bind(this), false);
                addRemovableEventListener(nav, "navigating", this._navigating.bind(this), false);
                addRemovableEventListener(nav, "navigated", this._navigated.bind(this), false);

                window.onresize = this._resized.bind(this);
                window.onorientationchange = this._orientationchanged.bind(this);
                window.onpopstate = this._popstate.bind(this);

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
                _beforeNavigateWatchdog: null,
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
                _subMenuFlyout: null,
                _subMenuList: null,
                _subMenuHeaderText: null,
                _removeBackStack: false,
                _noPushState: false,
                splitViewRoot: {
                    get: function () {
                        if (!this._splitViewRoot) {
                            this._splitViewRoot = document.querySelector("#root-split-view");
                        }
                        return this._splitViewRoot;
                    }
                },
                splitViewPane: {
                    get: function () {
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
                subMenuFlyout: {
                    get: function () {
                        if (!this._subMenuFlyout) {
                            this._subMenuFlyout = document.querySelector("#root-split-view-submenu");
                        }
                        return this._subMenuFlyout;
                    }
                },
                subMenuList: {
                    get: function () {
                        if (!this._subMenuList && this.subMenuFlyout) {
                            this._subMenuList = this.subMenuFlyout.querySelector("#root-split-view-submenu-list");
                        }
                        return this._subMenuList;
                    }
                },
                subMenuHeaderText: {
                    get: function() {
                        if (!this._subMenuHeaderText && this.subMenuFlyout) {
                            this._subMenuHeaderText = this.subMenuFlyout.querySelector(".pane-submenu-header-text");
                        }
                        return this._subMenuHeaderText;
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
                        setPromise: function (promise) {
                            if (!promise) {
                                promise = WinJS.Promise.as();
                            }
                            return promise.then(function() {
                                return that._loaded(element.id);
                            });
                        }
                    }
                    var ret = this._loading({ detail: detail });
                    Log.ret(Log.l.trace, "");
                    return ret;
                },
                resizeSplitView: function () {
                    var ret = false;
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var splitViewRoot = this.splitViewRoot;
                    var splitViewContent = this.splitViewContent;
                    if (splitViewRoot && splitViewContent) {
                        // resize only if it's a real SplitView control
                        // AppHeader element
                        var headerhost = document.querySelector("#headerhost");
                        if (headerhost) {
                            splitViewRoot.style.height = "calc(100% - " + headerhost.clientHeight.toString() + "px)";
                        }
                        ret = true;
                    }
                    Log.ret(Log.l.u1, "");
                    return ret;
                },
                
                elementUpdateLayout: function(element) {
                    var ret = null;
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    if (element &&
                        element.winControl &&
                        element.winControl.updateLayout) {
                        if (!element.winControl.inResize) {
                            Log.print(Log.l.u1, "calling updateLayout...");
                            ret = element.winControl.updateLayout.call(element.winControl, element);
                            Log.print(Log.l.u1, "...returned from updateLayout");
                        } else if (!element._updateLayoutPromise) {
                            Log.print(Log.l.u1, "semaphore set - try later again!");
                            var that = this;
                            element._updateLayoutPromise = WinJS.Promise.timeout(50).then(function() {
                                element._updateLayoutPromise = null;
                                return that.elementUpdateLayout(element);
                            });
                            ret = element._updateLayoutPromise;
                        }
                    }
                    Log.ret(Log.l.u1, "");
                    return ret || WinJS.Promise.as();
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
                        if (element.resizeWidth) {
                            if (element.resizeHelper && element.resizeHelper.inResize) {
                                width = element.resizeWidth;
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
                                if (element.resizeWidth >= width - 350) {
                                    if (this._nextMaster) {
                                        this._masterMaximized = true;
                                    } else {
                                        this._masterMaximized = false;
                                    }
                                } else if (element.resizeWidth <= 350) {
                                    if (this._nextMaster) {
                                        this._masterMaximized = true;
                                    } else {
                                        this._masterMaximized = false;
                                    }
                                } else {
                                    width = element.resizeWidth;
                                }
                            }
                        } else {
                            if (width > Application.maxViewSize.medium) {
                                width = 450;
                                if (this._masterMaximized) {
                                    if (this.masterElement && this._masterHidden) {
                                        this._masterHidden = false;
                                        this._prevAppBarHidden = null;
                                        this.masterElement.style.visibility = "";
                                    } else {
                                        WinJS.UI.Animation.enterContent(this.pageElement);
                                    }
                                    this._masterMaximized = false;
                                }
                            } else if (width >= Application.maxViewSize.mediumSmall) {
                                width = width / 2;
                                if (this._masterMaximized) {
                                    if (this.masterElement && this._masterHidden) {
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
                        }
                        if (element.resizeHelper) {
                            element.resizeHelper.minMaxChanged(this._masterMaximized);
                        }
                        // hide AppBar if master is maximized
                        if (AppBar.barElement && AppBar.barControl &&
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
                                if (!NavigationBar._resizedPromise) {
                                    NavigationBar._resizedPromise = WinJS.Promise.timeout(10).then(function () {
                                        // now do complete resize later!
                                        Application.navigator._resized();
                                        NavigationBar._resizedPromise = null;
                                    });
                                }
                            }
                            AppBar.triggerDisableHandlers();
                        }
                        if (AppBar.barElement && AppBar.barControl && 
                            AppBar._commandList && AppBar._commandList.length > 0 &&
                            !AppBar.barControl.disabled &&
                            AppBar.barControl.placement === "bottom") {
                            height -= AppBar.barElement.clientHeight;
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
                        if (width > Application.maxViewSize.small) {
                            // remove class: view-size-small  
                            WinJS.Utilities.removeClass(element, "view-size-small");
                        } else {
                            // add class: view-size-small    
                            WinJS.Utilities.addClass(element, "view-size-small");
                        }
                        if (width > Application.maxViewSize.mediumSmall) {
                            // remove class: view-size-medium-small  
                            WinJS.Utilities.removeClass(element, "view-size-medium-small");
                        } else {
                            // add class: view-size-medium-small    
                            WinJS.Utilities.addClass(element, "view-size-medium-small");
                        }
                        if (width > Application.maxViewSize.medium) {
                            // remove class: view-size-medium    
                            WinJS.Utilities.removeClass(element, "view-size-medium");
                        } else {
                            // add class: view-size-medium
                            WinJS.Utilities.addClass(element, "view-size-medium");
                        }
                        if (width > Application.maxViewSize.bigger) {
                            // remove class: view-size-bigger
                            WinJS.Utilities.removeClass(element, "view-size-bigger");
                        } else {
                            // add class: view-size-bigger
                            WinJS.Utilities.addClass(element, "view-size-bigger");
                        }
                        if (width > Application.maxViewSize.biggest) {
                            // remove class: view-size-biggest
                            WinJS.Utilities.removeClass(element, "view-size-biggest");
                        } else {
                            // add class: view-size-biggest
                            WinJS.Utilities.addClass(element, "view-size-biggest");
                        }
                        ret = this.elementUpdateLayout(element);
                    }
                    Log.ret(Log.l.u1, "");
                    return ret || WinJS.Promise.as();
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
                    var navBarVisible = false;
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var splitViewContent = Application.navigator && Application.navigator.splitViewContent;
                    if (element && element.style && splitViewContent) {
                        var i;

                        // current window size
                        var left = 0;
                        var top = 0;
                        var width = splitViewContent.clientWidth;
                        var height = splitViewContent.clientHeight;
                        var widthNavBar = width;

                        // calculate content element dimensions
                        if (this._nextMaster && this.masterElement && !this._masterHidden) {
                            left += this.masterElement.clientWidth;
                            width -= this.masterElement.clientWidth;
                        }

                        // NavigationBar element
                        var navBarElement = null;
                        if (this._nextPage) {
                            // check for coming NavigationBar on page transitions
                            var newPageId = Application.getPageId(this._nextPage);
                            var group = Application.groupFromPageId(newPageId);
                            if (group > 0 || !group && NavigationBar.data && NavigationBar.data.length > 0) {
                                navBarVisible = true;
                            }
                        } else if (NavigationBar.data && NavigationBar.data.length > 0) {
                            navBarVisible = true;
                        }
                        if (AppBar.barElement &&
                            AppBar.barControl &&
                            AppBar._commandList &&
                            AppBar._commandList.length > 0) {
                            if (AppBar.barControl.placement === "top") {
                                top += AppBar.barElement.clientHeight;
                            }
                            height -= AppBar.barElement.clientHeight;
                        }
                        if (navBarVisible) {
                            navBarElement = NavigationBar.ListView && NavigationBar.ListView.listElement;
                            if (NavigationBar.orientation === "horizontal") {
                                top += NavigationBar.navHorzHeight;
                                height -= NavigationBar.navHorzHeight;
                            } else {
                                var navVertWidthSmall = (3 * AppData.persistentStatesDefaults.navVertWidth) / 4;
                                if (width - navVertWidthSmall > Application.maxViewSize.small) {
                                    NavigationBar.navVertWidth = AppData.persistentStatesDefaults.navVertWidth;
                                    widthNavBar = 500;
                                } else {
                                    NavigationBar.navVertWidth = navVertWidthSmall;
                                    widthNavBar = navVertWidthSmall;
                                }
                                left += NavigationBar.navVertWidth;
                                width -= NavigationBar.navVertWidth;
                                // hide page top line - now in accent color!
                                if (!(AppBar.barElement &&
                                    AppBar.barControl &&
                                    AppBar.barControl.placement === "top" &&
                                    AppBar._commandList &&
                                    AppBar._commandList.length > 0)) {
                                    top -= 2;
                                    height += 2;
                                }
                            }
                        } else {
                            // hide page top line - now in accent color!
                            if (!(AppBar.barElement &&
                                AppBar.barControl &&
                                AppBar.barControl.placement === "top" &&
                                AppBar._commandList &&
                                AppBar._commandList.length > 0)) {
                                top -= 2;
                                height += 2;
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
                        if (navBarElement) {
                            if (widthNavBar > Application.maxViewSize.small) {
                                // remove class: view-size-small  
                                WinJS.Utilities.removeClass(navBarElement, "view-size-small");
                            } else {
                                // add class: view-size-small    
                                WinJS.Utilities.addClass(navBarElement, "view-size-small");
                            }
                            if (widthNavBar > Application.maxViewSize.mediumSmall) {
                                // remove class: view-size-medium-small  
                                WinJS.Utilities.removeClass(navBarElement, "view-size-medium-small");
                            } else {
                                // add class: view-size-medium-small    
                                WinJS.Utilities.addClass(navBarElement, "view-size-medium-small");
                            }
                            if (widthNavBar > Application.maxViewSize.medium) {
                                // remove class: view-size-medium    
                                WinJS.Utilities.removeClass(navBarElement, "view-size-medium");
                            } else {
                                // add class: view-size-medium
                                WinJS.Utilities.addClass(navBarElement, "view-size-medium");
                            }
                            if (widthNavBar > Application.maxViewSize.bigger) {
                                // remove class: view-size-bigger
                                WinJS.Utilities.removeClass(navBarElement, "view-size-bigger");
                            } else {
                                // add class: view-size-bigger
                                WinJS.Utilities.addClass(navBarElement, "view-size-bigger");
                            }
                            if (widthNavBar > Application.maxViewSize.biggest) {
                                // remove class: view-size-biggest
                                WinJS.Utilities.removeClass(navBarElement, "view-size-biggest");
                            } else {
                                // add class: view-size-biggest
                                WinJS.Utilities.addClass(navBarElement, "view-size-biggest");
                            }
                        }
                        if (width > Application.maxViewSize.small) {
                            // remove class: view-size-small  
                            WinJS.Utilities.removeClass(element, "view-size-small");
                        } else {
                            // add class: view-size-small    
                            WinJS.Utilities.addClass(element, "view-size-small");
                        }
                        if (width > Application.maxViewSize.mediumSmall) {
                            // remove class: view-size-medium-small  
                            WinJS.Utilities.removeClass(element, "view-size-medium-small");
                        } else {
                            // add class: view-size-medium-small    
                            WinJS.Utilities.addClass(element, "view-size-medium-small");
                        }
                        if (width > Application.maxViewSize.medium) {
                            // remove class: view-size-medium    
                            WinJS.Utilities.removeClass(element, "view-size-medium");
                        } else {
                            // add class: view-size-medium
                            WinJS.Utilities.addClass(element, "view-size-medium");
                        }
                        if (width > Application.maxViewSize.bigger) {
                            // remove class: view-size-bigger
                            WinJS.Utilities.removeClass(element, "view-size-bigger");
                        } else {
                            // add class: view-size-bigger
                            WinJS.Utilities.addClass(element, "view-size-bigger");
                        }
                        if (width > Application.maxViewSize.biggest) {
                            // remove class: view-size-biggest
                            WinJS.Utilities.removeClass(element, "view-size-biggest");
                        } else {
                            // add class: view-size-biggest
                            WinJS.Utilities.addClass(element, "view-size-biggest");
                        }
                        ret = this.elementUpdateLayout(element);
                    }
                    if (!this._nextPage || this._nextPage === this._lastPage) {
                        this._updateFragmentsLayout();
                    }
                    // Resize AppBar
                    if (AppBar.commandList && AppBar.commandList.length > 0 &&
                        AppBar.barElement && AppBar.barElement.clientHeight > 0) {
                        if (AppBar.barControl && AppBar.barControl.placement === "top") {
                            var appBarWidth = 0;
                            var appBarLeft = 0;
                            var appBarTop = 0;
                            if (Application.navigator.splitViewPane &&
                                Application.navigator.splitViewPane.parentElement) {
                                appBarLeft += Application.navigator.splitViewPane.parentElement.clientWidth;
                            }
                            if (Application.navigator.pageElement) {
                                appBarWidth += Application.navigator.pageElement.clientWidth;
                                if (splitViewContent) {
                                    appBarLeft += splitViewContent.clientWidth - appBarWidth;
                                }
                            }
                            // AppHeader element
                            var headerhost = document.querySelector("#headerhost");
                            if (headerhost) {
                                appBarTop += headerhost.clientHeight;
                            }
                            if (navBarVisible && NavigationBar.orientation === "horizontal") {
                                appBarTop += NavigationBar.navHorzHeight;
                            }
                            AppBar.barElement.style.width = appBarWidth + "px";
                            AppBar.barElement.style.marginLeft = appBarLeft + "px";
                            AppBar.barElement.style.marginTop = appBarTop + "px";
                        } else {
                            AppBar.barElement.style.width = "";
                            AppBar.barElement.style.marginLeft = "";
                            AppBar.barElement.style.marginTop = "";
                        }
                    } else {
                        AppBar.barElement.style.width = "";
                        AppBar.barElement.style.marginLeft = "";
                        AppBar.barElement.style.marginTop = "";
                    }
                    WinJS.Promise.timeout(0).then(function setDefaultButtonPos() {
                        Log.call(Log.l.u1, "Application.PageControlNavigator.resizePageElement.");
                        AppBar.checkDefaultButtonPos();
                        Log.ret(Log.l.u1, "");
                    });
                    Log.ret(Log.l.u1, "");
                    return ret || WinJS.Promise.as();
                },

                // This function disposes the page navigator and its contents.
                dispose: function () {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    if (this._disposed) {
                        Log.ret(Log.l.trace, "extra ignored!");
                        return;
                    }
                    this._disposed = true;
                    WinJS.Utilities.disposeSubTree(this._element);
                    if (this._eventHandlerRemover) {
                        for (var i = 0; i < this._eventHandlerRemover.length; i++) {
                            this._eventHandlerRemover[i]();
                        }
                        this._eventHandlerRemover = [];
                    }
                    Log.ret(Log.l.trace);
                },

                // Checks for valid state of current page before navigation via canUnload() function
                _beforeload: function (id) {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.", "id=" + id);
                    var fragment = this._fragments && this._fragments[id];
                    if (!fragment) {
                        Log.ret(Log.l.trace, "extra ignored");
                        return WinJS.Promise.as();
                    }
                    if (fragment._beforeLoadWatchdog) {
                        if (typeof fragment._beforeLoadWatchdog.cancel === "function") {
                            Log.print(Log.l.trace, "cancel beforeLoadWatchdog promise of fragment[" + id + "]");
                            fragment._beforeLoadWatchdog.cancel();
                        }
                        fragment._beforeLoadWatchdog = null;
                    }
                    if (fragment._beforeLoadPromise &&
                        typeof fragment._beforeLoadPromise.cancel === "function") {
                        Log.print(Log.l.trace, "cancel beforeLoadPromise of fragment[" + id + "]");
                        fragment._beforeLoadPromise.cancel();
                    }
                    fragment._inBeforeLoadPromise = true;
                    if (AppBar.notifyModified &&
                        fragment._element &&
                        fragment._element.firstElementChild &&
                        fragment._element.firstElementChild.winControl &&
                        typeof fragment._element.firstElementChild.winControl.canUnload === "function") {
                        fragment._beforeLoadPromise = fragment._element.firstElementChild.winControl.canUnload(function (response) {
                            Log.print(Log.l.trace, "from PageControlNavigator: _beforeload(" + id + ") canUnload true!");
                            return WinJS.Promise.timeout(0).then(function() {
                                if (fragment._inBeforeLoadPromise &&
                                    fragment._beforeLoadPromise &&
                                    typeof fragment._beforeLoadPromise._completed === "function") {
                                    // called asynchronously if ok
                                    Log.print(Log.l.trace, "from PageControlNavigator (true): _beforeload(" + id + ") calling _completed()");
                                    fragment._beforeLoadPromise._completed();
                                    fragment._inBeforeLoadPromise = false;
                                }
                            });
                        }, function(errorResponse) {
                            Log.print(Log.l.trace, "from PageControlNavigator: _beforeload(" + id + ") canUnload false!");
                            return WinJS.Promise.timeout(0).then(function() {
                                if (fragment._inBeforeLoadPromise &&
                                    fragment._beforeLoadPromise &&
                                    typeof fragment._beforeLoadPromise.cancel === "function") {
                                    // called asynchronously if not allowed
                                    Log.print(Log.l.trace, "from PageControlNavigator (false): _beforeload(" + id + ") calling cancel()");
                                    fragment._beforeLoadPromise.cancel();
                                    fragment._inBeforeLoadPromise = false;
                                }
                            });
                        }).then(function() {
                            // handle waitfor asynchronously called return values
                            fragment._beforeLoadWatchdog = WinJS.Promise.timeout(120000).then(function() {
                                Log.print(Log.l.info, "from PageControlNavigator: _beforeload(" + id + ") canUnload timeout!");
                                if (fragment._inBeforeLoadPromise &&
                                    fragment._beforeLoadPromise &&
                                    typeof fragment._beforeLoadPromise.cancel === "function") {
                                    Log.print(Log.l.trace, "from PageControlNavigator (timeout): _beforeload(" + id + ") calling cancel()");
                                    fragment._beforeLoadPromise.cancel();
                                    fragment._inBeforeLoadPromise = false;
                                }
                            });
                            return fragment._beforeLoadWatchdog;
                        });
                    } else {
                        fragment._beforeLoadPromise = new WinJS.Promise.as().then(function (response) {
                            Log.print(Log.l.trace, "from PageControlNavigator: _beforeload(" + id + ") done!");
                            return WinJS.Promise.timeout(0).then(function() {
                                if (fragment._inBeforeLoadPromise &&
                                    fragment._beforeLoadPromise &&
                                    typeof fragment._beforeLoadPromise._completed === "function") {
                                    // called asynchronously if ok
                                    Log.print(Log.l.trace, "from PageControlNavigator (true): _beforeload(" + id + ") calling _completed()");
                                    fragment._beforeLoadPromise._completed();
                                    fragment._inBeforeLoadPromise = false;
                                }
                            });
                        });
                    }
                    Log.ret(Log.l.trace, "");
                    return fragment._beforeLoadPromise;
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
                                if (oldElement.winControl.controller) {
                                    oldElement.winControl.controller = null;
                                }
                                if (typeof oldElement.winControl.dispose === "function") {
                                    oldElement.winControl.dispose();
                                }
                            }
                            if (oldElement.resizeHelper &&
                                typeof oldElement.resizeHelper.dispose === "function") {
                                oldElement.resizeHelper.dispose();
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
                    if (this._fragments[id]._lastNavigationPromise && 
                        typeof this._fragments[id]._lastNavigationPromise.cancel === "function") {
                        Log.print(Log.l.trace, "cancel lastNavigationPromise of fragment[" + id + "]");
                        this._fragments[id]._lastNavigationPromise.cancel();
                    }
                    this._fragments[id]._lastNavigationPromise = WinJS.Promise.as().then(function() {
                        function abs(uri) {
                            var a = document.createElement("a");
                            a.href = uri;
                            return a.href;
                        }
                        newFragmentElement = that._createFragmentElement(id);
                        that._fragments[id]._element.appendChild(newFragmentElement);
                        that._fragments[id]._location = location;
                        Log.print(Log.l.trace, "PageControlNavigator: calling render fragment");
                        return WinJS.UI.Fragments.render(abs(location), newFragmentElement);
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
                            var that = this;
                            ret = WinJS.UI.Animation.enterContent(fragmentAnimationElements).then(function () {
                                return that.elementUpdateLayout(fragmentElement);
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
                    element.setAttribute("style", "display: inline-block; position: absolute; visibility: hidden; overflow-x: hidden; overflow-y: hidden;");
                    this._masterHidden = false;
                    if (this._nextMaster) {
                        var masterId = Application.getPageId(this._nextMaster);
                        if (AppData._persistentStates.resizeWidths && 
                            AppData._persistentStates.resizeWidths[masterId]) {
                            if (typeof AppData._persistentStates.resizeWidths[masterId] === "number") {
                                element.resizeWidth = AppData._persistentStates.resizeWidths[masterId];
                            } else if (typeof AppData._persistentStates.resizeWidths[masterId] === "string") {
                                element.resizeWidth = parseInt(AppData._persistentStates.resizeWidths[masterId]);
                            }
                        }
                    }
                    this.resizeMasterElement(element);
                    Log.ret(Log.l.trace, "");
                    return element;
                },

                // Creates a container for a new page to be loaded into.
                _createPageElement: function () {
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    var element = document.createElement("div");
                    element.setAttribute("dir", window.getComputedStyle(this._element, null).direction);
                    element.setAttribute("style", "display: inline-block; position: absolute; visibility: hidden; overflow-x: hidden; overflow-y: hidden;");
                    var elementBkg = document.createElement("div");
                    WinJS.Utilities.addClass(element, "row-bkg");
                    element.appendChild(elementBkg);
                    this.resizePageElement(element);
                    Log.ret(Log.l.trace, "");
                    return element;
                },

                _updateFragmentsLayout: function () {
                    var ret = null;
                    Log.call(Log.l.u1, "Application.PageControlNavigator.");
                    var keys = this.getFragmentKeys();
                    if (keys && keys.length > 0) {
                        for (var j = 0; j < keys.length; j++) {
                            var fragmentElement = this.getFragmentElement(keys[j]);
                            Log.print(Log.l.trace, "calling updateLayout of fragment id=" + keys[j]);
                            ret = this.elementUpdateLayout(fragmentElement);
                        }
                    }
                    Log.ret(Log.l.u1, "");
                    return ret || WinJS.Promise.as()
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
                        var newPageId = Application.getPageId(newPage);
                        var group = Application.groupFromPageId(newPageId);
                        var i;
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
                    Log.call(Log.l.trace, "Application.PageControlNavigator.", "removeBackStack=" + this._removeBackStack);
                    var animationDistanceX;
                    var animationDistanceY;
                    var animationOptions;
                    var iPrev = -1;
                    var iCur = -1;
                    var isGroup = false;
                    var removeBackStack = this._removeBackStack;
                    this._removeBackStack = false;
                    var navBarPos = this._navBarPos;
                    if (navBarPos) {
                        iPrev = navBarPos.iPrev;
                        iCur = navBarPos.iCur;
                        isGroup = navBarPos.isGroup;
                    }
                    var that = this;

                    function cleanup() {
                        Log.call(Log.l.trace, "Application.PageControlNavigator._navigated.");
                        if (!that.cleanupPrevPage) {
                            Log.print(Log.l.trace, "cleanupPrevPage already called!");
                        } else {
                            that.cleanupPrevPage();
                            that.cleanupPrevPage = null;
                        }
                        that._nextPage = null;
                        Log.ret(Log.l.trace, "");
                    }
                    var lastPage = this._lastPage;
                    this._lastPage = nav.location;
                    if (this._nextPageElement && this._nextPageElement.style) {
                        this._nextPageElement.style.visibility = "";
                    }
                    if (this._nextMaster === this._lastMaster) {
                        Log.print(Log.l.trace, "master not changed: _lastMaster=" + this._lastMaster);
                    } else {
                        Log.print(Log.l.trace, "master changed: _nextMaster=" + this._nextMaster + " _lastMaster=" + this._lastMaster);
                        this._prevAppBarHidden = null;
                        this._lastMaster = this._nextMaster;
                        if (this._nextMaster && this.masterElement && !this._masterHidden) {
                            this.masterElement.style.visibility = "";
                            this.resizeMasterElement(this.masterElement).then(function() {
                                that.createMasterResizeHelper();
                                Log.print(Log.l.trace, "PageControlNavigator: enter next master page");
                                animationDistanceX = -NavigationBar._animationDistanceX;
                                animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                WinJS.UI.Animation.enterContent(that._getAnimationElements(0, that.masterElement), animationOptions);
                            });
                        }
                    }
                    WinJS.Promise.as().then(function() {
                        if (lastPage === Application.initPage) {
                            Log.print(Log.l.trace, "calling cleanup first in case of lastPage === Application.initPage=" + Application.initPage);
                            cleanup();
                            that.resizePageElement(that.pageElement);
                            Log.print(Log.l.u1, "calling Animation.fadeIn...");
                            WinJS.UI.Animation.fadeIn(that._getAnimationElements(0, that._nextPageElement));
                        } else {
                            that.resizePageElement(that.pageElement);
                            if (NavigationBar.orientation !== "horizontal" ||
                                iPrev < 0 || iCur < 0 || iPrev === iCur ||
                                nav.location === Application.startPage) {
                                Log.print(Log.l.u1, "calling Animation.enterPage...");
                                WinJS.UI.Animation.enterPage(that._getAnimationElements(0, that._nextPageElement)).then(function () {
                                    cleanup();
                                }, cleanup);
                            } else if (isGroup) {
                                if (iPrev < iCur) {
                                    Log.print(Log.l.u1, "calling Animation.continuumBackwardIn...");
                                    WinJS.UI.Animation.continuumBackwardIn(that._nextPageElement, that._getAnimationElements(0, that._nextPageElement)).then(function () {
                                        cleanup();
                                    }, cleanup);
                                } else {
                                    Log.print(Log.l.u1, "calling Animation.continuumForwardIn...");
                                    WinJS.UI.Animation.continuumForwardIn(that._nextPageElement, that._getAnimationElements(0, that._nextPageElement)).then(function () {
                                        cleanup();
                                    }, cleanup);
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
                                Log.print(Log.l.u1, "calling Animation.enterContent...");
                                WinJS.UI.Animation.enterContent(that._getAnimationElements(0, that._nextPageElement), animationOptions, { mechanism: "transition" }).then(function () {
                                    cleanup();
                                }, cleanup);
                            }
                        }
                        if (removeBackStack) {
                            return WinJS.Promise.timeout(0);
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function postNavigatedRemoveBackStack() {
                        if (removeBackStack) {
                            Log.call(Log.l.u1, "Application.PageControlNavigator._navigated.");
                            if (WinJS.Navigation.history &&
                                WinJS.Navigation.history.backStack) {
                                Log.print(Log.l.trace, "remove previous page from navigation history!");
                                WinJS.Navigation.history.backStack.pop();
                            }
                            Log.ret(Log.l.u1, "");
                        }
                    });
                    Log.ret(Log.l.trace, "");
                },

                // Checks for valid state of current page before navigation via canUnload() function
                _beforenavigate: function (args) {
                    var isDisabled = false;
                    var prevPageId = Application.getPageId(nav.location);
                    var pageId = null;
                    var group = null;
                    Log.call(Log.l.trace, "Application.PageControlNavigator.");
                    if (args && args.detail && args.detail.location) {
                        var i;
                        pageId = Application.getPageId(args.detail.location);
                        group = Application.groupFromPageId(pageId);
                        if (NavigationBar.pages && NavigationBar.pages.length > 0) {
                            for (i = 0; i < NavigationBar.pages.length; i++) {
                                if (NavigationBar.pages[i] &&
                                    NavigationBar.pages[i].id === pageId &&
                                    (!group || NavigationBar.pages[i].group === group)) {
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
                    if (this._beforeNavigateWatchdog) {
                        if (typeof this._beforeNavigateWatchdog.cancel === "function") {
                            Log.print(Log.l.trace, "cancel previous beforeNavigateWatchdog promise");
                            this._beforeNavigateWatchdog.cancel();
                        }
                        this._beforeNavigateWatchdog = null;
                    }
                    if (this._beforeNavigatePromise &&
                        typeof this._beforeNavigatePromise.cancel === "function") {
                        Log.print(Log.l.trace, "cancel previous beforeNavigatePromise");
                        this._beforeNavigatePromise.cancel();
                    }
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
                                    that._inBeforeNavigatePromise = false;
                                    if (typeof that._syncNavigationBar === "function") {
                                        that._syncNavigationBar();
                                    }
                                }
                            });
                        });
                    } else {
                        var checkCanUnload = function () {
                            var ret;
                            Log.call(Log.l.trace, "Application.PageControlNavigator._beforenavigate.");
                            if (!(pageId === "register" || pageId === "recover" || (pageId === "account" && prevPageId === "login") || (pageId === "barcode" && prevPageId === "login")) &&
                                AppBar.notifyModified &&
                                that._element &&
                                that._element.firstElementChild &&
                                that._element.firstElementChild.winControl &&
                                typeof that._element.firstElementChild.winControl.canUnload === "function") {
                                ret = that._element.firstElementChild.winControl.canUnload(function(response) {
                                    Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate canUnload true!");
                                    return WinJS.Promise.timeout(0).then(function() {
                                        if (that._inBeforeNavigatePromise &&
                                            that._beforeNavigatePromise &&
                                            typeof that._beforeNavigatePromise._completed === "function") {
                                            // called asynchronously if ok
                                            Log.print(Log.l.trace, "from PageControlNavigator (true): _beforenavigate calling _completed()");
                                            that._beforeNavigatePromise._completed();
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
                                            that._inBeforeNavigatePromise = false;
                                            if (typeof that._syncNavigationBar === "function") {
                                                that._syncNavigationBar();
                                            }
                                        }
                                    });
                                }).then(function () {
                                    // handle waitfor asynchronously called return values
                                    that._beforeNavigateWatchdog = WinJS.Promise.timeout(120000).then(function () {
                                        Log.print(Log.l.info, "from PageControlNavigator: _beforenavigate canUnload timeout!");
                                        if (that._inBeforeNavigatePromise &&
                                            that._beforeNavigatePromise &&
                                            typeof that._beforeNavigatePromise.cancel === "function") {
                                            Log.print(Log.l.trace, "from PageControlNavigator (timeout): _beforenavigate calling cancel()");
                                            that._beforeNavigatePromise.cancel();
                                            that._inBeforeNavigatePromise = false;
                                            if (typeof that._syncNavigationBar === "function") {
                                                that._syncNavigationBar();
                                            }
                                        }
                                    });
                                    return that._beforeNavigateWatchdog;
                                });
                            } else {
                                ret = new WinJS.Promise.as().then(function() {
                                    Log.print(Log.l.trace, "from PageControlNavigator: _beforenavigate done!");
                                    return WinJS.Promise.timeout(0).then(function () {
                                        if (that._inBeforeNavigatePromise &&
                                            that._beforeNavigatePromise &&
                                            typeof that._beforeNavigatePromise._completed === "function") {
                                            // called asynchronously if ok
                                            Log.print(Log.l.trace, "from PageControlNavigator (true): _beforenavigate calling _completed()");
                                            that._beforeNavigatePromise._completed();
                                            that._inBeforeNavigatePromise = false;
                                        }
                                    });
                                });
                            }
                            Log.ret(Log.l.trace, "");
                            return ret;
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
                        var countFragments = keys && keys.length;
                        Log.print(Log.l.trace, "countFragments=" + countFragments);
                        if (countFragments > 0) {
                            var fragmentPromises = {};
                            for (var j = 0; j < countFragments; j++) {
                                var id = keys[j];
                                Log.print(Log.l.trace, "adding beforeLoad promise of fragment[" + id + "]");
                                fragmentPromises[id] = that._beforeload(id);
                            }
                            this._beforeNavigatePromise = new WinJS.Promise.as().then(function () {
                                Log.print(Log.l.trace, "from _beforenavigate: waiting for fulfillment of " + countFragments + " fragment promises...");
                                return WinJS.Promise.join(fragmentPromises);
                            }).then(function () {
                                Log.print(Log.l.trace, "from _beforenavigate: all fragment promises fulfilled...");
                                return checkCanUnload();
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

                    var noPushState = this._noPushState;
                    this._noPushState = false;

                    var newMasterElement = null;
                    this._nextMaster = null;

                    this._nextPageElement = null;
                    this._nextPage = args.detail.location;

                    var prevPageElement = this.pageElement;
                    var lastPage = this._lastPage;
                    var prevAnimationElements = null;
                    if (AppData._persistentStates.showAppBkg) {
                        prevAnimationElements = this._getAnimationElements();
                    }

                    var prevFragments = this._fragments;

                    var animationDistanceX;
                    var animationDistanceY;
                    var animationOptions;

                    var that = this;

                    if (!noPushState && window.history) {
                        var state = {};
                        var title = "";
                        var pageId = Application.getPageId(this._nextPage);
                        if (Application.query) {
                            Application.query.pageId = pageId;
                        } else {
                            Application.query = {
                                pageId: pageId
                            }
                        }
                        var url = window.location.href.split("?")[0] + "?" + createQueryStringFromParameters(Application.query);
                        window.history.pushState(state, title, url);
                    };
                    function cleanupOldElement(oldElement) {
                        Log.call(Log.l.trace, "Application.PageControlNavigator.");
                        // Cleanup and remove previous element
                        if (oldElement) {
                            if (oldElement.winControl) {
                                if (oldElement.winControl.unload) {
                                    oldElement.winControl.unload();
                                }
                                if (oldElement.winControl.controller) {
                                    oldElement.winControl.controller = null;
                                }
                                if (typeof oldElement.winControl.dispose === "function") {
                                    oldElement.winControl.dispose();
                                }
                            }
                            if (oldElement.resizeHelper &&
                                typeof oldElement.resizeHelper.dispose === "function") {
                                oldElement.resizeHelper.dispose();
                            }
                            oldElement.parentNode.removeChild(oldElement);
                            oldElement.innerHTML = "";
                        }
                        Log.ret(Log.l.trace);
                    }
                    this.cleanupPrevPage = function () {
                        Log.call(Log.l.trace, "Application.PageControlNavigator.");
                        while (that._element.childElementCount > 1) {
                            if (prevFragments) {
                                var propertyName;
                                for (propertyName in prevFragments) {
                                    if (prevFragments.hasOwnProperty(propertyName)) {
                                        Log.print(Log.l.trace, "cleanup fragments[" + propertyName + "]");
                                        if (prevFragments[propertyName]._lastNavigationPromise) {
                                            if (typeof prevFragments[propertyName]._lastNavigationPromise.cancel === "function") {
                                                Log.print(Log.l.trace, "cancel lastNavigationPromise of fragments[" + propertyName + "]");
                                                prevFragments[propertyName]._lastNavigationPromise.cancel();
                                            }
                                            prevFragments[propertyName]._lastNavigationPromise = null;
                                        }
                                        if (prevFragments[propertyName]._beforeLoadWatchdog) {
                                            if (typeof prevFragments[propertyName]._beforeLoadWatchdog.cancel === "function") {
                                                Log.print(Log.l.trace, "cancel beforeLoadWatchdog of fragments[" + propertyName + "]");
                                                prevFragments[propertyName]._beforeLoadWatchdog.cancel();
                                            }
                                            prevFragments[propertyName]._beforeLoadWatchdog = null;
                                        }
                                        if (prevFragments[propertyName]._beforeLoadPromise) {
                                            if (prevFragments[propertyName]._inBeforeLoadPromise &&
                                                typeof prevFragments[propertyName]._beforeLoadPromise.cancel === "function") {
                                                Log.print(Log.l.trace, "cancel beforeLoadPromise of fragments[" + propertyName + "]");
                                                prevFragments[propertyName]._beforeLoadPromise.cancel();
                                            }
                                            prevFragments[propertyName]._beforeLoadPromise = null;
                                        }
                                        if (prevFragments[propertyName]._element) {
                                            cleanupOldElement(prevFragments[propertyName]._element.firstElementChild);
                                        }
                                        delete prevFragments[propertyName];
                                    }
                                }
                            }
                            cleanupOldElement(that._element.firstElementChild);
                        }
                        Log.ret(Log.l.trace);
                    };

                    if (this._lastNavigationPromise &&
                        typeof this._lastNavigationPromise.cancel === "function") {
                        Log.print(Log.l.trace, "cancel lastNavigationPromise");
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
                        return that.resizeMasterElement(newMasterElement) || WinJS.Promise.as();
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
                    }).then(function () {
                        if (that.resizeSplitView() && newMasterElement) {
                            return that.resizeMasterElement(newMasterElement);
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        return that.resizePageElement(that._nextPageElement);
                    }).then(function () {
                        if (prevAnimationElements && prevAnimationElements.length > 0) {
                            var nextPage;
                            var iPrev = -1;
                            var iCur = -1;
                            var isGroup = false;
                            Log.print(Log.l.trace, "PageControlNavigator: calling exit previous page");
                            if (NavigationBar.data && NavigationBar.ListView) {
                                var newPageId = Application.getPageId(args.detail.location);
                                var group = Application.groupFromPageId(newPageId);
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
                    }, function() {
                        that.cleanupPrevPage();
                        that.cleanupPrevPage = null;
                    });
                    args.detail.setPromise(this._lastNavigationPromise);
                    Log.ret(Log.l.trace, "");
                },
                
                // Responds to orientationchange events
                // on the currently loaded page.
                _orientationchanged: function (args) {
                    Log.call(Log.l.u1, "PageControlNavigator.");
                    // set orientation here
                    NavigationBar.updateOrientation();

                    // call resized later
                    var that = this;
                    WinJS.Promise.timeout(0).then(function() {
                        that._resized(args);
                    });
                    Log.ret(Log.l.u1);
                },

                // Responds to onpopstate event  
                // on the browser history state, e.g back button.
                _popstate : function(event) {
                    //WinJS.Promise.timeout(50).then(function() {
                    var pageId = Application.getPageId(nav.location);
                    var query = getQueryStringParameters();
                        Log.call(Log.l.trace, "PageControlNavigator.", "pageId=" + pageId + " query.pageId=" + (query && query.pageId));
                        if (query && query.pageId && pageId && query.pageId !== pageId) {
                            var path = Application.getPagePath(query.pageId);
                            var stepsBack = Application.getBackStackIndex(path);
                            var stepsForward = Application.getForwardStackIndex(path);
                            if (stepsForward > 0 && !(stepsBack > 0 && stepsBack < stepsForward)) {
                                Application.navigator._noPushState = true;
                                nav.forward(stepsForward);
                            } else if (stepsBack > 0) {
                                Application.navigator._noPushState = true;
                                nav.back(stepsBack);
                            } else if (stepsForward < 0 && stepsBack < 0) {
                                Application.navigateById(query.pageId);
                            }
                        }
                        Log.ret(Log.l.trace);
                    //});
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
                    var width = document.body.clientWidth;
                    var height = document.body.clientHeight;
                    Log.call(Log.l.u1, "PageControlNavigator.", "width=" + width + " height=" + height);
                    // close submenu
                    var subMenuFlyout = Application.navigator && Application.navigator.subMenuFlyout;
                    if (subMenuFlyout && typeof subMenuFlyout.close === "function") {
                        subMenuFlyout.close();
                    }
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
                    }
                    // in case of no page loaded, set orientation here
                    NavigationBar.updateOrientation();
                    // current size of page
                    if (Application.navigator) {
                        if (AppBar.barControl) {
                            var prevPlacement = AppBar.barControl.placement;
                            if (prevPlacement) {
                                var newPlacement;
                                var newZindex;
                                if (width > Application.maxViewSize.bigger) {
                                    newPlacement = "top";
                                    newZindex = 0;
                                } else {
                                    newPlacement = "bottom";
                                    newZindex = 999;
                                }
                                if (prevPlacement !== newPlacement) {
                                    AppBar.barControl.placement = newPlacement;
                                    if (AppBar.barElement && AppBar.barElement.style) {
                                        AppBar.barElement.style.zIndex = newZindex;
                                    }
                                }
                            }
                        }
                        // Resize splitView
                        Application.navigator.resizeSplitView();
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
                    var ret = null;
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
                            ret = WinJS.UI.Animation.enterContent(this.pageElement, animationOptions).then(function () {
                                if (that.masterElement) {
                                    that.masterElement.style.zIndex = "-9990";
                                    that.masterElement.style.visibility = "hidden";
                                    that.resizeMasterElement(that.masterElement);
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.u1);
                    return (ret || WinJS.Promise.as()).then(function() {
                        AppBar.triggerDisableHandlers();
                        return WinJS.Promise.as();
                    });
                },

                _showMaster: function () {
                    var ret = null;
                    Log.call(Log.l.u1, "PageControlNavigator.");
                    if (this._masterHidden) {
                        this._prevAppBarHidden = null;
                        this._masterHidden = false;
                        if (NavigationBar.ListView) {
                            NavigationBar.ListView.updateLayout();
                        }
                        if (this.masterElement) {
                            this.masterElement.style.visibility = "";
                            this.masterElement.style.zIndex = "1";
                        }
                        if (this.pageElement) {
                            var animationDistanceX = this.masterElement ? this.masterElement.clientWidth : 450;
                            var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                            var that = this;
                            ret = WinJS.UI.Animation.exitContent(this.pageElement, animationOptions).then(function () {
                                if (that.masterElement) {
                                    that.resizeMasterElement(that.masterElement);
                                }
                                return that.resizePageElement(that.pageElement);
                            });
                        }
                    }
                    Log.ret(Log.l.u1);
                    return (ret || WinJS.Promise.as()).then(function() {
                       AppBar.triggerDisableHandlers();
                       return WinJS.Promise.as();
                    });
                },

                createMasterResizeHelper: function() {
                    var masterElement = this.masterElement;
                    if (masterElement && this._nextMaster) {
                        if (masterElement.resizeHelper &&
                            typeof masterElement.resizeHelper.dispose === "function") {
                            masterElement.resizeHelper.dispose();
                        }
                        var masterId = Application.getPageId(this._nextMaster);
                        masterElement.resizeHelper = new Application.ResizeHelper(masterElement, {
                            minsize: 1,
                            //maxsize: -350,
                            svgMaximize: "fit_to_right",
                            svgRestore: "fit_to_left",
                            onsizechanging: function (newWidth) {
                                masterElement.resizeWidth = newWidth;
                                if (!NavigationBar._resizedPromise) {
                                    NavigationBar._resizedPromise = WinJS.Promise.timeout(10).then(function () {
                                        // now do complete resize later!
                                        Application.navigator._resized();
                                        NavigationBar._resizedPromise = null;
                                    });
                                }
                            },
                            onsizechanged: function (newWidth) {
                                masterElement.resizeWidth = Math.round(newWidth);
                                if (Application.navigator) {
                                    if (!Application.navigator._masterMaximized &&
                                        masterElement.resizeWidth >= 0 && masterElement.resizeWidth <= 350) {
                                        Application.navigator._hideMaster();
                                    }
                                }
                                if (!AppData._persistentStates.resizeWidths) {
                                    AppData._persistentStates.resizeWidths = {};
                                }
                                AppData._persistentStates.resizeWidths[masterId] = masterElement.resizeWidth;
                                if (Application.pageframe) {
                                    Application.pageframe.savePersistentStates();
                                }
                                if (!NavigationBar._resizedPromise) {
                                    NavigationBar._resizedPromise = WinJS.Promise.timeout(10).then(function () {
                                        // now do complete resize later!
                                        Application.navigator._resized();
                                        NavigationBar._resizedPromise = null;
                                    });
                                }
                            },
                            onmaximized: function(isMaximized) {
                                if (Application.navigator) {
                                    if (isMaximized) {
                                        if (!Application.navigator._masterMaximized) {
                                            var splitViewContent = Application.navigator && Application.navigator.splitViewContent;
                                            if (splitViewContent) {
                                                masterElement.resizeWidth = splitViewContent.clientWidth;
                                            }
                                        }
                                    } else {
                                        if (Application.navigator._masterMaximized) {
                                            masterElement.resizeWidth = 0;
                                        }
                                    }
                                    if (masterElement.style) {
                                        masterElement.style.width = masterElement.resizeWidth.toString() + "px";
                                    }
                                    if (!NavigationBar._resizedPromise) {
                                        NavigationBar._resizedPromise = WinJS.Promise.timeout(10).then(function () {
                                            // now do complete resize later!
                                            Application.navigator._resized();
                                            NavigationBar._resizedPromise = null;
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            }
        ),
        /**
         * @class ResizeHelper 
         * @memberof Application
         * @param {Object} element - Element to be resized (horizontal in it's width or vertical in it's height)
         * @param {Object} options - Resize options
         * @param {Boolean} options.vertical - Vertical resize, increase or decrease the height of the element.
         * (Default is horizontal, increase or decrease the width of ehe element)
         * @param {function} options.onsizechanged - Callback function to be called after resize
         * @param {function} options.onsizechanging - Callback function to be called while resize
         * @description This class is used to help resizing of elements
         */
         ResizeHelper: WinJS.Class.define(
             function ResizeHelper(element, options) {
                 Log.call(Log.l.trace, "ResizeHelper.");
                 this._options = options;
                 this._element = element;
                 this._sizeAdd = options && options.sizeadd;

                 if (!this._element) {
                     Log.ret(Log.l.error, "null param!");
                     return;
                 }
                 var that = this;
                 var svgPromises = null;
                 var commandingSurface = null;
                 if (options && options.svgMaximize && options.svgRestore) {
                     svgPromises = {};
                     function createCommand(id, svg) {
                         Log.call(Log.l.trace, "ResizeHelper.");
                         var command = new WinJS.UI.Command(null, {
                             section: "primary",
                             id: id,
                             //label: getResourceText("command."+id),
                             tooltip: getResourceText("tooltip."+id)
                         });
                         if (command.element && svg) {
                             var winCommandImage = command.element.querySelector(".win-commandimage");
                             if (winCommandImage) {
                                var svgObject = document.createElement("div");
                                if (svgObject) {
                                    var symbolSize = 24;
                                    svgObject.setAttribute("width", symbolSize.toString());
                                    svgObject.setAttribute("height", symbolSize.toString());
                                    svgObject.style.display = "inline";
                                    svgObject.id = svg;

                                    // insert svg object before span element
                                    var parentNode = winCommandImage.parentNode;
                                    parentNode.insertBefore(svgObject, winCommandImage);
                                    var childElementCount = parentNode.childElementCount;
                                    if (childElementCount > 2) {
                                        // remove prev. element
                                        var prevImage = parentNode.firstElementChild;
                                        if (prevImage) {
                                            parentNode.removeChild(prevImage);
                                            prevImage.innerHTML = "";
                                        }
                                    }
                                    // overlay span element over svg object to enable user input
                                    winCommandImage.setAttribute("style",
                                        "position: relative; top: -" +
                                        (symbolSize + 4).toString() +
                                        "px; width: " +
                                        symbolSize.toString() +
                                        "px; height: " +
                                        symbolSize.toString() +
                                        "px; background-size: " +
                                        AppBar._appBar._heightOfCompact.toString() +
                                        "px " +
                                        AppBar._appBar._heightOfCompact.toString() +
                                        "px;");
                                    // load the image file
                                    svgPromises[options.svgRestore] = Colors.loadSVGImage({
                                        fileName: svg,
                                        color: Colors.navigationColor,
                                        element: svgObject,
                                        size: symbolSize,
                                        strokeWidth: AppData._persistentStates.iconStrokeWidth
                                    });
                                }
                             }
                         }
                         Log.ret(Log.l.trace);
                         return command;
                     }
                     var actionArea = document.createElement("div");
                     WinJS.Utilities.addClass(actionArea,"win-commandingsurface-actionarea");
                     this._commands = [];
                     this._commands.push(createCommand("windowMaximized", options.svgMaximize));
                     this._commands.push(createCommand("windowRestored", options.svgRestore));
                     this._commands.forEach(function(command) {
                         if (command.element) {
                             actionArea.appendChild(command.element);
                         }
                     });
                     commandingSurface = document.createElement("div");
                     WinJS.Utilities.addClass(commandingSurface,"win-commandingsurface");
                     WinJS.Utilities.addClass(commandingSurface,"resize-helper-command-container");
                     commandingSurface.appendChild(actionArea);
                 }
                 function createGripper() {
                     var div = document.createElement("div");
                     WinJS.Utilities.addClass(div,"resize-helper-gripper");
                     if (options && options.vertical) {
                         WinJS.Utilities.addClass(div,"resize-helper-vertical");
                     } else {
                         WinJS.Utilities.addClass(div,"resize-helper-horizontal");
                     }
                     return div;
                 }
                 this._gripper = createGripper();
                 this._events = [
                     {
                         name: "click",
                         handler: function onClick(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (eventInfo && eventInfo.currentTarget && that._options) {
                                 var isMaximized = false;
                                 if (eventInfo.currentTarget.winControl &&
                                     eventInfo.currentTarget.winControl.id === "windowMaximized") {
                                     isMaximized = true;
                                 }
                                 if (typeof that._options.onmaximized === "function") {
                                     that._options.onmaximized(isMaximized);
                                 }
                             }
                             Log.ret(Log.l.trace);
                         },
                         bound: null,
                         target: that._commands ? that._commands.map(function (command) { return command.element; }) : null
                     },
                     { 
                         name: "mouseover", 
                         handler: function onMouseOver(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (eventInfo && eventInfo.target === that._gripper && 
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "opacity linear 500ms";
                                 that._gripper.style.webkitTransition = "opacity linear 500ms";
                                 that._gripper.style.opacity = 0.4;
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setCapture === "function" &&
                             typeof document.releaseCapture === "function" &&
                             !(typeof that._gripper.setPointerCapture === "function")) ? that._gripper : null
                     }, 
                     { 
                         name: "mouseout", 
                         handler: function onMouseOut(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (eventInfo && eventInfo.target === that._gripper && 
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "opacity linear 167ms";
                                 that._gripper.style.webkitTransition = "opacity linear 167ms";
                                 that._gripper.style.opacity = 0;
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setCapture === "function" &&
                            typeof document.releaseCapture === "function" &&
                            !(typeof that._gripper.setPointerCapture === "function")) ? that._gripper : null
                     }, 
                     { 
                         name: "pointerover", 
                         handler: function onMouseOver(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (eventInfo && eventInfo.target === that._gripper && 
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "opacity linear 500ms";
                                 that._gripper.style.webkitTransition = "opacity linear 500ms";
                                 that._gripper.style.opacity = 0.4;
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setPointerCapture === "function" &&
                             typeof that._gripper.releasePointerCapture === "function") ? that._gripper : null
                     }, 
                     { 
                         name: "pointerleave", 
                         handler: function onMouseOut(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (eventInfo && eventInfo.target === that._gripper && 
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "opacity linear 167ms";
                                 that._gripper.style.webkitTransition = "opacity linear 167ms";
                                 that._gripper.style.opacity = 0;
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setPointerCapture === "function" &&
                             typeof that._gripper.releasePointerCapture === "function") ? that._gripper : null
                     }, 
                     { 
                         name: "mousedown", 
                         handler: function onMouseDown(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (!that._pointerCaptured && eventInfo && that._options &&
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "";
                                 that._gripper.style.webkitTransition = "";
                                 that._gripper.style.opacity = 0.6;
                                 that._pageX = eventInfo.pageX;
                                 that._pageY = eventInfo.pageY;
                                 if (that._options.vertical) {
                                     that._initialSize = that._element.clientHeight;
                                 } else {
                                     that._initialSize = that._element.clientWidth;
                                 }
                                 that._currentSize = that._initialSize;
                                 that._pointerCaptured = true;
                                 that._gripper.setCapture();
                             }
                             Log.ret(Log.l.trace);
                         },  
                         bound: null, 
                         target: (typeof that._gripper.setCapture === "function" &&
                             typeof document.releaseCapture === "function" &&
                             !(typeof that._gripper.setPointerCapture === "function")) ? that._gripper : null
                     }, 
                     { 
                         name: "mousemove", 
                         handler: function onMouseMove(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (that._pointerCaptured && eventInfo && that._options &&
                                 that._initialSize && that._element && that._element.style) {
                                 if (that._options.vertical) {
                                     var deltaY = eventInfo.pageY - that._pageY;
                                     that._currentSize = that._initialSize + deltaY;
                                     if (that._options.maxsize) {
                                         that._currentSize = Math.min(that._options.maxsize, that._currentSize);
                                     }
                                     if (that._options.minsize) {
                                         that._currentSize = Math.max(that._options.minsize, that._currentSize);
                                     }
                                     that._element.style.height = (that._currentSize + that._sizeAdd).toString() + "px";
                                 } else {
                                     var deltaX = eventInfo.pageX - that._pageX;
                                     that._currentSize = that._initialSize + deltaX;
                                     if (that._options.maxsize) {
                                         if (that._options.maxsize > 0) {
                                             that._currentSize = Math.min(that._options.maxsize, that._currentSize);
                                         } else if (Application.navigator && Application.navigator.splitViewContent) {
                                             var width = Application.navigator.splitViewContent.clientWidth;
                                             that._currentSize = Math.min(width + that._options.maxsize, that._currentSize);
                                         }
                                     }
                                     if (that._options.minsize) {
                                         that._currentSize = Math.max(that._options.minsize, that._currentSize);
                                     }
                                     that._element.style.width = (that._currentSize + that._sizeAdd).toString() + "px";
                                 }
                                 if (that._options && typeof that._options.onsizechanging === "function") {
                                     that._options.onsizechanging(that._currentSize);
                                 }
                             }
                             Log.ret(Log.l.trace);
                        }, 
                         bound: null, 
                         target: (typeof that._gripper.setCapture === "function" &&
                             typeof document.releaseCapture === "function" &&
                             !(typeof that._gripper.setPointerCapture === "function")) ? that._gripper : null
                     },
                     { 
                         name: "mouseup", handler: function onMouseUp(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (that._pointerCaptured && eventInfo && that._options &&
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "";
                                 that._gripper.style.webkitTransition = "";
                                 that._gripper.style.opacity = 0;
                                 if (typeof that._options.onsizechanged === "function") {
                                     that._options.onsizechanged(that._currentSize);
                                 }
                                 that._currentSize = 0;
                                 document.releaseCapture();
                                 that._pointerCaptured = false;
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setCapture === "function" &&
                             typeof document.releaseCapture === "function" &&
                             !(typeof that._gripper.setPointerCapture === "function")) ? that._gripper : null
                     },
                     { 
                         name: "pointerdown", 
                         handler: function onPointerDown(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (!that._pointerCaptured && eventInfo && that._options &&
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "";
                                 that._gripper.style.webkitTransition = "";
                                 that._gripper.style.opacity = 0.6;
                                 that._pageX = eventInfo.pageX;
                                 that._pageY = eventInfo.pageY;
                                 if (that._options.vertical) {
                                     that._initialSize = that._element.clientHeight;
                                 } else {
                                     that._initialSize = that._element.clientWidth;
                                 }
                                 that._currentSize = that._initialSize;
                                 that._pointerCaptured = true;
                                 that._pointerType = eventInfo.pointerType;
                                 that._pointerId = eventInfo.pointerId;
                                 that._gripper.setPointerCapture(eventInfo.pointerId);
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setPointerCapture === "function" &&
                             typeof that._gripper.releasePointerCapture === "function") ? that._gripper : null
                     },
                     { 
                         name: "pointermove", handler: function onPointerMove(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (that._pointerCaptured && eventInfo && that._options &&
                                 that._pointerType === eventInfo.pointerType && 
                                 that._pointerId === eventInfo.pointerId && that._initialSize &&
                                 that._element && that._element.style) {
                                 if (that._options.vertical) {
                                     var deltaY = eventInfo.pageY - that._pageY;
                                     that._currentSize = that._initialSize + deltaY;
                                     if (that._options.maxsize) {
                                         that._currentSize = Math.min(that._options.maxsize, that._currentSize);
                                     }
                                     if (that._options.minsize) {
                                         that._currentSize = Math.max(that._options.minsize, that._currentSize);
                                     }
                                     that._element.style.height = (that._currentSize + that._sizeAdd).toString() + "px";
                                 } else {
                                     var deltaX = eventInfo.pageX - that._pageX;
                                     that._currentSize = that._initialSize + deltaX;
                                     if (that._options.maxsize) {
                                         if (that._options.maxsize > 0) {
                                             that._currentSize = Math.min(that._options.maxsize, that._currentSize);
                                         } else if (Application.navigator && Application.navigator.splitViewContent) {
                                             var width = Application.navigator.splitViewContent.clientWidth;
                                             that._currentSize = Math.min(width + that._options.maxsize, that._currentSize);
                                         }
                                     }
                                     if (that._options.minsize) {
                                         that._currentSize = Math.max(that._options.minsize, that._currentSize);
                                     }
                                     that._element.style.width = (that._currentSize + that._sizeAdd).toString() + "px";
                                 }
                                 if (that._options && typeof that._options.onsizechanging === "function") {
                                     that._options.onsizechanging(that._currentSize);
                                 }
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setPointerCapture === "function" &&
                             typeof that._gripper.releasePointerCapture === "function") ? that._gripper : null
                     },
                     { 
                         name: ["pointerup", "pointercancel", "lostpointercapture"], handler: function onPointerUp(eventInfo) {
                             Log.call(Log.l.trace, "ResizeHelper.");
                             if (that._pointerCaptured && eventInfo && that._options &&
                                 that._pointerType === eventInfo.pointerType && 
                                 that._pointerId === eventInfo.pointerId && 
                                 that._gripper && that._gripper.style) {
                                 that._gripper.style.transition = "";
                                 that._gripper.style.webkitTransition = "";
                                 that._gripper.style.opacity = 0;
                                 if (typeof that._options.onsizechanged === "function") {
                                     that._options.onsizechanged(that._currentSize);
                                 }
                                 that._currentSize = 0;
                                 that._gripper.releasePointerCapture(eventInfo.pointerId);
                                 that._pointerCaptured = false;
                                 that._pointerId = null;
                                 that._pointerType = null;
                             }
                             Log.ret(Log.l.trace);
                         }, 
                         bound: null, 
                         target: (typeof that._gripper.setPointerCapture === "function" &&
                             typeof that._gripper.releasePointerCapture === "function") ? that._gripper : null
                     }
                 ];
                 that._events.forEach(function(eventsItem) {
                     if (eventsItem && eventsItem.target && eventsItem.handler) {
                         function bindEvent(eventName) {
                             if (typeof eventName === "string") {
                                 eventsItem.bound = eventsItem.handler.bind(that);
                                 Log.print(Log.l.trace, "bind event '" + eventName + "'");
                                 if (typeof eventsItem.target.forEach === "function") {
                                     eventsItem.target.forEach(function(target) {
                                         target.addEventListener(eventName, eventsItem.bound, false);
                                     });
                                 } else {
                                     eventsItem.target.addEventListener(eventName, eventsItem.bound, false);
                                 }
                             }
                         }
                         if (typeof eventsItem.name.forEach === "function") {
                             eventsItem.name.forEach(bindEvent);
                         } else {
                             bindEvent(eventsItem.name);
                         }
                     }
                 });
                 if (this._gripper) {
                     this._element.appendChild(this._gripper);
                 }
                 if (svgPromises) {
                     WinJS.Promise.join(svgPromises).then(function() {
                         if (that._element && commandingSurface) {
                             that._element.appendChild(commandingSurface);
                             that.minMaxChanged(Application.navigator && Application.navigator._masterMaximized);
                         }
                     });
                 }
                 Log.ret(Log.l.trace);
             }, {
                 /**
                  * @function dispose
                  * @memberof Application.ResizeHelper
                  * @description Used to dispose this object and free all of it's resources.
                  */
                 dispose: function () {
                     Log.call(Log.l.trace, "ResizeHelper.");
                     if (this._disposed) {
                         Log.ret(Log.l.trace);
                         return;
                     }
                     var that = this;
                     if (this._element) {
                         if (this._gripper) {
                             if (this._events) {
                                 that._events.forEach(function (eventsItem) {
                                     if (eventsItem && eventsItem.target && eventsItem.handler) {
                                         function removeEvent(eventName) {
                                             if (typeof eventName === "string") {
                                                 eventsItem.bound = eventsItem.handler.bind(that);
                                                 Log.print(Log.l.trace, "bind event '" + eventName + "'");
                                                 if (typeof eventsItem.target.forEach === "function") {
                                                     eventsItem.target.forEach(function(target) {
                                                         target.removeEventListener(eventName, eventsItem.bound);
                                                     });
                                                 } else {
                                                     eventsItem.target.removeEventListener(eventName, eventsItem.bound);
                                                 }
                                             }
                                         }
                                         if (typeof eventsItem.name.forEach === "function") {
                                             eventsItem.name.forEach(removeEvent);
                                         } else {
                                             removeEvent(eventsItem.name);
                                         }
                                     }
                                 });
                                 this._events = null;
                             }
                             this._element.removeChild(this._gripper);
                             this._gripper = null;
                         }
                         this._element = null;
                     }
                     Log.ret(Log.l.trace);
                 },
                 minMaxChanged: function(isMaximized) {
                     if (this._options && this._commands) {
                         this._commands.forEach(function(command) {
                             if (command) {
                                 command.disabled = isMaximized ? 
                                     !(command.id === "windowRestored") : !(command.id === "windowMaximized");
                             } 
                         });
                     }
                 },
                 inResize: {
                     get: function() {
                         return this._pointerCaptured;
                     }
                 },
                 _options: {},
                 _events: [],
                 _element: null,
                 _gripper: null,
                 _command: null,
                 _disposed: false,
                 _initialSize: 0,
                 _currentSize: 0,
                 _pageX: 0,
                 _pageY: 0,
                 _pointerCaptured: false,
                 _pointerId: null,
                 _pinterType: null,
                 _sizeAdd: 0
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
                        NavigationBar.splitViewPaneWidth = AppData._persistentStates.splitViewPaneWidth;

                        splitViewRoot.addEventListener("beforeopen", NavigationBar.handleSplitViewBeforeOpen);
                        splitViewRoot.addEventListener("afteropen", NavigationBar.handleSplitViewAfterOpen);
                        splitViewRoot.addEventListener("afterclose", NavigationBar.handleSplitViewAfterClose);
                    }
                    NavigationBar.createSplitViewPaneResizeHelper();
                    var subMenuList = Application.navigator && Application.navigator.subMenuList;
                    if (subMenuList) {
                        subMenuList.addEventListener("iteminvoked", NavigationBar.handleSubmenuInvoked);
                        subMenuList.addEventListener("loadingstatechanged", NavigationBar.handleSubmenuLoadingStateChanged);
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
                        NavigationBar.navHorzHeight = AppData.persistentStatesDefaults.navHorzHeight;
                    } else {
                        listOrientation = "vertical";
                        NavigationBar.navVertWidth = AppData.persistentStatesDefaults.navVertWidth;
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
                    if (this._element.parentNode &&
                        this._element.parentNode.style) {
                        this._element.parentNode.style.visibility = "hidden";
                        this._element.parentNode.style.zIndex = -this._zIndex;
                        this._visibility = "hidden";
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
                        this._element.addEventListener("wheel", this.wheelHandler.bind(this), {passive: true});
                        this._element.addEventListener("mousewheel", this.wheelHandler.bind(this), {passive: true});
                        this._touchPhysics = new TouchPhysics.TouchPhysics(this.onTouch.bind(this));

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
                    get: function () { return this._element; }
                },
                // winControl property, returns the WinJS control
                /**
                 * @property {Object} listControl - The ListView object of the navigation bar ListView
                 * @memberof NavigationBar.ListViewClass
                 * @description Read-only. Retrieves the {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211837.aspx WinJS.UI.ListView} object of the navigation bar list view. 
                 */
                listControl: {
                    get: function () { return this._element && this._element.winControl; }
                },
                // orientation of list property, returns the orientation value
                /**
                 * @property {string} listOrientation - Possible values: "horizontal" or "vertical"
                 * @memberof NavigationBar.ListViewClass
                 * @description Read-only. Retrieves the orientation of the navigation bar ListView. 
                 */
                listOrientation: {
                    get: function () { return this._listOrientation; }
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

                            var splitViewPane = Application.navigator.splitViewPane;
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
                                        if (openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.overlay && window.innerWidth <= Application.maxViewSize.small) {
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
                                } else if (window.innerWidth <= Application.maxViewSize.small) {
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
                                    if (splitViewControl.paneOpened) {
                                        splitViewControl.closePane();
                                    }
                                    splitViewControl.openedDisplayMode = openedDisplayMode;
                                    if (window.innerWidth > 1149 && !splitViewControl.paneOpened) {
                                        splitViewControl.openPane();
                                    }
                                }
                            }
                            var element = NavigationBar.ListView && NavigationBar.ListView.listElement;
                            var listControl = NavigationBar.ListView && NavigationBar.ListView.listControl;
                            var containers, container, i, selectionBkg;
                            if (element && listControl) {
                                // current window dimension
                                if (NavigationBar.ListView._listOrientation === "vertical") {
                                    // set list height to window height
                                    if (element.style) {
                                        var strHeight = height.toString() + "px";
                                        if (element.parentNode && element.parentNode.style) {
                                            element.parentNode.style.height = strHeight;
                                        }
                                        strHeight = height.toString() + "px";
                                        element.style.height = strHeight;
                                    }
                                    if (listControl.loadingState === "complete") {
                                        containers = element.querySelectorAll(".win-container");
                                        if (containers && containers.length === NavigationBar.data.length) {
                                            for (i = 0; i < NavigationBar.data.length; i++) {
                                                container = containers[i];
                                                if (container) {
                                                    selectionBkg = container.querySelector(".win-selectionbackground");
                                                    if (selectionBkg && selectionBkg.style) {
                                                        selectionBkg.style.backgroundColor = Colors.navigationColor;
                                                        selectionBkg.style.opacity = 1;
                                                    }
                                                }
                                            }

                                        }
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
                                        if (splitViewPane && splitViewPane.parentElement.clientWidth > 0) {
                                            width -= splitViewPane.clientWidth;
                                        }
                                    }
                                     */
                                    var left = 0;
                                    if (Application.navigator._nextMaster &&
                                        Application.navigator.masterElement && 
                                        !Application.navigator._masterHidden) {
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
                                        containers = element.querySelectorAll(".win-container");
                                        if (containers && containers.length === NavigationBar.data.length) {
                                            var fontWidth = width > Application.maxViewSize.small ? 10 : 7;
                                            var totalLen = 0;
                                            var maxLen = 0;
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
                                                    container = containers[i];
                                                    if (container) {
                                                        var strContainerWidth = widthNavigationbarItem.toString() + "px";
                                                        if (container.style) {
                                                            container.style.width = strContainerWidth;
                                                        }
                                                        selectionBkg = container.querySelector(".win-selectionbackground");
                                                        if (selectionBkg && selectionBkg.style) {
                                                            var horizontalTexts = container.querySelectorAll(".navigationbar-horizontal-text");
                                                            if (horizontalTexts && horizontalTexts[0]) {
                                                                var textElement = horizontalTexts[0].querySelector(".navigationbar-inner-text");
                                                                if (textElement && textElement.offsetWidth > 0 && selectionBkg && selectionBkg.style) {
                                                                    selectionBkg.style.left = "calc(50% - " + (textElement.offsetWidth / 2).toString() + "px)";
                                                                    selectionBkg.style.right = "";
                                                                    selectionBkg.style.width = textElement.offsetWidth.toString() + "px";
                                                                    selectionBkg.style.backgroundColor = Colors.navigationColor;
                                                                    selectionBkg.style.opacity = 1;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            if (doAnimation) {
                                                if (NavigationBar._orientation !== "vertical") {
                                                    var textElements = element.querySelectorAll(".navigationbar-text");
                                                    if (textElements && textElements.length > 0) {
                                                        var horzHeight = -NavigationBar.navHorzHeight / 8;
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
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.u1, "NavigationBar.ListViewClass.");
                    var listControl = this.listControl;
                    if (listControl) {
                        Log.print(Log.l.u1, "listOrientation=" + this.listOrientation + " loadingState=" + listControl.loadingState);
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
                                var prevOrientation = NavigationBar.updateOrientation();
                                if (prevOrientation === NavigationBar.orientation) {
                                    var playAnimation = NavigationBar._playAnimation;
                                    WinJS.Promise.timeout(0).then(function () {
                                        NavigationBar.ListView.updateLayout(playAnimation);
                                    });
                                    NavigationBar._playAnimation = false;
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.u1);
                },
                scrollIntoView: function (curIndex) {
                    Log.call(Log.l.u1, "NavigationBar.ListViewClass.");
                    var that = this;
                    if (NavigationBar._orientation === "horizontal" && !this._scrollSynced) {
                        this._scrollSynced = true;
                        var element = NavigationBar.ListView && NavigationBar.ListView.listElement;
                        var control = NavigationBar.ListView && NavigationBar.ListView.listControl;
                        if (element && control) {
                            var containers = element.querySelectorAll(".win-container");
                            if (containers && containers.length === NavigationBar.data.length && containers[0]) {
                                var surface = element.querySelector(".win-surface");
                                if (surface) {
                                    var overflow = surface.clientWidth - element.clientWidth;
                                    if (overflow > 0) {
                                        var containersWidth = 0;
                                        for (var i = 0; i < curIndex; i++) {
                                            containersWidth += containers[i].clientWidth;
                                            if (i === curIndex - 1) {
                                                if (containersWidth - Math.max(60, containers[i].clientWidth / 4) < control.scrollPosition) {
                                                    containersWidth -= Math.max(60, containers[i].clientWidth / 4);
                                                } else if (containersWidth + containers[curIndex].clientWidth +
                                                    ((curIndex + 1 < containers.length) ? Math.max(60, containers[curIndex + 1].clientWidth / 4) : 0) -
                                                    element.clientWidth > control.scrollPosition) {
                                                    containersWidth += containers[curIndex].clientWidth +
                                                        ((curIndex + 1 < containers.length) ? Math.max(60, containers[curIndex + 1].clientWidth / 4) : 0) -
                                                        element.clientWidth;
                                                } else {
                                                    Log.ret(Log.l.u1, "extra ignored");
                                                    return;
                                                }
                                            }
                                        }
                                        var scrollPosition = Math.floor(containersWidth);
                                        if (scrollPosition < 0) {
                                            scrollPosition = 0;
                                        } else if (scrollPosition > overflow) {
                                            scrollPosition = overflow;
                                        }
                                        if (control.scrollPosition !== scrollPosition) {
                                            var prevScrollPosition = control.scrollPosition;
                                            control.scrollPosition = scrollPosition;
                                            if (that._doScrollIntoViewAnimation) {
                                                var animationDistanceX = (scrollPosition - prevScrollPosition) / 3;
                                                var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                                WinJS.UI.Animation.enterContent(surface, animationOptions).done(function () {
                                                    that._doScrollIntoViewAnimation = false;
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.u1);
                },
                // event handler for selectionchanged event
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "NavigationBar.ListViewClass.");
                    var that = this;
                    // Handle Page Selection
                    var listControl = this.listControl;
                    if (listControl && listControl.selection && NavigationBar.data) {
                        var selectionCount = listControl.selection.count();
                        if (selectionCount === 1) {
                            // Only one item is selected, show the page
                            listControl.selection.getItems().done(function (items) {
                                var curIndex = items[0].index;
                                // sync other list
                                if (NavigationBar._listViewVert &&
                                    NavigationBar._listViewVert.listControl !== listControl) {
                                    if (NavigationBar.orientation === "horizontal") {
                                        that._doScrollIntoViewAnimation = true;
                                        that._scrollSynced = false;
                                        NavigationBar._listViewVert.setSelIndex(curIndex);
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
                                    if (Application.navigator._nextPage === Application.getPagePath(item.id)) {
                                        Log.print(Log.l.trace, "just navigating to page location=" + item.id);
                                    } else {
                                        Application.navigateById(item.id);
                                    }
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                // function for single selection via item index
                setSelIndex: function (index) {
                    Log.call(Log.l.trace, "NavigationBar.ListViewClass.", "index=" + index);
                    var listControl = this.listControl;
                    if (listControl && listControl.selection) {
                        var selectionCount = listControl.selection.count();
                        if (selectionCount === 1) {
                            // Only one item is selected, check for same selection
                            listControl.selection.getItems().done(function (items) {
                                if (items && items[0] && items[0].index === index) {
                                    // already selected!
                                    return;
                                } else if (listControl && listControl.selection) {
                                    listControl.selection.clear();
                                    if (listControl.itemDataSource && index >= 0) {
                                        listControl.itemDataSource.itemFromIndex(index).done(function (curItem) {
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
                                listControl.itemDataSource.itemFromIndex(index).done(function (curItem) {
                                    listControl.selection.add(curItem);
                                });
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onTouch: function (eventId, x, y) {
                    if (this.listControl) {
                        this.listControl.scrollPosition = this._initialScrollPosition + x / 4;
                    }
                },
                checkForWheelEnd: function (eventInfo) {
                    if (this._checkForWheelEndPromise) {
                        this._checkForWheelEndPromise.cancel();
                    }
                    var that = this;
                    this._checkForWheelEndPromise = WinJS.Promise.timeout(TouchPhysics.wheelEndTimerMs).then(function () {
                        that._waitingForMouseScroll = false;
                        that._checkForWheelEndPromise = null;
                        that._touchPhysics.processUp(MANIPULATION_PROCESSOR_MANIPULATIONS.MANIPULATION_TRANSLATE_X, that._wheelScrollAdd * that._wheelValueFactor, 0);
                        that._wheelScrollAdd = 0;
                    });
                },
                wheelHandler: function (eventInfo) {
                    Log.call(Log.l.u1, "NavigationBar.Controller.");
                    var that = this;
                    if (NavigationBar._orientation === "horizontal") {
                        var element = NavigationBar.ListView && NavigationBar.ListView.listElement;
                        var control = NavigationBar.ListView && NavigationBar.ListView.listControl;
                        var wheelWithinListView = eventInfo.target && (element && element.contains(eventInfo.target) || element === eventInfo.target);
                        if (wheelWithinListView && control) {
                            eventInfo.stopPropagation();
                            eventInfo.preventDefault();

                            var wheelValue;
                            if (!that._waitingForMouseScroll) {
                                that._waitingForMouseScroll = true;
                                that._initialScrollPosition = control.scrollPosition;
                                if (typeof eventInfo.deltaY === 'number') {
                                    wheelValue = Math.abs(eventInfo.deltaX || eventInfo.deltaY || 0);
                                } else {
                                    wheelValue = Math.abs(eventInfo.wheelDelta || 0);
                                }
                                if (wheelValue) {
                                    that._wheelValueFactor = 10000 / wheelValue;
                                }
                                that._touchPhysics.processDown(MANIPULATION_PROCESSOR_MANIPULATIONS.MANIPULATION_TRANSLATE_X, 0, 0);
                                WinJS.Promise.timeout(TouchPhysics.wheelStartTimerMs).then(function () {
                                    that.wheelHandler(eventInfo);
                                });
                                return;
                            }
                            var wheelingForward;

                            if (typeof eventInfo.deltaY === 'number') {
                                wheelingForward = (eventInfo.deltaX || eventInfo.deltaY) > 0;
                                wheelValue = Math.abs(eventInfo.deltaX || eventInfo.deltaY || 0);
                            } else {
                                wheelingForward = eventInfo.wheelDelta < 0;
                                wheelValue = Math.abs(eventInfo.wheelDelta || 0);
                            }
                            that._wheelScrollAdd += wheelingForward ? wheelValue : -wheelValue;

                            that._touchPhysics.processMove(MANIPULATION_PROCESSOR_MANIPULATIONS.MANIPULATION_TRANSLATE_X, that._wheelScrollAdd * that._wheelValueFactor, 0);
                            that.checkForWheelEnd(eventInfo);
                            /*
                            if (that._waitingForMouseScroll) {
                                return;
                            }
                            that._waitingForMouseScroll = true;
                            control.scrollPosition += that._wheelScrollAdd / 2;
                            that._wheelScrollAdd = 0;
                            WinJS.Promise.timeout(20).then(function () {
                                that._waitingForMouseScroll = false;
                            });
                            */
                        }
                    }
                    Log.ret(Log.l.u1);
                },
                _scrollSynced: false,
                // anchor for element istself
                _element: null,
                // orientation of list element
                _listOrientation: null,
                _visibility: null,
                _doScrollIntoViewAnimation: false,
                _initialScrollPosition: 0,
                _wheelValueFactor: 100,
                _waitingForMouseScroll: false,
                _wheelScrollAdd: 0,
                _checkForWheelEndPromise: null,
                _touchPhysics: null
            }
        ),
        /**
         * @property {string} orientation - Possible values: "horizontal" or "vertical"
         * @memberof NavigationBar
         * @description Read/Write. Retrieves and stes the orientation of the navigation bar ListView. 
         */
        orientation: {
            get: function () {
                return NavigationBar._orientation;
            },
            set: function (newOrientation) {
                Log.call(Log.l.u1, "NavigationBar.orientation.", "newOrientation=" + newOrientation);
                if (NavigationBar._inOrientationChange > 0) {
                    if (!NavigationBar._resizedPromise) {
                        NavigationBar._resizedPromise = WinJS.Promise.timeout(50).then(function () {
                            NavigationBar._resizedPromise = null;
                            // now do complete resize later!
                            Application.navigator._resized();
                        });
                    }
                    Log.ret(Log.l.u1, "semaphore set");
                    return;
                }
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
                    NavigationBar._orientation = newOrientation;
                    NavigationBar._inOrientationChange++;
                    if (NavigationBar.data &&
                        NavigationBar.data.length > 0) {
                        if (newOrientation === "vertical") {
                            if (NavigationBar._listViewHorz &&
                                NavigationBar._listViewHorz.listElement) {
                                horzHeight = -NavigationBar.navHorzHeight / 2;
                                offsetOut = { top: horzHeight.toString() + "px", left: "0px" };
                                thatOut = NavigationBar._listViewHorz;
                                Log.print(Log.l.trace, "hide NavigationBar._listViewHorz");
                            }
                            if (NavigationBar._listViewVert &&
                                NavigationBar._listViewVert.listElement) {
                                vertWidth = -NavigationBar.navVertWidth;
                                offsetIn = { top: "0px", left: vertWidth.toString() + "px" };
                                thatIn = NavigationBar._listViewVert;
                                Log.print(Log.l.trace, "show NavigationBar._listViewVert");
                            }
                        } else {
                            if (NavigationBar._listViewVert &&
                                NavigationBar._listViewVert.listElement) {
                                vertWidth = -NavigationBar.navVertWidth;
                                offsetOut = { top: "0px", left: vertWidth.toString() + "px" };
                                thatOut = NavigationBar._listViewVert;
                                Log.print(Log.l.trace, "hide NavigationBar._listViewVert");
                            }
                            if (NavigationBar._listViewHorz &&
                                NavigationBar._listViewHorz.listElement) {
                                horzHeight = -NavigationBar.navHorzHeight / 2;
                                offsetIn = { top: horzHeight.toString() + "px", left: "0px" };
                                thatIn = NavigationBar._listViewHorz;
                                Log.print(Log.l.trace, "show NavigationBar._listViewHorz");
                            }
                        }
                        if (thatOut && offsetOut) {
                            outElement = thatOut.listElement ? thatOut.listElement.parentNode : null;
                            if (outElement && outElement.style) {
                                NavigationBar._inOrientationChange++;
                                Log.print(Log.l.trace, "calling hidePanel animation");
                                WinJS.UI.Animation.exitContent(outElement, offsetOut).done(function () {
                                    outElement.style.visibility = "hidden";
                                    thatOut._visibility = "hidden";
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
                            inElement = thatIn.listElement ? thatIn.listElement.parentNode : null;
                            if (inElement && inElement.style) {
                                NavigationBar._inOrientationChange++;
                                Log.print(Log.l.trace, "calling showPanel animation");
                                thatIn._visibility = "visible";
                                inElement.style.visibility = "";
                                inElement.style.zIndex = thatIn._zIndex;
                                WinJS.UI.Animation.enterContent(inElement, offsetIn).done(function () {
                                    NavigationBar._inOrientationChange--;
                                    NavigationBar.updateOrientation();
                                    if (NavigationBar.ListView) {
                                        NavigationBar.ListView.updateLayout();
                                    }
                                });
                            }
                        }
                    } else {
                        if (NavigationBar._listViewHorz &&
                            NavigationBar._listViewHorz._visibility !== "hidden" &&
                            NavigationBar._listViewHorz.listElement) {
                            horzHeight = -NavigationBar.navHorzHeight / 2;
                            offsetOut = { top: horzHeight.toString() + "px", left: "0px" };
                            thatOut = NavigationBar._listViewHorz;
                        } else if (NavigationBar._listViewVert &&
                            NavigationBar._listViewVert._visibility !== "hidden" &&
                            NavigationBar._listViewVert.listElement) {
                            vertWidth = -NavigationBar.navVertWidth;
                            offsetOut = { top: "0px", left: vertWidth.toString() + "px" };
                            thatOut = NavigationBar._listViewVert;
                        }
                        if (thatOut && offsetOut) {
                            outElement = thatOut.listElement ? thatOut.listElement.parentNode : null;
                            if (outElement && outElement.style) {
                                NavigationBar._inOrientationChange++;
                                Log.print(Log.l.trace, "calling hidePanel animation");
                                WinJS.UI.Animation.exitContent(outElement, offsetOut).done(function () {
                                    outElement.style.visibility = "hidden";
                                    thatOut._visibility = "hidden";
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
            get: function () { return NavigationBar._pages; },
            set: function (pages) {
                Log.call(Log.l.trace, "NavigationBar.pages.");
                NavigationBar._pages = pages;
                Log.ret(Log.l.trace);
            }
        },
        groups: {
            get: function () { return NavigationBar._groups; },
            set: function (groups) {
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
            Log.call(Log.l.u1, "NavigationBar.", "id=" + id);
            var i, updateMenu = false;
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
                    if (NavigationBar.groups[i].id === id &&
                        !NavigationBar.groups[i].disabled) {
                        NavigationBar.groups[i].disabled = true;
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
                            command.disabled = true;
                            WinJS.Utilities.addClass(command, "win-disabled");
                            break;
                        }
                    }
                }
            }
            if (updateMenu) {
                NavigationBar.groups = Application.navigationBarGroups;
            }
            Log.ret(Log.l.u1);
        },
        /**
         * @function enablePage
         * @param {string} id - Page id
         * @memberof NavigationBar
         * @description Use this function to enable the navigation to a page specified by the page id.
         */
        enablePage: function (id) {
            Log.call(Log.l.u1, "NavigationBar.", "id=" + id);
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
                    if (NavigationBar.groups[i].id === id &&
                        NavigationBar.groups[i].disabled) {
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
            Log.ret(Log.l.u1);
        },
        /**
         * @property {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211837.aspx WinJS.UI.ListView} ListView - The currently active navigation bar ListView object
         * @memberof NavigationBar
         * @description Read-only. Retrieves The currently active navigation bar ListView object
         */
        ListView: {
            get: function () {
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
            get: function () { return NavigationBar._curGroup; },
            set: function (newGroup) {
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
            var ret = NavigationBar.orientation;
            Log.call(Log.l.u1, "NavigationBar.");
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
            Log.ret(Log.l.u1, "newOrientation=" + NavigationBar.orientation + " (prevOrientation=" + ret + ")");
            return ret;
        },
        createViewPaneSubMenu: function (group, element, title) {
            var ret = null;
            Log.call(Log.l.trace, "NavigationBar.");
            var subMenuFlyout = Application.navigator && Application.navigator.subMenuFlyout;
            var subMenuList = Application.navigator && Application.navigator.subMenuList;
            var subMenuHeaderText = Application.navigator && Application.navigator.subMenuHeaderText;
            if (subMenuHeaderText) {
                subMenuHeaderText.textContent = title;
            }
            if (subMenuFlyout &&
                subMenuList && subMenuList.winControl) {
                subMenuFlyout.group = group;
                subMenuFlyout.paneState = "opening";
                var groups = NavigationBar.groups &&
                    NavigationBar.groups.filter(function (item) {
                        return item.predecGroup === group;
                    }) || [];
                if (groups.length > 0) {
                    NavigationBar.submenu.length = 0;
                    for (var i = 0; i < groups.length; i++) {
                        var navigationLabel = getResourceText(groups[i].label || ("label." + groups[i].id));
                        var resIdTooltip = groups[i].tooltip || groups[i].label || ("tooltip." + groups[i].id);
                        var navigationTooltip = getResourceText(resIdTooltip);
                        if (!navigationTooltip || navigationTooltip === resIdTooltip) {
                            navigationTooltip = navigationLabel;
                        }
                        var options = {
                            id: groups[i].id,
                            label: navigationLabel,
                            tooltip: navigationTooltip,
                            svg: groups[i].svg,
                            disabled: groups[i].disabled
                        };
                        if (!groups[i].svg) {
                            options.icon = groups[i].icon;
                        }
                        NavigationBar.submenu.push(options);
                    }
                    if (subMenuFlyout.style) {
                        subMenuFlyout.style.display = "block";
                    }
                    if (!subMenuFlyout.close) {
                        subMenuFlyout.close = function() {
                            subMenuFlyout.group = null;
                            if (subMenuFlyout.paneState === "opened") {
                                if (subMenuFlyout.style) {
                                    subMenuFlyout.style.display = "none";
                                }
                                subMenuFlyout.paneState = "";
                                return WinJS.Promise.as();
                            } else {
                                return WinJS.Promise.as();
                            }
                        }
                    }
                    if (!subMenuFlyout._handleFocusOut) {
                        subMenuFlyout._handleFocusOut = function (ev) {
                            WinJS.Promise.timeout(50).then(function () {
                                var activeElement = document.activeElement;
                                if (subMenuFlyout !== activeElement &&
                                    !subMenuFlyout.contains(activeElement)) {
                                    subMenuFlyout.close();
                                }
                            });
                        };
                        subMenuFlyout.addEventListener("focusout", subMenuFlyout._handleFocusOut);
                    }
                    ret = WinJS.UI.Animation.slideRightIn(subMenuFlyout).then(function() {
                        // workaround: force rendering on zero itemscontainer width
                        var itemsContainer = subMenuList.querySelector(".win-itemscontainer");
                        if (itemsContainer && !itemsContainer.clientWidth && subMenuList.winControl) {
                            subMenuList.winControl.forceLayout();
                        }
                    });
                }
            }
            Log.ret(Log.l.trace, "");
            return ret || WinJS.Promise.as();
        },
        handleSubmenuLoadingStateChanged: function (ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            var subMenuFlyout = Application.navigator && Application.navigator.subMenuFlyout;
            var subMenuList = Application.navigator && Application.navigator.subMenuList;
            if (subMenuList && subMenuList.winControl && subMenuFlyout) {
                Log.print(Log.l.trace, "loadingState=" + subMenuList.winControl.loadingState);
                if (subMenuList.winControl.loadingState === "itemsLoaded") {
                    // load SVG images
                    Colors.loadSVGImageElements(subMenuList, "pane-submenu-icon", 16, Colors.navigationColor, "name");
                    if (subMenuFlyout.paneState === "opening") {
                        subMenuFlyout.paneState = "opened";
                        subMenuList.focus();
                    }
                    for (var i = 0; i < NavigationBar.submenu.length; i++) {
                        var curSubMenu = NavigationBar.submenu.getAt(i);
                        if (curSubMenu) {
                            var element = subMenuList.winControl.elementFromIndex(i);
                            if (element && element.parentElement) {
                                if (curSubMenu.disabled) {
                                    if (!WinJS.Utilities.hasClass(element.parentElement, "win-nonselectable")) {
                                        WinJS.Utilities.addClass(element.parentElement, "win-nonselectable");
                                    }
                                    if (!WinJS.Utilities.hasClass(element.parentElement, "win-disabled")) {
                                        WinJS.Utilities.addClass(element.parentElement, "win-disabled");
                                    }
                                } else {
                                    if (WinJS.Utilities.hasClass(element.parentElement, "win-nonselectable")) {
                                        WinJS.Utilities.removeClass(element.parentElement, "win-nonselectable");
                                    }
                                    if (WinJS.Utilities.hasClass(element.parentElement, "win-disabled")) {
                                        WinJS.Utilities.removeClass(element.parentElement, "win-disabled");
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Log.ret(Log.l.trace);
        },
        handleSubmenuInvoked: function (ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            if (ev && ev.detail) {
                var item = NavigationBar.submenu.getAt(ev.detail.itemIndex);
                if (item && item.id && !item.disabled) {
                    var msg = "menu " + item.label + " with id=" + item.id + " was pressed";
                    Log.print(Log.l.trace, msg);
                    Application.navigateById(item.id);
                    var subMenuFlyout = Application.navigator && Application.navigator.subMenuFlyout;
                    if (subMenuFlyout.style) {
                        subMenuFlyout.style.display = "none";
                    }
                    subMenuFlyout.paneState = "";
                }
            }
            Log.ret(Log.l.trace, "");
        },
        handleNavCommand: function (ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            var command = ev.currentTarget || ev.target;
            if (command && !command.disabled) {
                var commandControl = command.winControl;
                if (commandControl) {
                    var id = commandControl.id;
                    var msg = "menu " + commandControl._label + " with id=" + id + " was pressed";
                    var groups = NavigationBar.groups &&
                        NavigationBar.groups.filter(function (element) {
                            return element.id === id;
                        });
                    if (groups && groups[0] && !!groups[0].popup) {
                        var group = groups[0].group;
                        Log.print(Log.l.trace, msg + " is popup!");
                        var splitViewRoot = Application.navigator.splitViewRoot;
                        if (splitViewRoot) {
                            var splitViewControl = splitViewRoot.winControl;
                            if (splitViewControl && !splitViewControl.paneOpened) {
                                var promise;
                                var subMenuFlyout = Application.navigator && Application.navigator.subMenuFlyout;
                                if (subMenuFlyout &&
                                    !(subMenuFlyout.group === group) &&
                                    typeof subMenuFlyout.close === "function") {
                                    promise = subMenuFlyout.close();
                                } else {
                                    promise = WinJS.Promise.as();
                                }
                                promise.then(function() {
                                    if (!(subMenuFlyout && subMenuFlyout.paneState)) {
                                        NavigationBar.createViewPaneSubMenu(group, command, commandControl._label);
                                    }
                                });
                            } else if (AppData._persistentStates.expandSubMenuMode !== Application.expandSubMenuModes.all &&
                                Application.navigator.splitViewPane) {
                                var navCommands = Application.navigator.splitViewPane.querySelector(".nav-commands");
                                if (navCommands) {
                                    if (WinJS.Utilities.hasClass(command, "submenu-collapsed")) {
                                        if (AppData._persistentStates.expandSubMenuMode !== Application.expandSubMenuModes.toggle) {
                                            var commands = navCommands.children;
                                            var length = commands ? commands.length : 0;
                                            if (length > 0) {
                                                for (var i = length - 1; i >= 0; i--) {
                                                    if (commands[i] && commands[i].winControl && commands[i].winControl.id !== id) {
                                                        NavigationBar.removeSubMenuCommands(navCommands, commands[i]);
                                                    }
                                                }
                                            }
                                        }
                                        NavigationBar.addSubMenuCommands(navCommands, command);
                                        WinJS.Promise.timeout(0).then(function() {
                                            NavigationBar.loadMenuIcons();
                                        });
                                    } else if (WinJS.Utilities.hasClass(command, "submenu-expanded")) {
                                        NavigationBar.removeSubMenuCommands(navCommands, command);
                                    }
                                }
                            }
                        }
                    } else {
                        Log.print(Log.l.trace, msg);
                        if (id) {
                            Application.navigateById(id);
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, "");
        },
        addSubMenuCommands: function(navCommands, command, noAnimation) {
            var ret = null;
            Log.call(Log.l.trace, "NavigationBar.", "id=" + (command && command.winControl && command.winControl.id));
            var affected = [];
            var commands = navCommands.children;
            if (commands && command) {
                var id = command.winControl && command.winControl.id;
                var commandIndex = 0;
                for (var i = 0; i < commands.length; i++) {
                    if (!commandIndex) {
                        if (commands[i] && commands[i].winControl && commands[i].winControl.id === id) {
                            commandIndex = i;
                            if (noAnimation) {
                                break;
                            }
                        }
                    } else {
                        affected.push(commands[i]);
                    }
                }
                var popupsFound = NavigationBar.groups.filter(function (item) {
                    return (item.id === id && !!item.popup);
                });
                if (popupsFound && popupsFound[0]) {
                    var group = popupsFound[0].group;
                    var groups = NavigationBar.groups &&
                        NavigationBar.groups.filter(function (item) {
                            return item.predecGroup === group;
                        }) || [];
                    if (groups.length > 0) {
                        var added = [];
                        if (WinJS.Utilities.hasClass(command, "submenu-collapsed")) {
                            WinJS.Utilities.removeClass(command, "submenu-collapsed");
                        }
                        if (!WinJS.Utilities.hasClass(command, "submenu-expanded")) {
                            WinJS.Utilities.addClass(command, "submenu-expanded");
                        }
                        var j, element;
                        for (j = groups.length - 1; j >= 0; j--) {
                            element = document.createElement("div");
                            WinJS.Utilities.addClass(element, "pane-submenu");
                            var navigationLabel = getResourceText(groups[j].label || ("label." + groups[j].id));
                            var resIdTooltip = groups[j].tooltip || groups[j].label || ("tooltip." + groups[j].id);
                            var navigationTooltip = getResourceText(resIdTooltip);
                            if (!navigationTooltip || navigationTooltip === resIdTooltip) {
                                navigationTooltip = navigationLabel;
                            }
                            var options = {
                                id: groups[j].id,
                                label: navigationLabel,
                                oninvoked: NavigationBar.handleNavCommand,
                                tooltip: navigationTooltip
                            };
                            if (!groups[j].svg) {
                                options.icon = groups[j].icon;
                            }
                            var splitViewCommand = new WinJS.UI.SplitViewCommand(element, options);
                            if (splitViewCommand.element) {
                                splitViewCommand.element.disabled = groups[j].disabled;
                                if (splitViewCommand.element.disabled) {
                                    if (!WinJS.Utilities.hasClass(splitViewCommand.element, "win-disabled")) {
                                        WinJS.Utilities.addClass(splitViewCommand.element, "win-disabled");
                                    }
                                } else {
                                    if (WinJS.Utilities.hasClass(splitViewCommand.element, "win-disabled")) {
                                        WinJS.Utilities.removeClass(splitViewCommand.element, "win-disabled");
                                    }
                                }
                            }
                            if (noAnimation) {
                                if (commandIndex < commands.length - 1) {
                                    navCommands.insertBefore(element, commands[commandIndex + 1]);
                                } else {
                                    navCommands.appendChild(element);
                                }
                            } else {
                                added.push(element);
                            }
                        }
                        if (!noAnimation) {
                            var anim = WinJS.UI.Animation.createAddToListAnimation(added, affected);
                            for (j = groups.length - 1; j >= 0; j--) {
                                element = added[groups.length - 1 - j];
                                if (commandIndex < commands.length - 1) {
                                    navCommands.insertBefore(element, commands[commandIndex + 1]);
                                } else {
                                    navCommands.appendChild(element);
                                }
                            }
                            ret = anim.execute();
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, "");
            return ret || WinJS.Promise.as();
        },
        removeCommandById: function(navCommands, id) {
            Log.call(Log.l.trace, "NavigationBar.", "id=" + id);
            var commands = navCommands && navCommands.children;
            var command = null;
            for (var i = commands.length - 1; i >= 0; i--) {
                if (commands[i] && commands[i].winControl && commands[i].winControl.id === id) {
                    command = commands[i];
                    break;
                }
            }
            if (command) {
                if (command.winControl &&
                    typeof command.winControl.dispose === "function") {
                    command.winControl.dispose();
                }
                navCommands.removeChild(command);
            }
            Log.ret(Log.l.trace, "");
        },
        removeSubMenuCommands: function(navCommands, command, noAnimation) {
            var ret = null;
            Log.call(Log.l.trace, "NavigationBar.", "id=" + (command && command.winControl && command.winControl.id));
            if (command) {
                var id = command.winControl && command.winControl.id;
                var popupsFound = NavigationBar.groups.filter(function (item) {
                    return item.id === id && !!item.popup;
                });
                if (popupsFound && popupsFound[0]) {
                    var group = popupsFound[0].group;
                    var groups = NavigationBar.groups &&
                        NavigationBar.groups.filter(function (item) {
                            return item.predecGroup === group;
                        }) || [];
                    if (groups.length > 0) {
                        if (WinJS.Utilities.hasClass(command, "submenu-expanded")) {
                            WinJS.Utilities.removeClass(command, "submenu-expanded");
                        }
                        if (!WinJS.Utilities.hasClass(command, "submenu-collapsed")) {
                            WinJS.Utilities.addClass(command, "submenu-collapsed");
                        }
                        var commands = navCommands && navCommands.children;
                        var commandIndex = 0;
                        var j;
                        var affected = [];
                        var removed = [];
                        for (var i = 0; i < commands.length; i++) {
                            if (!commandIndex) {
                                if (commands[i] && commands[i].winControl && commands[i].winControl.id === id) {
                                    commandIndex = i;
                                    if (noAnimation) {
                                        break;
                                    }
                                }
                            } else {
                                var found = false;
                                for (j = groups.length - 1; j >= 0; j--) {
                                    if (commands[i] && commands[i].winControl && groups[j] && groups[j].id === commands[i].winControl.id) {
                                        removed.push(commands[i]);
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    affected.push(commands[i]);
                                }
                            }
                        }         
                        if (noAnimation) {
                            for (j = groups.length - 1; j >= 0; j--) {
                                NavigationBar.removeCommandById(navCommands, groups[j] && groups[j].id);
                            }
                        } else {
                            var anim = WinJS.UI.Animation.createCollapseAnimation(removed, affected);
                            removed.forEach(function(element, index) {
                                if (element && element.style) {
                                    element.style.position = "absolute";
                                    element.style.opacity = 0;
                                }
                            });
                            ret = anim.execute().then(function() {
                                for (j = groups.length - 1; j >= 0; j--) {
                                    NavigationBar.removeCommandById(navCommands, groups[j] && groups[j].id);
                                }
                            });
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, "");
            return ret || WinJS.Promise.as();
        },
        handleSplitViewBeforeOpen: function (ev) {
            Log.call(Log.l.trace, "NavigationBar.");
            if (Application.navigator && Application.navigator.splitViewPane) {
                if (AppData._persistentStates.expandSubMenuMode === Application.expandSubMenuModes.all) {
                    var navCommands = Application.navigator.splitViewPane.querySelector(".nav-commands");
                    if (navCommands) {
                        var commands = navCommands.children;
                        var length = commands ? commands.length : 0;
                        if (length > 0) {
                            for (var i = length - 1; i >= 0; i--) {
                                NavigationBar.addSubMenuCommands(navCommands, commands[i], true);
                            }
                        }
                    }
                }
                WinJS.Promise.timeout(0).then(function () {
                    NavigationBar.loadMenuIcons();
                });
                var splitViewPane = Application.navigator.splitViewPane;
                if (splitViewPane && splitViewPane.style) {
                    var splitViewRoot = Application.navigator.splitViewRoot;
                    if (splitViewRoot) {
                        var splitViewControl = splitViewRoot.winControl;
                        if (splitViewControl &&
                            splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.overlay) {
                            splitViewPane.style.marginTop = NavigationBar.navHorzHeight + "px";
                        } else {
                            splitViewPane.style.marginTop = "0";
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
                if (rootSplitViewPane) {
                    // remove subMenu commands
                    var navCommands = rootSplitViewPane.querySelector(".nav-commands");
                    if (navCommands) {
                        var commands = navCommands.children;
                        var length = commands ? commands.length : 0;
                        if (length > 0) {
                            for (var i = length - 1; i >= 0; i--) {
                                NavigationBar.removeSubMenuCommands(navCommands, commands[i], true);
                            }
                        }
                    }
                    if (rootSplitViewPane.style) {
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
            }
            Log.ret(Log.l.trace, "");
        },
        showGroupsMenu: function (results, bForceReloadMenu) {
            Log.call(Log.l.trace, "NavigationBar.", "bForceReloadMenu=" + bForceReloadMenu);
            var i, updateMenu = false;
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
            Log.call(Log.l.trace, "NavigationBar.", "name=" + name);
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
            Log.call(Log.l.u2, "NavigationBar.");
            var i;
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
                                                var size = NavigationBar.groups[j].predecGroup ? 16 : 24;
                                                var svg = NavigationBar.groups[j].svg;
                                                if (svg) {
                                                    var svgObject = document.createElement("div");
                                                    if (svgObject) {
                                                        svgObject.setAttribute("width", size.toString());
                                                        svgObject.setAttribute("height", size.toString());
                                                        svgObject.style.display = "inline";
                                                        svgObject.id = svg;

                                                        // insert svg object before span element
                                                        splitViewCommandIcon.appendChild(svgObject);

                                                        // overlay span element over svg object to enable user input
                                                        splitViewCommandIcon.setAttribute("style", "width: " + size.toString() + "px; height: " + size.toString() + "px;");

                                                        // load the image file
                                                        Colors.loadSVGImage({
                                                            fileName: svg,
                                                            color: Colors.navigationColor,
                                                            element: svgObject,
                                                            size: size,
                                                            strokeWidth: AppData._persistentStates.iconStrokeWidth
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
            Log.call(Log.l.trace, "NavigationBar.");
            var i, reloadSubMenu = false, splitViewRoot, splitViewPane, splitViewPaneScrollTop, splitViewControl;
            if (Application.navigator) {
                splitViewRoot = Application.navigator.splitViewRoot;
                splitViewControl = splitViewRoot && splitViewRoot.winControl;
                splitViewPane = Application.navigator.splitViewPane;
                
            }
            if (splitViewControl && splitViewControl.paneOpened) {
                reloadSubMenu = true;
            }
            if (splitViewPane) {
                splitViewPaneScrollTop = splitViewPane.scrollTop;
                var navCommands = splitViewPane.querySelector(".nav-commands");
                if (navCommands) {
                    var commands = navCommands.children;
                    var length = commands ? commands.length : 0;
                    if (length > 0) {
                        for (i = length - 1; i >= 0; i--) {
                            var command = commands[i];
                            if (command.id !== "dummyMenu") {
                                if (command.winControl &&
                                    typeof command.winControl.dispose === "function") {
                                    command.winControl.dispose();
                                }
                                navCommands.removeChild(command);
                            }
                        }
                    }
                    if (NavigationBar.groups && NavigationBar.groups.length > 0) {
                        for (i = 0; i < NavigationBar.groups.length; i++) {
                            var group = NavigationBar.groups[i];
                            if (group && !group.disabled && !group.predecGroup) {
                                var element = document.createElement("div");
                                navCommands.appendChild(element);
                                var navigationLabel = getResourceText(group.label || ("label." + group.id));
                                var resIdTooltip = group.tooltip || group.label || ("tooltip." + group.id);
                                var navigationTooltip = getResourceText(resIdTooltip);
                                if (!navigationTooltip || navigationTooltip === resIdTooltip) {
                                    navigationTooltip = navigationLabel;
                                }
                                var options = {
                                    id: group.id,
                                    label: navigationLabel,
                                    oninvoked: NavigationBar.handleNavCommand,
                                    tooltip: navigationTooltip
                                };
                                if (!group.svg) {
                                    options.icon = group.icon;
                                }
                                var splitViewCommand = new WinJS.UI.SplitViewCommand(element, options);
                                if (!!group.popup && splitViewCommand && splitViewCommand.element) {
                                    WinJS.Utilities.addClass(splitViewCommand.element, "submenu-collapsed");
                                }
                            }
                        }
                        if (reloadSubMenu) {
                            NavigationBar.handleSplitViewBeforeOpen();
                            NavigationBar.handleSplitViewAfterOpen();
                            if (splitViewPaneScrollTop > 0) {
                                splitViewPane.scrollTop = splitViewPaneScrollTop;
                            }
                        } else {
                            WinJS.Promise.timeout(0).then(function () {
                                NavigationBar.loadMenuIcons();
                            });
                        }
                    }
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
                    var vertWidth = -NavigationBar.navVertWidth;
                    offset = { top: "0px", left: vertWidth.toString() + "px" };
                } else {
                    var horzHeight = -NavigationBar.navHorzHeight;
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
                                var navigationLabel = getResourceText(NavigationBar.pages[i].label || ("label." + NavigationBar.pages[i].id));
                                Log.print(Log.l.trace, "push new item id=" + NavigationBar.pages[i].id, " navigationLabel=" + navigationLabel);
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
                    var ret = WinJS.Promise.timeout(0).then(function () {
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
                        WinJS.UI.Animation.exitContent(that.listElement.parentNode, offset).done(function () {
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
        submenu: {
            get: function () {
                if (!NavigationBar._submenu) {
                    NavigationBar._submenu = new WinJS.Binding.List([]);
                }
                return NavigationBar._submenu;
            }
        },
        navVertWidth: {
            get: function () {
                return NavigationBar._navVertWidth;
            },
            set: function (navVertWidth) {
                if (navVertWidth === NavigationBar._navVertWidth) {
                    // extra ignored
                } else {
                    NavigationBar._navVertWidth = navVertWidth;
                    Colors.changeCSS(".navigationbar-container-vertical", "width", navVertWidth.toString() + "px !important");
                    /*
                    var navigationbarContainerVertical = document.querySelector(".navigationbar-container-vertical");
                    if (navigationbarContainerVertical && navigationbarContainerVertical.style) {
                        navigationbarContainerVertical.style.width = navVertWidth.toString() + "px";
                    }
                     */
                }
            }
        },
        navHorzHeight: {
            get: function () {
                return NavigationBar._navHorzHeight;
            },
            set: function (navHorzHeight) {
                if (NavigationBar._navHorzHeight === navHorzHeight) {
                    // extra ignored
                } else {
                    NavigationBar._navHorzHeight = navHorzHeight;
                    Colors.changeCSS(".navigationbar-container-horizontal", "height", navHorzHeight.toString() + "px !important");
                }
            }
        },
        splitViewPaneWidth: {
            get: function () {
                return NavigationBar._splitViewPaneWidth;
            },
            set: function (splitViewPaneWidth) {
                if (splitViewPaneWidth === NavigationBar._splitViewPaneWidth) {
                    // extra ignored
                } else {
                    NavigationBar._splitViewPaneWidth = splitViewPaneWidth;
                    Colors.changeCSS("#root-split-view.win-splitview-pane-opened.rootsplitview-tablet .win-splitview-pane, #root-split-view.win-splitview-pane-opened.rootsplitview-full .win-splitview-pane", "width", splitViewPaneWidth.toString() + "px");
                    Colors.changeCSS("#root-split-view-submenu", splitViewPaneWidth.toString() + "px");
                }
            }
        },
        createSplitViewPaneResizeHelper: function() {
            var splitViewPane = Application.navigator && Application.navigator.splitViewPane;
            if (splitViewPane) {
                if (splitViewPane.resizeHelper &&
                    typeof splitViewPane.resizeHelper.dispose === "function") {
                    splitViewPane.resizeHelper.dispose();
                }
                splitViewPane.resizeHelper = new Application.ResizeHelper(splitViewPane, {
                    sizeadd: 18,
                    minsize: AppData._persistentStatesDefaults.splitViewPaneWidth / 2,
                    maxsize: 4 * AppData._persistentStatesDefaults.splitViewPaneWidth / 3,
                    onsizechanged: function (splitViewPaneWidth) {
                        NavigationBar.splitViewPaneWidth = splitViewPaneWidth;
                        AppData._persistentStates.splitViewPaneWidth = splitViewPaneWidth;
                        if (Application.pageframe) {
                            Application.pageframe.savePersistentStates();
                        }
                        if (!NavigationBar._resizedPromise) {
                            NavigationBar._resizedPromise = WinJS.Promise.timeout(10).then(function () {
                                // now do complete resize later!
                                Application.navigator._resized();
                                NavigationBar._resizedPromise = null;
                            });
                        }
                    },
                    onsizechanging: function (splitViewPaneWidth) {
                        if (!NavigationBar._resizedPromise) {
                            NavigationBar._resizedPromise = WinJS.Promise.timeout(10).then(function () {
                                // now do complete resize later!
                                Application.navigator._resized();
                                NavigationBar._resizedPromise = null;
                            });
                        }
                    }
                });
            }
        },
        _data: null,
        _submenu: null,
        _listViewHorz: null,
        _listViewVert: null,
        _orientation: null,
        _inOrientationChange: 0,
        _pages: null,
        _curGroup: 0,
        _animationDistanceX: 160,
        _animationDistanceY: 80,
        _playAnimation: false,
        _splitViewClassSet: false,
        _splitViewDisplayMode: null,
        _navVertWidth: 0,
        _navHorzHeight: 0,
        _splitViewPaneWidth: 0,
        _baseHref: ""
    });

})();
