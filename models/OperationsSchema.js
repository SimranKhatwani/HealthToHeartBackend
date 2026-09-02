const mongoose = require("mongoose");

const OperationSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  doctor_details: [{ type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff", required: true }], 
  patient_details: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  operationType: { type: String, required: true },
  operationDate: { type: Date, required: true },
  operationRoom: { type: String, required: true },
  anesthesiaType: { type: String, enum: ["Local", "General", "Regional", "None"] },
  duration: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["Scheduled", "In Progress", "Completed", "Canceled"], 
    default: "Scheduled" 
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Operation", OperationSchema);
