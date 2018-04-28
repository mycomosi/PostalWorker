# PostalWorker
A JavaScript WebWorker & postMessage library that connects UI elements, Web Workers, & Cross-Site Windows

Installation:
npm install -save postalworker

Usage examples

```javascript
import PostalWorker from "postalworker";

// In one window:
PostalWorker().on('example', (msg) => { window.console.info(msg); });

// In another window:
PostalWorker().fire('example', 'This is an example');

// In the above, the first window will print the message passed on message class "example" into the window.console: "This is an example"
