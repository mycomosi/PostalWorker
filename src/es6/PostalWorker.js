/**
 * PostalWorker Post Messenger Event Bus Module (ES6)
 * @description: Listen for and broadcast out messages by "message class" between windows/tabs & web workers using the postMessage API
 * @Authors: Russ Stratfull & Francois Wauquier - 2017-2018
 */

import * as S from './strings';

let // Private registrations
    _address = null,
    _config = false,
    _worker = false,
    _parentWindow = false,
    _subscriptions = new Set(),
    _events = new Map(),
    _crossEvents = new Map(),
    _windows = new Map(),

    // Simplify adding event listeners
    _addListener = (ele, type, handler) => {
        if (ele.attachEvent) { ele.attachEvent(S.ON.concat(type), handler); }
        else { ele.addEventListener(type, handler); }
    };

// Define the PostalWorker object
export class PostalWorker {

    /**
     * Initialize object with configuration & setup the worker and listeners
     * @param configuration
     */
    constructor(configuration, safeJsonStringify) {

        _config = configuration || false;
        this.safeJsonStringify = safeJsonStringify;

        // Does this window have a parent?
        if (window.self !== window.top) {

            // If it does, register it and let it know this window is ready to receive messages
            _parentWindow = this._getSubscriber(document.referrer);
            this.backFire(S.CHILDREGISTER);
        }

        // Add event listener to incoming messages (from windows) and process with messageController
        _addListener(window, S.MESSAGE, this._messageController);

        // Resolve worker threading
        this._resolveWorker();
    }

    /**
     * Get root URL for subscriptions
     * (postMessage treats ALL urls the same off the same root)
     * @param url
     * @return {*}
     * @private
     */
    static _getSubscriber(url) {

        let splt = url.split('://'),
            protocol = splt[0],
            urlx = splt[1];
        if (urlx !== undefined) {
            let domain = splt[1].split('/')[0];
            return protocol.concat('://').concat(domain);
        }
        else {
            return url;
        }
    }

    /**
     * Resolve what type of worker threading is available
     * @private
     */
    _resolveWorker() {

        // Browser supports SharedWorker
        let sh = !!window.SharedWorker;
        sh = Boolean(sh);
        if (sh) {
            _worker = this._startSharedWorker();
            if (!_worker) {
                // Fallback on failure
                _worker = this._startDedicatedWorker();
            }
        }

        // Use plain web worker
        else {
            _worker = this._startDedicatedWorker();
        }

        return _worker;

    }

    /**
     * Attempt to start SharedWorker thread or fail and return false
     * @return {SharedWorker | boolean}
     * @private
     */
    _startSharedWorker() {

        let worker,
            route = this._getPostalRoute();

        try {
            worker = new SharedWorker(route.concat(S.POSTAL_SHARED_WORKER).concat('.').concat(S.JS), S.POSTAL_WORKER);
            worker.port.onmessage = (event) => {

                let OK = this.safeJsonStringify({type: S.RESPONSE, status: true});

                // Handle messages sent from worker by type
                switch (event.data.type) {

                    case S.FIRE:

                        // Send the message
                        if (event.data.data.msgClass &&
                        _events.get(event.data.data.msgClass)) {
                            _events.get(event.data.data.msgClass)(event.data.data.message);
                        }

                        // Let worker know message was received
                        event.currentTarget.postMessage(OK);

                        break;

                    case S.SET_ADDRESS: {
                        _address = event.data.data;
                        break;
                    }

                    case S.ERROR:
                        console.error(event.data.data);

                        break;

                    default: console.warn(event);
                }
            };
        }
        catch (e) {
            window.console.warn('PostalWorker - Unable to start SharedWorker - Reverting to dedicated worker');
            window.console.debug(e);
        }
        return (worker) ? worker : false;
    }

    /**
     * Start a basic web worker (not available at this time)
     * @private
     */
    static _startDedicatedWorker() {
        window.console.info('_startDedicatedWorker (not complete)');
    }

    /**
     * Resolve route to use to find the sharedworker file
     * Priority is:
     * 1. Configuration passed to library
     * 2. Find any script tag in document which is called PostalWorker and then see if PostalRoute is defined in the querystring
     * 3. Assume the file is adjacent to where this script is being run from
     * @return {String}
     * @private
     */
    _getPostalRoute() {
        let script = Array.from(document
            .querySelectorAll(S.SCRIPT))
            .filter(
                (s) => { return s.src.match(S.POSTAL_WORKER); }
            );

        // What about if more than one postalworker is found?
        // This should be pointed out...
        if (script.length>1) {
            window.console.warn('PostalWorker - Discovered more than 1 script tag matching "PostalWorker"');
        }
        if (_config.PostalRoute) {
            return _config.PostalRoute;
        }
        else {
            return (script.length === 1) ? script[0].src

                // minified version
                    .replace(/PostalWorker\.min\.js.*$/, '')

                    // full version
                    .replace(/PostalWorker\.js.*$/, '') :
                '';
        }

    }

    /**
     * Process window messaging events "data" by "type"
     * @param e
     * @private
     */
    static _messageController(e) {

        let msg = JSON.parse(e.data);

        switch (msg.type) {

            case S.CROSSFIRE:

                // Is this a parent we don't yet know about?
                if (!_windows.has(e.origin)) {
                    _windows.set(e.origin, e.source);
                    _subscriptions.add(e.origin);
                }

                // Is this a cross event?
                if (_crossEvents.has(msg.data.msgClass)) {

                    // If so, invoke registered callback against message
                    _crossEvents.get(msg.data.msgClass)(msg.data.message);
                }

                break;

            case S.BACKFIRE:

                // Children register themselves with the parent
                if (msg.data.msgClass === S.CHILDREGISTER) {

                    if (!_windows.has(e.origin)) {
                        _windows.set(
                            e.origin,
                            e.source
                        );
                    }
                    else {
                        // When a duplicate attempts to register, delete the previous resource
                        // This accounts for iframe reloading
                        _windows.delete(e.origin);
                        _windows.set(
                            e.origin,
                            e.source
                        );
                    }
                }

                // Regular backfire
                else {
                    if (_crossEvents.has(msg.data.msgClass)) {
                        // Invoke registered callback
                        _crossEvents.get(msg.data.msgClass)(msg.data.message);
                    }
                }

                break;

            case S.ERROR:
                window.console.error(msg.data.message);
                break;


            default:
                window.console.error('PostalWorker - Unexpected message event');
                window.console.debug({
                    type: '_messageController',
                    event: e
                });
        }

    }

    /**
     * Register in the worker thread for events
     * @param msgClass
     * @param action
     * @return {PostalWorker}
     */
    on(msgClass, action) {

        if (msgClass && action) {

            // Send message to worker thread
            let msg_ = this.safeJsonStringify({
                type: S.ON,
                data: {
                    msgClass: msgClass,
                    action: action
                }
            });
            if (_worker) _worker.port.postMessage(msg_);

            // Update registry
            _events.set(msgClass, action);

            return this;
        }
    }

    /**
     * Unregister event from worker thread
     * @param msgClass
     * @return {PostalWorker}
     */
    un(msgClass) {

        // Send message to worker thread
        let msg_ = this.safeJsonStringify({
            type: S.UN,
            data: msgClass
        });
        _worker.port.postMessage(msg_);

        // Update registry
        _events.delete(msgClass);

        return this;

    }

    /**
     * Fire event to worker thread
     * @param msgClass
     * @param msg
     * @param audience
     * @return {PostalWorker}
     */
    fire(msgClass, msg, audience) {

        let msg_ = this.safeJsonStringify({
            type: S.FIRE,
            data: {
                msgClass: msgClass,
                message: msg,
                audience: audience
            }
        });

        // Send to worker
        if (_worker) _worker.port.postMessage(msg_);

        return this;

    }

    /**
     * Register for cross launched windows or iframes messages
     * @param msgClass
     * @param action
     * @param subscriber
     * @param name
     * @param windowparams
     * @return {PostalWorker}
     */
    crossOn(msgClass, action, subscriber, name, windowparams) {

        let rootSubscriber,
            winName,
            params = '';

        // No subscriber means to ONLY listen but not to open the window reference
        if (!subscriber) {
            _crossEvents.set(msgClass, action);
        }
        else {

            // postMessage only needs the root protocol+domain to send messages
            rootSubscriber = this._getSubscriber(subscriber);

            // If subscriber doesn't exist
            if (!_subscriptions.has(rootSubscriber)) {

                // It also cannot be the parent window as that is already taken
                if (_parentWindow &&
                    rootSubscriber !== _parentWindow) {
                    window.console.warn('PostalWorker - Unable to crossOn parentWindow');
                    return this;
                }

                // Register subscription
                _subscriptions.add(rootSubscriber);

                // Open window for subscription
                winName = name || S._BLANK;

                if (windowparams) {
                    if (windowparams.top) params.concat(`top=${windowparams.top}`);
                    if (windowparams.left) params.concat(`, left=${windowparams.left}`);
                    if (windowparams.height) params.concat(`, height=${windowparams.height}`);
                    if (windowparams.width) params.concat(`, width=${windowparams.width}`);
                    if (windowparams.resizable) params.concat(`, resizable=${windowparams.resizable ? S.YES : S.NO}`);
                    if (windowparams.scrollbars) params.concat(`, scrollbars=${windowparams.scrollbars ? S.YES : S.NO}`);
                    if (windowparams.menubar) params.concat(`, menubar=${windowparams.menubar ? S.YES : S.NO}`);
                    if (windowparams.toolbar) params.concat(`, toolbar=${windowparams.toolbar ? S.YES : S.NO}`);

                    // Open window (with extra params)
                    _windows.set(
                        rootSubscriber,
                        window.open(
                            subscriber,
                            winName,
                            params
                        )
                    );
                }
                else {

                    // Open window (basic)
                    _windows.set(
                        rootSubscriber,
                        window.open(
                            subscriber,
                            winName
                        )
                    );
                }

                // Register associated action in registry
                _crossEvents.set(msgClass, action);
            }
            else {
                // Registration failed, print out what happened to console
                // todo: replace with custom logging to worker...?
                window.console.warn('PostalWorker - Unable to crossOn request');
                window.console.debug({
                    msgClass: msgClass,
                    action: action,
                    subscriber: subscriber,
                    name: name,
                    windowParams: windowparams
                });

            }
        }
        return this;
    }

    /**
     * Unregister cross launch/iframes
     * @param msgClass
     * @param subscriber
     * @return {PostalWorker}
     */
    unCross(msgClass, subscriber) {

        // Get root subscriber
        let rootSubscriber = this._getSubscriber(subscriber);

        // Remove from subscriptions
        _subscriptions.delete(rootSubscriber);

        // Remove from cross events registry
        _crossEvents.delete(msgClass);

        // If a reference to a window exists
        if (_windows.has(rootSubscriber)) {

            // Close it
            _windows.get(rootSubscriber).close();

            // Then remove from registry
            _windows.delete(rootSubscriber);
        }
        return this;
    }

    /**
     * Broadcast/fire across the windows/frames
     * @param msgClass
     * @param msg
     * @return {PostalWorker}
     */
    crossFire(msgClass, msg) {

        let msg_ = this.safeJsonStringify({
            type: S.CROSSFIRE,
            data: {
                msgClass: msgClass,
                message: msg
            }
        });

        // Parent window is part of the crossFire group
        if (_parentWindow) {
            top.postMessage(
                msg_,
                _parentWindow
            );
        }
        // The rest of the crossFire group
        if (_subscriptions.size>0) {
            for (let sub of _subscriptions) {
                _windows.get(sub).postMessage(
                    msg_,
                    sub
                );
            }
        }

        return this;
    }

    /**
     * Fire to all the things!
     * @param msgClass
     * @param msg
     * @return {PostalWorker}
     */
    fireAll(msgClass, msg) {
        return this.fire(msgClass, msg)
            .crossFire(msgClass, msg);
    }

    /**
     * Special fire type that is specifically from child to parent window
     * @param msgClass
     * @param msg
     * @return {PostalWorker}
     */
    backFire(msgClass, msg) {

        if (_parentWindow && msgClass) {

            let msg_ = this.safeJsonStringify({
                type: S.BACKFIRE,
                data: {
                    msgClass: msgClass,
                    message: msg
                }
            });

            try {
                top.postMessage(
                    msg_,
                    _parentWindow
                );
            }
            catch(e) {
                window.console.warn('PostalWorker - Unable to backFire');
                window.console.debug({
                    msg: msg_,
                    parentWindow: _parentWindow,
                    error: e
                });
            }

        }
        return this;
    }

    // todo: @russ - continue developing the below concepts...
    // ajax(config, fn) {}

    /**
     * Load JavaScript library into worker thread
     * todo: @Russ - support for multiple threads...
     * @param library
     */
    load(library) {
        // if (_worker) _worker.port.postMessage(msg_);
        if (_worker) {
            _worker.port.postMessage(this.safeJsonStringify({
                type: S.LOAD,
                data: library
            }));
        }
    }

    /**
     * Set postal address with worker postal system
     * @param name
     */
    setAddress(name) {
        if (_worker) {
            _worker.port.postMessage(this.safeJsonStringify({
                type: S.SET_ADDRESS,
                data: name
            }));
        }
    }

    /**
     * Get current address that is registered with postal system
     * @return {*}
     */
    getAddress() {
        return _address;
    }

}




