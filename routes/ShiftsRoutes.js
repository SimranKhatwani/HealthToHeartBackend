const express = require("express");
const ShiftsRoutes = express.Router();
const shiftController = require("../controllers/ShiftsController");

ShiftsRoutes.post("/", shiftController.createShift);
ShiftsRoutes.get("/", shiftController.getAllShifts);
ShiftsRoutes.get("/:id", shiftController.getShiftById);
ShiftsRoutes.put("/:id", shiftController.updateShift);
ShiftsRoutes.delete("/:id", shiftController.deleteShift);
ShiftsRoutes.get("/staff/:staffId", shiftController.getShiftsByStaffId);
ShiftsRoutes.get("/organization/:orgId", shiftController.getShiftsByOrganization);
ShiftsRoutes.get("/day/:day", shiftController.getShiftsByDay);
ShiftsRoutes.get("/active", shiftController.getActiveShifts);
// ShiftsRoutes.get("/inactive", shiftController.getInactiveShifts);

module.exports = ShiftsRoutes;
