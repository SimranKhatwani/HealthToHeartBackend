/**
 * ABDM (Ayushman Bharat Digital Mission) Configuration Module
 * 
 * Manages configuration and environment variables for ABDM/ABHA integration.
 * IMPORTANT: All credentials must be provided via backend environment variables.
 * Never hardcode credentials, and never log secrets or tokens.
 * 
 * Note: ABDM Sandbox registration is currently pending approval.
 * Values default to safe unconfigured states until official credentials are provided.
 */

require("dotenv").config();

/**
 * Returns the current ABDM configuration from environment variables.
 * Does not expose raw secrets in logs or unhandled exceptions.
 * 
 * @returns {Object} ABDM configuration object
 */
const getAbdmConfig = () => {
    return {
        // ABDM Gateway Base URL (Sandbox default: https://dev.abdm.gov.in)
        gatewayBaseUrl: process.env.ABDM_GATEWAY_URL || "https://dev.abdm.gov.in",

        // Client ID issued by the ABDM Developer Portal
        clientId: process.env.ABDM_CLIENT_ID || null,

        // Client Secret issued by the ABDM Developer Portal (must remain server-side only)
        clientSecret: process.env.ABDM_CLIENT_SECRET || null,

        // Consent Manager ID (typically 'sbx' for sandbox environment)
        cmId: process.env.ABDM_X_CM_ID || "sbx",

        // HTTP request timeout in milliseconds for gateway communication
        requestTimeoutMs: parseInt(process.env.ABDM_REQUEST_TIMEOUT_MS, 10) || 15000,

        // Session TTL in seconds for ephemeral verification tracking (default: 15 minutes)
        sessionTtlSeconds: parseInt(process.env.ABDM_SESSION_TTL_SECONDS, 10) || 900,

        // Sandbox mode flag
        isSandbox: process.env.NODE_ENV !== "production"
    };
};

/**
 * Validates the ABDM configuration without leaking secret values.
 * 
 * @returns {{ isValid: boolean, missingKeys: string[], status: string }} Validation result
 */
const validateAbdmConfig = () => {
    const missingKeys = [];

    if (!process.env.ABDM_CLIENT_ID) {
        missingKeys.push("ABDM_CLIENT_ID");
    }
    if (!process.env.ABDM_CLIENT_SECRET) {
        missingKeys.push("ABDM_CLIENT_SECRET");
    }
    if (!process.env.ABDM_GATEWAY_URL) {
        missingKeys.push("ABDM_GATEWAY_URL");
    }

    const isValid = missingKeys.length === 0;

    return {
        isValid,
        missingKeys,
        status: isValid 
            ? "CONFIGURED" 
            : "PENDING_APPROVAL_OR_UNCONFIGURED"
    };
};

/**
 * Checks whether ABDM sandbox credentials have been configured.
 * 
 * @returns {boolean} True if all mandatory gateway credentials exist
 */
const isAbdmConfigured = () => {
    return Boolean(
        process.env.ABDM_CLIENT_ID && 
        process.env.ABDM_CLIENT_SECRET && 
        process.env.ABDM_GATEWAY_URL
    );
};

module.exports = {
    getAbdmConfig,
    validateAbdmConfig,
    isAbdmConfigured
};
