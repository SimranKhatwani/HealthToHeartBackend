const mongoose = require("mongoose");

const PharmacySchema = new mongoose.Schema({
    org_id: { type: String, ref: 'Organization', required: true },
    pharmacistDetails: { type: mongoose.Schema.Types.ObjectId, ref: "GeneralStaff"},
    medicines: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true },
          stock: { type: Number, required: true, min: 0 },
          type:{type:String, enum: ["Antibiotics", "Analgesics", "Antivirals", "Antifungals", "Antidepressants", "Diabetes", "Cardiovascular", "Antihypertensives", "other"]},
          mfgDate: { type: Date, required: true },
          expiryDate: { type: Date, required: true },
        },
    ],
    
})

module.exports = mongoose.model("Pharmacy", PharmacySchema)