const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportName: {
        type: String,
        required: true
    },
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    period: {
        type: String,
        required: true
    },
    generatedDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["Completed", "Processing", "Scheduled", "Active", "Paused", "Failed"],
        default: "Processing"
    },
    reportFormat: {  
        type: String,
        enum: ["pdf", "excel"],
        default: "pdf"
    },
    duration: {
        type: String,
        enum: ["yearly", "quarterly", "monthly"],
        default: "monthly"
    },
    recipients: {
        type: Number,
    },
    schedule:{
        type: String,
    },
    nextRun:{
        type: String,
    },
    type: {
        type: String,
        enum: ["financial", "operational", "clinical", "scheduled"],
        default: "financial"
    }
}, { timestamps: true });

module.exports = mongoose.model("Reports", reportSchema);
