#!/bin/bash

mkdir Depictor
cd Depictor

echo -e "\x1B[96m starting Depictor install \x1B[0m"

echo -e "\x1B[96m updating system \x1B[0m"
sudo apt-get update -y
sudo apt-get upgrade -y

echo -e "\x1B[96m installing Apache server  \x1B[0m"
sudo apt-get install apache2 -y
echo -e "\x1B[96m downloading latest Depictor Frontend Build \x1B[0m"
sudo rm -r /var/www/html/index.html
sudo wget "https://github.com/Iqwertz/Depictor/releases/latest/download/Depictor-Frontend-Build.zip" -O "/var/www/html/latest.zip"
sudo unzip /var/www/html/latest.zip -d /var/www/html/
sudo rm /var/www/html/latest.zip

echo -e "\x1B[96m installing XVFB \x1B[0m"
sudo apt-get install xvfb libxrender1 libxtst6 libxi6 -y
echo -e "\x1B[96m installing Java \x1B[0m"
sudo apt-get install default-jre -y

echo -e "\x1B[96m starting Depictor Backend install \x1B[0m"

echo -e "\x1B[96m installing node \x1B[0m"
curl -sL https://deb.nodesource.com/setup_16.x | sudo bash -
sudo apt-get install -y nodejs
echo -e "\x1B[96m installing git \x1B[0m"
sudo apt install git -y

echo -e "\x1B[96m installing gcode-cli \x1B[0m"
echo -e "\x1B[96m cloning gcode-cli \x1B[0m"
git clone https://github.com/hzeller/gcode-cli.git
echo -e "\x1B[96m building gcode-cli \x1B[0m"
cd gcode-cli
make
sudo cp gcode-cli /usr/bin/
cd ../

echo -e "\x1B[96m downloading latest Depictor Backend releases \x1B[0m"
sudo wget "https://github.com/Iqwertz/Depictor/releases/latest/download/Depictor-Backend.zip"
sudo unzip Depictor-Backend.zip -d ./Depictor-Backend/
sudo rm Depictor-Backend.zip
cd Depictor-Backend
mv * ../
cd ../
rm -r Depictor-Backend
echo -e "\x1B[96m installing Node modules \x1B[0m"
npm i

echo -e "\x1B[96m setting default Gcodes \x1B[0m"
if [ -z "$(ls -A ./data/savedGcodes)" ]; then
    sudo mkdir data
    sudo cp -a ./assets/defaultGcodes/. ./data/savedGcodes
else
    echo "System already has gcode data"
fi

echo -e "\x1B[96m setting chmod flags \x1B[0m"
sudo chmod +x chmodScripts.sh
sudo ./chmodScripts.sh
sudo find ./ -type d -exec chmod 755 {} \;
sudo chmod -R a+rw ./*

echo -e "\x1B[96m installing PM2 \x1B[0m"
sudo npm install pm2 -g
echo -e "\x1B[96m configuring PM2 startup \x1B[0m"
sudo pm2 startup | awk '$1 ~ /^sudo/' | bash
echo -e "\x1B[96m starting node server \x1B[0m"
sudo pm2 start "npm run start"
sudo pm2 save

echo "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"
echo ""
echo " /%%%%%%%                      /%%             /%%                        "
echo "| %%__  %%                    |__/            | %%                        "
echo "| %%  \ %%  /%%%%%%   /%%%%%%  /%%  /%%%%%%% /%%%%%%    /%%%%%%   /%%%%%% "
echo "| %%  | %% /%%__  %% /%%__  %%| %% /%%_____/|_  %%_/   /%%__  %% /%%__  %%"
echo "| %%  | %%| %%%%%%%%| %%  \ %%| %%| %%        | %%    | %%  \ %%| %%  \__/"
echo "| %%  | %%| %%_____/| %%  | %%| %%| %%        | %% /%%| %%  | %%| %%      "
echo "| %%%%%%%/|  %%%%%%%| %%%%%%%/| %%|  %%%%%%%  |  %%%%/|  %%%%%%/| %%      "
echo "|_______/  \_______/| %%____/ |__/ \_______/   \___/   \______/ |__/      "
echo "                    | %%                                                  "
echo "                    | %%                                                  "
echo "                    |__/       "
echo ""
echo "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"      


echo -e "\x1B[96m successfully finished install \x1B[0m"