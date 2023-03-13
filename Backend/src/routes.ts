//////////////////////////routes//////////////////////////
const express = require("express");
const router = express.Router();

//controller imports
const downloadController = require("./controllers/download.controller");

//download routes
router.post("/availableFiles", downloadController.availableFiles);
router.get("/zipData", downloadController.zipData);
router.get("/downloadSVG", downloadController.downloadSVG);
router.get("/downloadGcode", downloadController.downloadGcode);
router.get("/downloadPNG", downloadController.downloadPNG);
router.get("/downloadJPG", downloadController.downloadJPG);

module.exports = router;
