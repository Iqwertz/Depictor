#!/bin/bash

echo "Deleting old builds"
db="Depictor-Backend.zip"
if [ -f "$db" ] ; then
    rm "$db"
fi

df="Depictor-Frontend-Build.zip"
if [ -f "$df" ] ; then
    rm "$df"
fi

echo "Version number (format: v1.0.0):"
read vn

echo "Building Frontend"
cd Frontend
npm install
ng build
cd ../
powershell Compress-Archive ".\Frontend\dist\Depictor\*" "Depictor-Frontend-Build.zip"
 
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

cd buildTemp/
find . -name '*.sh' |xargs dos2unix
dos2unix ./assets/image2gcode/linux/Drawbot_image_to_gcode_stripped
cd ../

powershell Compress-Archive ".\buildTemp\*" "Depictor-Backend.zip"
rm -r buildTemp

echo "Backend Build Successfull"