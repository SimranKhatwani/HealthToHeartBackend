const mongoose = require("mongoose");
const shortUUID = require("short-uuid");
const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");

const generateShortId = (roleName) => {

    const prefix = "REP"; // Default to "GEN"
    return `${prefix}-${translator.generate().slice(0, 4)}`;
};

const AppointmentSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        default: generateShortId
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",

    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalStaff",
        required: true,
        index: true
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
        required: true
    },
    slotTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled", "no-show"],
        default: "scheduled"
    },
    reason: {
        type: String
    },
    notes: {
        type: String
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    }
}, { timestamps: true });

AppointmentSchema.index({ doctorId: 1, slotTime: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", AppointmentSchema);
