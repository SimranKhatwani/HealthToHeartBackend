const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        unique: true,
    },
    dueDate: { type: Date, required: true },
    PatientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: false },
    totalAmount: { type: Number, required: true },
    balance: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["Cash", "credit Card", "Debit Card", "Insurance"], required: false },
}, { timestamps: true });

BillingSchema.pre("save", async function (next) {
    const doc = this;

    // Only generate if it's a new document and paymentId is not already set
    if (doc.isNew && !doc.paymentId) {
        try {
            const count = await mongoose.model("Billing").countDocuments();
            const nextNumber = count + 1;
            const formattedNumber = String(nextNumber).padStart(3, "0");
            doc.paymentId = `PAY-${formattedNumber}`;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model("Billing", BillingSchema);
