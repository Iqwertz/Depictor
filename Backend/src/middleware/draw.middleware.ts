//imports
import { logger } from "../utils/logger.util";
import * as fs from "fs";
import { disconnectTerminal } from "./terminal.middleware";
let exec = require("child_process").exec;
let fse = require("fs-extra");
let Tail = require("tail").Tail;

/**
 *drawGcode()
 * starts a process to draw the given gcode.
 * only draws when run on linux
 * the drawing programm is defined in "launchGcodeCli.sh"
 *
 * @param {string} gcode the gcode th draw
 */
export function drawGcode(gcode: string) {
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

      if (globalThis.isLinux) {
        //check if os is Linux
        let startTime = new Date().getTime(); //save start time
        let launchcommand: string = "./scripts/launchGcodeCli.sh"; //command to launch the programm

        globalThis.appState = "idle";
        globalThis.isDrawing = true; //update maschine drawing state

        fse.outputFileSync("data/logs/grbl.log", " ", "utf8");

        let tail = new Tail("data/logs/grbl.log", "\n", {}, true); //setup tail to listen to gcode sender output

        tail.on("line", function (data: any) {
          //update progress when a new line is drawen
          data = data.trim();
          globalThis.drawingProgress = parseInt(data.replace(/[^\d].*/, ""));
          console.log(globalThis.drawingProgress);
        });

        tail.on("error", function (error: any) {
          //stop drawing when an error occured
          logger.error("Error during drawing: " + error);
          globalThis.isDrawing = false;
        });

        disconnectTerminal();
        const launchProcess = exec(
          //execute launchcommand
          launchcommand,
          function (err: any, data: any) {
            //after process exits
            logger.debug(data.toString());

            globalThis.isDrawing = false; //update drawing state
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
              globalThis.appState = "idle";
              globalThis.drawingProgress = 0;
            } else {
              globalThis.drawingProgress = -1;
              logger.error(err);
              //appState = "error";
            }
          }
        );

        globalThis.currentDrawingProcessPID = launchProcess.pid; //set the currentProcessId
      } else {
        logger.warn("drawing cancled - os not Linux");
      }
    }
  );
}

/**
 *sends a given gcode to grbl by creating a temp file and running it with gcode-cli
 *
 * @param {string} gcode
 */
export function executeCustomGcode(gcode: string) {
  if (globalThis.isDrawing) {
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
