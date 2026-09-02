const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true }, // Reference to the patient
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Doctor who created the record
    diagnosis: { type: String, required: true }, // Example: "Diabetes Type 2"
    symptoms: [{ type: String }], // Example: ["Fever", "Cough", "Headache"]
    prescriptions: [{
        medicine: String,
        dosage: String,
        duration: String // Example: "7 days"
    }], // List of prescribed medicines
    labResults: [{ 
        testName: String, 
        result: String, 
        testDate: Date 
    }], // Example: Blood test reports
    notes: { type: String }, // Doctor's additional comments
    nextAppointment: { type: Date }, // Follow-up appointment date
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
