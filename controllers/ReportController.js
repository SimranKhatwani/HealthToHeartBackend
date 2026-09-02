const Reports = require('../models/Reports');
const jwt = require('jsonwebtoken');
const SuperAdmin = require("../models/SuperAdmin");
const MedicalStaff = require("../models/MedicalStaff");

// Create a new report

const createReport = async (req, res) => {
    // let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);
    const org_id = req.user.org_id;

    try {
        const {
            reportName,
            period,
            generatedDate,
            recipients,
            schedule,
            nextRun,
            reportFormat = "pdf", 
            duration = "monthly",
            status = "Processing",
            type = "financial",
        } = req.body;

        // Required field validation
        if (!org_id || !reportName || !period || !generatedDate || !recipients) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing: org_id, reportName, period, generatedDate, or recipients.",
            });
        }

        const report = new Reports({
            orgId: org_id,
            reportName,
            period,
            generatedDate,
            recipients,
            reportFormat,
            duration,
            schedule,
            nextRun,
            status,
            type,
        });

        await report.save();

        return res.status(201).json({
            success: true,
            message: "Report created successfully.",
            data: report,
        });
    } catch (error) {
        // console.error("Error creating report:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

// Get all reports
const getAllReports = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const { type } = req.query;

    // Build the query filter correctly
    const filter = {
      orgId: org_id, // compare orgId in DB with org_id from req.user
      ...(type && { type }) // add type filter only if it exists
    };

    const reports = await Reports.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message,
    });
  }
};

// Update a report
const updateReport = async (req, res) => {
  try {
    const report = await Reports.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json({ message: 'Report updated successfully', report });
  } catch (error) {
    res.status(400).json({ message: 'Error updating report', error: error.message });
  }
};

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const org_id = req.user.org_id 
    if(!org_id){
      return res.status(400).json({ success: false, message: "Unauthorized access" });
    }
    const report = await Reports.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
};

module.exports = {
  createReport,
  getAllReports,
  updateReport,
  deleteReport
};
