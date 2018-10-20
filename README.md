# PostalWorker
A JavaScript WebWorker & postMessage library that connects UI elements, Web Workers, & Cross-Site Windows

# Installation:
npm install -save postalworker

# npm Commands:
```
npm run build - Runs rollup.js to combine all the modules and dependencies and output the primary library script PostalWorker.js
npm run build-worker - Builds the worker libraries (SharedWorker and WebWorker scripts are run separately from main library)
npm run test - Run unit tests
npm run coverage - Generate code coverage report
npm run doc - Generate documentation
npm run demos - Generate demo pages
npm run relase - Build, generate, run unit tests (basicaly - DO EVERYTHING)
```

Usage examples

```javascript
import PostalWorker from "postalworker";

// In one window:
PostalWorker().on('example', (msg) => { window.console.info(msg); });

// In another window:
PostalWorker().fire('example', 'This is an example');

// In the above, the first window will print the message passed on message class "example" into the window.console: "This is an example"

// To cross launch a new window with the ability to send messages (even if the new window is not on the same host/domain)
PostalWorker().crossOn(
  'crossExample',   
  function(msg) { window.console.info(msg); },
  'http://myurl', // This is where you specify the url you want to open to (it must have a copy of PostalWorker hosted too)
  'MyURL',        // This is where you name the new window if you want to interact with it directly with Javascript - limited by cross origin rules of course)
  false           // The last argument is optional and it includes more specific window parameters like width, height, etc...
);

// Then to send it a message:
PostalWorker().crossFire('crossExample', 'This is a message for my url window');

// In the above 2 commands, a window will be opened by the primary window, which will point to the url provided in argument 3
// And the second command will publish the message to the message class "crossExample" which window 2 will invoke the callback in argument 2 of crossOn

```
