const mongoose = require("mongoose");

const ExperienceSchema = new mongoose.Schema(
  {
    organization: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Experience", ExperienceSchema);
