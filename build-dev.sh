#!/bin/bash

vn="v0.0.0 dev"

echo "Building Frontend"
cd Frontend
npm install
ng build
cd ../
powershell Compress-Archive ".\Frontend\dist\Depictor\*" "Dev-Depictor-Frontend-Build.zip"
 
echo "Frontend Build Successfull"

echo "Building Backend"
mkdir buildTemp/
cp -r ./Backend/* ./buildTemp
rm removeBGAPIKey.txt
rm -r ./buildTemp/node_modules
rm -r ./buildTemp/data
rm -r ./buildTemp/assets/image2gcode/windows

cat > ./buildTemp/src/version.ts << ENDOFFILE
export const version = { tag: "$vn", production: true };
ENDOFFILE

powershell Compress-Archive ".\buildTemp\*" "Dev-Depictor-Backend.zip"
rm -r buildTemp

echo "Backend Build Successfull"