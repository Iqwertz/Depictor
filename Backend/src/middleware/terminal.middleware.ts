////////////////////terminal.middleware/////////////////////////
// this file contains all functions that handle terminal functionality.
// The terminal uses the serialport library to communicate with the arduino and socket.io to communicate with the client
// exports:
//  openSerialPort: (opens the serial port and sets up the event listeners)
//  disconnectTerminal: (disconnects from the arduino and closes the websocket connection)
////////////////////////////////////////////////////////

//imports
import { logger } from "../utils/logger.util";
import { SerialPort } from "serialport";
import { Socket } from "socket.io";
const fs = require("fs");

//interfaces
interface TerminalHistoryEntry {
  command: string;
  type: "command" | "response";
}

//variables
let terminalHistory: TerminalHistoryEntry[] = [];
let serialport: SerialPort | null = null;
let globalTerminalSocket: Socket | null = null;

let io = require("socket.io")(globalThis.httpServer, {
  cors: {
    origins: ["*"],
  },
});

////////////////////////////serialport//////////////////////////////////////////////

/**
 * openSerialPort
 * opens the serial port and sets up the event listeners
 *
 * @returns
 */
export function openSerialPort() {
  let error = "";
  let port: string = "";
  if (fs.existsSync("data/settings.json")) {
    let settings = fs.readFileSync("data/settings.json", "utf8");
    port = JSON.parse(settings).port;
  } else {
    error = "cant open serial Port, no settings file found";
    logger.warn(error);
  }

  if (!port) {
    logger.error("cant open serial Port, no port found");
    return "Error when opening serial port: noPortFound";
  }

  serialport = new SerialPort({ path: port, baudRate: 115200 }).setEncoding("utf8");
  logger.info("serial port opened at " + port);

  // Open errors will be emitted as an error event
  serialport.on("error", function (err) {
    logger.error("Serialport error: " + err);
    if (globalTerminalSocket) {
      globalTerminalSocket.emit("serialError", err.message);
    }
  });

  serialport.on("data", function (data) {
    if (data) {
      terminalHistory.push({ command: data, type: "response" });
      io.emit("serialData", data);
    }
  });
}

///////////////////////////socket.io//////////////////////////////////////////////

export function iniTerminalSocket() {
  io = require("socket.io")(globalThis.httpServer, {
    cors: {
      origins: ["*"],
    },
  });

  //Handle socket.io connections
  io.on("connection", (socket: Socket) => {
    logger.info("a user connected");

    if (globalThis.isDrawing) {
      socket.emit("serialError", "cannot connect to serial port while drawing");
      return;
    }

    if (!serialport?.isOpen) {
      openSerialPort();
    }

    for (let command of terminalHistory) {
      if (command.type === "command") {
        socket.emit("commandData", command.command);
      } else {
        socket.emit("serialData", command.command);
      }
    }

    socket.on("disconnect", () => {
      logger.info("user disconnected");
      if (io.engine.clientsCount == 0) {
        terminalHistory = [];
        serialport?.close();
        serialport = null;
      }
    });

    socket.on("command", (msg: string) => {
      logger.info("Terminal Command: " + msg);
      if (serialport) {
        terminalHistory.push({ command: msg, type: "command" });
        io.emit("commandData", msg);
        serialport.write(msg + "\n");
      } else {
        logger.error("serialport not open");
      }
    });

    globalTerminalSocket = socket;
  });
}

/**
 * disconnectTerminal
 * disconnects all terminals and closes the serialport
 * @returns
 */
export function disconnectTerminal() {
  logger.info("disconnecting all terminals");
  if (!io.engine) {
    logger.warn("cant disconnect terminals, no io engine");
    return;
  }
  if (io.engine.clientsCount > 0) {
    console.log("disconnecting all terminals");
    io.emit("disconnectSelf");
  }
  if (serialport) {
    console.log("closing serialport");
    terminalHistory = [];
    serialport.close();
    serialport = null;
  }
}
