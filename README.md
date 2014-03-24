Bustimer
======================

A website which displays a bus departure schedule board.

Everything happens in Javascript in the browser.  You only need a basic dumb HTTP server.

The page fetches new bus times every 20 seconds.  If you see a little spinning reload icon,
the data you're seeing is older than 20 seconds (perhaps because of a lost network connection).
You can wait until the next 20 second refresh comes, or click the reload icon to try again right now.

You can click the "bus leaves in..." button to switch to "start waking in..." which takes walking
time to the bus stop into consideration.

To run:

* Run `./serve.sh` to start a basic HTTP server at `localhost:8000` for testing.

To edit the bus routes, stops, and walking times:

* Look at the end of `static/jsx/bustimer.jsx`.  There are notes there on how to get stop id numbers, etc.
* After making changes, run `./compile.sh` to turn the jsx into a normal js file so you can see it in the browser.

To develop:

* Edit `static/jsx/bustimer.jsx` which is a special weird kind of Javascript used by Facebook's `react.js` project
* Run `./compile.sh` to turn the jsx into a normal js file so you can see it in the browser.
* Alternately, you can use React's in-browser compiler during development to avoid running the compilation yourself all the time.  In `index.html`, remove "xxx" whereever you find it.

