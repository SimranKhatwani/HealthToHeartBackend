const express = require("express");
const TestReportRoutes = express.Router();
const testReportController = require("../controllers/TestReportController");

TestReportRoutes.post("/", testReportController.createTestReport);
TestReportRoutes.get("/", testReportController.getAllTestReports);
TestReportRoutes.get("/labTest/:labTestId", testReportController.getReportsByLabTestId);
TestReportRoutes.get("/:id", testReportController.getTestReportById);
TestReportRoutes.put("/:id", testReportController.updateTestReport);
TestReportRoutes.delete("/:id", testReportController.deleteTestReport);

module.exports = TestReportRoutes;
