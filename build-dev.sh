#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

vn="v0.0.0 dev"

echo "Building Frontend"
cd Frontend
npm install
ng build
cd ../
zip -r "Dev-Depictor-Frontend-Build.zip" "Frontend/dist/Depictor/" 

echo "Frontend Build Successfull"

echo "Building Backend"
mkdir buildTemp/
cp -r ./Backend/* ./buildTemp
#remove test.txt if exists
rm -f removeBGAPIKey.txt
rm -r ./buildTemp/node_modules
rm -r ./buildTemp/data

cat > ./buildTemp/src/version.ts << ENDOFFILE
export const version = { tag: "$vn", production: true };
ENDOFFILE

zip -r "Dev-Depictor-Backend.zip" "./buildTemp/" 
rm -r buildTemp

echo "Backend Build Successfull"

echo "Build Successfull"