const Operation = require("../models/OperationsSchema");
const SuperAdmin = require("../models/SuperAdmin");
const jwt = require("jsonwebtoken");
const MedicalStaff = require("../models/MedicalStaff");
const Patient = require("../models/Patients");

const createOperation = async (req, res) => {
  const org_id = req.user.org_id;
  try {
    let {
      doctor_name,
      patient_name,
      operationType,
      operationDate,
      operationRoom,
      anesthesiaType,
      duration,
      status,
      notes,
    } = req.body;


    // Find doctor and patient in the correct collections
    const doctor = await MedicalStaff.findOne({ name: doctor_name }); // Check correct model
    const patient = await Patient.findOne({ name: patient_name }); // Check correct model

    if (!doctor || !patient) {
      return res.status(404).json({
        success: false,
        message: "Doctor or patient not found",
      });
    }

    const newOperation = new Operation({
      org_id : org_id,
      doctor_details: [doctor._id], // Store in an array (schema requires it)
      patient_details: patient._id, // Single ObjectId
      operationType,
      operationDate,
      operationRoom,
      anesthesiaType,
      duration,
      status,
      notes,
    });

    await newOperation.save();
    res.status(201).json({
      success: true,
      message: "Operation created successfully",
      data: newOperation,
    });

  } catch (error) {
    // console.error("Error creating operation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create operation",
      error: error.message,
    });
  }
};


const getAllOperations = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const operations = await Operation.find({org_id})
      .populate("org_id", "org_name") // Populate organization name
      .populate("doctor_details", "name specialization") // Populate doctor name and specialty
      .populate("patient_details", "name gender id") // Populate patient name, age, and gender
      .sort({ operationDate: -1 });

    res.status(200).json({
      success: true,
      count: operations.length,
      data: operations,
    });

  } catch (error) {
    // console.error("Error fetching operations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch operations",
      error: error.message,
    });
  }
};

// Get Operation by ID
const getOperationById = async (req, res) => {
  try {
    const operation = await Operation.findById(req.params.id)
      .populate("org_id", "name")
      .populate("doctor_details", "name specialty")
      .populate("patient_details", "name age gender id");

    if (!operation) {
      return res.status(404).json({ success: false, message: "Operation not found" });
    }

    res.status(200).json({
      success: true,
      data: operation,
    });

  } catch (error) {
    // console.error("Error fetching operation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch operation",
      error: error.message,
    });
  }
};

const updateOperation = async (req, res) => {
  try {
    const updatedOperation = await Operation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("org_id", "name")
      .populate("doctor_details", "name specialty")
      .populate("patient_details", "name age gender");

    if (!updatedOperation) {
      return res.status(404).json({ success: false, message: "Operation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Operation updated successfully",
      data: updatedOperation,
    });

  } catch (error) {
    // console.error("Error updating operation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update operation",
      error: error.message,
    });
  }
};

//  Delete Operation
const deleteOperation = async (req, res) => {
  try {
    const deletedOperation = await Operation.findByIdAndDelete(req.params.id);

    if (!deletedOperation) {
      return res.status(404).json({ success: false, message: "Operation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Operation deleted successfully",
    });

  } catch (error) {
    // console.error("Error deleting operation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete operation",
      error: error.message,
    });
  }
};

module.exports = {
  createOperation,
  getAllOperations,
  getOperationById,
  updateOperation,
  deleteOperation,
};
