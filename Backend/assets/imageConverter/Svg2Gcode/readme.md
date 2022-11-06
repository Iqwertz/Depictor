svg2gcode

This code was modified by Iqwertz to be a module for Depictor.

- Added an Output option
- Gcanvas module was replaced with an fork from https://github.com/risq/gcanvas to have M3 and M5 commands
  - This requires to run npm i in the ./gcanvas folder as well
- small changes to better integrate with Depictor

========
A command line utility for converting SVG to Gcode using [Gcanvas](https://github.com/em/gcanvas) and [canvg](https://code.google.com/p/canvg/).

### Installation

First make sure you have [nodejs](http://nodejs.org) installed.

```
npm install -g svg2gcode
```

### Usage

```
  Usage: svg2gcode [options] <file ...>

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -s, --speed <number>       spindle speed
    -f, --feed <number>        feed rate
    -d, --depth <number>       z of final cut depth
    -c, --depthofcut <number>  z offset of layered cuts
    -t, --top <number>         z of top of work surface
    -a, --above <number>       z of safe area above the work
```
