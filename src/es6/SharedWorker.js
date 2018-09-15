/**
 *  Postal Worker - Shared Worker Thread Engine
 *  @Description: Use web worker threading to fork threads and use postMessage to pass serialized data between threads and windows
 *  @Author: Russ Stratfull 2017-2018
 */

import * as S from './strings';
function uniqueNumber() {
    var date = Date.now();

    if (date <= uniqueNumber.previous) {
        date = ++uniqueNumber.previous;
    } else {
        uniqueNumber.previous = date;
    }

    return date;
}
uniqueNumber.previous = 0;

postalSharedWorker = {
    ports: [],
    events: new Map(),
    scripts: new Set(),
    addresses: new Set(),
    listeners: new Map(),

    /**
     *
     * @param msgClass
     * @param action
     */
    on: (msgClass, action) => {
        postalSharedWorker.events.set(msgClass, action);
    },

    /**
     *
     * @param msgClass
     */
    un: (msgClass) => {
        postalSharedWorker.events.delete(msgClass);
    },

    /**
     *
     * @param msgClass
     * @param msg
     * @param audience
     * @param target
     */
    fire: (msgClass, msg, audience, target) => {
        postalSharedWorker._postMessenger(
            S.FIRE,
            audience,
            {
                msgClass: msgClass,
                message: msg,
                audience: audience
            },
            target
        );
    },

    /**
     * Listen for an event and execute the provided callback
     * Events:
     * remove - remove from messaging community/queue
     *
     * @param event
     * @param callback
     */
    addListener: (event, callback) => {
        postalSharedWorker.listeners.set(S.REMOVE, callback);
    },

    /**
     * Process message events
     * @param event
     * @param port
     * @param ports
     * @private
     */
    _processMessage: (event, port, ports) => {

        if (event.data && event.type) {

            let msg = JSON.parse(event.data),
                range;

            switch (msg.type) {

                // Responses keep the worker aware of which connections are current
                case S.RESPONSE:
                    if (msg.status) {
                        let lastRequest = postalSharedWorker.ports.find(prt => prt.session === event.currentTarget);
                        if (lastRequest && lastRequest.tries) lastRequest.tries++;
                    }
                    break;

                case S.ON:
                    // todo: Not ported over from previous version yet
                    break;

                case S.UN:
                    // todo: Not ported over from previous version yet
                    break;

                case S.FIRE:

                    // Broadcast to windows/tabs
                    range = msg.data.audience || S.ALL; // public, private, ALL todo: direct port messaging...
                    postalSharedWorker._postMessenger(S.FIRE, range, msg.data, port);

                    // Invoke registered event on this thread
                    if (postalSharedWorker.events.has(msg.data.msgClass)) {
                        let address,
                            index,
                            src;
                        for (let p of postalSharedWorker.ports) {
                            if (p.session === event.currentTarget) {
                                address = p.address;
                                index = postalSharedWorker.ports.indexOf(p);
                                src = p.session;
                            }
                        }
                        postalSharedWorker.events.get(msg.data.msgClass)(
                            msg.data.message,
                            {index: index, address: address, src: src}
                        );
                    }
                    break;


                // todo...
                // case S.AJAX:
                //     break;
                // todo...
                case S.LOAD:

                    if (postalSharedWorker.scripts.has(msg.data)) {
                        return;
                    }
                    // Wrap importScripts in try catch to report errors back to the main window
                    // Attemp to load requested library
                    try {
                        importScripts(msg.data);
                        postalSharedWorker.scripts.add(msg.data);
                    }
                    catch(e) {
                        event.currentTarget.postMessage({
                            type: 'ERROR',
                            data: `PostalWorkerWorker Error: Unable to load file ${msg.data}`
                        });
                    }
                    break;

                case S.SET_ADDRESS: {
                    for (let p of postalSharedWorker.ports) {
                        if (p.session === event.currentTarget) {
                            p.address = msg.data;
                        }
                    }
                    let addressChange = {
                        type: S.SET_ADDRESS,
                        data: msg.data
                    };
                    event.currentTarget.postMessage(addressChange);
                }
            }
        }
    },

    /**
     * This function invokes a callback whenever a window is removed from the messaging queue
     * To configure the worker to do this, use the "addListener" method and provide the event "remove"
     * as the first argument
     * @param removals
     * @private
     */
    _invokeRemoveCallback: (removals) => {
        for (let r of removals) {
            postalSharedWorker.listeners.get(S.REMOVE)(r);
        }
    },

    /**
     * The messenger method used to post messages to the windows
     * @param type
     * @param audience
     * @param msg
     * @param port
     * @private
     */
    _postMessenger: (type, audience, msg, port) => {

        let notification,
            _port = (!!port && port.address) ?
            postalSharedWorker.ports.find(p => {
                if (p.address === port.address) {
                    return p;
                }
            }) :
            false;

        switch (audience) {

            case S.PRIVATE:
                notification = {
                    type: type,
                    data: msg
                };
                _port.tries++;
                _port.session.postMessage(notification);
                break;

            case S.PUBLIC:
                for (let p of postalSharedWorker.ports) {
                    p.tries--;
                    if (port !== p.session) {
                        notification = {
                            // If buffer drops, send one last notification of type BUFFERDROPPED
                            type: (p.tries<1) ? S.BUFFERDROPPED : type,
                            data: msg
                        };
                        p.session.postMessage(notification);
                    }
                }

                // Apply custom callback if it is provided when a port is removed from queue
                if (postalSharedWorker.listeners.has(S.REMOVE)) {
                    let removals = postalSharedWorker.ports.filter(pr => pr.tries <= 0);
                    if (removals.length>0) {
                        postalSharedWorker._invokeRemoveCallback(removals);
                    }
                }

                // Remove entries that don't have any tries left
                postalSharedWorker.ports = postalSharedWorker.ports.filter(pr => pr.tries > 0);
                break;

            default: // ALL
                // Fallback to older version support in case of no scope being defined
                for (let p of postalSharedWorker.ports) {
                    p.tries--;
                    notification = {
                        // If buffer drops,
                        // send one last notification of type BUFFERDROPPED
                        type: (p.tries<1) ? S.BUFFERDROPPED : type,
                        data: msg
                    };
                    p.session.postMessage(notification);
                }

                // Apply custom callback if it is provided when a port is removed from queue
                if (postalSharedWorker.listeners.has(S.REMOVE)) {
                    let removals = postalSharedWorker.ports.filter(pr => pr.tries <= 0);
                    if (removals.length>0) {
                        postalSharedWorker._invokeRemoveCallback(removals);
                    }
                }

                // Remove entries that don't have any tries left
                postalSharedWorker.ports = postalSharedWorker.ports.filter(pr => pr.tries > 0);
        }

    }
};

/**
 * When windows connect to the worker,
 * register their source and start their messaging session
 * @param event
 */
onconnect = (event) => {

    let address = uniqueNumber();
    let src = event.source,
        port = {
            address: address,
            session: src,
            tries: 10
        };
    postalSharedWorker.ports.push(port);
    src.start();
    src.addEventListener(S.MESSAGE, (event) => {
        postalSharedWorker._processMessage(event, src, postalSharedWorker.ports);
    });
    let startup = {
        type: S.SET_ADDRESS,
        data: address
    };
    src.postMessage(startup);

};
