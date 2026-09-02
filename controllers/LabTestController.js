const LabTest = require("../models/LabTestSchema");
const MedicalStaff = require("../models/MedicalStaff");
const Patients = require("../models/Patients");
const { getUserFromToken } = require("../utils/auth"); // Adjust path as needed

// ✅ Create Lab Test
exports.createLabTest = async (req, res) => {
    try {
        const { org_id } = await getUserFromToken(req);
        // console.log(req.body)
        const {
            testName,
            // testType,
            category,
            notes,
            patientId,
            DoctorId,
            sampleCollectedBy,
            sampleCollected,
            sampleCollectedDate,
            Priority,
            requestDate
        } = req.body;

        // Validate required fields
        if (!testName || !patientId || !DoctorId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Check if patient exists
        const patient = await Patients.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // Check if doctor exists
        const doctor = await MedicalStaff.findById(DoctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        // Create lab test
        const labTest = new LabTest({
            testName,
            // testType,
            notes,
            patientId,
            DoctorId,
            sampleCollected,
            sampleCollectedDate,
            sampleCollectedBy,
            org_id,
            Priority,
            requestDate
        });

        // Push the test to the patient's labTests array
        patient.labTests.push(labTest._id);
        await patient.save();
        await labTest.save();

        res.status(201).json({ success: true, message: "Lab test created", data: labTest });
    } catch (error) {
        // console.error("Error in createLabTest:", error);
        res.status(500).json({ success: false, message: "Error creating lab test", error: error.message });
    }
};


// ✅ Get all Lab Tests (org-wise or filter by patientId/doctorId optionally)
exports.getAllLabTests = async (req, res) => {
    try {
        // console.log("I am here");
        const { org_id } = await getUserFromToken(req);
        const { patientId, DoctorId, status } = req.query;

        const filter = { org_id };
        if (patientId) filter.patientId = patientId;
        if (DoctorId) filter.DoctorId = DoctorId;
        if (status) filter.status = status;

        const labTests = await LabTest.find(filter)
            .populate("patientId")
            .populate("DoctorId")
            .populate("sampleCollectedBy");

        res.status(200).json({ success: true, data: labTests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching lab tests", error: error.message });
    }
};

// ✅ Get Lab Test by ID
exports.getLabTestById = async (req, res) => {
    try {
        const labTest = await LabTest.findById(req.params.id)
            .populate("patientId", "first_name last_name")
            .populate("DoctorId", "first_name last_name")
            .populate("sampleCollectedBy", "first_name last_name");

        if (!labTest) {
            return res.status(404).json({ success: false, message: "Lab test not found" });
        }

        res.status(200).json({ success: true, data: labTest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching lab test", error: error.message });
    }
};

// ✅ Update Lab Test
exports.updateLabTest = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Get original lab test (to access current patientId before updating)
      const labTest = await LabTest.findOne({ id });
      if (!labTest) {
        return res.status(404).json({ success: false, message: "Lab test not found" });
      }
  
      const originalPatientId = labTest.patientId?.toString();
  
      // Now update fields from req.body
      Object.assign(labTest, req.body);
  
      // Sample collection logic
      if (req.body.sampleCollected) {
        labTest.status = "in-progress";
        labTest.sampleCollectedDate = req.body.sampleCollectedDate;
        labTest.sampleCollectedBy = req.body.sampleCollectedBy;
      }
  
      // Patient reassignment logic
      if (req.body.patientId && req.body.patientId !== originalPatientId) {
        const previousPatient = await Patients.findById(originalPatientId);
        if (previousPatient) {
          previousPatient.labTests.pull(labTest._id);
          await previousPatient.save();
        }
  
        const newPatient = await Patients.findById(req.body.patientId);
        if (newPatient) {
          newPatient.labTests.push(labTest._id);
          await newPatient.save();
          labTest.patientId = newPatient._id;
        }
      }
  
      // Save labTest with any final updates
      await labTest.save();
  
      res.status(200).json({ success: true, message: "Lab test updated", data: labTest });
    } catch (error) {
      // console.error("Error in updateLabTest:", error);
      res.status(500).json({ success: false, message: "Error updating lab test", error: error.message });
    }
  };
  
  

// ✅ Delete Lab Test
exports.deleteLabTest = async (req, res) => {
    try {
        const deleted = await LabTest.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Lab test not found" });
        }

        const patient = await Patients.findById(deleted.patientId);
        if (patient) {
            patient.labTests.pull(deleted._id);
            await patient.save();
        }

        res.status(200).json({ success: true, message: "Lab test deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting lab test", error: error.message });
    }
};

// ✅ Update Lab Test Status
exports.updateLabTestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["pending", "in-progress", "completed", "rejected"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const labTest = await LabTest.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!labTest) {
            return res.status(404).json({ success: false, message: "Lab test not found" });
        }

        res.status(200).json({ success: true, message: "Status updated", data: labTest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating status", error: error.message });
    }
};

// ✅ Mark Sample as Collected
exports.markSampleCollected = async (req, res) => {
    try {
        const { userId } = await getUserFromToken(req);

        const labTest = await LabTest.findByIdAndUpdate(
            req.params.id,
            {
                status: "in-progress",
                sampleCollected: true,
                sampleCollectedDate: new Date(),
                sampleCollectedBy: userId,
            },
            { new: true }
        );

        if (!labTest) {
            return res.status(404).json({ success: false, message: "Lab test not found" });
        }

        res.status(200).json({ success: true, message: "Sample marked as collected", data: labTest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error collecting sample", error: error.message });
    }
};
