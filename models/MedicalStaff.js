const mongoose = require("mongoose");
const Organization = require("./Organization");
const Role = require("./Role");
const Education = require("./Education");
const Experience = require("./Experience");
const Schedule = require("./Schedule");
const shortUUID = require("short-uuid");

// Short UUID Generator
const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
const generateShortId = (roleName) => {
  const prefixMap = {
    Doctor: "DOC",
    Nurse: "NUR",
    WardBoy: "WRD",
    Staff: "STF",
  };

  const prefix = prefixMap[roleName] || "GEN"; // Default to "GEN" if role is unknown
  return `${prefix}-${translator.generate().slice(0, 3)}`;
};

// Define Schema
  const MedicalStaffSchema = new mongoose.Schema(
    {
      id: { type: String, unique: true },
      prefix: { type: String },
      first_name: { type: String },
      last_name: { type: String },
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      phone: { type: String },
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      avatar: {
        data: Buffer,
        contentType: String,
      },
      joinDate: { type: Date, default: Date.now },
      status: { type: String, enum: ["active", "on-leave", "resigned"], default: "active" },
      password: { type: String, required: true },
      previewPassword: { type: String },

      // Organization & Role
      org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
      role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },

      // Medical or Non-Medical Category
      category: { type: String, enum: ["Medical", "NonMedical"], required: true },

      // References for Education & Experience (Only for Medical Staff)
      education: [{ type: mongoose.Schema.Types.ObjectId, ref: "Education" }],  // Multiple education records
      experience: [{ type: mongoose.Schema.Types.ObjectId, ref: "Experience" }] , // Multiple experience records

      // Additional Fields
      description: { type: String },
      specialization: { type: String }, // Only for Medical Staff
      department: { type: String },
      experienceYears: { type: Number },
      availability: { type: Boolean, default: false },
      schedule: [{ type: mongoose.Schema.Types.ObjectId, ref: "Schedule" }],
    },
    { timestamps: true }
  );

// Middleware to Generate ID Before Saving
MedicalStaffSchema.pre("save", async function (next) {
  if (!this.id) {
    const role = await mongoose.model("Role").findById(this.role_id);
    this.id = generateShortId(role.role_name);
  }
  next();
});

module.exports = mongoose.model("MedicalStaff", MedicalStaffSchema);
