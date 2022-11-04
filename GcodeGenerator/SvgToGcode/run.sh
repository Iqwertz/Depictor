#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

chmod +x juicy-gcode
mkdir -p output
juicy-gcode input/image.svg -o output/gcode.nc -f juicy.conf
cp input/image.svg output/image.svg

