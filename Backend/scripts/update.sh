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
sudo wget "https://github.com/Iqwertz/Depictor/releases/latest/download/Depictor-Backend.zip"
sudo unzip Depictor-Backend.zip -d ./Depictor-Backend/
sudo rm Depictor-Backend.zip
cd Depictor-Backend
mv * ../
cd ../
rm -r Depictor-Backend
npm i

echo -e "\x1B[96m setting chmod flags \x1B[0m"
sudo chmod +x chmodScripts.sh
sudo ./chmodScripts.sh
sudo find ./ -type d -exec chmod 755 {} \;
sudo chmod -R a+rw ./*

sudo reboot