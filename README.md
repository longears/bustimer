Bustimer
======================

A website which displays a bus departure schedule board.

Everything happens in Javascript in the browser.  You only need a basic dumb HTTP server.

To run:

* Run `./serve.sh` to start a basic HTTP server at `localhost:8000` for testing.

To edit the bus config:

* Look at the end of `static/jsx/bustimer.jsx`.  There are notes there on how to get stop id numbers, etc.
* After making changes, run `./compile.sh` to turn the jsx into a normal js file so you can see it in the browser.

To develop:

* Edit `static/jsx/bustimer.jsx` which is a special weird kind of Javascript used by Facebook's `react.js` project
* Run `./compile.sh` to turn the jsx into a normal js file so you can see it in the browser.
* Alternately, you can use React's in-browser compiler during development to avoid running the compilation yourself all the time.  In `index.html`, remove "xxx" whereever you find it.

