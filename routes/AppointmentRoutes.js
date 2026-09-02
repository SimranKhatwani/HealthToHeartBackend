// const express = require("express")
// const { createAppointment, getAppointment, updateAppointment, deleteAppointment, getAppointmentById } = require("../controllers/AppointmentController")

// const AppointmentRoutes = express.Router()

// AppointmentRoutes.post("/create-appointment",createAppointment)
// AppointmentRoutes.get("/get-Appointments",getAppointment)
// AppointmentRoutes.put("/update-Appointment",updateAppointment)
// AppointmentRoutes.delete("/delete-Appointment",deleteAppointment)
// AppointmentRoutes.get("/get-Appointment/:id",getAppointmentById)

// module.exports = AppointmentRoutes



const express = require("express");
const appointmentController = require("../controllers/AppointmentController");
const AppointmentRoutes = express.Router();
const { verifyTokenUser } = require("../middleware/Verification")

// Create a new appointment
AppointmentRoutes.post("/", verifyTokenUser, appointmentController.createAppointment);

// Get all appointments
AppointmentRoutes.get("/", verifyTokenUser, appointmentController.getAllAppointments);

// Get an appointment by ID
AppointmentRoutes.get("/:id", appointmentController.getAppointmentById);

// Get all appointments for a specific doctor
AppointmentRoutes.get("/doctor/:doctorId", appointmentController.getDoctorAppointments);

// Get all appointments for a specific patient
AppointmentRoutes.get("/patient/:patientId", appointmentController.getPatientAppointments);

// Get all appointments for a specific date
AppointmentRoutes.get("/date/:date", appointmentController.getAppointmentsByDate);

// Update an appointment
AppointmentRoutes.put("/:id", verifyTokenUser, appointmentController.updateAppointment);

// Delete an appointment
AppointmentRoutes.delete("/:id", verifyTokenUser, appointmentController.deleteAppointment);

module.exports = AppointmentRoutes;
