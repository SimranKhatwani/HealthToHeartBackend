const mongoose = require("mongoose");

const HospitalPartnershipSchema = new mongoose.Schema({
  referringHospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true }, 
  receivingHospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true }, 
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true }, 
  referralReason: { type: String, required: true }, 
  referralDate: { type: Date, default: Date.now }, 
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Completed", "Rejected"], 
    default: "Pending" 
  }, 
  referredByDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff", required: true }, 
  receivedByDoctors: [{ 
    doctorName: { type: String, required: true }, 
    specialization: { type: String },
    contactNumber: { type: String },
    receivedDate: { type: Date, default: Date.now } 
  }],
  notes: { type: String }, 
  createdAt: { type: Date, default: Date.now } 
});

module.exports = mongoose.model("HospitalPartnership", HospitalPartnershipSchema);
