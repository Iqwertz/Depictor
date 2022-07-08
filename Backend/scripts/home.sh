#!/bin/bash
source ./portConfig.sh
gcode-cli -b 1 -s 3000 ./assets/gcodes/home.gcode $serialPort,b115200