const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  units: { type: Number, required: true, min: 0 }, 
  addedDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['available', 'low', 'out'], default: 'available' }
});

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);
