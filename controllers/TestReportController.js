const TestReport = require("../models/LabReports");
const LabTest = require("../models/LabTestSchema");
const { getUserFromToken } = require("../utils/auth");

// Create a test report
exports.createTestReport = async (req, res) => {
    try {
        // console.log(req.body);
        const { org_id } = await getUserFromToken(req);
        const {
            labTest,
            patientId,
            testName,
            performedBy,
            reviewedBy,
            status,
            results,
            comments
        } = req.body;

        const labTestExists = await LabTest.findById(labTest);
        if (!labTestExists) {
            return res.status(404).json({ message: "Lab test not found" });
        }

        const report = await TestReport.create({
            labTest,
            patientId,
            testName,
            performedBy,
            reviewedBy,
            status,
            results,
            comments,
            org_id
        });
        // find the lab test and add the report to its report array and also update its status to completed
        labTestExists.report.push(report._id);
        labTestExists.status = "completed";
        await labTestExists.save();

        res.status(201).json(report);
    } catch (error) {
        // console.error("Error creating test report:", error);
        res.status(500).json({ message: "Failed to create test report" });
    }
};

// Get all reports
exports.getAllTestReports = async (req, res) => {
    try {
        const { status, labTest } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (labTest) filter.labTest = labTest;

        const reports = await TestReport.find(filter)
            .populate("patientId")
            .populate("labTest", "id testName")
            .populate("performedBy", "id name")
            .populate("reviewedBy", "id name");

        res.json(reports);
    } catch (error) {
        // console.error("Error getting reports:", error);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
};

// Get a report by ID
exports.getTestReportById = async (req, res) => {
    try {
        const report = await TestReport.findById(req.params.id)
            .populate("patientId")
            .populate("labTest", "id testName")
            .populate("performedBy", "id name")
            .populate("reviewedBy", "id name");

        if (!report) return res.status(404).json({ message: "Test report not found" });

        res.json(report);
    } catch (error) {
        // console.error("Error fetching test report:", error);
        res.status(500).json({ message: "Failed to get test report" });
    }
};

// Update a report
exports.updateTestReport = async (req, res) => {
    try {
        // console.log(req.body);
        const {id} = req.params;
        const updated = await TestReport.findOne({id: id}).updateOne(req.body);


        if (!updated) {
            // console.log("Test report not found" ,updated);
            return res.status(404).json({ message: "Test report not found" });
        }

        res.json(updated);
    } catch (error) {
        // console.error("Error updating report:", error);
        res.status(500).json({ message: "Failed to update test report" });
    }
};

// Delete a report
exports.deleteTestReport = async (req, res) => {
    try {
        const deleted = await TestReport.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Test report not found" });

        res.json({ message: "Test report deleted successfully" });
    } catch (error) {
        // console.error("Error deleting report:", error);
        res.status(500).json({ message: "Failed to delete test report" });
    }
};

// Get all reports for a specific lab test
exports.getReportsByLabTestId = async (req, res) => {
    try {
        const { labTestId } = req.params;
        const reports = await TestReport.find({ labTest: labTestId })
            .populate("performedBy", "id name")
            .populate("reviewedBy", "id name");

        res.json(reports);
    } catch (error) {
        // console.error("Error fetching reports:", error);
        res.status(500).json({ message: "Failed to fetch reports for lab test" });
    }
};

// Search reports by patient name or test name
exports.searchTestReports = async (req, res) => {
    try {
        const { query } = req.query;
        const reports = await TestReport.find({
            $or: [
                { patientId: new RegExp(query, "i") },
                { testName: new RegExp(query, "i") }
            ]
        });

        res.json(reports);
    } catch (error) {
        // console.error("Error searching reports:", error);
        res.status(500).json({ message: "Search failed" });
    }
};
