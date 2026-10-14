/**
 * ABDM Gateway Service
 * 
 * Reusable internal service layer for communication with the official ABDM (Ayushman Bharat Digital Mission)
 * Gateway / Health ID v1 APIs.
 * 
 * FINALIZED API SCOPE (v1 Legacy Specification):
 * 1. v1/search/searchByHealthId    - Search for an existing ABHA account by Health ID / ABHA Address
 * 2. v1/auth/init                  - Initiate authentication (e.g., requesting Mobile or Aadhaar OTP)
 * 3. v1/auth/confirmWithMobileOTP  - Complete authentication by submitting Mobile OTP
 * 4. v1/auth/confirmWithAadhaarOtp - Alternative authentication by submitting Aadhaar OTP
 * 5. v1/account/profile            - Retrieve verified patient profile using the X-Token post-auth
 * 6. v1/auth/cert                  - Obtain the gateway public certificate for encryption flows
 * 
 * SECURITY & INTEGRITY CONSTRAINTS:
 * - Credentials and tokens are kept strictly server-side.
 * - OTP values are NEVER logged, printed, or persisted in application logs.
 * - When sandbox credentials are not configured in .env, live network calls are safely blocked.
 * - Does not invent fake patient data or simulate verification when sandbox is offline.
 */

const { getAbdmConfig, isAbdmConfigured } = require("../config/abdmConfig");

class AbdmGatewayService {
    constructor() {
        this.cachedGatewayToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Standardized error response formatter for ABDM gateway operations.
     * Sanitizes errors to prevent leaking API secrets, raw tokens, or stack traces.
     * 
     * @param {string} code - Internal machine-readable error code
     * @param {string} message - Safe user-facing message
     * @param {Object} [details] - Non-sensitive diagnostic details
     * @returns {Object} Structured error object
     */
    _createError(code, message, details = null) {
        return {
            success: false,
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
                ...(details ? { details } : {})
            }
        };
    }

    /**
     * Resolves the gateway endpoint URL for a given relative path.
     * 
     * @param {string} relativePath - Path such as 'v1/search/searchByHealthId'
     * @returns {string} Fully qualified gateway URL
     */
    _resolveUrl(relativePath) {
        const config = getAbdmConfig();
        const base = config.gatewayBaseUrl.replace(/\/+$/, "");
        const path = relativePath.replace(/^\/+/, "");
        return `${base}/${path}`;
    }

    /**
     * Obtains or refreshes the gateway session bearer token.
     * In the ABDM protocol, hospitals exchange client credentials (clientId, clientSecret)
     * at the session endpoint to obtain a short-lived Bearer token for gateway calls.
     * 
     * @returns {Promise<{ success: boolean, token?: string, error?: Object }>}
     */
    async getGatewaySessionToken() {
        if (!isAbdmConfigured()) {
            return this._createError(
                "ABDM_NOT_CONFIGURED",
                "ABDM Gateway credentials are not configured in environment variables. Live gateway calls are blocked pending sandbox approval."
            );
        }

        const now = Date.now();
        // Return cached token if valid with at least 60 seconds buffer
        if (this.cachedGatewayToken && this.tokenExpiresAt && (this.tokenExpiresAt - now > 60000)) {
            return { success: true, token: this.cachedGatewayToken };
        }

        const config = getAbdmConfig();
        const sessionUrl = this._resolveUrl("v1/sessions");

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

            const response = await fetch(sessionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    clientId: config.clientId,
                    clientSecret: config.clientSecret
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return this._createError(
                    "SESSION_TOKEN_FAILED",
                    `ABDM Gateway session token request failed with status ${response.status}`,
                    { status: response.status, details: errorData.message || errorData.error || null }
                );
            }

            const data = await response.json();
            const accessToken = data.accessToken || data.token;
            const expiresIn = data.expiresIn || 1200; // default 20 minutes if omitted

            if (!accessToken) {
                return this._createError(
                    "INVALID_SESSION_RESPONSE",
                    "Gateway session response did not include a valid access token."
                );
            }

            this.cachedGatewayToken = accessToken;
            this.tokenExpiresAt = Date.now() + (expiresIn * 1000);

            return { success: true, token: this.cachedGatewayToken };
        } catch (err) {
            if (err.name === "AbortError") {
                return this._createError(
                    "GATEWAY_TIMEOUT",
                    `Gateway session token request timed out after ${config.requestTimeoutMs}ms`
                );
            }
            return this._createError(
                "GATEWAY_NETWORK_ERROR",
                "Failed to communicate with ABDM Gateway session endpoint.",
                { message: err.message }
            );
        }
    }

    /**
     * Internal HTTP executor for ABDM v1 endpoints.
     * Handles auth headers, timeouts, and error normalization.
     * 
     * @private
     */
    async _executeRequest({ endpointPath, method, body = null, extraHeaders = {}, requiresAuth = true }) {
        if (!isAbdmConfigured()) {
            return this._createError(
                "ABDM_NOT_CONFIGURED",
                "ABDM Gateway credentials are not configured in environment variables. Live gateway calls are blocked pending sandbox approval."
            );
        }

        const config = getAbdmConfig();
        const targetUrl = this._resolveUrl(endpointPath);
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-CM-ID": config.cmId,
            ...extraHeaders
        };

        if (requiresAuth) {
            const tokenResult = await this.getGatewaySessionToken();
            if (!tokenResult.success) {
                return tokenResult;
            }
            headers["Authorization"] = `Bearer ${tokenResult.token}`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

            const options = {
                method,
                headers,
                signal: controller.signal
            };

            if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(targetUrl, options);
            clearTimeout(timeoutId);

            const isJson = response.headers.get("content-type")?.includes("application/json");
            const responseData = isJson ? await response.json() : await response.text();

            if (!response.ok) {
                return this._createError(
                    `GATEWAY_HTTP_${response.status}`,
                    `Gateway endpoint ${endpointPath} returned HTTP ${response.status}`,
                    {
                        status: response.status,
                        gatewayMessage: typeof responseData === "object" ? (responseData.message || responseData.error || responseData.details) : responseData
                    }
                );
            }

            return {
                success: true,
                data: responseData
            };
        } catch (err) {
            if (err.name === "AbortError") {
                return this._createError(
                    "GATEWAY_TIMEOUT",
                    `ABDM Gateway call to ${endpointPath} timed out after ${config.requestTimeoutMs}ms`
                );
            }
            return this._createError(
                "GATEWAY_CONNECTION_ERROR",
                `Failed to connect to ABDM Gateway at ${endpointPath}: ${err.message}`
            );
        }
    }

    // =========================================================================
    // FINALIZED API 1: v1/search/searchByHealthId
    // Purpose: Search for an existing ABHA account by Health ID or ABHA Address
    // =========================================================================
    async searchByHealthId({ healthId }) {
        if (!healthId || typeof healthId !== "string" || !healthId.trim()) {
            return this._createError("INVALID_HEALTH_ID", "A non-empty healthId parameter is required.");
        }

        return this._executeRequest({
            endpointPath: "v1/search/searchByHealthId",
            method: "POST",
            body: {
                healthId: healthId.trim()
            },
            requiresAuth: true
        });
    }

    // =========================================================================
    // FINALIZED API 2: v1/auth/init
    // Purpose: Start the supported authentication flow (requests OTP)
    // =========================================================================
    async initAuth({ authMethod, healthid }) {
        if (!healthid || typeof healthid !== "string" || !healthid.trim()) {
            return this._createError("INVALID_HEALTH_ID", "A non-empty healthid parameter is required.");
        }

        const validAuthMethods = ["MOBILE_OTP", "AADHAAR_OTP", "DEMOGRAPHIC", "PASSWORD"];
        const selectedMethod = authMethod || "MOBILE_OTP";

        if (!validAuthMethods.includes(selectedMethod)) {
            return this._createError(
                "INVALID_AUTH_METHOD",
                `Invalid authMethod: ${selectedMethod}. Must be one of: ${validAuthMethods.join(", ")}`
            );
        }

        return this._executeRequest({
            endpointPath: "v1/auth/init",
            method: "POST",
            body: {
                authMethod: selectedMethod,
                healthid: healthid.trim()
            },
            requiresAuth: true
        });
    }

    // =========================================================================
    // FINALIZED API 3: v1/auth/confirmWithMobileOTP
    // Purpose: Complete mobile OTP authentication
    // SECURITY: The otp parameter is NEVER logged.
    // =========================================================================
    async confirmWithMobileOTP({ transactionId, otp }) {
        if (!transactionId || typeof transactionId !== "string" || !transactionId.trim()) {
            return this._createError("INVALID_TRANSACTION_ID", "transactionId is required.");
        }

        if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
            return this._createError("INVALID_OTP_FORMAT", "OTP must be a 6-digit numeric string.");
        }

        return this._executeRequest({
            endpointPath: "v1/auth/confirmWithMobileOTP",
            method: "POST",
            body: {
                transactionId: transactionId.trim(),
                otp: String(otp).trim()
            },
            requiresAuth: true
        });
    }

    // =========================================================================
    // FINALIZED API 4: v1/auth/confirmWithAadhaarOtp
    // Purpose: Alternative Aadhaar OTP confirmation
    // SECURITY: The otp parameter is NEVER logged.
    // =========================================================================
    async confirmWithAadhaarOtp({ transactionId, otp }) {
        if (!transactionId || typeof transactionId !== "string" || !transactionId.trim()) {
            return this._createError("INVALID_TRANSACTION_ID", "transactionId is required.");
        }

        if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
            return this._createError("INVALID_OTP_FORMAT", "OTP must be a 6-digit numeric string.");
        }

        return this._executeRequest({
            endpointPath: "v1/auth/confirmWithAadhaarOtp",
            method: "POST",
            body: {
                transactionId: transactionId.trim(),
                otp: String(otp).trim()
            },
            requiresAuth: true
        });
    }

    // =========================================================================
    // FINALIZED API 5: v1/account/profile
    // Purpose: Retrieve profile information after successful authorization
    // Header requirement: X-Token (User authentication token returned post-OTP)
    // =========================================================================
    async getAccountProfile({ userToken }) {
        if (!userToken || typeof userToken !== "string" || !userToken.trim()) {
            return this._createError("INVALID_USER_TOKEN", "Valid user authorization token (X-Token) is required to fetch profile.");
        }

        const cleanToken = userToken.trim().replace(/^Bearer\s+/i, "");

        return this._executeRequest({
            endpointPath: "v1/account/profile",
            method: "GET",
            extraHeaders: {
                "X-Token": `Bearer ${cleanToken}`
            },
            requiresAuth: true
        });
    }

    // =========================================================================
    // FINALIZED API 6: v1/auth/cert
    // Purpose: Obtain the public certificate if required by authentication / encryption
    // =========================================================================
    async getAuthCert() {
        return this._executeRequest({
            endpointPath: "v1/auth/cert",
            method: "GET",
            requiresAuth: false // Public certificate endpoint does not strictly require user bearer token
        });
    }
}

// Export singleton instance of ABDM Gateway Service
module.exports = new AbdmGatewayService();
