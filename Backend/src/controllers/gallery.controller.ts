////////////////////gallery.controller////////////////////
// this file contains all endpoints that handle gallery related requests
// exports:
//  deleteEntry: (deletes an gallery entry by Id)
//  getGcodeGallery: (returns previews of all saved gcode files)
//  getGcodeById: (returns a gcode file by Id)
///////////////////////////////////////////////////////////

//imports
import { logger } from "../utils/logger.util";
import { Request, Response } from "express";

//interfaces
interface GcodeEntry {
  image: string;
  name: string;
} //reponse interface when sending a gallery item

const fs = require("fs");

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
async function deleteEntry(req: Request, res: Response) {
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
}

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
async function getGcodeGallery(req: Request, res: Response) {
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
}

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
async function getGcodeById(req: Request, res: Response) {
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
}

module.exports = {
  deleteEntry,
  getGcodeGallery,
  getGcodeById,
};
