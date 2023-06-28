#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
source $parent_path/portConfig.sh
gcode-cli -b 1 -s 3000 ./assets/gcodes/gcode.nc $serialPort,b115200,$enableHardwareFlowControl > ./data/logs/grbl.log 2>&1