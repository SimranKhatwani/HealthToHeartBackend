const mongoose = require("mongoose")

const PatientVitalSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    nurseId:{type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    temperature: { type: String, required: true },
    bloodPressure: { type: String, required: true },
    pulseRate: { type: String, required: true },
    respiratoryRate: { type: String, required: true },
    oxygenLevel: { type: String, required: true },
    bloodSugar: { type: String, required: true },
    weight: { type: String, required: true },
    height: { type: String, required: true },
    bmi: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("PatientVital", PatientVitalSchema);