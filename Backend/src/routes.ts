//////////////////////////routes//////////////////////////
// In this file all routes are defined
// exports:
//   router: express.Router
//////////////////////////////////////////////////////////

//imports
const express = require("express");
const router = express.Router();

//controller imports
const downloadController = require("./controllers/download.controller");
const uploadController = require("./controllers/upload.controller");
const drawingController = require("./controllers/drawing.controller");
const galleryController = require("./controllers/gallery.controller");
const statusController = require("./controllers/status.controller");
const settingsController = require("./controllers/settings.controller");

//download routes
router.post("/availableFiles", downloadController.availableFiles);
router.get("/zipData", downloadController.zipData);
router.get("/downloadSVG", downloadController.downloadSVG);
router.get("/downloadGcode", downloadController.downloadGcode);
router.get("/downloadPNG", downloadController.downloadPNG);
router.get("/downloadJPG", downloadController.downloadJPG);

//upload routes
router.post("/newPicture", uploadController.newPicture);
router.post("/newFile", uploadController.newFile);
router.post("/postGcode", uploadController.postGcode);
router.post("/uploadGalleryEntry", uploadController.uploadGalleryEntry);

//drawing routes
router.post("/getDrawingProgress", drawingController.getDrawingProgress);
router.post("/getDrawenGcode", drawingController.getDrawenGcode);
router.post("/cancle", drawingController.cancle);
router.post("/stop", drawingController.stop);
router.post("/executeGcode", drawingController.executeGcode);
router.post("/continueMultiTool", drawingController.continueMultiTool);

//gallery routes
router.post("/delete", galleryController.deleteEntry);
router.post("/getGcodeGallery", galleryController.getGcodeGallery);
router.post("/getGcodeById", galleryController.getGcodeById);

//status routes
router.post("/checkProgress", statusController.checkProgress);
router.post("/getGeneratedGcode", statusController.getGeneratedGcode);

//settings routes
router.post("/setBGRemoveAPIKey", settingsController.setBGRemoveAPIKey);
router.post("/shutdown", settingsController.shutdown);
router.post("/update", settingsController.update);
router.post("/updateBeta", settingsController.updateBeta);
router.post("/getVersion", settingsController.getVersion);
router.post("/changeSettings", settingsController.changeSettings);
router.post("/changeConverterSettings", settingsController.changeConverterSettings);
router.post("/getAvailableSerialPorts", settingsController.getAvailableSerialPorts);
router.post("/setSerialPort", settingsController.setSerialPort);
router.post("/getLoggingData", settingsController.getLoggingData);
router.post("/home", settingsController.home);

module.exports = router;
