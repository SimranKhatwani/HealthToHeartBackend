const mongoose = require("mongoose")

const shortUUID = require("short-uuid");
const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");

const generateShortId = (roleName) => {

    const prefix = "TES"; // Default to "GEN"
    return `${prefix}-${translator.generate().slice(0, 4)}`;
};
const LabTestSchema = new mongoose.Schema({
    id: {
        type: String,
        default: generateShortId
    },
    testName: {
        type: String,
        required: true

    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    // testType: {
    //     type: String,

    // },

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
    },
    DoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalStaff",
    },

    status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "rejected"],
        default: "pending"

    },
    sampleCollected: {
        type: Boolean,
        default: false
    },
    sampleCollectedDate: {
        type: Date,
        default: Date.now
    },
    sampleCollectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalStaff",
    },
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
    // category: {
    //     // type: mongoose.Schema.Types.ObjectId,
    //     // ref: "Category",
    //     type: String,
    //     required: true,
    // },
    notes: {
        type: String,
    },
    Priority: {
        type: String,
        enum: ["Normal", "High", "Urgent"],
        default: "Normal"
    },
    report: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestReport"
    }]

}, { timestamps: true })

module.exports = mongoose.model("LabTest", LabTestSchema)