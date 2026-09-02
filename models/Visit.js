const mongoose = require("mongoose");

const VisitSchema = new mongoose.Schema({
    patient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Patient", 
        required: true
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    doctor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "MedicalStaff", 
        required: true
    },
    notes: { 
        type: String 
    },
    diagnosis: { 
        type: String 
    },
    treatment: { 
        type: String 
    },
    org_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Organization", 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model("Visit", VisitSchema);
