/**
 *  PostalWorker Demo - Multiple Iframes Issue
 *  In order to support multiple iframes or windows from the same "host"
 */

let myid = false;
const DEMO = 'demo',
    IFRAME_MSG = 'iframe-msg',
    PARENT_MSG = 'parent-msg',
    CURRENT_ID = 'current-id';

/**
 * Makes the ids and also handles assigning the window # to hashes
 * @return {string}
 */
const makeId = () => {
    let currentId = window.localStorage.getItem(CURRENT_ID);
    if (!currentId) {
        window.localStorage.setItem(CURRENT_ID, '1');
        window.location.hash = 1;
        myid = 1;
        return '1';
    }
    else if (currentId === '1' || currentId.toString() === '1') {
        window.localStorage.setItem(CURRENT_ID, '2');
        window.location.hash = 2;
        myid = 2;
        return '2';
    }
    else if (currentId === '2' || currentId.toString() === '2') {
        myid = window.location.hash;
        return window.location.hash;
    }
};

// Create closure and split behaviors based on whether window is parent or child
{

    // If this is an iframe
    if (window.self !== window.top) {
        let postal = window.PostalWorker(),
            id = makeId();
        postal.backFire(IFRAME_MSG, `Iframe (${id}) sending message to parent window`);
        postal.crossOn(PARENT_MSG, (msg) => {
            window.console.info(`[Message from iframe (${myid}): ${msg}]`);
        }, false);
    }
    // Otherwise, this is the parent page...
    else {
        let postal = window.PostalWorker(),
            demo = document.querySelector(`#${DEMO}`);
        postal.crossOn(IFRAME_MSG, (msg) => {
            window.console.info(`Parent window: ${msg}`);
        }, false);

        setTimeout(() => {
            postal.crossFire(
                PARENT_MSG,
                `Automatically initiated message from parent window`
            );
        }, 100);


        /*
        Display demo view content...
         */
        demo.innerHTML = `

<p>
This demonstration displays a basic 3 window environment where there is a single parent window and 2 iframes.
</p>

<button>Send Message to Iframes</button>

`;
        document.querySelector('button').onclick = () => {
            let postal = window.PostalWorker();
            postal.crossFire(
                PARENT_MSG,
                `Manually initiated message from parent window`
            );
        };
        // Cleanup
        window.onunload = function () {
            window.localStorage.clear();
        };
    }
}
