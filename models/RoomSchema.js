const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    room_id: {
      type: String,
      unique: true,
    },
    room_number: {
      type: String,
      required: true,
    },
    room_name: {
      type: String,
    },
    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    bedsCount: {
      type: Number,
      default: 1,
      required: true,
    },
    occupiedBedsCount: {
      type: Number,
      default: 0,
    },
    roomType: {
      type: String,
      enum: [
        "Multi-Sharing Ward",
        "Semi-Private Room",
        "Private Room",
        "Deluxe Room",
        "Suite Room",
        "Junior Suite",
        "Super Deluxe Room",
        "ICU",
        "CCU",
        "Isolation Room",
        "Pediatric Room",
        "Maternity Room",
        "Recovery Room",
      ],
      required: true,
    },
    roomStatus: {
      type: String,
      enum: ["Available", "Occupied"],
      default: "Available",
    },
  },
  { timestamps: true }
);

// Auto-generate room_id before saving
RoomSchema.pre("save", async function (next) {
  if (!this.room_id && this.roomType) {
    // Convert room type to uppercase hyphenated format
    const typePrefix = this.roomType.substring(0, 3).toUpperCase();

    // Count existing rooms of same type
    const count = await mongoose.model("Room").countDocuments({ roomType: this.roomType });

    // Set room_id 
    this.room_id = `${typePrefix}-${(count + 1).toString().padStart(3, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Room", RoomSchema);
