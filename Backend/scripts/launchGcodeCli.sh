#!/bin/bash
source ./portConfig.sh
gcode-cli -b 1 -s 3000 ./assets/gcodes/gcode.nc $serialPort,b115200 > ./data/logs/gcodeCliOutput.txt
