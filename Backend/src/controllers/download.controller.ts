////////////////////download.controller////////////////////
// this file contains all endpoints for downloading files
// exports:
//  availableFiles: (checks which type of files are available in the given id)
//  zipData: (zips the data folder and response with it)
//  downloadSVG: (reads an svg file and response with it)
//  downloadGcode: (reads an nc file and response with it)
//  downloadPNG: (reads an png file and response with it)
//  downloadJPG: (reads an jpg file and response with it)
///////////////////////////////////////////////////////////

//imports
import { logger } from "../utils/logger.util";
import * as fs from "fs";
import { Request, Response } from "express";

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
async function availableFiles(req: Request, res: Response) {
  logger.http("post: availableFiles");
  let fileTypes: string[] = [];

  if (req.body == undefined) {
    logger.error("post: availableFiles failed: id is undefined");
    res.json({ err: "id is undefined" });
    return;
  }

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
}

/*
get: /zipData

description: zips the data folder and response with it
*/
async function zipData(req: any, res: any) {
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
}

/*
get: /downloadSVG

description: reads an svg file and response with it
*/
async function downloadSVG(req: any, res: any) {
  logger.http("get: downloadSVG");
  var dirPath = "./data/savedGcodes/" + req.query.name + ".svg";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
}

/*
get: /downloadGcode

description: reads an nc file and response with it
*/
async function downloadGcode(req: any, res: any) {
  logger.http("get: downloadGcode");
  var dirPath = "./data/savedGcodes/" + req.query.name + ".nc";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
}

/*
get: /downloadPNG

description: reads an png file and response with it
*/
async function downloadPNG(req: any, res: any) {
  logger.http("get: downloadPNG");
  var dirPath = "./data/savedGcodes/" + req.query.name + ".png";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
}

/*
get: /downloadJPG

description: reads an jpg file from the rawimages folder and response with it
*/
async function downloadJPG(req: any, res: any) {
  logger.http("get: downloadJPG");
  var dirPath = "./data/rawimages/" + req.query.name + "-image.jpeg";
  if (fs.existsSync(dirPath)) {
    res.download(dirPath);
  } else {
    logger.error("File: " + dirPath + " does not exist");
    res.send("file not found");
  }
}

module.exports = {
  availableFiles,
  zipData,
  downloadSVG,
  downloadGcode,
  downloadPNG,
  downloadJPG,
};
