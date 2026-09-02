const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
    InvoiceId: {
        type: String,
        unique: true,
    },
    BillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Billing"
    },
    status: { type: String, enum: ["Paid", "Pending", "overdue"], default: "Pending" },
}, {
    timestamps: true
});

// Auto-generate InvoiceId like INV-001
InvoiceSchema.pre("save", async function (next) {
    const doc = this;

    if (doc.isNew && !doc.InvoiceId) {
        try {
            const count = await mongoose.model("Invoice").countDocuments();
            const nextNumber = count + 1;
            const formattedNumber = String(nextNumber).padStart(3, "0");
            doc.InvoiceId = `INV-${formattedNumber}`;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
