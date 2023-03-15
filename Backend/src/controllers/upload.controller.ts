////////////////////upload.util/////////////////////////
// this file contains all functions that handle uploading files
// exports:

////////////////////////////////////////////////////////

// imports
import { logger } from "../utils/logger.util";
import * as fs from "fs";
const fse = require("fs-extra");
import { Request, Response } from "express";
import { enviroment } from "../config/enviroment";
import { removeBg, skipRemoveBg } from "../middleware/removeBG.middleware";
import { convertBase64ToGcode } from "../middleware/converter.middleware";
import { drawGcode } from "../middleware/draw.middleware";

//interfaces
interface GalleryEntryUpload {
  name?: string;
  gcode: string;
  preview: string;
  standardized: boolean;
  scale: boolean;
}

//variables
const useBGApi: boolean = enviroment.removeBGSettings.enableApi; //used during dev. to limit api calls

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
async function newPicture(req: Request, res: Response) {
  logger.http("post: newPicture");
  if (globalThis.appState != "idle") {
    //check if maschine is ready
    logger.warn("req denied: not in idle");
    res.json({ err: "not_ready: " + globalThis.appState }); //return error if not
  } else {
    const timestamp = Date.now();
    if (req.body.config.needInputFile == false) {
      //check if img is empty -> if so skip bg checks and rawimage creation are skipped
      convertBase64ToGcode("", req.body.config, timestamp); //start gcode generation
    } else {
      globalThis.appState = "removingBg"; //update globalThis.appState
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
    }

    res.json({}); //return emmpty on success
  }
}

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
async function newFile(req: Request, res: Response) {
  logger.http("post: newFile");
  if (globalThis.appState != "idle") {
    //check if maschine is ready
    logger.warn("req denied: not in idle");
    res.json({ err: "not_ready: " + globalThis.appState }); //return error if not
  } else {
    globalThis.appState = "processingImage"; //update globalThis.appState
    convertBase64ToGcode(req.body.img, req.body.config, Date.now()); //convert the base64 to gcode
    res.json({}); //return emmpty on success
  }
}

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
async function postGcode(req: Request, res: Response) {
  logger.http("post: postGcode");
  if (!globalThis.isDrawing && globalThis.appState != "error") {
    //check if maschine is not drawing and maschine is ready
    let gcode: string = req.body.gcode;
    drawGcode(gcode); //draw gcode

    res.json({ appState: globalThis.appState });
  } else {
    res.json({ appState: globalThis.appState, err: "not_allowed" }); //return not allowed error
  }
}

/*
post: /uploadGalleryEntry

description: upload a custom gcode to the gallery

expected request: 
  {
    preview: string,
    gcode: string
  }

*/

async function uploadGalleryEntry(req: Request<{}, {}, GalleryEntryUpload>, res: Response) {
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
}

module.exports = {
  newPicture,
  newFile,
  postGcode,
  uploadGalleryEntry,
};
