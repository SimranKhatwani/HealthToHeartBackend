const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "MedicalStaff", 
        required: true, 
        index: true
    },
    date: { 
        type: Date, 
        required: true, 
        default: Date.now,
        index: true
    }, // Specific date
    startTime: { 
        type: Date, 
        required: true 
    }, // Defines the start of working hours
    endTime: { 
        type: Date, 
        required: true 
    }, // Defines the end of working hours
    breakTime: [ // Breaks within the working hours
        {
            start: { type: Date, required: true },
            end: { type: Date, required: true }
        }
    ],
    slots: [
        {
            time: { type: Date, required: true }, // Time for each slot
            status: { type: String, enum: ["available", "booked"], default: "available" },
            bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null }
        }
    ],
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }
}, { timestamps: true });

ScheduleSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Schedule", ScheduleSchema);
