////////////////////status.controller////////////////////
// this file contains all endpoints that handle the state of the server
// exports:
//  checkProgress: (returns the current state of the application)
//  getGeneratedGcode: (returns the last generated gcode when available)
///////////////////////////////////////////////////////////

//imports
import { logger } from "../utils/logger.util";
import { Request, Response } from "express";
import { enviroment } from "../config/enviroment";
import { checkBGremoveAPIkey } from "../middleware/removeBG.middleware";
const fs = require("fs");

//interfaces
interface StateResponse {
  state: AppStates;
  isDrawing: boolean;
  removeBG: boolean;
}

//variables
const useBGApi: boolean = enviroment.removeBGSettings.enableApi; //used during dev. to limit api calls

/*
post: /checkProgress

description: returns the current state of the application

expected request: 
  {}
  
returns: 
  @StateResponse
*/
async function checkProgress(req: Request, res: Response) {
  logger.http("post: checkProgress");

  let bgRemoveAvailable = checkBGremoveAPIkey();

  let response: StateResponse = {
    state: globalThis.appState,
    isDrawing: globalThis.isDrawing,
    removeBG: bgRemoveAvailable && useBGApi,
  };

  res.json(response);
}

/*
post: /getGeneratedGcode

description: returns the generated gcode when available

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
async function getGeneratedGcode(req: Request, res: Response) {
  logger.http("post: getGeneratedGcode");
  if (globalThis.appState == "rawGcodeReady") {
    //check if gcode is ready
    /////get the correct path depending on os
    let gcodePath: string = "./data/savedGcodes/" + globalThis.lastGeneratedGcode;

    /////read gcode
    let rawGcode = fs.readFileSync(gcodePath, "utf8");

    res.json({ state: globalThis.appState, isDrawing: globalThis.isDrawing, data: rawGcode }); //return gcode and appstate information
  } else {
    res.json({ state: globalThis.appState, err: "no_gcode_ready" }); //return nogcodeready error when nothing is ready
  }
}

module.exports = {
  checkProgress,
  getGeneratedGcode,
};
