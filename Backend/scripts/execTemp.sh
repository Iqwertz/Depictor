#!/bin/bash
source ./portConfig.sh
gcode-cli -b 1 -s 3000 ./assets/gcodes/temp.gcode $serialPort,b115200