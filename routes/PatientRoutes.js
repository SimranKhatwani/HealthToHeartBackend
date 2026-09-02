const express = require("express");
const patientController = require("../controllers/patientController");
const PatientRoutes = express.Router();

PatientRoutes.post("/", patientController.createPatient);
PatientRoutes.get("/", patientController.getPatients);
PatientRoutes.get("/:id", patientController.getPatientById);
PatientRoutes.patch("/:id", patientController.updatePatient);
PatientRoutes.delete("/:id", patientController.deletePatient);
PatientRoutes.post("/:id/visits", patientController.addVisit); 
PatientRoutes.post("/:id/medical-history", patientController.addMedicalHistory);
PatientRoutes.post("/:id/prescriptions", patientController.addPrescription);
PatientRoutes.patch("/:id/discharge", patientController.updateDischarge);
PatientRoutes.post("/details", patientController.getPatientDetails);

module.exports = PatientRoutes;
