#!/bin/sh

# compile jsx files to js

# see http://facebook.github.io/react/docs/tooling-integration.html for more details

# to get the jsx compiler, do this:
# $ npm install -g react-tools

jsx static/jsx/bustimer.jsx > static/js/bustimer.jsx.js 2>/dev/null
echo
echo 'done'
echo

