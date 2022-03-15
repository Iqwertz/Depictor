
<p align="center">
  <img width="200" src="images/LogoFullRound.png">
</p>

# Depictor

![license](https://img.shields.io/github/license/iqwertz/depictor)
![release](https://img.shields.io/github/v/release/iqwertz/depictor)
![commits](https://img.shields.io/github/commit-activity/m/iqwertz/depictor)


Depictor is a web app that runs on a Raspberry Pi. It provides a simple and clean web interface to easily generate and draw images on an 2d plotter.
It features automatic background removal, custom gcode settings, print time estimates, gallery with previous prints and many more features.

# Table of contents

   * [Features](#features)
   * [Demo](#demo)
   * [Screenshots](#screenshots)
   * Installation & Setup
     * [Material](#material)
     * [Quick install instructions](#quick-install-instructions)
     * [Detailed install instructions](#detailed-install-instructions)
     * [Setup](#setup)
       * [Start gcode](#start-gcode)
       * [Gcode scaling](#gcode-scaling)
       * [Start gcode](#start-gcode)
       * [Pen down command](#pen-down-command)
       * [Enable automatic background removal](#enable-automatic-background-removal)
   * [Supported Raspberry Pi models ](#supported-raspberry-pi-models)
   * [Acknowledgements](#acknowledgements)
   * [License](#license)
   * [Run Locally](#run-locally)
   * [Support](#support)

# Features


- Modern and responsive web interface
- Image to gcode converter
- Automatic background removal
- Gallery with all previous drawings
- Live print progress view with time estimates
- One click updates


# Demo

Insert gif or link to demo


# Screenshots

![Screenshot](images/landingPage.png)
![gif](images/gcodeSlider.gif)
![Screenshot](images/gallery.png)
![Screenshot](images/drawing.png)
![Screenshot](images/settings.png)


# Installation & Setup
I couldn't test this guide with a lot of people, so if something isn't clear or doesn't work, please create a new Issue or write an email to juliushussl@gmail.com.

## Material
- Raspberry pi
- min. 4GB micro sd card
- plotter that works with grbl (other non grbl plotter should also work in theory if they support the standard gcode set)
- a cable to connect the plotter and rpi over usb

## Quick install instructions:
If you are already familiar with rpis these are the simplified quick install instructions:
- install a raspbian os light image on the rpi.
- ssh into the rpi.
- execute these three commands:
```bash
  wget https://raw.githubusercontent.com/Iqwertz/Depictor/main/install.sh
  sudo chmod +x install.sh
  sudo ./install.sh
```
- Connect the plotter with the rpi via USB.
- Open a browser and enter the ip of your rpi in the browser to access the web interface. If everything was successfull you now should see the depictor landing page! 
- (Before you start your first drawing you should check out the 'Setup' section)

## Detailed install instructions:
### Insalling raspbian
To install raspbian on an sd card I recommend to use the Raspberry Pi imager. You can download it here: [www.raspberrypi.com/software/](https://www.raspberrypi.com/software/).
After installing raspberrypi imager and opening it up choose raspberry PI OS Lite (32-bit) as the os. Then select the correct sd-card and set the following settings (of course you have to change the username and password and set the correct wifi credentials):
<p align="center">
  <img width="300" src="images/imagerSettings.PNG">
</p>

(The settings are in german and I cant find  way to change that but I think it is clear which settings should be used)
Then click on write and wait.

After the imager finished the write process remove the micro-sd card and put it into the rpi. You successfully created an raspbian image!

### Installing Depictor
To install Depictor on your rpi you have to ssh into it. 
To do so open a terminal and type in _ssh pi@depictor_ (if you changed your username replace _pi_ with your username).
There may be some warning... just accept it by typing _yes_ and then enter your password.
If every thing was successfull the last line in the terminal should be: _pi@depictor:~ $_
Now paste these three commands: 
```bash
  wget https://raw.githubusercontent.com/Iqwertz/Depictor/main/install.sh
  sudo chmod +x install.sh
  sudo ./install.sh
```

The install will take a few minutes. After it finished you successfully have installed Depictor! You can now access it by opening this url in the browser: [depictor.local](http://depictor.local/).

## Setup
Before you try to draw your first image, you propably have to adjust these three settings (all of them can be found in the settings tab in the top right):

### **Start gcode**
In this textfield you can paste some gcode that gets appended to the gcode file before drawing it. Before starting your first printer please adjust the feedrate (default 4000) and the homing command for your plotter. 

### **Gcode scaling**
The maximum values of the generated gcode are X200, Y162. If you move your plotter to this point the pen should be at the boarder of the a4 paper you want to draw on. If this is not the case you have to adjust the scaling of the generated gcode: 

To calculate the correct scaling for your plotter move your plotter to (0,0). Now place one corner of the A4 paper under the pen. Also the longer side of the paper should be along the x-axis.
Now move the y axis to the other corner of the A4 Paper. Note down the y coordinate of the new position. Then divide this value by 162. The result is the correct scaling. Enter it into the "_Gcode scaling_" field in the settings. 

When the pen is  if the drawen picture is not in the center of the paper you can shift the image by adjusting the "_Gcode offset_" setting.

### **Pen down command**
As the name says this is the command that is used to lower the pen during drawing. If this command is diffrent on your plotter plotter please change it here.
(Note: Currently the pen up command is always "_M05_"! I will add an option to change this in the future. If it is important to you please create an issue)

### **Enable automatic background removal**
The background remove function uses the [remove.bg](https://www.remove.bg/) api. To enable it you have to get an API key:
- Register on [remove.bg](https://www.remove.bg/)
- Go to the api settings: https://www.remove.bg/de/dashboard#api-key
- Click on "Show API key".
- Copy the key and paste it in the settings of depictor under "_BgRemove API key_"

(Note: When using the free version of the api you can only convert 50 pictures a month. If you need more you can buy more on the [remove.bg](https://www.remove.bg/) website)
 

# Supported Raspberry Pi models 
The project was developed and tested with an Raspberry Pi 3B but should work on every official model. However it is not recommended to use an Raspberry Pi zero due to its limited processing power (the image conversion will take 15+ min).
    
# Acknowledgements

 - Huge thanks to [Scott-Cooper](https://github.com/Scott-Cooper), for creating the  [Drawbot_image_to_gcode_v2](https://github.com/Scott-Cooper/Drawbot_image_to_gcode_v2) which is used to convert the images to beautiful gcode.
 - [gcode-cli](https://github.com/hzeller)
 - [remove.bg](https://www.remove.bg/de)


# License

[GPL-3.0 License](https://choosealicense.com/licenses/gpl-3.0/)


# Run Locally

Clone the project

```bash
  git clone https://github.com/Iqwertz/Depictor.git
```

## Start the backend server
Go to the projects backend directory:

```bash
  cd Depictor/Backend
```

Install backend dependencies :

```bash
  npm i
```

Start the backend server:

```bash
  npm run start
```
or
```bash
  nodemon
```

## Serve frontend
Go to the projects frontend directory:

```bash
  cd Depictor/Frontend
```

Install frontend dependencies:

```bash
  npm i
```

Start frontend live server:

```bash
  ng serve
```


## Deployment

To generate a new release run

```bash
  ./ generateRelease.sh
```


# Support

For support, email juliushussl@gmail.com .

