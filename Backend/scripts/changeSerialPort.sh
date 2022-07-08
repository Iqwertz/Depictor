#chenges the serialPort config for all the bash scripts, needs the new port as argument
#!/bin/bash

#get first input argument
newPort=$1

#check if new port is valid
if [ -z "$newPort" ]; then
    echo "No port specified"
    exit 1
fi

cat > ./portConfig.sh << ENDOFFILE
#!/usr/bin/env bash
serialPort="$newPort"
ENDOFFILE

echo "new port set to $newPort"

sudo bash setUSBChmod.sh