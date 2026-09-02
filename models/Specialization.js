const mongoose = require('mongoose');
const shortUUID = require("short-uuid");

const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
const generateShortId = () => `SPECIALIZATION-${translator.generate().slice(0, 5)}`;

const SpecializationSchema = new mongoose.Schema({
    specializationId: { 
        type: String, 
        unique: true, 
        default: generateShortId // ✅ Ensure this function runs correctly
    },
    specialization_name: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Specialization', SpecializationSchema);
