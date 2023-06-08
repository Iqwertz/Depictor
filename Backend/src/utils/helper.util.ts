////////////////////helper.util/////////////////////////
// this file contains helper functions that are used in multiple places
// exports:
//  loadConfig: (loads the converter config file and returns it)
//  chmodConverters: (sets the execute permission for all converter run.sh files)
////////////////////////////////////////////////////////

//imports
import { logger } from "./logger.util";
import { execFile } from "child_process";
import { Config } from "../middleware/converter.middleware";
const fs = require("fs");

/**
 * loadConfig()
 * loads the assets/config.json file and returns it if it exists
 * @returns {Config | undefined} - the config file or undefined if it doesnt exist
 */
export function loadConfig(): Config | undefined {
  if (fs.existsSync("assets/config.json")) {
    logger.info("found config");
    let config = JSON.parse(fs.readFileSync("assets/config.json", "utf8"));
    return config;
  } else {
    logger.error("coldnt find converter config");
    return undefined;
  }
}

/**
 * chmodConverters
 * set execute permission for all converter run.sh files to make them executable
 */
export function chmodConverters() {
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
 * loadSettings
 * loads the settings.json file and returns it if it exists
 * @returns {any | undefined} - the settings file or undefined if it doesnt exist
 */
export function loadSettings(): any | undefined {
  if (fs.existsSync("data/settings.json")) {
    logger.info("found settings");
    let settings = JSON.parse(fs.readFileSync("data/settings.json", "utf8"));
    return settings;
  } else {
    logger.error("couldnt find settings");
    return undefined;
  }
}
