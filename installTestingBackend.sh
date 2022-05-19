branch="gcode-upload"

sudo rm -r testingBackend
sudo mkdir testingBackend
cd testingBackend
sudo wget -O - https://github.com/Iqwertz/Depictor/archive/$branch.tar.gz | sudo tar -xz --strip=2 "Depictor-$branch/Backend"
npm i
sudo sed -i -e 's/3001/3333/g' ./src/enviroment.ts
sudo chmod +x chmodScripts.sh
sudo ./chmodScripts.sh
sudo find ./ -type d -exec chmod 755 {} \;
sudo chmod -R a+rw ./*
sudo chmod a+rw /dev/ttyACM0
sudo bash testingBackend/scripts/setUSBChmod.sh
sudo nodemon