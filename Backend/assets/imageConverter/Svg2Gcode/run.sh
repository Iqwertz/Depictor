#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

chmod +x ./bin/svg2gcode
mkdir -p output
./bin/svg2gcode --output output/gcode.nc
cp input/image.svg output/image.svg
mv output/image.png output/preview.png
