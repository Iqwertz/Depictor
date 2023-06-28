////////////////////drawing.controller////////////////////
// this file contains all endpoints that handle drawing related requests
// exports:
//   getDrawingProgress: (returns the amout of gcode lines that where executed)
//   getDrawenGcode: (returns the currently drawen gcode when available)
//   cancle: (cancles the current generated gcode by updating the appState)
//   stop: (stops the current drawing process by killing the child process)
//   executeGcode: (executes the given gcode)
///////////////////////////////////////////////////////////

//imports
import { logger } from "../utils/logger.util";
import { Request, Response, raw } from "express";
import { disconnectTerminal } from "../middleware/terminal.middleware";
import { drawNextMultiToolGcode, executeCustomGcode } from "../middleware/draw.middleware";
const fs = require("fs");
const kill = require("tree-kill");
let exec = require("child_process").exec;

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
      multiToolState?: MultiToolState
    }
*/
async function getDrawingProgress(req: Request, res: Response) {
  logger.http("post: getDrawingProgress");
  if (globalThis.isDrawing) {
    //check if drawing
    if (globalThis.multiToolState.active) {
      res.json({ data: globalThis.drawingProgress, multiToolState: globalThis.multiToolState }); //return progress
    } else {
      res.json({ data: globalThis.drawingProgress }); //return progress
    }
  } else {
    res.json({ err: "not_drawing", data: globalThis.drawingProgress }); //return notdrawing error
  }
}

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
async function getDrawenGcode(req: Request, res: Response) {
  logger.http("post: getDrawenGcode");
  if (globalThis.isDrawing) {
    //check if maschine is drawing
    let rawGcode = "";
    if (globalThis.multiToolState.active) {
      rawGcode = fs.readFileSync("assets/gcodes/multiTool/original.nc", "utf8"); //read gcode
    } else {
      rawGcode = fs.readFileSync("assets/gcodes/gcode.nc", "utf8"); //read gcode
    }
    res.json({ state: globalThis.appState, isDrawing: globalThis.isDrawing, data: rawGcode }); //return gcode and appstate information
  } else {
    res.json({ state: globalThis.appState, err: "not_drawing" }); //return not drawing error
  }
}

/*
post: /cancle //I now know its written cancel but too lazy to change all code vars....

description: cancles the generated gcode by updateing appState, drawing progress is set to -2 to indicate that the gcode was cancled

expected request: 
  {}
returns: 
  {}
*/
async function cancle(req: Request, res: Response) {
  logger.http("post: cancle");
  globalThis.appState = "idle";
  globalThis.drawingProgress = -2;
}

/*
post: /stop

description: stops the current drawing process and homes maschine 

expected request: 
  {}
  
returns: 
  {}
*/
async function stop(req: Request, res: Response) {
  logger.http("post: stop");
  globalThis.drawingProgress = 0; //reset drawing progress
  if (globalThis.multiToolState) {
    globalThis.multiToolState.state = "finished";
    globalThis.multiToolState.active = false;
  }

  kill(globalThis.currentDrawingProcessPID); //kill the drawing process
  setTimeout(() => {
    //Home after some timeout because kill() needs some time
    globalThis.appState = "idle"; //reset appState
    globalThis.isDrawing = false;
    disconnectTerminal();
    exec("./scripts/home.sh", function (err: any, data: any) {
      if (err) {
        logger.error(err);
      }
    });
  }, 2000);
}

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
async function executeGcode(req: Request, res: Response) {
  logger.http("post: executeGcode");

  if (globalThis.isDrawing) {
    logger.warn("cant execute Gcode! Machine is drawing");
    res.json({ err: "drawing" });
    return;
  }
  disconnectTerminal();
  executeCustomGcode(req.body.gcode);
  res.json({});
}

async function continueMultiTool(req: Request, res: Response) {
  logger.http("post: continueMultiTool");
  drawNextMultiToolGcode();
  res.json({});
}

module.exports = {
  getDrawingProgress,
  getDrawenGcode,
  cancle,
  stop,
  executeGcode,
  continueMultiTool,
};
