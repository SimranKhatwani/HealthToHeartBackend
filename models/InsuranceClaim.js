const mongoose = require("mongoose");
const shortUUID = require("short-uuid");

const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
const generateShortId = () => `CLM-${translator.generate().slice(0, 5)}`;

const InsuranceClaimSchema = new mongoose.Schema(
  {
    id:{
        type: String, 
        unique: true, 
        default: generateShortId 
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InsuranceProvider",
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    submissionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
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
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InsuranceClaim", InsuranceClaimSchema);
