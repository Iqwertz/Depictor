export {};

declare global {
  type AppStates = "idle" | "removingBg" | "processingImage" | "rawGcodeReady" | "updating" | "error"; //possible states of the server
  var appState: AppState;
  var isDrawing: boolean;
  var drawingProgress: number;
  var currentDrawingProcessPID: number;
  var lastGeneratedGcode: string;
  var isLinux: boolean;
  var httpServer: any;
}
