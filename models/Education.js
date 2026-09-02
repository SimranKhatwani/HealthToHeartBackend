const mongoose = require("mongoose");

const EducationSchema = new mongoose.Schema(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalStaff" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Education", EducationSchema);
