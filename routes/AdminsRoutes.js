const express = require("express");
const { createAdmins, getAllSuperAdmins, getSuperAdminById, updateSuperAdmin, deleteSuperAdmin, getAdminAvatar } = require("../controllers/AdminsController");

const AdminsRoutes = express.Router();

AdminsRoutes.post("/", createAdmins);
AdminsRoutes.get("/", getAllSuperAdmins);
AdminsRoutes.get("/avatar/:id", getAdminAvatar);
AdminsRoutes.get("/:id", getSuperAdminById);
AdminsRoutes.put("/:id", updateSuperAdmin);
AdminsRoutes.delete("/:id", deleteSuperAdmin);

module.exports = AdminsRoutes;
