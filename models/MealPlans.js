const mongoose = require("mongoose");
const shortUUID = require("short-uuid");

const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");

// Function to generate unique ID based on meal plan name
const generateShortId = (mealPlanName) => {
    const prefixMap = {
        "Standard Diet": "STD",
        "Low Sodium": "LSD",
        "Diabetic Diet": "DBT",
        "Liquid Diet": "LQD",
        "High Protein": "HPT",
        "Basic Diet": "BSC"
    };

    const prefix = prefixMap[mealPlanName] || "GEN"; 
    return `${prefix}-${translator.generate().slice(0, 6)}`; 
};

// Meal Plan Schema
const MealPlanSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    mealPlanId: {
        type: String,
        unique: true, 
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["Special", "Regular", "Super Special", "Basic"],
        default: "Basic",
        required: true,
    },
    calories: {
        type: Number,
        required: true,
    },
    costPerDay: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
        required: true,
    },
});

MealPlanSchema.pre("save", function (next) {
    if (!this.mealPlanId) {
        this.mealPlanId = generateShortId(this.name);
    }
    next();
});

module.exports = mongoose.model("MealPlan", MealPlanSchema);
