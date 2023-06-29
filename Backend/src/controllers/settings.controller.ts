////////////////////settings.controller////////////////////
// this file contains all endpoints that handle requests from the settings page
// exports:
//  setBGRemoveAPIKey: (writes the bg remove key to a text file)
//  shutdown: (shuts down the pi)
//  update: (updates the pi by executing the scripts/update.sh script) (will be updated in the future by fetching the update script from github and executing it)
//  getVersion: (returns the current version of Depictor)
//  changeSettings: (changes the settings by overwriting the settings.json (if request is not empty) file and returns the current settings.json)
//  changeConverterSettings: (changes the converter settings by overwriting the settings.json of the specified converter (if request is not empty) and returns the current converterSettings.json)
//  getAvailableSerialPorts: (returns all available serial ports)
//  setSerialPort: (sets the serial port by executing the scripts/changeSerialPort.sh script)
//  getLoggingData: (returns the content of the specified log file)
//  home: (moves the pen to the home position)
///////////////////////////////////////////////////////////

//imports
import { logger } from "../utils/logger.util";
import { Request, Response } from "express";
import { exec } from "child_process";
import { execFile } from "child_process";
import { disconnectTerminal } from "../middleware/terminal.middleware";
import { version } from "../version";
import { ConverterSettings } from "../middleware/converter.middleware";
import { loadConfig, loadSettings } from "../utils/helper.util";
import e from "cors";
const readLastLines = require("read-last-lines");
const linesCount = require("file-lines-count");
const { LinuxBinding, WindowsBinding } = require("@serialport/bindings-cpp");
const axios = require("axios");
const fse = require("fs-extra");
const fs = require("fs");

//interfaces

interface SerialPortEntry {
  path: string;
  manufacturer: string;
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
async function setBGRemoveAPIKey(req: Request, res: Response) {
  logger.http("post: setBGRemoveAPIKey");
  fse.outputFile("removeBGAPIKey.txt", req.body.key, "utf8", function (err: any, data: any) {
    if (err) {
      logger.error("Error " + err);
    }
  });

  res.json({});
}

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
async function shutdown(req: Request, res: Response) {
  logger.http("post: shutdown");

  if (globalThis.isDrawing) {
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
}

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
async function update(req: Request, res: Response) {
  logger.http("post: update");

  if (globalThis.appState == "updating") {
    logger.warn("cant update - update is already in progress");
    res.json({ err: "update_ongoing" });
    return;
  }
  globalThis.appState = "updating";
  axios.get("https://api.github.com/repos/iqwertz/Depictor/tags").then((response: any) => {
    if (response.data[0].name != version.tag) {
      logger.info("found Update - Starting Update");
      execFile("sudo", ["./scripts/update.sh"], function (err: any, data: any) {
        if (err) {
          logger.error("Error " + err);
          globalThis.appState = "error";
          return;
        }
      });
    } else {
      logger.warn("no updates found");
    }
  });
  res.json({});
}

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
async function getVersion(req: Request, res: Response) {
  logger.http("post: getVersion");
  res.json(version);
}

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
async function changeSettings(req: Request, res: Response) {
  logger.http("post: changeSettings");
  setSettings(req.body.settings);
  res.json({ settings: readSettingsFile() });
}

function setSettings(settings: Object) {
  if (settings) {
    logger.debug(JSON.stringify(settings));
    fse.outputFileSync("data/settings.json", JSON.stringify(settings), "utf8", function (err: any, data: any) {
      if (err) {
        logger.error(err);
        return;
      } else {
        applySettingsChange();
        logger.info("successfully saved settings");
      }
    });
  }
}

/*
 *applySettingsChange()
 *applies all settings that need to be applied immediately in the backend after settings change
 */
function applySettingsChange() {
  applySerialPortChange();
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
async function changeConverterSettings(req: Request, res: Response) {
  logger.http("post: changeConverterSettings");
  setConverterSettings(req.body.converter, req.body.settings);
  res.json(readConverterSettingsFile(req.body.converter));
}

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
async function getAvailableSerialPorts(req: Request, res: Response) {
  logger.http("post: getAvailableSerialPorts");

  listPorts().then((ports: any) => {
    let formattedPorts: SerialPortEntry[] = [];
    for (let port of ports) {
      let formattedPort: SerialPortEntry = { path: port.path, manufacturer: port.manufacturer };
      formattedPorts.push(formattedPort);
    }

    res.json({ ports: ports });
  });
}

async function listPorts() {
  if (globalThis.isLinux) {
    const ports = await LinuxBinding.list();
    return ports;
  } else {
    const ports = await WindowsBinding.list();
    return ports;
  }
}

/*
post: /setSerialPort

description: sets the serial port to the provided path

expected request: 
  {path: string}
  
returns: 
    unsuccessful 
      {err: string}

    successful
    {}
*/
async function setSerialPort(req: Request, res: Response) {
  //test this on linux
  logger.http("post: setSerialPort");

  if (req.body.path) {
    applySerialPortChange(req.body.path);
    res.json({});
  } else {
    logger.warn("setSerialPort: no path provided");
    res.json({ err: "no path provided" });
  }
}

function applySerialPortChange(port?: string) {
  let eneableHardwareControlflow = "false";
  let settings = loadSettings();

  if (settings) {
    if (settings.enableHardwareControlflow) {
      eneableHardwareControlflow = "true";
    }
  } else {
    logger.error("applySerialPortChange: no settings found");
    return;
  }
  let serialPort = port || settings?.port;
  console.log("setting port to " + port);
  disconnectTerminal();
  execFile(
    "sudo",
    ["bash", "./scripts/changeSerialPort.sh", serialPort, eneableHardwareControlflow],
    function (err: any, data: any) {
      if (err) {
        logger.error(err);
      }
    }
  );
}

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
async function getLoggingData(req: Request, res: Response) {
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
}

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
async function home(req: Request, res: Response) {
  logger.http("post: home");

  if (globalThis.isDrawing) {
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
}

module.exports = {
  setBGRemoveAPIKey,
  shutdown,
  update,
  getVersion,
  changeSettings,
  changeConverterSettings,
  getAvailableSerialPorts,
  setSerialPort,
  getLoggingData,
  home,
};
