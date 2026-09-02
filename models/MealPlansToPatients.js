const mongoose = require("mongoose");

const MealPlansToPatientsSchema = new mongoose.Schema({
  org_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  patientDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  MealPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealPlan",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
    required: true,
  },
  billingStatus: {
    type: String,
    enum: ["Billed", "Pending", "Paid", "Not Billed"],
    default: "Not Billed",
    required: true,
  },
  payAmount: {
    type: Number,
    default: 0,
  },
  invoiceDate: {
    type: Date,
  },
});

module.exports = mongoose.model("MealPlansToPatients", MealPlansToPatientsSchema);
