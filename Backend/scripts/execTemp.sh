#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
source $parent_path/portConfig.sh
gcode-cli -b 1 -s 3000 ./assets/gcodes/temp.gcode $serialPort,b115200