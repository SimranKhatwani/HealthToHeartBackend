const express = require("express")
const medicalStaffController = require("../controllers/MedicalStaffController")
const MedicalStaffRoutes = express.Router()
const { verifyTokenUser } = require("../middleware/Verification")

MedicalStaffRoutes.post("/", medicalStaffController.createStaff);
MedicalStaffRoutes.get("/", verifyTokenUser, medicalStaffController.getAllStaff);
MedicalStaffRoutes.put("/edit-profile", verifyTokenUser, medicalStaffController.editStaff);
MedicalStaffRoutes.get("/avatar/:id", medicalStaffController.getStaffAvatar);
MedicalStaffRoutes.get("/:role_name", verifyTokenUser, medicalStaffController.getAllStaffCategory);
MedicalStaffRoutes.get("/:id", verifyTokenUser, medicalStaffController.getStaffById);
MedicalStaffRoutes.put("/:id", verifyTokenUser, medicalStaffController.updateStaff);
MedicalStaffRoutes.delete("/:id", medicalStaffController.deleteStaff);
module.exports = MedicalStaffRoutes



