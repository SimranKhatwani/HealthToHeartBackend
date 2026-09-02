const mongoose = require("mongoose");

const ShiftSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalStaff",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    startTime: {
      type: String, // Storing as string ("HH:MM AM/PM") for simplicity
      required: true,
    },
    endTime: {
      type: String, // Storing as string ("HH:MM AM/PM")
      required: true,
    },
    type: {
      type: String,
      enum: ["Morning", "Day", "Evening", "Night"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // breakTime:{
    //         start: { type: Date },
    //         end: { type: Date }
    // },
    breakTime:{
      start: { type: String },
      end: { type: String }
},
    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shifts", ShiftSchema);