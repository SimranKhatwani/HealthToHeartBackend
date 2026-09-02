const mongoose = require('mongoose');

const bloodDonationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  unitsDonated: { type: Number, required: true },
  donationDate: { type: Date, default: Date.now },
  contact: { type: String, required: true },
  hospital: { type: String, required: true }
});

module.exports = mongoose.model('BloodDonations', bloodDonationSchema);
