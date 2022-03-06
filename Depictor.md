# Depictor
## About it
**Depictor** is a software that runs on a Raspberry Pi. It provides a simple and clean web interface to easily generate and draw images on an 2d plotter. A huge thanks goes to [Scott-Cooper](https://github.com/Scott-Cooper), for creating the  [Drawbot_image_to_gcode_v2](https://github.com/Scott-Cooper/Drawbot_image_to_gcode_v2) which is used to convert the images to beautiful gcode.


The idea behind this project is to have an plotter hanging on the wall and visitor have the possibilty to scan a qr-code for a website where they can take a selfie and watch it being drawen.

## Installing and Setup

### Material
- Raspberry pi
- min. 4GB micro sd card
- plotter that works with grbl (other non grbl plotter should also work in theory if they support the standard gcode set)
- a cable to connect the poltter and rpi over usb

### Quick install instructions:
If you are already familiar with rpis these are the simplified quick install instructions:
- install a raspbian os light image on the rpi.
- ssh into the rpi.
- execute these three commands:
-- wget https://raw.githubusercontent.com/Iqwertz/Depictor/main/install.sh
-- sudo chmod +x install.sh
-- sudo ./install.sh
- Open a browser and enter the ip of your rpi in the browser to access the web interface

### Detailed install instructions:
#### Insalling raspbian
To install raspbian on an sd card I recommend to use the Raspberry Pi imager. You can download it here:[www.raspberrypi.com/software/](https://www.raspberrypi.com/software/)
After installing raspberrypi imager and opening it up choose raspberry PI OS Lite (32-bit) as the os. Then select the correct sd-card and set the following settings (of course you have to change the username and password and set the correct wifi credentials):
[imager settings]
(The settings are in german and I cant find  way to change that but I think it is clear which settings should be used)
Then click on write and wait.

After the imager finished the write process remove the micro-sd card and put it into the rpi. You successfully created an raspbian image!

#### Installing Depictor
To install Depictor on your rpi you have to ssh into it. 
To do so open a terminal and type in _ssh pi@depictor_ (if you changed your username replace _pi_ with your username).
There may be some warning... just accept it by typing _yes_ and then enter your password.
If every thing was successfull the last line in the terminal should be: _pi@depictor:~ $_
Now paste these three commands: 
- wget https://raw.githubusercontent.com/Iqwertz/Depictor/main/install.sh
- sudo chmod +x install.sh
- sudo ./install.sh

The install will take a few minutes and then successfully installed Depictor! You can now access it by opening this url in the browser: [depictor.local](http://depictor.local/).

## Supported Raspberry Pi models 
The project was developed and tested with an Raspberry Pi 3B but should work on every official model. However it is not recommended to use an Raspberry Pi zero due to its limited processing power (the image conversion will take 15+ min)
