#!/bin/bash
gcode-cli -b 1 -s 3000 ./assets/gcodes/gcode.nc /dev/ttyACM0,b115200 > ./data/logs/gcodeCliOutput.txt
