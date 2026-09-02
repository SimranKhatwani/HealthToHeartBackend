const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const SuperAdminSchema = new mongoose.Schema({
    user_id: { type: String, default: uuidv4, unique: true },
    avatar: {
        data: Buffer,
        contentType: String,
    },
    name: {
        type: String,
        required: true
    },
    first_name: { type: String, required: true },
    last_name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    previewPassword: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    org_id: { type: String, ref: 'Organization' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    joinDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('SuperAdmin', SuperAdminSchema);
