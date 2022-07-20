#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
source $parent_path/portConfig.sh
#check if usb port is connected
if [ -z "$serialPort" ]; then
    echo "No USB port connected"
    else
    sudo chmod a+rw $serialPort
    echo "USB port $serialPort is now accessible"
fi
