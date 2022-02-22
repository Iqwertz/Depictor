#!/bin/bash

echo start Frontend Update

shopt -s extglob
sudo rm -r /var/www/html/!("dev")
sudo wget "https://github.com/Iqwertz/Depictor/releases/latest/download/Depictor-Backend.zip"
sudo unzip /var/www/html/latest.zip -d /var/www/html/
sudo rm /var/www/html/latest.zip

echo updated Frontend

echo start Backend Update

shopt -s extglob
rm -r ./!("data")
wget "https://github.com/Iqwertz/Depictor/releases/latest/download/Depictor-Backend.zip"
unzip Depictor-Backend.zip
rm Depictor-Backend.zip
cd Depictor-Backend
mv * ../
cd ../
rm -r Depictor-Backend
sudo npm i
sudo chmod +x chmodScripts.sh
sudo ./chmodScripts.sh

sudo reboot