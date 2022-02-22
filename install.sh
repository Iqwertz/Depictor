#!/bin/bash

echo -e "\x1B[96m starting Depictor install \x1B[0m"

echo -e "\x1B[96m updating system \x1B[0m"
sudo apt-get update -y
sudo apt-get upgrade -y

echo -e "\x1B[96m installing Apache server  \x1B[0m"
sudo apt-get install apache2 -y
echo -e "\x1B[96m downloading latest Depictor Frontend Build \x1B[0m"
sudo rm -r /var/www/html/index.html
sudo wget "https://github.com/Iqwertz/Depictor/releases/latest/download/Depictor-Build.zip" -O "/var/www/html/latest.zip"
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
cd

echo -e "\x1B[96m downloading latest Depictor Backend releases \x1B[0m"
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
echo -e "\x1B[96m installing Node modules \x1B[0m"
npm i

echo -e "\x1B[96m chmodExecutables \x1B[0m"
sudo chmod +x chmodScripts.sh
sudo ./chmodScripts.sh

echo -e "\x1B[96m installing PM2 \x1B[0m"
sudo npm install pm2 -g
echo -e "\x1B[96m configuring PM2 startup \x1B[0m"
sudo pm2 startup | awk '$1 ~ /^sudo/' | bash
echo -e "\x1B[96m starting node server \x1B[0m"
pm2 start "npm run start"
pm2 save

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