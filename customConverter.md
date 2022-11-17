Currently Depictor supports the following image converters:

- [Drawbot_image_to_gcode_converter_v2](https://github.com/Scott-Cooper/Drawbot_image_to_gcode_v2)
- [SudokuGcode](https://github.com/Iqwertz/SudokuGcode)

There are plans to add more image converters in the future (suggestions are welcome :).

Also in the far future there may be a option to add a custom image converter via the web interface. But for now you have to add a custom image converter manually:

## Requirements

- SSH access to the rpi
- FTP access to the rpi
- Converter
  - has to run on the rpi
  - has to be standalone (no dependencies)
  - has to be able to start by calling one bash script
  - has to output a file called _gcode.nc_ in the subfolder ./output
  - should output a file called _image.svg_ in the subfolder ./output
  - should output a file called _preview.png_ in the subfolder ./output
  - if it uses an image as input it should read it from ./input/image.jpg

## Preparing the files

Every converter has to be in its own folder named after the converter. The structure of the folder should look like this:

- _converterName_ (binary file) the compiled binary file of the converter
- _run.sh_ (bash script) more information:
  [run.sh](#runsh)
- _settings.json_ (json file) more information:
  [settings.json](#settingsjson)
- _input/_ (folder) if the converter uses an image it will be placed in this folder and have the name "image.jpg"
- _output/_ (folder) the converter has to output the gcode file in this folder and name it "gcode.nc". It should also output a svg file called "image.svg" and a preview image called "preview.png".

### **run.sh**

run.sh is the script that gets called by depictor when it wants to start the converter. The script will be made executable by depictor on startup. However all other files that need to be executable to run the converter have to be made executable by the script using `chmod +x`.

For example this is the run.sh script for DrawbotV2:

```bash
#!/bin/bash
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

chmod +x Drawbot_image_to_gcode_stripped
xvfb-run ./Drawbot_image_to_gcode_stripped
```

**Note 1:** The first three lines should be added to every run.sh script. They make sure that the script is executed in the same directory as the converter.

**Note 2:** Since most Depictor converters are written with processing. They need to be run with xvfb-run in order to work on an headless pie. xvfb-run is already installed when installing Depictor.

### **settings.json**

The settings.json file has to exist in every converter folder. It contains the settings that the user can change in the web interface.

- The following data types are supported:
  - string
  - number
  - boolean
  - object (with properties of supported types) (used to sort settings by type),
  - select
    - to add a select option add an array with the options and an string variable called "selected"+arrayVariableName
- if a variable starts with \_ it will be hidden from the settings

You can find a example for a settings.json file here: _/Backend/assets/imageConverter/DrawotbotV2/settings.json_

## Install the converter

All converters for Depictor are placed in the /home/pi/Depictor/assets/imageConverter directory. To install a new converter create a folder inside this directory with the name of the converter. Then copy all files of the converter into this folder. The easiest way to do this is ftp.

## Add the converter to the config file.

In the last step you have to add the converter to the config file. The config file is located at /home/pi/Depictor/data/config.json. To add the new converter add a new object in the converters array that looks like this:

```json
{
  "name": "ConverterName",
  "imageInput": boolean, // if the converter needs an image as input set to true
}
```

If you restart the rpi the converter should now be available in the web interface.

## Troubleshooting

If you have problems with the installation or the converter doesn't work please open an issue on github. I am happy to help you.
