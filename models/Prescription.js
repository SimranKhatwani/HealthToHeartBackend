const mongoose = require('mongoose');
const shortUUID = require("short-uuid");

const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
const generateShortId = () => `PVD-${translator.generate().slice(0, 3)}`;

//Stores doctor-prescribed medicines for patients.
const PrescriptionSchema = new mongoose.Schema(
  {
    // patient: { 
    //   name: { type: String, required: true },
    //   email: { type: String, required: true, unique: true },
    // }, 
    id:{
      type: String,
      unique: true,
      default: generateShortId
    },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStaff',
      required: true
    },
    prescription: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: Number, required: true },
        duration: { type: String, required: true },
        frequency: { type: String, required: true },
        quantity: { type: Number, required: true },
        instructions: { type: String },
      },
    ],

    diagnosis: { type: String, required: true },
    consultationDate: { type: Date, default: Date.now },
    notes: { type: String },

    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    date: { type: Date, default: Date.now },
    filled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', PrescriptionSchema);
