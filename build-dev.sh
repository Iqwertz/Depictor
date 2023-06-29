#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

vn=$1

echo "Building Frontend"
cd Frontend
npm install
ng build
cd ../
pushd Frontend/dist/Depictor
zip -r "Dev-Depictor-Frontend-Build.zip" "./" 
popd
mv Frontend/dist/Depictor/Dev-Depictor-Frontend-Build.zip .

echo "Frontend Build Successfull"

echo "Building Backend"
mkdir buildTemp/
cp -r ./Backend/* ./buildTemp
cd buildTemp
rm -f removeBGAPIKey.txt
rm -rf node_modules
rm -rf data

cat > ./src/version.ts << ENDOFFILE
export const version = { tag: "$1", production: true };
ENDOFFILE

cd ../

pushd buildTemp
zip -r "Dev-Depictor-Backend.zip" "./" 
popd
mv buildTemp/Dev-Depictor-Backend.zip .
rm -r buildTemp

echo "Backend Build Successfull"

echo "Build Successfull"