const AIDiagnostic = require("../models/aiDiagnosticModel");
const LabReports = require("../models/LabReports");
const { analyzeLabTest } = require("../controllers/GenAiControllers");


// Create AI diagnostic from lab test
exports.createAIDiagnostic = async (req, res) => {
    try {
        const { testId } = req.body;
        const test = await LabReports.findById(testId).populate("patientId").populate("labTest");
        // console.log(test);


        if (!test) return res.status(404).json({ message: "Lab test not found" });

        const aiResult = await analyzeLabTest(test);

        const newInsight = new AIDiagnostic({
            testId: test._id,
            ...aiResult,
        });

        await newInsight.save();
        res.status(201).json(newInsight);
    } catch (err) {
        // console.error("❌ AI diagnostic error:", err.message);
        res.status(500).json({ message: err.message || "AI analysis failed" });
    }
};


// Get all diagnostics
exports.getAIDiagnostics = async (req, res) => {
    try {
      const diagnostics = await AIDiagnostic.find()
        .populate({
          path: "testId",
          populate: [
            { path: "patientId" },
            { path: "labTest" }
          ],
        })
        .lean();
  
      res.json(diagnostics);
    } catch (err) {
      // console.error("Error fetching diagnostics:", err);
      res.status(500).json({ error: "Failed to fetch AI diagnostics" });
    }
  };

// Get diagnostic by ID
exports.getAIDiagnosticById = async (req, res) => {
    try {
        const diagnostic = await AIDiagnostic.findById(req.params.id)
          .populate({
            path: "testId",
            populate: [
              { path: "patientId" },
              { path: "labTest" }
            ],
          })
          .lean();
    
          if (!diagnostic) return res.status(404).json({ message: "Not found" });
          res.json(diagnostic);
      } catch (err) {
        // console.error("Error fetching diagnostics:", err);
        res.status(500).json({ error: "Failed to fetch AI diagnostics" });
      }
    
};
