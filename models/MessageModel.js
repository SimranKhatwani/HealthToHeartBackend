const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    sender: {
        type: String,
        required:true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient", 
        required: true
    },      
    subject: {
        type: String,
    },
    message: {
        type: String,
        required:true
    },
    status: {
        type: String,
        default:"unread"
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Messages', messageSchema);
