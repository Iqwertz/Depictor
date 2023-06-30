#!/bin/bash

# Variables
OWNER="iqwertz"
REPO="depictor"
TAG=$1

sudo apt-get install jq

# GitHub API URL
API_URL="https://api.github.com/repos/$OWNER/$REPO/releases/tags/$TAG"

# Fetch release information
response=$(curl -s "$API_URL")
assets=$(echo "$response" | jq -r '.assets[] | .browser_download_url')

# abort if no assets are found
if [[ -z "$assets" ]]; then
    echo "No assets found for tag $TAG"
    exit 1
fi

echo start Backend Update

shopt -s extglob
rm -r ./!("data"|"removeBGAPIKey.txt")

# Download assets
for asset in $assets; do
    echo "Downloading $asset..."
    curl -LOJ "$asset"
done

sudo unzip Depictor-Backend.zip -d ./Depictor-Backend/
sudo rm Depictor-Backend.zip
cd Depictor-Backend
mv * ../
cd ../
rm -r Depictor-Backend
npm i

echo updated Backend

echo start Frontend Update

shopt -s extglob
sudo rm -r /var/www/html/!("dev")
sudo unzip Depictor-Frontend-Build.zip -d /var/www/html/
sudo rm Depictor-Frontend-Build.zip

echo updated Frontend

echo -e "\x1B[96m setting chmod flags \x1B[0m"
sudo chmod +x chmodScripts.sh
sudo ./chmodScripts.sh
sudo find ./ -type d -exec chmod 755 {} \;
sudo chmod -R a+rw ./*

sudo reboot