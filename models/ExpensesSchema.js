const mongoose = require("mongoose");
const shortUUID = require("short-uuid");

const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
const generateShortId = () => `EXP-${translator.generate().slice(0, 5)}`;
const ExpensesSchema = new mongoose.Schema({
    ExpenseId: { type: String, unique: true, default: generateShortId },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    category: { type: String, required: true },
    receipt: { type: String }, // URL to the receipt image
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    inventoryItem:{type: mongoose.Schema.Types.ObjectId, ref: "Inventory"},
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    supplier: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Expenses", ExpensesSchema);