branch="gcode-upload"

sudo rm -r testingBackend
sudo mkdir testingBackend
cd testingBackend
sudo wget -O - https://github.com/Iqwertz/Depictor/archive/$branch.tar.gz | sudo tar -xz --strip=2 "Depictor-$branch/Backend"
npm i
npm run start