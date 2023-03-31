////////////////////converter.middleware/////////////////////////
// this file contains all functions that handle converting files
// exports:
//  convertBase64ToGcode: (converts a base64 image to gcode using the selected converter)
////////////////////////////////////////////////////////

//imports
import { logger } from "../utils/logger.util";
import { enviroment } from "../config/enviroment";
const fse = require("fs-extra");
let execFile = require("child_process").execFile;
let skipGenerateGcode: boolean = enviroment.skipGenerateGcode; //use the last gcode - used for faster development

//interfaces
export interface Config {
  converters: ConverterConfig[];
}

export interface ConverterSettings {
  availableConverter: ConverterConfig[];
  selectedConverter: string;
}

export interface ConverterConfig {
  name: string;
  needInputFile: boolean; //true if the converter needs an image as input
  inputFiletype: string; //filetype of the input file
  acceptedFiletypes: string; //filetypes that are allowed to upload (e.g. "image/*" for all image types)
  isBinary: boolean; //is the file binary or text
}

/**
 *convertBase64ToGcode()
 *
 * converts an base64image to gcode with an java based image to gcode converter. It is based on this project: https://github.com/Scott-Cooper/Drawbot_image_to_gcode_v2.
 * @param {string} base64
 * @param {ConverterConfig} config - the selected image converter config
 * @param {number} ts - timestamp of the current drawing (has to be global to have the same unique timestamp for all genereated files related to this drawing)
 */
export function convertBase64ToGcode(base64: string, config: ConverterConfig, ts: number) {
  logger.info("start converting image to gcode");
  globalThis.appState = "processingImage"; //update appState

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
        globalThis.appState = "rawGcodeReady"; //update appState
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
              globalThis.lastGeneratedGcode = fName + ".nc"; //set the last generated gcode
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

          globalThis.appState = "rawGcodeReady"; //update appState
        }
      });
    }
  );
}
