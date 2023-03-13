///////////////////////////////////////////////////
//
//Depictor Backend
//
//description: ...
//
//author: Julius Hussl
//
///////////////////////////////////////////////////

//imports
import { enviroment } from "./config/enviroment";
import { chmodConverters } from "./utils/helper.util";
import { logger } from "./utils/logger.util";
const zip = require("express-easy-zip");
const express = require("express");
const cors = require("cors");
const app = express();
const routes = require("./routes");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(zip());
app.use(cors()); //enable cors

type AppStates = "idle" | "removingBg" | "processingImage" | "rawGcodeReady" | "updating" | "error"; //possible states of the server

var appState: AppStates = "idle"; //var to track the current appstate
var isDrawing: boolean = false; //var to track if the bot is currently drawing
var drawingProgress: number = 0; //var to track the progress of the current drawing //when -1 drawing failed

var currentDrawingProcessPID: number = 0; //used to stop the drawing process
var lastGeneratedGcode: string = "";

var isLinux: boolean = process.platform === "linux";

var httpServer = require("http").createServer(app); //create new http server

/* //make variables global (not best practice, might be improved in the future)
globalThis.appState = appState;
globalThis.isDrawing = isDrawing;
globalThis.drawingProgress = drawingProgress;
globalThis.currentDrawingProcessPID = currentDrawingProcessPID;
globalThis.lastGeneratedGcode = lastGeneratedGcode;
globalThis.isLinux = isLinux;
globalThis.httpServer; */

app.use(routes);
httpServer!.listen(enviroment.port, () => {
  //start http server
  logger.info("started Server");
  logger.info("listening on *:" + enviroment.port);
  logger.info("Detected Linux: " + isLinux);
  chmodConverters();
});
