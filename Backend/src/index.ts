///////////////////////////////////////////////////
//
//Depictor Backend
//
//description: This is the entry point of the backend server
//
//author: Julius Hussl
///////////////////////////////////////////////////

//imports
import { enviroment } from "./config/enviroment";
import { startIoServer } from "./middleware/terminal.middleware";
import { chmodConverters } from "./utils/helper.util";
import { logger } from "./utils/logger.util";
const zip = require("express-easy-zip");
const express = require("express");
const cors = require("cors");
const app = express();
const routes = require("./routes");

//initialize global vars (not best practice, might be improved in the future)
globalThis.appState = "idle"; //var to track the current appstate;
globalThis.isDrawing = false; //var to track if the bot is currently drawing
globalThis.drawingProgress = 0; //var to track the progress of the current drawing //when -1 drawing failed
globalThis.currentDrawingProcessPID = 0; //used to stop the drawing process
globalThis.lastGeneratedGcode = ""; //used to store the last generated gcode
globalThis.isLinux = process.platform === "linux";
globalThis.httpServer = require("http").createServer(app); //create new http server
startIoServer(); //start socket.io server

//configure express
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(zip());
app.use(cors());
app.use(routes);

//start server
globalThis.httpServer!.listen(enviroment.port, () => {
  logger.info("started Server");
  logger.info("listening on *:" + enviroment.port);
  logger.info("Detected Linux: " + isLinux);
  chmodConverters();
});
