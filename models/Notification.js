const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    sender: {
        type: String,
        required:true
    },
    receiver:{
        type:[String],
        required:true
    },
    message: {
        type: String,
        required:true
    },
    notDesc:{
        type: String,
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Notifications', notificationSchema);
