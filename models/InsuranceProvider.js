const mongoose = require("mongoose");


const shortUUID = require("short-uuid");

const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
const generateShortId = () => `PVD-${translator.generate().slice(0, 5)}`;

const InsuranceProviderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: generateShortId
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Government", "Private", "Cooperative"],
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    patientsCount: {
      type: Number,
      default: 0,
    },
    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    governmentId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InsuranceProvider", InsuranceProviderSchema);
