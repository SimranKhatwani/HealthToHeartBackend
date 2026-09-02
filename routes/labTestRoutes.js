const express = require("express");
const labTestRoutes = express.Router();
const labTestController = require("../controllers/LabTestController");

labTestRoutes.post("/", labTestController.createLabTest);
labTestRoutes.get("/", labTestController.getAllLabTests);
labTestRoutes.get("/:id", labTestController.getLabTestById);
labTestRoutes.put("/:id", labTestController.updateLabTest);
labTestRoutes.put("/:id/sample", labTestController.markSampleCollected);
labTestRoutes.put("/:id/status", labTestController.updateLabTestStatus);
labTestRoutes.delete("/:id", labTestController.deleteLabTest);

module.exports = labTestRoutes;
