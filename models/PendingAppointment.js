const mongoose = require("mongoose");

const PendingAppointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalStaff",
        required: true,
        index: true,
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
        required: true,
    },
    slotTime: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "rejected", "approved"],
        default: "pending",
    },
    reason: {
        type: String,
    },
    notes: {
        type: String,
    },
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },
}, { timestamps: true });

PendingAppointmentSchema.index({ doctorId: 1, slotTime: 1 }, { unique: true });

module.exports = mongoose.model("PendingAppointment", PendingAppointmentSchema);
