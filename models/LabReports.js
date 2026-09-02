const mongoose = require("mongoose");
const shortUUID = require("short-uuid");
const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");

const generateShortId = (roleName) => {

    const prefix = "REP"; // Default to "GEN"
    return `${prefix}-${translator.generate().slice(0, 4)}`;
};
const parameterSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, required: true },
  referenceRange: { type: String },
}, { _id: false });

const testReportSchema = new mongoose.Schema({
id:{
  type: String,
  unique: true,
  default: generateShortId
},
  labTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LabTest",
    required: true,
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  testName: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff", required: true }, 
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff", required: true },  
  status: {
    type: String,
    enum: ["normal", "abnormal"],
    default: "normal",
    required: true
  },
  results: {
    type: [parameterSchema],
    required: true
  },
  comments: {
    type: String
  },
  org_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  resultDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("TestReport", testReportSchema);
