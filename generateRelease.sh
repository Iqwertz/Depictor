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
pushd Frontend/dist/Depictor
zip -r  "Depictor-Frontend-Build.zip" "./"
popd
mv Frontend/dist/Depictor/Depictor-Frontend-Build.zip .
 
echo "Frontend Build Successfull"
echo "Building Backend"
mkdir buildTemp/
cp -r ./Backend/* ./buildTemp
rm removeBGAPIKey.txt
rm -rf ./buildTemp/node_modules
rm -rf ./buildTemp/data
rm -rf ./buildTemp/assets/image2gcode/windows

cat > ./buildTemp/src/version.ts << ENDOFFILE
export const version = { tag: "$vn", production: true };
ENDOFFILE

pushd buildTemp
zip -r "Depictor-Backend.zip" "./" 
popd
mv buildTemp/Depictor-Backend.zip .
rm -r buildTemp

echo "Backend Build Successfull"