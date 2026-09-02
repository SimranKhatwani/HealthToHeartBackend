const mongoose = require("mongoose")
const shortUUID = require("short-uuid");

const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
const generateShortId = () => `TRN-${translator.generate().slice(0, 5)}`;
const PaymentSchema = new mongoose.Schema({
    PaymentId: { type: String, unique: true, default: generateShortId },
    
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    amountPaid: { type: Number, required: true },
    currency:{
        type:String,
        required:true,
        enum: ['euro', 'usd', 'dollar', "inr"]
    },
    transactionDate: { type: Date, default: Date.now },
    created_by: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);


