//impots
import { logger } from "./logger.util";
import { execFile } from "child_process";
import { Config } from "../middleware/converter.middleware";
const fs = require("fs");

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
