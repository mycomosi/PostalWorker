# PostalWorker
A JavaScript WebWorker & postMessage library that connects UI elements, Web Workers, & Cross-Site Windows

Installation:
npm install -save postalworker

# npm Commands:
npm run build - Runs rollup.js to combine all the modules and dependencies and output the primary library script PostalWorker.js
npm run build-worker - Builds the worker libraries (SharedWorker and WebWorker scripts are run separately from main library)
npm run test - Run unit tests
npm run coverage - Generate code coverage report
npm run doc - Generate documentation
npm run demos - Generate demo pages
npm run relase - Build, generate, run unit tests (basicaly - DO EVERYTHING)

Usage examples

```javascript
import PostalWorker from "postalworker";

// In one window:
PostalWorker().on('example', (msg) => { window.console.info(msg); });

// In another window:
PostalWorker().fire('example', 'This is an example');

// In the above, the first window will print the message passed on message class "example" into the window.console: "This is an example"
