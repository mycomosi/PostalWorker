/* eslint-env node, mocha */
/* global expect sinon*/

import {PostalWorker} from "../../src/es6/PostalWorker";


describe('PostalWorker', function () {

    'use strict';

    it(`
    should initialize and if it is not the parent window, 
    backfire to register with parent,
    and start sharedWorker`, function () {

        // Given
        global.SharedWorker = function() {
            this.port = {
                onmessage: null
            };
        };
        global.window = {
            attachEvent: () => {

            },
            SharedWorker: function() {
                this.port = {
                    onmessage: null
                };
            },
            console: {
                warn: sinon.spy(),
                debug: sinon.spy()
            },
            self: 'me',
            top: {
                postMessage: sinon.spy()
            }
        };
        global.document = {
            querySelectorAll: () => {
                return {};
            },
            referrer: 'http://parentwindow'
        };
        let configuration = {},
            safeJson = sinon.spy(() => {return 'json';});

        // When
        new PostalWorker(configuration, safeJson);

        // Then
        sinon.assert.calledOnce(safeJson);
        sinon.assert.calledWith(window.top.postMessage,
            'json',
            'http://parentwindow'
        );

    });

    it(`should initialize and cover conditions normally not reached`, function () {

        // Given
        global.window = {
            addEventListener: () => {

            },
            console: {
                warn: sinon.spy(),
                debug: sinon.spy(),
                info: sinon.spy()
            },
            self: {
                postMessage: sinon.spy()
            },
            top: {
                postMessage: sinon.spy()
            }
        };
        global.document = {
            querySelectorAll: () => {
                return {};
            },
            referrer: ''
        };
        let configuration = null,
            safeJson = sinon.spy(() => {return 'json';});

        // When
        new PostalWorker(configuration, safeJson);

        // Then
        sinon.assert.calledWith(window.console.info, '_startDedicatedWorker (not complete)');

    });

});
