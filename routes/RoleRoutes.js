const express = require("express");
const roleController = require("../controllers/RoleController");
const { verifyTokenUser } = require('../middleware/Verification');

const RoleRoutes = express.Router();

RoleRoutes.post("/", roleController.createRole);
RoleRoutes.get("/", roleController.getAllRoles);
RoleRoutes.get("/role-permissions", verifyTokenUser, roleController.getRolePermissions);
RoleRoutes.get("/:id", roleController.getRoleById);
RoleRoutes.put("/:id", roleController.updateRole);
RoleRoutes.delete("/:id", roleController.deleteRole);




module.exports = RoleRoutes;
