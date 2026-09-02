// const express = require("express")
// const {createSchedule, getDoctorSchedule, deleteSchedule, updateSchedule} = require("../controllers/ScheduleController")
// const ScheduleRoutes = express.Router()

// ScheduleRoutes.post("/create-schedule",createSchedule)
// ScheduleRoutes.get("/get-doctor-schedule/:doctorId",getDoctorSchedule)
// ScheduleRoutes.delete("/delete-schedule/:scheduleId",deleteSchedule)
// ScheduleRoutes.put("/update-schedule/:scheduleId",updateSchedule)
// module.exports = ScheduleRoutes

const express = require("express");
const scheduleController = require("../controllers/ScheduleController");

const ScheduleRoutes = express.Router();

ScheduleRoutes.get("/", scheduleController.getAllSchedules);
ScheduleRoutes.post("/", scheduleController.createSchedule);
ScheduleRoutes.get("/:doctorId", scheduleController.getSchedules);
ScheduleRoutes.post("/available", scheduleController.getAvailableSlots);
ScheduleRoutes.delete("/:scheduleId", scheduleController.deleteSchedule);
ScheduleRoutes.put("/:scheduleId", scheduleController.updateSchedule);
module.exports = ScheduleRoutes;

