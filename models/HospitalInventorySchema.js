const mongoose = require("mongoose");

// Counter schema to keep track of the auto-increment value
const counterSchema = new mongoose.Schema({
  category: { type: String, unique: true },
  seq: { type: Number, default: 1 }
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const HospitalInventorySchema = new mongoose.Schema({
  org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },
  inventoryId: { type: String, unique: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  minStock: { type: Number, required: true },
  unit: { type: String, required: true }, 
  category: { 
    type: String, 
    enum: ["Surgical Tools", "Medical Supplies", "PPE"], 
    default: "Medical Supplies" 
  },
  status: { 
    type: String, 
    enum: ["In Stock", "Low Stock", "Out of Stock"], 
    default: "Medical Supplies" 
  },
  price: { type: Number, required: true },
  supplier: { type: String, required: true }
}, { timestamps: true });

// Pre-save hook to generate custom ID
HospitalInventorySchema.pre("save", async function (next) {
  const doc = this;

  try {
    // Map categories to ID prefixes
    const categoryPrefixMap = {
      "Surgical Tools": "SUR",
      "Medical Supplies": "MED",
      "PPE": "PPE"
    };

    const prefix = categoryPrefixMap[doc.category] || "GEN";  // Fallback prefix

    // Find or create the counter for the current category
    const counter = await Counter.findOneAndUpdate(
      { category: doc.category },
      { $inc: { seq: 1 } },  // Increment the counter
      { new: true, upsert: true }
    );

    // Set the custom inventory ID
    doc.inventoryId = `${prefix}-${counter.seq.toString().padStart(2, "0")}`;
    next();
  } catch (error) {
    // console.error("Error generating custom ID:", error);
    next(error);
  }
});

module.exports =  mongoose.model("HospitalInventory", HospitalInventorySchema)
