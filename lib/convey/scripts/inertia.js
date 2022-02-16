(function () {
    "use strict";

    WinJS.Namespace.define("MANIPULATION_PROCESSOR_MANIPULATIONS", {
        MANIPULATION_NONE: 0x00000000,
        MANIPULATION_TRANSLATE_X: 0x00000001,
        MANIPULATION_TRANSLATE_Y: 0x00000002,
        MANIPULATION_SCALE: 0x00000004,
        MANIPULATION_ROTATE: 0x00000008,
        MANIPULATION_ALL: 0x0000000F
    });

    WinJS.Namespace.define("TOUCHEVENT", {
        DOWN: 1,
        MOVE: 2,
        UP: 3
    });

    WinJS.Namespace.define("TouchPhysics", {
        wheelEndTimerMs: 30,
        wheelStartTimerMs: 5,
        touchInertiaTimerMs: 10,
        touchIntertiaDeceleraion: 100,
        PIXEL_TO_TOUCH_COORD: function (value) {
            return value * 100;
        },
        TOUCH_COORD_TO_PIXEL: function (value) {
            return value / 100;
        },

        // define a class for the ManipulationEvents
        ManipulationEvents: WinJS.Class.define(
            function manipulationEvents(manipulationStarted, manipulationDelta, manipulationCompleted) {
                this._manipulationStarted = manipulationStarted;
                this._manipulationDelta = manipulationDelta;
                this._manipulationCompleted = manipulationCompleted;
            }, {
                manipulationCompleted: function(x, y, cumulativeTranslationX, cumulativeTranslationY, cumulativeScale, cumulativeExpansion, cumulativeRotation) {
                    if (this._manipulationCompleted) {
                        this._manipulationCompleted(x, y, cumulativeTranslationX, cumulativeTranslationY, cumulativeScale, cumulativeExpansion, cumulativeRotation);
                    }
                },
                manipulationDelta: function(x, y, translationDeltaX, translationDeltaY, scaleDelta, expansionDelta, rotationDelta,
                    cumulativeTranslationX, cumulativeTranslationY, cumulativeScale, cumulativeExpansion, cumulativeRotation) {
                    if (this._manipulationDelta) {
                        this._manipulationDelta(x, y, translationDeltaX, translationDeltaY, scaleDelta, expansionDelta, rotationDelta,
                            cumulativeTranslationX, cumulativeTranslationY, cumulativeScale, cumulativeExpansion, cumulativeRotation);
                    }
                },
                manipulationStarted: function(x, y) {
                    if (this._manipulationStarted) {
                        this._manipulationStarted(x, y);
                    }
                },
                _manipulationCompleted: null,
                _manipulationDelta: null,
                _manipulationStarted: null
            }
        ),

        // define a class for the ManipulationProcessor
        ManipulationProcessor: WinJS.Class.define(
            function manipulationProcessor() {
                this._completed = false;

            }, {
                _completed: false,
                _initialTimeStamp: 0,
                _deltaTimeStamp: 0,
                _completeTimeStamp: 0,
                _manipulationEvents: null,
                _x: 0, 
                _y: 0, 
                _translationDeltaX: 0, 
                _translationDeltaY: 0, 
                _scaleDelta: 0, 
                _expansionDelta: 0, 
                _rotationDelta: 0,
                _cumulativeTranslationX: 0, 
                _cumulativeTranslationY: 0, 
                _cumulativeScale: 0, 
                _cumulativeExpansion: 0, 
                _cumulativeRotation: 0,
                _vA: 0,
                _vX: 0,
                _vY: 0,
                _dX: [],
                _dY: [],
                _dt: [],
                _i: 0,
                _iMax: 4,
                advise: function(manipulationEvents) {
                    this._manipulationEvents = manipulationEvents;
                },
                completeManipulation: function (timeStamp) {
                    if (timeStamp) {
                        this._completeTimeStamp = timeStamp;
                    } else {
                        this._completeTimeStamp = Date.now();
                    }
                    this._completed = true;
                },
                getAngularVelocity: function() {
                    return this._vA;
                },
                getExpansionVelocity: function() {
                    return 0;
                },
                getVelocityX: function() {
                    return this._vX;
                },
                getVelocityY: function() {
                    return this._vY;
                },
                processDownWithTime: function (manipulatorId, x, y, timeStamp) {
                    this._completed = false;
                    this._initialTimeStamp = timeStamp;

                    this._translationDeltaX = 0;
                    this._translationDeltaY = 0;
                    this._x = x;
                    this._y = y;
                    this._cumulativeTranslationX = 0;
                    this._cumulativeTranslationY = 0;
                    this._vA = 0;
                    this._vX = 0;
                    this._vY = 0;
                    this._dX = [];
                    this._dY = [];
                    this._dt = [];
                    this._i = 0;

                    if (this._manipulationEvents) {
                        this._manipulationEvents.manipulationStarted(this._x, this._y);
                    }
                },
                processDown: function (manipulatorId, x, y) {
                    this.processDownWithTime(manipulatorId, x, y, Date.now());
                },
                processMoveWithTime: function (manipulatorId, x, y, timeStamp) {
                    if (!this._completed) {
                        var prevTimestamp = this._deltaTimeStamp || this._initialTimeStamp;
                        this._deltaTimeStamp = timeStamp;

                        this._translationDeltaX = x - this._x;
                        this._translationDeltaY = y - this._y;
                        this._x = x;
                        this._y = y;
                        this._cumulativeTranslationX += this._translationDeltaX;
                        this._cumulativeTranslationY += this._translationDeltaY;

                        if (timeStamp > prevTimestamp) {
                            this._dX[this._i] = this._translationDeltaX;
                            this._dY[this._i] = this._translationDeltaY;
                            this._dt[this._i] = timeStamp - prevTimestamp;
                            this._i++;
                            if (this._i === this._iMax) {
                                this._i = 0;
                            }
                            var count = 0;
                            this._vX = 0;
                            this._vY = 0;
                            for (var i = 0; i < this._iMax; i++) {
                                if (this._dt[i]) {
                                    this._vX += this._dX[i] / this._dt[i];
                                    this._vY += this._dY[i] / this._dt[i];
                                    count++;
                                }
                            }
                            if (count > 0) {
                                this._vX = this._vX / count;
                                this._vY = this._vY / count;
                            }
                        }

                        if (this._manipulationEvents) {
                            this._manipulationEvents.manipulationDelta(this._x, this._y,
                                this._translationDeltaX, this._translationDeltaY, this._scaleDelta, this._expansionDelta, this._rotationDelta,
                                this._cumulativeTranslationX, this._cumulativeTranslationY, this._cumulativeScale, this._cumulativeExpansion, this._cumulativeRotation);
                        }
                    }
                },
                processMove: function (manipulatorId, x, y) {
                    this.processMoveWithTime(manipulatorId, x, y, Date.now());
                },
                processUpWithTime: function (manipulatorId, x, y, timeStamp) {
                    if (!this._completed) {

                        this._x = x;
                        this._y = y;

                        if (this._manipulationEvents) {
                            this._manipulationEvents.manipulationCompleted(this._x, this._y,
                                this._cumulativeTranslationX, this._cumulativeTranslationY, this._cumulativeScale, this._cumulativeExpansion, this._cumulativeRotation);
                        }
                        this.completeManipulation(timeStamp);
                    }
                },
                processUp: function (manipulatorId, x, y) {
                    this.processUpWithTime(manipulatorId, x, y, Date.now());
                },
                _minimumScaleRotateRadius: 0,
                minimumScaleRotateRadius: {
                    get: function() {
                        return this._minimumScaleRotateRadius;
                    },
                    set: function(value) {
                        this._minimumScaleRotateRadius = value;
                    }
                },
                _pivotPointX: 0,
                pivotPointX: {
                    get: function() {
                        return this._pivotPointX;
                    },
                    set: function(value) {
                        this._pivotPointX = value;
                    }
                },
                _pivotPointY: 0,
                pivotPointY: {
                    get: function() {
                        return this._pivotPointY;
                    },
                    set: function(value) {
                        this._pivotPointY = value;
                    }
                },
                _pivotRadius: 0,
                pivotRadius: {
                    get: function() {
                        return this._pivotRadius;
                    },
                    set: function(value) {
                        this._pivotRadius = value;
                    }
                },
                _supportedManipulations: MANIPULATION_PROCESSOR_MANIPULATIONS.MANIPULATION_TRANSLATE_X | MANIPULATION_PROCESSOR_MANIPULATIONS.MANIPULATION_TRANSLATE_Y,
                supportedManipulations: {
                    get: function() {
                        return this._supportedManipulations;
                    },
                    set: function(value) {
                        this._supportedManipulations = value;
                    }
                }
            }
        ),

        // define a class for the InertiaProcessor
        InertiaProcessor: WinJS.Class.define(
            function inertiaProcessor() {
                this.reset();
            }, {
                _x: 0,
                _y: 0,
                _completed: false,
                _initialTimeStamp: 0,
                _deltaTimeStamp: 0,
                _completeTimeStamp: 0,
                _manipulationEvents: null,
                advise: function(manipulationEvents) {
                    this._manipulationEvents = manipulationEvents;
                },
                completeTime: function (timeStamp) {
                    this._completeTimeStamp = timeStamp;
                    this._completed = true;
                },
                complete: function () {
                    this.completeTime(Date.now());
                },
                processTime: function (timeStamp) {
                    if (!this._completed) {
                        var prevTimestamp = this._initialTimeStamp;
                        this._deltaTimeStamp = timeStamp;

                        var sX = 0;
                        var sY = 0;
                        if (this._desiredDeceleration > 0) {
                            var dt = timeStamp - prevTimestamp;
                            var vD = this._desiredDeceleration * dt;
                            var decl = this._desiredDeceleration * dt * dt / 2;
                            var tMaxX, tMaxY;
                            if (this._initialVelocityX > 0) {
                                if (this._initialVelocityX - vD > 0) {
                                    sX = this._initialVelocityX * dt - decl;
                                } else {
                                    tMaxX = this._initialVelocityX / this._desiredDeceleration;
                                    sX = this._initialVelocityX * tMaxX - this._desiredDeceleration * tMaxX * tMaxX / 2;
                                }
                            } else if (this._initialVelocityX < 0) {
                                if (this._initialVelocityX + vD < 0) {
                                    sX = this._initialVelocityX * dt + decl;
                                } else {
                                    tMaxX = -this._initialVelocityX / this._desiredDeceleration;
                                    sX = this._initialVelocityX * tMaxX + this._desiredDeceleration * tMaxX * tMaxX / 2;
                                }
                            }
                            if (this._initialVelocityY > 0) {
                                if (this._initialVelocityY - vD > 0) {
                                    sY = this._initialVelocityY * dt - decl;
                                } else {
                                    tMaxY = this._initialVelocityY / this._desiredDeceleration;
                                    sY = this._initialVelocityY * tMaxY - this._desiredDeceleration * tMaxX * tMaxX / 2;
                                }
                            } else if (this._initialVelocityY < 0) {
                                if (this._initialVelocityY + vD > 0) {
                                    sY = this._initialVelocityY * dt + decl;
                                } else {
                                    tMaxY = -this._initialVelocityY / this._desiredDeceleration;
                                    sY = this._initialVelocityY * tMaxY + this._desiredDeceleration * tMaxX * tMaxX / 2;
                                }
                            }
                        }
                        var x = this._initialOriginX + sX;
                        var y = this._initialOriginY + sY;

                        if (this._manipulationEvents) {
                            if (this._x !== x || this._y !== y) {
                                this._translationDeltaX = x - this._x;
                                this._translationDeltaY = y - this._y;
                                this._x = x;
                                this._y = y;
                                this._cumulativeTranslationX += this._translationDeltaX;
                                this._cumulativeTranslationY += this._translationDeltaY;

                                this._manipulationEvents.manipulationDelta(this._x, this._y,
                                    this._translationDeltaX, this._translationDeltaY, this._scaleDelta, this._expansionDelta, this._rotationDelta,
                                    this._cumulativeTranslationX, this._cumulativeTranslationY, this._cumulativeScale, this._cumulativeExpansion, this._cumulativeRotation);
                            } else {
                                this.completeTime(timeStamp);
                            }
                        }
                    }
                    return this._completed;
                },
                process: function () {
                    return this.processTime(Date.now());
                },
                reset: function () {
                    this._initialTimeStamp = Date.now();
                    this.x = 0;
                    this.y = 0;
                    this._completed = false;
                },
                _boundaryBottom: 0,
                boundaryBottom: {
                    get: function() {
                        return this._boundaryBottom;
                    },
                    set: function(value) {
                        this._boundaryBottom = value;
                    }
                },
                _boundaryLeft: 0,
                boundaryLeft: {
                    get: function() {
                        return this._boundaryLeft;
                    },
                    set: function(value) {
                        this._boundaryLeft = value;
                    }
                },
                _boundaryTop: 0,
                boundaryTop: {
                    get: function() {
                        return this._boundaryTop;
                    },
                    set: function(value) {
                        this._boundaryTop = value;
                    }
                },
                _boundaryRight: 0,
                boundaryRight: {
                    get: function() {
                        return this._boundaryRight;
                    },
                    set: function(value) {
                        this._boundaryRight = value;
                    }
                },
                _desiredAngularDecelaration: 0.00001,
                desiredAngularDecelaration: {
                    get: function() {
                        return this._desiredAngularDecelaration;
                    },
                    set: function(value) {
                        this._desiredAngularDecelaration = value;
                    }
                },
                _desiredDeceleration: 0.001,
                desiredDeceleration: {
                    get: function() {
                        return this._desiredDeceleration;
                    },
                    set: function(value) {
                        this._desiredDeceleration = value;
                    }
                },
                _desiredDisplacement: 0,
                desiredDisplacement: {
                    get: function() {
                        return this._desiredDisplacement;
                    },
                    set: function(value) {
                        this._desiredDisplacement = value;
                    }
                },
                _desiredExpansion: 0,
                desiredExpansion: {
                    get: function() {
                        return this._desiredExpansion;
                    },
                    set: function(value) {
                        this._desiredExpansion = value;
                    }
                },
                _desiredExpansionDeceleration: 0,
                desiredExpansionDeceleration: {
                    get: function() {
                        return this._desiredExpansionDeceleration;
                    },
                    set: function(value) {
                        this._desiredExpansionDeceleration = value;
                    }
                },
                _desiredRotation: 0,
                desiredRotation: {
                    get: function() {
                        return this._desiredRotation;
                    },
                    set: function(value) {
                        this._desiredRotation = value;
                    }
                },
                _elasticMarginBottom: 0,
                elasticMarginBottom: {
                    get: function() {
                        return this._elasticMarginBottom;
                    },
                    set: function(value) {
                        this._elasticMarginBottom = value;
                    }
                },
                _elasticMarginLeft: 0,
                elasticMarginLeft: {
                    get: function() {
                        return this._elasticMarginLeft;
                    },
                    set: function(value) {
                        this._elasticMarginLeft = value;
                    }
                },
                _elasticMarginRight: 0,
                elasticMarginRight: {
                    get: function() {
                        return this._elasticMarginRight;
                    },
                    set: function(value) {
                        this._elasticMarginRight = value;
                    }
                },
                _elasticMarginTop: 0,
                elasticMarginTop: {
                    get: function() {
                        return this._elasticMarginTop;
                    },
                    set: function(value) {
                        this._elasticMarginTop = value;
                    }
                },
                _initialAngularVelocity: 0,
                initialAngularVelocity: {
                    get: function() {
                        return this._initialAngularVelocity;
                    },
                    set: function(value) {
                        this._initialAngularVelocity = value;
                    }
                },
                _initialExpansionVelocity: 0,
                initialExpansionVelocity: {
                    get: function() {
                        return this._initialExpansionVelocity;
                    },
                    set: function(value) {
                        this._initialExpansionVelocity = value;
                    }
                },
                _initialOriginX: 0,
                initialOriginX: {
                    get: function() {
                        return this._initialOriginX;
                    },
                    set: function(value) {
                        this._initialOriginX = value;
                    }
                },
                _initialOriginY: 0,
                initialOriginY: {
                    get: function() {
                        return this._initialOriginY;
                    },
                    set: function(value) {
                        this._initialOriginY = value;
                    }
                },
                _initialRadius: 0,
                initialRadius: {
                    get: function() {
                        return this._initialRadius;
                    },
                    set: function(value) {
                        this._initialRadius = value;
                    }
                },
                _initialTimestamp: 0,
                initialTimestamp: {
                    get: function() {
                        return this._initialTimestamp;
                    },
                    set: function(value) {
                        this._initialTimestamp = value;
                    }
                },
                _initialVelocityX: 0,
                initialVelocityX: {
                    get: function() {
                        return this._initialVelocityX;
                    },
                    set: function(value) {
                        this._initialVelocityX = value;
                    }
                },
                _initialVelocityY: 0,
                initialVelocityY: {
                    get: function() {
                        return this._initialVelocityY;
                    },
                    set: function(value) {
                        this._initialVelocityY = value;
                    }
                }
            }
        )
    });

    WinJS.Namespace.define("TouchPhysics", {


        // define a class for the ManipulationEventSinks
        //
        // use new ManipulationEventSink(touchMove, inert, manip) for manipulation processing
        // use new ManipulationEventSink(touchMove, inert) for inertia processing
        //
        // with function onTouch(eventId, x, y) for resulting action
        //
        ManipulationEventSink: WinJS.Class.derive(TouchPhysics.ManipulationEvents,
            function manipulationEventSink(onTouch, inert, manip) {
                this.fExtrapolating = !manip;
                this.fCancelled = false;
                this.fCompleted = false;
                this.cStartedEventCount = 0;
                this.cDeltaEventCount = 0;
                this.cCompletedEventCount = 0;
                this.fX = 0;
                this.fY = 0;
                this.dwLastEventMs = 0;

                var that = this;
                TouchPhysics.ManipulationEvents.apply(this, [
                    function manipulationStarted(x, y) {
                        that.cStartedEventCount++;
                        that.fCancelled = false;

                        if (!that.fExtrapolating) {
                            that.fX = x;
                            that.fY = y;
                            //New manipultaion started, stop other inertia timer (if any) used for processing  
                            var pxX = TouchPhysics.TOUCH_COORD_TO_PIXEL(x);
                            var pxY = TouchPhysics.TOUCH_COORD_TO_PIXEL(x);
                            onTouch(TOUCHEVENT.DOWN, pxX, pxY);
                            if (inert) {
                                // set origins in manipulation processor
                                inert.initialOriginX = x;
                                inert.initialOriginY = y;

                                // deceleration is units per square millisecond
                                inert.desiredDeceleration = TouchPhysics.touchIntertiaDeceleraion / 100;//0;

                                // ToDo: set the boundaries
                            }
                        }
                        that.dwLastEventMs = Date.now();
                    }, function manipulationDelta(x, y, translationDeltaX, translationDeltaY, scaleDelta, expansionDelta, rotationDelta,
                        cumulativeTranslationX, cumulativeTranslationY, cumulativeScale, cumulativeExpansion, cumulativeRotation) {
                        if (!that.fCancelled) {
                            that.cStartedEventCount++;
                            that.fX += translationDeltaX;
                            that.fY += translationDeltaY;

                            var pxX = TouchPhysics.TOUCH_COORD_TO_PIXEL(that.fX);
                            var pxY = TouchPhysics.TOUCH_COORD_TO_PIXEL(that.fY);
                            if (pxX !== that.prevPxX || pxY !== that.prevPxY) {
                                onTouch(TOUCHEVENT.MOVE, pxX, pxY);

                                that.prevPxX = pxX;
                                that.prevPxY = pxY;
                            }
                            that.dwLastEventMs = Date.now();
                        }
                    }, function manipulationCompleted(x, y, cumulativeTranslationX, cumulativeTranslationY, cumulativeScale, cumulativeExpansion, cumulativeRotation) {
                        if (!that.fCancelled) {
                            that.cStartedEventCount++;

                            if (that.fExtrapolating) {
                                var pxX = TouchPhysics.TOUCH_COORD_TO_PIXEL(that.fX);
                                var pxY = TouchPhysics.TOUCH_COORD_TO_PIXEL(that.fY);

                                onTouch(TOUCHEVENT.UP, pxX, pxY);
                            } else if (inert && manip) {
                                var vX = manip.getVelocityX();
                                var vY = manip.getVelocityY();
                                var vA = manip.getAngularVelocity();

                                // complete any previous processing
                                inert.complete();

                                // Reset sets the  initial timestamp
                                inert.reset();

                                inert.initialVelocityX = vX;
                                inert.initialVelocityY = vY;
                                inert.initialAngularVelocity = vA;

                                inert.initialOriginX = that.fX;
                                inert.initialOriginY = that.fY;

                                that.startTimer();
                                that.dwLastEventMs = Date.now();
                            }
                        } else {
                            that.fCompleted = true;
                            that.fCancelled = false;
                        }
                    }
                ]);
                if (manip) {
                    manip.pivotRadius = -1;
                    manip.advise(this);
                } else if (inert) {
                    inert.advise(this);
                }
            }, {
                fExtrapolating : false,
                fCancelled: false,
                cStartedEventCount: 0,
                cDeltaEventCount: 0,
                cCompletedEventCount: 0,
                fX: 0,
                fY: 0,
                prevPxX: 0,
                prevPxY: 0,
                dwLastEventMs: 0,
                getStartedEventCount: function() {
                    return this.cStartedEventCount;
                },
                getDeltaEventCount: function() {
                    return this.cDeltaEventCount;
                },
                getCompletedEventCount: function() {
                    return this.cCompletedEventCount;
                },
                getLastEventMs: function () {
                    return this.dwLastEventMs;
                },
                x: {
                    get: function () {
                        return this.fX;
                    }, 
                    set: function(fX) {
                        this.fX = fX;
                    }
                },
                y: {
                    get: function () {
                        return this.fY;
                    },
                    set: function (fY) {
                        this.fY = fY;
                    }
                },
                _timer: null,
                setTimer: function(timer) {
                    this._timer = timer;
                },
                startTimer: function() {
                    if (this._timer) {
                        this._timer();
                    }
                }
            }
        ),

        TouchPhysics: WinJS.Class.define(
            function touchPhysics(touchMove) {
                this.manipProc = new TouchPhysics.ManipulationProcessor();
                this.inertProc = new TouchPhysics.InertiaProcessor();
                this.manipEventSink = new TouchPhysics.ManipulationEventSink(touchMove, this.inertProc, this.manipProc);
                this.inertEventSink = new TouchPhysics.ManipulationEventSink(touchMove, this.inertProc);
                this.manipEventSink.setTimer(this.onTimer.bind(this));
            }, {
                manipProc: null,
                inertProc: null,
                inertEventSink: null,
                manipEventSink: null,
                processDown: function (manipulatorId, x, y) {
                    if (this.manipProc) {
                        this.manipProc.processDown(manipulatorId, x, y);
                    }
                },
                processMove: function (manipulatorId, x, y) {
                    if (this.manipProc) {
                        this.manipProc.processMove(manipulatorId, x, y);
                    }
                },
                processUp: function (manipulatorId, x, y) {
                    if (this.manipProc) {
                        this.manipProc.processUp(manipulatorId, x, y);
                    }
                },
                onTimer: function () {
                    if (this.inertProc) {
                        this.inertProc.process();
                    }
                    if (this.inertEventSink && !this.inertEventSink.fCompleted &&
                        Math.abs(Date.now() - this.inertEventSink.getLastEventMs()) < 500) {
                        var that = this;
                        WinJS.Promise.timeout(TouchPhysics.touchInertiaTimerMs).then(function() {
                            that.onTimer();
                        });
                    }
                }
            }
        )
    });

})();
