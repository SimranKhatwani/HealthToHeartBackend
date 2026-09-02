const mongoose = require("mongoose");
const shortUUID = require("short-uuid");
const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");

// Function to generate ID based on role
const generateShortId = (roleName) => {
    
    const prefix = "PAT"; // Default to "GEN"
    return `${prefix}-${translator.generate().slice(0, 5)}`;
};
const PatientSchema = new mongoose.Schema({
    id: { type: String, default: generateShortId },
    org_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Organization', 
        required: true 
    }, // Multi-tenant support

    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    
   
    address: { type: String, required: true },

    patientType: { 
        type: String, 
        enum: ["OPD", "IPD", "Emergency", "Walk-in", "Telemedicine", "Online"], 
        required: true 
    },    

    doctorAssigned: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "MedicalStaff",
        required: true
    },

    bloodGroup: { type: String },
    
    visitDates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Visit"
    }], // Tracks multiple visits

    lastVisit: { type: Date }, // Stores the most recent visit date

    consultationFees: [{
        amount: Number,
        date: { type: Date, default: Date.now },
        paymentMethod: { type: String, enum: ["Cash", "Card", "Insurance"] },
        transactionId: String
    }], 

    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Room" 
    }, 
    medicalHistory: [{
        visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit" }, // Links each record to a visit
        diagnosis: String,
        treatment: String,
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff" },
        date: { type: Date, default: Date.now }
    }],

    prescriptions: [{ 
        visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit" },
        prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" } 
    }], // Prescriptions linked to visits

    appointments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Appointment" 
    }],

    emergencyContact: {
        name: String,
        relation: String,
        phone: String
    },

    insuranceDetails: {
        provider: String,
        policyNumber: String,
        expiryDate: Date
    },
    labTests: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "LabTest" 
    }],

    paymentDetails: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Payment"
    },

    guardianDetails: {
        name: String,
        relation: String,
        phone: String
    }, // Useful for minors

    status: {
        type: String,
        enum: ["Admitted", "Discharged", "Deceased", "InConsultation", ""],
        default: "InConsultation"
    },
    admitDetails: [{ 
        date: { type: Date, default: Date.now },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff" },
        reason: { type: String },
        medications: [{
            medication: { type: String },
            date: { type: Date, default: Date.now }
        }],
        discharge: { type: Boolean, default: false }
     }],

    dischargeDetails: {
        date: { type: Date },
        reason: { type: String }
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages"
    }],
    createdBy: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("Patient", PatientSchema);
