#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
source $parent_path/portConfig.sh
#check if usb port is connected
sudo chmod a+rw $serialPort
if [ $? = 0 ]; then
    echo "USB port $serialPort is now accessible"
else
    echo "No USB port connected"
fi
