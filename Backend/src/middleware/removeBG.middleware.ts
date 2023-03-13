//imports
import { logger } from "../utils/logger.util";
import * as fs from "fs";
let fse = require("fs-extra");
import { enviroment } from "../config/enviroment";
import { RemoveBgResult, RemoveBgError, removeBackgroundFromImageBase64 } from "remove.bg";
import { ConverterConfig } from "../middleware/converter.middleware";
import { convertBase64ToGcode } from "../middleware/converter.middleware";

const outputDir = enviroment.removeBGSettings.outputDir;
let removedBgBase64: string = "";

export let isBGRemoveAPIKey: boolean = false;

let useBGApi: boolean = enviroment.removeBGSettings.enableApi; //used during dev. to limit api calls

export function checkBGremoveAPIkey() {
  if (!fs.existsSync("removeBGAPIKey.txt")) {
    isBGRemoveAPIKey = false;
  } else {
    isBGRemoveAPIKey = true;
  }
}

/**
 *removeBg()
 * uses the removeBg api (https://www.remove.bg/de/tools-api) to remove the background of a picture and start to convert the picture to gcode when succesful
 * todo: send user alert why image background couldnt be remove
 *
 * @param {string} base64img
 */
export function removeBg(base64img: string, config: ConverterConfig, ts: number) {
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
      logger.warn("cant remove bg - skipping");
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
export function skipRemoveBg(base64img: string, config: ConverterConfig, ts: number) {
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
