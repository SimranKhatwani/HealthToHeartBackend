const mongoose = require("mongoose");
const { getAbdmConfig } = require("../config/abdmConfig");



const AbhaVerificationSessionSchema = new mongoose.Schema(
    {
        // Multi-tenant organization isolation (Hospital / Clinic ID)
        org_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        // Hospital staff member who initiated the verification request
        initiatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicalStaff",
            required: true,
        },

        // Unique gateway transaction identifier returned by official ABDM API
        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Target ABHA Identifier being verified (ABHA number or ABHA address)
        abhaIdentifier: {
            type: String,
            required: true,
        },

        // Authentication mode requested
        authMode: {
            type: String,
            enum: ["MOBILE_OTP", "AADHAAR_OTP", "DEMOGRAPHIC", "PASSWORD"],
            default: "MOBILE_OTP",
            required: true,
        },

        // Current status of the verification lifecycle
        status: {
            type: String,
            enum: ["INITIATED", "OTP_SENT", "VERIFIED", "LINKED", "EXPIRED", "FAILED"],
            default: "INITIATED",
            index: true,
        },

        // Masked mobile or communication channel returned by ABDM (e.g., '******3210')
        maskedContact: {
            type: String,
            default: null,
        },

        // Ephemeral demographic profile returned by official ABDM gateway upon successful verification
        // Stored only temporarily until staff links the profile to a patient record or session expires
        verifiedProfile: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        // Reference to the hospital Patient document once successfully linked
        linkedPatientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            default: null,
        },

        // Error message or failure description if gateway verification fails
        failureReason: {
            type: String,
            default: null,
        },

        // Expiry timestamp for session. Managed via MongoDB TTL index below.
        expiresAt: {
            type: Date,
            required: true,
            default: () => {
                const config = getAbdmConfig();
                return new Date(Date.now() + config.sessionTtlSeconds * 1000);
            },
        },
    },
    {
        timestamps: true,
    }
);

/**
 * MongoDB TTL Index:
 * Automatically deletes the session document from MongoDB when current time exceeds `expiresAt`.
 * Ensures stale sessions and temporary verification tokens are not stored indefinitely.
 */
AbhaVerificationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index to quickly look up active sessions by organization and transaction
AbhaVerificationSessionSchema.index({ org_id: 1, transactionId: 1 });

module.exports = mongoose.model("AbhaVerificationSession", AbhaVerificationSessionSchema);
