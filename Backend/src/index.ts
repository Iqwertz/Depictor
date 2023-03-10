///////////////////////////////////////////////////
//
//Depictor Backend
//
//description: ...
//
//author: Julius Hussl
//
///////////////////////////////////////////////////

//imports
const express = require("express");
const fs = require("fs");
const fse = require("fs-extra");
const winston = require("winston");
import { RemoveBgResult, RemoveBgError, removeBackgroundFromImageBase64 } from "remove.bg";
import { Request, Response } from "express";
import { enviroment } from "./enviroment";
import { version } from "./version";
import { Socket } from "socket.io";

const kill = require("tree-kill");
let execFile = require("child_process").execFile;
let exec = require("child_process").exec;
const { spawn } = require("child_process");
let Tail = require("tail").Tail;
const axios = require("axios");
let zip = require("express-easy-zip");
const { LinuxBinding, WindowsBinding } = require("@serialport/bindings-cpp");
import { SerialPort } from "serialport";

const readLastLines = require("read-last-lines");
const linesCount = require("file-lines-count");

var cors = require("cors");
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(zip());

let useBGApi: boolean = enviroment.removeBGSettings.enableApi; //used during dev. to limit api calls
let isBGRemoveAPIKey: boolean = false;
let skipGenerateGcode: boolean = enviroment.skipGenerateGcode; //use the last gcode - used for faster development
const outputDir = `./data/bgremoved/`;
let removedBgBase64: string = "";

const isLinux: boolean = process.platform === "linux";

type AppStates = "idle" | "removingBg" | "processingImage" | "rawGcodeReady" | "updating" | "error"; //possible states of the server

interface StateResponse {
  state: AppStates;
  isDrawing: boolean;
  removeBG: boolean;
}

interface GcodeEntry {
  image: string;
  name: string;
} //reponse interface when sending a gallery item

interface SerialPortEntry {
  path: string;
  manufacturer: string;
}

interface Config {
  converters: ConverterConfig[];
}

interface PaperProfile {
  name: string;
  paperMax: number[]; //Maximum coordinates of the drawing area ("Drawing area end" in the settings UI)
  drawingOffset: number[]; //Offset of the drawing area from the origin ("Drawing area start" in the settings UI)
}

interface Settings {
  endGcode: string;
  startGcode: string;
  penDownCommand: string;
  penUpCommand: string;
  avgTimePerLine: number;
  maxImageFileSize: number;
  centerOnDrawingArea: boolean;
  paperProfiles: PaperProfile[];
  selectedPaperProfile: PaperProfile;
  gcodeDisplayTransform: boolean[]; //boolean array consisting of three values: [0] when true switche x any y, [1] when true invert x, [2] when true invert y
  standardizeGcode: boolean;
  standardizerSettings: Object;
  floatingPoints: number;
  port: string;
  converter: ConverterSettings;
}

interface ConverterSettings {
  availableConverter: ConverterConfig[];
  selectedConverter: string;
}

interface ConverterConfig {
  name: string;
  needInputFile: boolean; //true if the converter needs an image as input
  inputFiletype: string; //filetype of the input file
  acceptedFiletypes: string; //filetypes that are allowed to upload (e.g. "image/*" for all image types)
  isBinary: boolean; //is the file binary or text
}

let appState: AppStates = "idle"; //var to track the current appstate
let isDrawing: boolean = false; //var to track if the bot is currently drawing
let drawingProgress: number = 0; //var to track the progress of the current drawing //when -1 drawing failed

let currentDrawingProcessPID: number = 0; //used to stop the drawing process
let lastGeneratedGcode: string = "";

let httpServer: any;

app.use(cors()); //enable cors

httpServer = require("http").createServer(app); //create new http server

const io = require("socket.io")(httpServer, {
  cors: {
    origins: ["*"],
  },
});

/*
post: /newPicture

description: when the post request is made with an valid request body the picture will be converted to gcode and saved to the library

expected request: 
  {
    removeBg: boolean //use removeBg to removeBackground
    img: string //an base64 encoded picture
    config: ConverterConfig //the converter config to use
  }
  
returns: 
  unsuccessful: 
    {
      err: string [errMessage]
    }
  successful:
    {}
*/
app.post("/newPicture", (req: Request, res: Response) => {
  logger.http("post: newPicture");
  if (appState != "idle") {
    //check if maschine is ready
    logger.warn("req denied: not in idle");
    res.json({ err: "not_ready: " + appState }); //return error if not
  } else {
    appState = "removingBg"; //update appState
    const timestamp = Date.now();
    if (useBGApi && req.body.removeBg) {
      //check if removeBG API should be used
      logger.info("starting removing bg process");
      removeBg(req.body.img, req.body.config, timestamp); //remove background with removebg //this function will call convertBase64ToGcode asynchronous
    } else {
      skipRemoveBg(req.body.img, req.body.config, timestamp);
    }

    fse.outputFile(
      //Log file to rawImages folder
      "data/rawimages/" + timestamp + "-image.jpeg",
      req.body.img,
      "base64",
      function (err: any, data: any) {
        if (err) {
          logger.error("Error: " + err);
        }
      }
    );

    res.json({}); //return emmpty on success
  }
});

/*
post: /newFile

description: when the post request is made with an valid request body the file will be uploaded and converted with the selected converter

expected request: 
  {
    img: string //an base64 encoded picture
    config: ConverterConfig //the converter config to use
  }
  
returns: 
  unsuccessful: 
    {
      err: string [errMessage]
    }
  successful:
    {}
*/
app.post("/newFile", (req: Request, res: Response) => {
  logger.http("post: newFile");
  if (appState != "idle") {
    //check if maschine is ready
    logger.warn("req denied: not in idle");
    res.json({ err: "not_ready: " + appState }); //return error if not
  } else {
    appState = "processingImage"; //update appState
    convertBase64ToGcode(req.body.img, req.body.config, Date.now()); //convert the base64 to gcode
    res.json({}); //return emmpty on success
  }
});

/*
post: /checkProgress

description: returns the current state of the application

expected request: 
  {}
  
returns: 
  @StateResponse
*/
app.post("/checkProgress", (req: Request, res: Response) => {
  logger.http("post: checkProgress");

  checkBGremoveAPIkey();

  let response: StateResponse = {
    state: appState,
    isDrawing: isDrawing,
    removeBG: isBGRemoveAPIKey && useBGApi,
  };

  res.json(response);
});

/*
post: /getGeneratedGcode

description: returns the generated gcode when available

expected request: 
  {}
  
returns: 
  unsuccessful: 
    {
      state: AppStates, 
      err: string [errMessage]
    }
  successful:
    {
      state: AppStates, 
      isDrawing: boolean, 
      data: string [requested Gcode]
    }
*/
app.post("/getGeneratedGcode", (req: Request, res: Response) => {
  logger.http("post: getGeneratedGcode");
  if (appState == "rawGcodeReady") {
    //check if gcode is ready
    /////get the correct path depending on os
    let gcodePath: string = "./data/savedGcodes/" + lastGeneratedGcode;

    /////read gcode
    let rawGcode = fs.readFileSync(gcodePath, "utf8");

    res.json({ state: appState, isDrawing: isDrawing, data: rawGcode }); //return gcode and appstate information
  } else {
    res.json({ state: appState, err: "no_gcode_ready" }); //return nogcodeready error when nothing is ready
  }
});

/*
post: /getDrawenGcode

description: returns the currently drawen gcode when available

expected request: 
  {}
  
returns: 
  unsuccessful: 
    {
      state: AppStates, 
      err: string [errMessage]
    }
   successful:
    {
      state: AppStates, 
      isDrawing: boolean, 
      data: string [requested Gcode]
    }
*/
app.post("/getDrawenGcode", (req: Request, res: Response) => {
  logger.http("post: getDrawenGcode");
  if (isDrawing) {
    //check if maschine is drawing
    let rawGcode = fs.readFileSync("assets/gcodes/gcode.nc", "utf8"); //read gcode
    res.json({ state: appState, isDrawing: isDrawing, data: rawGcode }); //return gcode and appstate information
  } else {
    res.json({ state: appState, err: "not_drawing" }); //return not drawing error
  }
});

/*
post: /getDrawingProgress

description: returns the progress of the current drawing as the amount of gcode lines that where executed

expected request: 
  {}
  
returns: 
  unsuccessful: 
    {
      err: string [errMessage]
    }
   successful:
    {
      data: number [amount of gcode lines]
    }
*/
app.post("/getDrawingProgress", (req: Request, res: Response) => {
  logger.http("post: getDrawingProgress");
  if (isDrawing) {
    //check if drawing
    res.json({ data: drawingProgress }); //return progress
  } else {
    res.json({ err: "not_drawing", data: drawingProgress }); //return notdrawing error
  }
});

/*
post: /postGcode

description: when a valid request is made and the maschine is ready to draw the maschine will start to draw the posted gcode

expected request: 
  {
    gcode: string
  }
  
returns: 
  unsuccessful: 
    {
      appState: appState
      err: string [errMessage]
    }
   successful:
    {
      appState: appState
    }
*/
app.post("/postGcode", (req: Request, res: Response) => {
  logger.http("post: postGcode");
  if (!isDrawing && appState != "error") {
    //check if maschine is not drawing and maschine is ready
    let gcode: string = req.body.gcode;
    drawGcode(gcode); //draw gcode

    res.json({ appState: appState });
  } else {
    res.json({ appState: appState, err: "not_allowed" }); //return not allowed error
  }
});

/*
post: /cancle //I now know its written cancel but too lazy to change all code vars....

description: cancles the generated gcode by updateing appState

expected request: 
  {}
returns: 
  {}
*/
app.post("/cancle", (req: Request, res: Response) => {
  logger.http("post: cancle");
  appState = "idle";
  drawingProgress = 0;
});

/*
post: /stop

description: stops the current drawing process and homes maschine 

expected request: 
  {}
  
returns: 
  {}
*/
app.post("/stop", (req: Request, res: Response) => {
  logger.http("post: stop");
  drawingProgress = 0; //reset drawing progress
  kill(currentDrawingProcessPID); //kill the drawing process
  setTimeout(() => {
    //Home after some timeout because kill() needs some time
    appState = "idle"; //reset appState
    disconnectTerminal();
    exec("./scripts/home.sh", function (err: any, data: any) {
      if (err) {
        logger.error(err);
      }
    });
  }, 2000);
});

/*
post: /delete

description: deletes an gallery entry by Id

expected request: 
  {
    id: number
  }
  
returns: 
  {}
*/
app.post("/delete", (req: Request, res: Response) => {
  logger.http("post: delete");

  fs.unlink("data/savedGcodes/" + req.body.id + ".nc", (err: any) => {
    //delete gcode
    if (err) {
      logger.error("Error " + err);
      return;
    }
  });
  fs.unlink("data/savedGcodes/" + req.body.id + ".png", (err: any) => {
    //delete preview image
    if (err) {
      logger.error("Error " + err);
      return;
    }
  });
});

/*
post: /getGcodeGallery

description: get entrys from gcode gallery. A range can be specified to enable infinite scroll. If no range is defined all entries will be returned

expected request: 
  {
    range?: number[start, end]
  }
  
returns: 
  unsuccessful: 
    {
      err: string
    }
   successful:
    {
      data: GcodeEntry[]
    }
*/
app.post("/getGcodeGallery", (req: Request, res: Response) => {
  logger.http("post: getGcodeGallery");
  let gallery: GcodeEntry[] = [];

  if (!fs.existsSync("data/savedGcodes/")) {
    res.json({ err: "no_entry" });
    return;
  }

  fs.readdirSync("data/savedGcodes/").forEach((file: any) => {
    //read all saved gcode files
    if (file.endsWith(".nc")) {
      let imagePath: string = "data/savedGcodes/" + file.split(".")[0] + ".png";
      //check if file exists
      let image: string = "";
      if (fs.existsSync(imagePath)) {
        image = fs.readFileSync(imagePath, {
          encoding: "base64",
        }); //read preview image as base64 string
      } else {
        //use default image if no preview image exists
        image = fs.readFileSync("assets/images/nopreview.png", {
          encoding: "base64",
        }); //read preview image as base64 string
      }
      let entry: GcodeEntry = {
        //create entry
        image: image,
        name: file.split(".")[0],
      };
      gallery.push(entry); //push entry to gallery array
    }
  });

  gallery.reverse(); //reverse gallery to show newest first
  if (req.body.range) {
    // check if a range was defined
    gallery = gallery.slice(req.body.range[0], req.body.range[1]); //remove all elements out of defined range
  }

  res.json({ data: gallery }); //return gallery
});

/*
post: /getGcodeById

description: return the requested gcode file by its name(id)

expected request: 
  {
    id: number|string
  }
  
returns: 
  unsuccessful: 
    {
      err: string [errMessage]
    }
   successful:
    {
      data: string
    }
*/
app.post("/getGcodeById", (req: Request, res: Response) => {
  logger.http("post: getGcodeById");
  fs.readFile(
    //try to read gcode file
    "data/savedGcodes/" + req.body.id + ".nc",
    "utf8",
    (err: any, data: string) => {
      if (err) {
        //check for error
        logger.error("Error " + err);
        res.json({ err: "not_found" }); //return notfound error when no file was found
        return;
      }
      res.json({ data: data }); //when a gcode file was found return it
    }
  );
});

/*
post: /uploadGalleryEntry

description: upload a custom gcode to the gallery

expected request: 
  {
    preview: string,
    gcode: string
  }

*/
interface GalleryEntryUpload {
  name?: string;
  gcode: string;
  preview: string;
  standardized: boolean;
  scale: boolean;
}

app.post("/uploadGalleryEntry", (req: Request<{}, {}, GalleryEntryUpload>, res: Response) => {
  logger.http("post: uploadGalleryEntry");

  const fName: number = Date.now();
  let config: string = "";
  if (req.body.scale) {
    config += "s1,";
  } else {
    config += "s0,";
  }
  let flag: string = "c";
  let b64Preview: string = req.body.preview.replace(/^data:image\/png;base64,/, "");
  if (req.body.standardized) {
    flag = "sc";
  }

  fse.outputFile(
    //save the gcode file //this file will be used by the gcodesender
    "data/savedGcodes/" + fName + "#" + flag + "#" + config + ".nc",
    req.body.gcode,
    "utf8",
    function (err: any, data: any) {
      if (err) {
        //guard clause for errors
        logger.error("Error " + err);
        return;
      }
    }
  );

  fse.outputFile(
    //save the gcode file //this file will be used by the gcodesender
    "data/savedGcodes/" + fName + "#" + flag + "#" + config + ".png",
    b64Preview,
    "base64",
    function (err: any, data: any) {
      if (err) {
        //guard clause for errors
        logger.error("Error " + err);
        return;
      }
    }
  );

  res.json({});
});

/*
post: /setBGRemoveAPIKey

description: sets the removeBG Api key by writing it to removeBGAPIKey.txt

expected request: 
  {
    key: string
  }
  
returns: 
  {}
*/
app.post("/setBGRemoveAPIKey", (req: Request, res: Response) => {
  logger.http("post: setBGRemoveAPIKey");
  fse.outputFile("removeBGAPIKey.txt", req.body.key, "utf8", function (err: any, data: any) {
    if (err) {
      logger.error("Error " + err);
    }
  });

  res.json({});
});

/*
post: /shutdown

description: shutsdown the system by executing "sudo shutdown now" - only executed when not drawing

expected request: 
  {}
  
returns: 
  unsuccessful 
    {err: string}

    successful
    {}
*/
app.post("/shutdown", (req: Request, res: Response) => {
  logger.http("post: shutdown");

  if (isDrawing) {
    logger.warn("shutdown aborted! Machine is drawing");
    res.json({ err: "drawing" });
    return;
  }
  res.json({});
  exec("sudo shutdown now", function (error: any, stdout: any, stderr: any) {
    if (error) {
      logger.error(error);
    }
    logger.debug(stdout);
  });
});

/*
post: /update

description: updates the system

expected request: 
  {}
  
returns: 
  unsuccessful 
    {err: string}

    successful
    {}
*/
app.post("/update", (req: Request, res: Response) => {
  logger.http("post: update");

  if (appState == "updating") {
    logger.warn("cant update - update is already in progress");
    res.json({ err: "update_ongoing" });
    return;
  }
  appState = "updating";
  axios.get("https://api.github.com/repos/iqwertz/Depictor/tags").then((response: any) => {
    if (response.data[0].name != version.tag) {
      logger.info("found Update - Starting Update");
      execFile("sudo", ["./scripts/update.sh"], function (err: any, data: any) {
        if (err) {
          logger.error("Error " + err);
          appState = "error";
          return;
        }
      });
    } else {
      logger.warn("no updates found");
    }
  });
  res.json({});
});

/*
post: /getVersion

description: returns the version information of the backend
expected request: 
  {}
  
returns: 
    {
      tag: string
      production: boolean
    }
*/
app.post("/getVersion", (req: Request, res: Response) => {
  logger.http("post: getVersion");
  res.json(version);
});

/*
post: /changeSettings

description: returns content of data/settings.json and sets new settings if provided

expected request: 
  {settings?: object}
  
returns: 
    unsuccessful 
      {}

    successful
    {settings: object}
*/
app.post("/changeSettings", (req: Request, res: Response) => {
  logger.http("post: changeSettings");
  setSettings(req.body.settings);
  res.json({ settings: readSettingsFile() });
});

function setSettings(settings: Object) {
  if (settings) {
    logger.debug(JSON.stringify(settings));
    fse.outputFileSync("data/settings.json", JSON.stringify(settings), "utf8", function (err: any, data: any) {
      if (err) {
        logger.error(err);
        return;
      } else {
        logger.info("successfully saved settings");
      }
    });
  }
}

function readSettingsFile(): Settings | null {
  if (fs.existsSync("data/settings.json")) {
    let settings = JSON.parse(fs.readFileSync("data/settings.json", "utf8"));
    logger.info("found settings");
    let config = loadConfig();
    if (config) {
      settings.converter = settings.converter || {};
      settings.converter.availableConverter = config.converters;
    }
    return settings;
  } else {
    logger.warn("no settings found");
    return null;
  }
}

/*
post: /changeConverterSettings

description: returns content of the settings.json in the defined converter and sets new settings if provided

expected request: 
  {
    converter: string
    settings?: object
  }
  
returns: 
    unsuccessful 
      {err: string}

    successful
    {settings: object}
*/
app.post("/changeConverterSettings", (req: Request, res: Response) => {
  logger.http("post: changeConverterSettings");
  setConverterSettings(req.body.converter, req.body.settings);
  res.json(readConverterSettingsFile(req.body.converter));
});

function setConverterSettings(converter: string, settings: Object | null) {
  if (settings) {
    logger.debug(JSON.stringify(settings));
    fse.outputFileSync(
      "assets/imageConverter/" + converter + "/settings.json",
      JSON.stringify(settings),
      "utf8",
      function (err: any, data: any) {
        if (err) {
          logger.error(err);
          return;
        } else {
          logger.info("successfully saved" + converter + " settings");
        }
      }
    );
  }
}

function readConverterSettingsFile(converter: string): object | null {
  if (fs.existsSync("assets/imageConverter/" + converter + "/settings.json")) {
    let settings = JSON.parse(fs.readFileSync("assets/imageConverter/" + converter + "/settings.json", "utf8"));
    logger.info("found " + converter + " settings");
    return settings;
  } else {
    logger.warn("no settings found for " + converter);
    return { err: "no_settings_found" };
  }
}

/*
post: /getAvailableSerialPorts

description: returns available serial ports

expected request: 
  {}
  
returns: 
    unsuccessful 
      {}

    successful
    {ports: string[]}
*/
app.post("/getAvailableSerialPorts", (req: Request, res: Response) => {
  logger.http("post: getAvailableSerialPorts");

  listPorts().then((ports: any) => {
    let formattedPorts: SerialPortEntry[] = [];
    for (let port of ports) {
      let formattedPort: SerialPortEntry = { path: port.path, manufacturer: port.manufacturer };
      formattedPorts.push(formattedPort);
    }

    res.json({ ports: ports });
  });
});

async function listPorts() {
  if (isLinux) {
    const ports = await LinuxBinding.list();
    return ports;
  } else {
    const ports = await WindowsBinding.list();
    return ports;
  }
}

/*
post: /setSerialPort

description: returns available serial ports

expected request: 
  {path: string}
  
returns: 
    unsuccessful 
      {err: string}

    successful
    {}
*/
app.post("/setSerialPort", (req: Request, res: Response) => {
  //test this on linux
  logger.http("post: setSerialPort");
  console.log("setting port to " + req.body.path);
  if (req.body.path) {
    disconnectTerminal();
    execFile("sudo", ["bash", "./scripts/changeSerialPort.sh", req.body.path], function (err: any, data: any) {
      if (err) {
        logger.error(err);
      }
    });
    res.json({});
  } else {
    logger.warn("setSerialPort: no path provided");
    res.json({ err: "no path provided" });
  }
});

/*
post: /getLoggingData

description: returns logging data and the number of log lines

expected request: 
  {
    minLines: number
    maxLines: number
    level: "debug" | "error" | "http" | "info" | "warn" | "grbl"
  }
  
returns: 
    unsuccessful 
      {err: string}

    successful
    {data: string[], lines: number}
*/
app.post("/getLoggingData", async (req: Request, res: Response) => {
  logger.http("post: getLoggingData");
  if (
    req.body.minLines == null ||
    req.body.maxLines == null ||
    !["debug", "error", "http", "info", "warn", "grbl"].includes(req.body.level)
  ) {
    res.json({ err: "faulty_input" });
    return;
  }

  let logFile = `./data/logs/${req.body.level}.log`;

  let lines: number[] = [req.body.minLines, req.body.maxLines];
  let lastLines: string = await readLastLines.read(logFile, lines[1]); //not really performant for high page numbers but enough for now
  let lineArray: string[] = lastLines.split("\n").slice(lines[0], lines[1]);

  //get size of file in bytes
  let stats = fs.statSync(logFile);
  let fileSizeInBytes = stats.size;
  let fileSizeInMegabytes = fileSizeInBytes / 1000000.0;

  let nlines: number = 0;
  if (fileSizeInMegabytes < 10) {
    nlines = await linesCount(logFile);
  } else {
    nlines = -1;
  }

  res.json({ data: lineArray, lines: nlines });
});

/*
post: /home

description: homes the maschine (when not currently drawing)

expected request: 
  {}
  
returns: 
    unsuccessful 
      {err: string}

    successful
    {}
*/
app.post("/home", (req: Request, res: Response) => {
  logger.http("post: home");

  if (isDrawing) {
    logger.warn("cant home! Machine is drawing");
    res.json({ err: "drawing" });
    return;
  }
  disconnectTerminal();
  exec("./scripts/home.sh", function (err: any, data: any) {
    if (err) {
      logger.error(err);
    }
  });
});

/*
post: /executeGcode

description: executes gcode on the maschine (when not currently drawing)

expected request: 
  {gcode: string}
  
returns: 
    unsuccessful 
      {err: string}

    successful
    {}
*/
app.post("/executeGcode", (req: Request, res: Response) => {
  logger.http("post: executeGcode");

  if (isDrawing) {
    logger.warn("cant execute Gcode! Machine is drawing");
    res.json({ err: "drawing" });
    return;
  }
  disconnectTerminal();
  executeGcode(req.body.gcode);
  res.json({});
});

/*
get: /zipData

description: zips the data folder and response with it
*/
app.get("/zipData", async function (req: any, res: any) {
  logger.http("get: zipData");
  var dirPath = "./data";
  await res.zip({
    files: [
      {
        path: dirPath,
        name: "DepictorData",
      },
    ],
    filename: "DepictorData " + new Date().toDateString() + ".zip",
  });
});

/*
get: /downloadSVG

description: reads an svg file and response with it
*/
app.get("/downloadSVG", async function (req: any, res: any) {
  logger.http("get: downloadSVG");
  var dirPath = "./data/savedGcodes/" + req.query.name + ".svg";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
});

/*
get: /downloadGcode

description: reads an nc file and response with it
*/
app.get("/downloadGcode", async function (req: any, res: any) {
  logger.http("get: downloadGcode");
  var dirPath = "./data/savedGcodes/" + req.query.name + ".nc";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
});

/*
get: /downloadPNG

description: reads an png file and response with it
*/
app.get("/downloadPNG", async function (req: any, res: any) {
  logger.http("get: downloadPNG");
  var dirPath = "./data/savedGcodes/" + req.query.name + ".png";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
});

/*
get: /downloadJPG

description: reads an jpg file from the rawimages folder and response with it
*/
app.get("/downloadJPG", async function (req: any, res: any) {
  logger.http("get: downloadJPG");
  var dirPath = "./data/rawimages/" + req.query.name + "-image.jpeg";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
});

/*
post: /availableFiles
checks which type of files are available in the given id

expected request: 
  {id: string}
  
returns: 
    unsuccessful 
      {err: string}

    successful
    {fileTypes: string[]}
*/
app.post("/availableFiles", (req: Request, res: Response) => {
  logger.http("post: availableFiles");
  let fileTypes: string[] = [];

  if (fs.existsSync("./data/savedGcodes/" + req.body.id + ".svg")) {
    fileTypes.push("svg");
  }
  if (fs.existsSync("./data/savedGcodes/" + req.body.id + ".nc")) {
    fileTypes.push("nc");
  }
  if (fs.existsSync("./data/savedGcodes/" + req.body.id + ".png")) {
    fileTypes.push("png");
  }
  if (fs.existsSync("./data/rawimages/" + req.body.id + "-image.jpeg")) {
    fileTypes.push("jpg");
  }
  res.json({ fileTypes: fileTypes });
});

httpServer!.listen(enviroment.port, () => {
  //start http server
  logger.info("started Server");
  logger.info("listening on *:" + enviroment.port);
  logger.info("Detected Linux: " + isLinux);
  chmodConverters();
});

function loadConfig(): Config | undefined {
  if (fs.existsSync("assets/config.json")) {
    logger.info("found config");
    let config = JSON.parse(fs.readFileSync("assets/config.json", "utf8"));
    return config;
  } else {
    logger.error("coldnt find converter config");
    return undefined;
  }
}
function chmodConverters() {
  logger.info("chmoding converters");
  let config: Config | undefined = loadConfig();
  if (config) {
    for (let converter of config.converters) {
      execFile(
        "chmod",
        ["+x", "./assets/imageConverter/" + converter.name + "/run.sh"],
        function (err: any, data: any) {
          if (err) {
            logger.error(err);
          }
        }
      );
    }
  } else {
    logger.error("no config found - chmoding converters canceled");
  }
}

/**
 *drawGcode()
 * starts a process to draw the given gcode.
 * only draws when run on linux
 * the drawing programm is defined in "launchGcodeCli.sh"
 *
 * @param {string} gcode the gcode th draw
 */
function drawGcode(gcode: string) {
  logger.info("start drawing");
  fse.outputFile(
    //save the gcode file //this file will be used by the gcodesender
    "assets/gcodes/gcode.nc",
    gcode,
    "utf8",
    function (err: any, data: any) {
      if (err) {
        //guard clause for errors
        logger.error("Error " + err);
        return;
      }

      if (isLinux) {
        //check if os is Linux
        let startTime = new Date().getTime(); //save start time
        let launchcommand: string = "./scripts/launchGcodeCli.sh"; //command to launch the programm

        appState = "idle";
        isDrawing = true; //update maschine drawing state

        fse.outputFileSync("data/logs/grbl.log", " ", "utf8");

        let tail = new Tail("data/logs/grbl.log", "\n", {}, true); //setup tail to listen to gcode sender output

        tail.on("line", function (data: any) {
          //update progress when a new line is drawen
          data = data.trim();
          drawingProgress = parseInt(data.replace(/[^\d].*/, ""));
          console.log(drawingProgress);
        });

        tail.on("error", function (error: any) {
          //stop drawing when an error occured
          logger.error("Error during drawing: " + error);
          isDrawing = false;
        });

        disconnectTerminal();
        const launchProcess = exec(
          //execute launchcommand
          launchcommand,
          function (err: any, data: any) {
            //after process exits
            logger.debug(data.toString());

            isDrawing = false; //update drawing state
            if (!err) {
              //when exited with out errors log the printing time and amount of lines to drawingTimesLog.txt. This file is used to determin an time/line estimation for the fronted
              let timeDiff: number = new Date().getTime() - startTime;
              let lines: number = gcode.length - gcode.replace(/\n/g, "").length + 1;

              fse.outputFile(
                "data/logs/drawingTimesLog.txt",
                lines + "," + timeDiff + "\n",
                { flag: "a" },
                (err: any) => {
                  if (err) logger.error(err);
                }
              );

              //reset appstate and drawing progress
              appState = "idle";
              drawingProgress = 0;
            } else {
              drawingProgress = -1;
              logger.error(err);
              //appState = "error";
            }
          }
        );

        currentDrawingProcessPID = launchProcess.pid; //set the currentProcessId
      } else {
        logger.warn("drawing cancled - os not Linux");
      }
    }
  );
}

/**
 *removeBg()
 * uses the removeBg api (https://www.remove.bg/de/tools-api) to remove the background of a picture and start to convert the picture to gcode when succesful
 * todo: send user alert why image background couldnt be remove
 *
 * @param {string} base64img
 */
function removeBg(base64img: string, config: ConverterConfig, ts: number) {
  const outputFile = outputDir + "bgremoved-current.jpg"; //define the output file

  checkBGremoveAPIkey();
  if (!isBGRemoveAPIKey) {
    logger.warn("cant remove bg - no apiKey");
    skipRemoveBg(base64img, config, ts);
    return;
  }
  const apiKey = fs.readFileSync("removeBGAPIKey.txt", "utf8");

  logger.info("sending picture to removeBG API");
  removeBackgroundFromImageBase64({
    //send to api with settings
    base64img,
    apiKey: apiKey,
    size: "preview",
    type: enviroment.removeBGSettings.type,
    format: "jpg",
    scale: enviroment.removeBGSettings.scale,
    bg_color: "fff",
    outputFile,
  })
    .then((result: RemoveBgResult) => {
      //api response
      const rmbgbase64img = result.base64img;
      removedBgBase64 = rmbgbase64img;
      fse.outputFile(
        //save image
        outputDir + ts + "-bgremoved.jpg",
        rmbgbase64img,
        "base64",
        function (err: any, data: any) {
          if (err) {
            logger.error(err);
          }
        }
      );

      convertBase64ToGcode(removedBgBase64, config, ts); //convert image to gcode
    })
    .catch((errors: Array<RemoveBgError>) => {
      logger.error(JSON.stringify(errors)); //log errors
      skipRemoveBg(base64img, config, ts);
    });
}

/**
 *skipRemoveBg
 *skips the remove Bg process and starts converting the picture
 *
 * @param {string} base64img
 * @param {ConverterConfig} config the config of the used converter
 * @param {number} ts timestamp
 */
function skipRemoveBg(base64img: string, config: ConverterConfig, ts: number) {
  logger.info("removebg skipped");
  removedBgBase64 = base64img; //set the removedBgBase64 Image without bgremove
  fse.outputFile(
    //update the current picture
    outputDir + "bgremoved-current.jpg",
    base64img,
    "base64",
    function (err: any, data: any) {
      if (err) {
        logger.error("Error: " + err);
      }
    }
  );

  convertBase64ToGcode(removedBgBase64, config, ts); //convert the image to gcode
}

/**
 *convertBase64ToGcode()
 *
 * converts an base64image to gcode with an java based image to gcode converter. It is based on this project: https://github.com/Scott-Cooper/Drawbot_image_to_gcode_v2.
 * @param {string} base64
 * @param {ConverterConfig} config - the selected image converter config
 * @param {number} ts - timestamp of the current drawing (has to be global to have the same unique timestamp for all genereated files related to this drawing)
 */
function convertBase64ToGcode(base64: string, config: ConverterConfig, ts: number) {
  logger.info("start converting image to gcode");
  appState = "processingImage"; //update appState

  let selectedImageConverter = config; //get selected image converter

  let img2gcodePath: string = "./assets/imageConverter/" + selectedImageConverter.name;

  let fileFormat: string = config.isBinary ? "base64" : "utf8";

  fse.outputFile(
    //save file to input folder of the convert

    //select object from arry by name

    img2gcodePath + "/input/image." + selectedImageConverter.inputFiletype,
    base64,
    fileFormat,
    function (err: any, data: any) {
      if (err) {
        logger.error(err);
      }

      if (skipGenerateGcode) {
        logger.info("skipping gcode generation");
        appState = "rawGcodeReady"; //update appState
        return;
      }

      logger.info("converting image with: " + selectedImageConverter.name);

      let launchFile: string = img2gcodePath + "/run.sh"; //define the launch file
      execFile(launchFile, function (err: any, data: any) {
        //launch converter
        if (err) {
          logger.error(err);
        }
        logger.debug(data.toString());

        if (!err) {
          //check for errors
          let fName = ts; //set the filename

          //check if output files exist
          if (fse.existsSync(img2gcodePath + "/output/gcode.nc")) {
            //if the output file exists copy it to the output folder
            fse.copy(img2gcodePath + "/output/gcode.nc", "data/savedGcodes/" + fName + ".nc", function (err: any) {
              if (err) {
                logger.error(err);
              }
              lastGeneratedGcode = fName + ".nc"; //set the last generated gcode
            });
          } else {
            logger.error("cant find generated gcode");
            return;
          }

          //check if a preview image exists -> else use the original image
          if (fse.existsSync(img2gcodePath + "/output/preview.png")) {
            fse.copy(img2gcodePath + "/output/preview.png", "data/savedGcodes/" + fName + ".png", function (err: any) {
              if (err) {
                logger.error(err);
              }
            });
          } else {
            logger.warn("cant find preview image - using original image");
            fse.copy(img2gcodePath + "/input/image.jpg", "data/savedGcodes/" + fName + ".png", function (err: any) {
              if (err) {
                logger.warn(err);
              }
            });
          }

          //check if an svg image exists
          if (fse.existsSync(img2gcodePath + "/output/image.svg")) {
            fse.copy(img2gcodePath + "/output/image.svg", "data/savedGcodes/" + fName + ".svg", function (err: any) {
              if (err) {
                logger.error(err);
              }
            });
          } else {
            logger.info("couldnt find generated svg image");
          }

          appState = "rawGcodeReady"; //update appState
        }
      });
    }
  );
}

function checkBGremoveAPIkey() {
  if (!fs.existsSync("removeBGAPIKey.txt")) {
    isBGRemoveAPIKey = false;
  } else {
    isBGRemoveAPIKey = true;
  }
}

/**
 *sends a given gcode to grbl by creating a temp file and running it with gcode-cli
 *
 * @param {string} gcode
 */
function executeGcode(gcode: string) {
  if (isDrawing) {
    return;
  }

  logger.info("Executing custom gcode: " + gcode);
  fse.outputFileSync("./assets/gcodes/temp.gcode", gcode, "utf8");

  disconnectTerminal();

  exec("./scripts/execTemp.sh", function (err: any, data: any) {
    fs.unlink("./assets/gcodes/temp.gcode", (err: any) => {
      //delete preview image
      if (err) {
        logger.error(err);
        return;
      }
    });

    if (err) {
      logger.error(err);
      return;
    }
  });
}

////////////////////////////serialport//////////////////////////////////////////////
let serialport: SerialPort | null = null;

function openSerialPort() {
  let error = "";
  let port: string = "";
  if (fs.existsSync("data/settings.json")) {
    let settings = fs.readFileSync("data/settings.json", "utf8");
    port = JSON.parse(settings).port;
  } else {
    error = "cant open serial Port, no settings file found";
    logger.warn(error);
  }

  if (!port) {
    logger.error("cant open serial Port, no port found");
    return "Error when opening serial port: noPortFound";
  }

  serialport = new SerialPort({ path: port, baudRate: 115200 }).setEncoding("utf8");
  logger.info("serial port opened at " + port);

  // Open errors will be emitted as an error event
  serialport.on("error", function (err) {
    logger.error("Serialport error: " + err);
    if (globalTerminalSocket) {
      globalTerminalSocket.emit("serialError", err.message);
    }
  });

  serialport.on("data", function (data) {
    if (data) {
      terminalHistory.push({ command: data, type: "response" });
      io.emit("serialData", data);
    }
  });
}

interface TerminalHistoryEntry {
  command: string;
  type: "command" | "response";
}

let terminalHistory: TerminalHistoryEntry[] = [];
///////////////////////////socket.io//////////////////////////////////////////////
let globalTerminalSocket: Socket | null = null;

io.on("connection", (socket: Socket) => {
  logger.info("a user connected");

  if (isDrawing) {
    socket.emit("serialError", "cannot connect to serial port while drawing");
    return;
  }

  if (!serialport?.isOpen) {
    openSerialPort();
  }

  for (let command of terminalHistory) {
    if (command.type === "command") {
      socket.emit("commandData", command.command);
    } else {
      socket.emit("serialData", command.command);
    }
  }

  socket.on("disconnect", () => {
    logger.info("user disconnected");
    if (io.engine.clientsCount == 0) {
      terminalHistory = [];
      serialport?.close();
      serialport = null;
    }
  });

  socket.on("command", (msg: string) => {
    logger.info("Terminal Command: " + msg);
    if (serialport) {
      terminalHistory.push({ command: msg, type: "command" });
      io.emit("commandData", msg);
      serialport.write(msg + "\n");
    } else {
      logger.error("serialport not open");
    }
  });

  globalTerminalSocket = socket;
});

function disconnectTerminal() {
  logger.info("disconnecting all terminals");
  if (io.engine.clientsCount > 0) {
    console.log("disconnecting all terminals");
    io.emit("disconnectSelf");
  }
  if (serialport) {
    console.log("closing serialport");
    terminalHistory = [];
    serialport.close();
    serialport = null;
  }
}

////////////////////logger/////////////////////////
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "user-service" },
  exitOnError: false,
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: "data/logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "data/logs/warn.log", level: "warn" }),
    new winston.transports.File({ filename: "data/logs/info.log", level: "info" }),
    new winston.transports.File({ filename: "data/logs/http.log", level: "http" }),
    new winston.transports.File({ filename: "data/logs/debug.log", level: "debug" }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (!version.production) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
