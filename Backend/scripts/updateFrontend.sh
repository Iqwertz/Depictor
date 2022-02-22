#!/bin/bash

echo start Frontend Update

shopt -s extglob
sudo rm -r /var/www/html/!("dev")
sudo wget "https://github.com/Iqwertz/Depictor/releases/latest/download/Depictor-Build.zip" -O "/var/www/html/latest.zip"
sudo unzip /var/www/html/latest.zip -d /var/www/html/
sudo rm /var/www/html/latest.zip