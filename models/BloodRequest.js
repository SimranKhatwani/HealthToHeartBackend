const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  patient_details: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  unitsRequested: { type: Number, required: true },
  requestDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'fulfilled', 'rejected'], default: 'pending' },
  urgency:{ type: String, enum: ['critical', 'urgent', 'normal'], default: 'normal'},
  contact: { type: String, required: true },
});

module.exports  = mongoose.model('BloodRequest', bloodRequestSchema);
