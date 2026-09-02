// const express = require('express');
// const {
//     createPrescription,
//     getPrescriptionsByEmail,
//     updatePrescription
// } = require('../controllers/Prescription');
// const {verifyTokenUser} = require('../middleware/Verification')

// const PrescriptionRoutes = express.Router();

// PrescriptionRoutes.post('/create', verifyTokenUser, createPrescription);
// PrescriptionRoutes.get('/fetch', verifyTokenUser, getPrescriptionsByEmail);
// PrescriptionRoutes.put('/edit/:id', verifyTokenUser, updatePrescription);


// module.exports = PrescriptionRoutes;
const express = require("express");
const {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionsByEmail,
  updatePrescription,
  deletePrescription,
  changeFilledStatus
} = require("../controllers/Prescription");

const PrescriptionRoutes = express.Router();

PrescriptionRoutes.post("/", createPrescription); // Create a new prescription
PrescriptionRoutes.get("/", getAllPrescriptions); // Get all prescriptions (with org_id filtering)
PrescriptionRoutes.get("/by-email", getPrescriptionsByEmail); // Get prescriptions by patient email
PrescriptionRoutes.put("/:id", updatePrescription); // Update a prescription
PrescriptionRoutes.delete("/:id", deletePrescription); // Delete a prescription
PrescriptionRoutes.put("/changestatus/:id", changeFilledStatus); // Change filled status

module.exports = PrescriptionRoutes;
