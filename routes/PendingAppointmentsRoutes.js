const express = require("express");
const PendingAppointmentsRoutes = express.Router();
const pendingAppointmentController = require("../controllers/PendingAppointmentController");

PendingAppointmentsRoutes.post("/", pendingAppointmentController.createPendingAppointment);
PendingAppointmentsRoutes.get("/", pendingAppointmentController.getAllPendingAppointments);
PendingAppointmentsRoutes.get("/:id", pendingAppointmentController.getPendingAppointmentById);
PendingAppointmentsRoutes.get("/patient/:patientId", pendingAppointmentController.getPendingAppointmentsForPatient);
PendingAppointmentsRoutes.put("/:id", pendingAppointmentController.updatePendingAppointment);
PendingAppointmentsRoutes.delete("/:id", pendingAppointmentController.deletePendingAppointment);

module.exports = PendingAppointmentsRoutes;
