#!/bin/bash
#changes the serialPort config for all the bash scripts, needs the new port as argument

#get first input argument
newPort=$1

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

#check if new port is valid
if [ -z "$newPort" ]; then
    echo "No port specified"
    exit 1
fi

cat > $parent_path/portConfig.sh << ENDOFFILE
#!/usr/bin/env bash
serialPort="$newPort"
ENDOFFILE

echo "new port set to $newPort"

sudo chmod a+rw $newPort