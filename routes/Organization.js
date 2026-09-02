const express = require("express");
const organizationController = require("../controllers/OrganizationController");


const OrganizationRoutes = express.Router();

OrganizationRoutes.post("/", organizationController.createOrganization);
OrganizationRoutes.get("/", organizationController.getAllOrganizations);
OrganizationRoutes.get("/:id", organizationController.getOrganizationById);
OrganizationRoutes.put("/:id", organizationController.updateOrganization);
OrganizationRoutes.delete("/:id", organizationController.deleteOrganization);

module.exports = OrganizationRoutes;
