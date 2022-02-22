#!/bin/bash

echo start Backend Update

shopt -s extglob
rm -r ./!("data")
LOCATION=$(curl -s https://api.github.com/repos/Iqwertz/Depictor-Backend/releases/latest \
| grep "tag_name" \
| awk '{print "https://github.com/Iqwertz/Depictor-Backend/archive/" substr($2, 2, length($2)-3) ".zip"}') \
; curl -L -o depictorbackend.zip $LOCATION
unzip depictorbackend.zip
rm depictorbackend.zip
cd Depictor-Backend-*
mv * ../
cd ../
rm -r Depictor-Backend-*
sudo npm i
sudo chmod +x chmodScripts.sh
sudo ./chmodScripts.sh

sudo reboot