const mongoose = require("mongoose");

const AmbulanceSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }, 
  vehicleNumber: { type: String, required: true, unique: true }, 
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "GeneralStaff", required: true },
  type: { 
    type: String, 
    enum: ["Basic Life Support", "Advanced Life Support", "Neonatal Ambulance", "Air Ambulance", "Mortuary"], 
    required: true 
  }, 
  availabilityStatus: { 
    type: String, 
    enum: ["Available", "On Duty", "Out of Service"], 
    default: "Available" 
  }, 
  location: {
    latitude: { type: Number, required: true }, 
    longitude: { type: Number, required: true } 
  }, 
  contactNumber: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now } 
});

module.exports = mongoose.model("Ambulance", AmbulanceSchema);
