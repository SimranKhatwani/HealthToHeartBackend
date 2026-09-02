const express = require('express');
const { createReport,
        getAllReports,
        updateReport,
        deleteReport
    } = require('../controllers/ReportController');
const { verifyTokenUser } = require("../middleware/Verification")

const ReportRoutes = express.Router();

ReportRoutes.post("/create", verifyTokenUser, createReport);
ReportRoutes.get("/get", verifyTokenUser, getAllReports)
ReportRoutes.put("/update/:id", verifyTokenUser, updateReport)
ReportRoutes.delete("/delete/:id", verifyTokenUser, deleteReport);



module.exports = ReportRoutes;
