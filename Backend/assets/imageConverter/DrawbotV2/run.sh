#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

chmod +x Drawbot_image_to_gcode_stripped
xvfb-run ./Drawbot_image_to_gcode_stripped