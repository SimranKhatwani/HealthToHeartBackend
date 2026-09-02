const express = require("express");
const aiDiagnosticController = require("../controllers/aiDiagnosticController");
const aiDiagnosticRoutes = express.Router();
aiDiagnosticRoutes.post("/", aiDiagnosticController.createAIDiagnostic);

aiDiagnosticRoutes.get("/", aiDiagnosticController.getAIDiagnostics);

aiDiagnosticRoutes.get("/:id", aiDiagnosticController.getAIDiagnosticById);

module.exports =  aiDiagnosticRoutes;
