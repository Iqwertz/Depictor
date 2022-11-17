#This script copies the Drawbot_image_to_gcode_stripped binary from the build folder to the Applications folder
#You still need to compile the binary in Processing first

shopt -s extglob

cp -R -a ./Drawbot_image_to_gcode_stripped/application.linux-armv6hf/. Backend/assets/image2gcode/linux
cp -R -a ./Drawbot_image_to_gcode_stripped/application.windows64/. Backend/assets/image2gcode/windows