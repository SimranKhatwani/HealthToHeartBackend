

const abdmGatewayService = require("../services/abdmGatewayService");
const AbhaVerificationSession = require("../models/AbhaVerificationSession");
const patientLinkingService = require("../services/patientLinkingService");

/**
 * 1. Search for an existing ABHA account
 * Mapped to: POST v1/search/searchByHealthId
 */
const searchAccount = async (req, res) => {
    try {
        const { healthId } = req.body;

        if (!healthId || typeof healthId !== "string" || !healthId.trim()) {
            return res.status(400).json({
                success: false,
                message: "A non-empty healthId (ABHA address or ABHA number) is required."
            });
        }

        const gatewayResult = await abdmGatewayService.searchByHealthId({ healthId: healthId.trim() });

        if (!gatewayResult.success) {
            return res.status(502).json(gatewayResult);
        }

        return res.status(200).json({
            success: true,
            message: "ABHA account found",
            data: gatewayResult.data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error while searching ABHA account",
            error: error.message
        });
    }
};

/**
 * 2. Initiate ABHA Authentication (Request OTP)
 * Mapped to: POST v1/auth/init
 */
const initiateAuth = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const staffId = req.user._id;
        const { healthid, authMethod = "MOBILE_OTP" } = req.body;

        if (!org_id) {
            return res.status(403).json({
                success: false,
                message: "User is not associated with an authorized hospital organization."
            });
        }

        if (!healthid || typeof healthid !== "string" || !healthid.trim()) {
            return res.status(400).json({
                success: false,
                message: "A non-empty healthid (ABHA identifier) is required."
            });
        }

        const gatewayResult = await abdmGatewayService.initAuth({
            authMethod,
            healthid: healthid.trim()
        });

        if (!gatewayResult.success) {
            return res.status(502).json(gatewayResult);
        }

        const transactionId = gatewayResult.data?.transactionId || gatewayResult.data?.txnId;

        if (!transactionId) {
            return res.status(502).json({
                success: false,
                message: "Gateway did not return a valid transaction reference.",
                details: gatewayResult.data
            });
        }

        // Create an ephemeral tracking session in MongoDB
        const session = new AbhaVerificationSession({
            org_id,
            initiatedBy: staffId,
            transactionId,
            abhaIdentifier: healthid.trim(),
            authMode,
            status: "OTP_SENT"
        });

        await session.save();

        return res.status(200).json({
            success: true,
            message: `Authentication initiated via ${authMethod}. OTP sent to patient mobile.`,
            transactionId,
            authMode,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error while initiating ABHA authentication",
            error: error.message
        });
    }
};

/**
 * 3. Confirm Mobile OTP
 * Mapped to: POST v1/auth/confirmWithMobileOTP
 * SECURITY: OTP is not logged.
 */
const confirmMobileOTP = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const { transactionId, otp } = req.body;

        if (!transactionId || !otp) {
            return res.status(400).json({
                success: false,
                message: "transactionId and otp are required."
            });
        }

        // Verify session belongs to the requesting staff's organization
        const session = await AbhaVerificationSession.findOne({
            transactionId: transactionId.trim(),
            org_id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Verification session not found or has expired."
            });
        }

        if (session.status === "EXPIRED" || session.status === "FAILED") {
            return res.status(400).json({
                success: false,
                message: `Session is in ${session.status} state. Please re-initiate authentication.`
            });
        }

        // Forward OTP to official gateway (never logged)
        const gatewayResult = await abdmGatewayService.confirmWithMobileOTP({
            transactionId: transactionId.trim(),
            otp: String(otp).trim()
        });

        if (!gatewayResult.success) {
            session.status = "FAILED";
            session.failureReason = gatewayResult.error?.message || "OTP verification failed at gateway";
            await session.save();
            return res.status(400).json(gatewayResult);
        }

        const userToken = gatewayResult.data?.token;

        if (!userToken) {
            session.status = "FAILED";
            session.failureReason = "Gateway did not return an authorization token";
            await session.save();
            return res.status(502).json({
                success: false,
                message: "Gateway did not return an authorization token post-OTP.",
                details: gatewayResult.data
            });
        }

        // Save token to session and attempt profile retrieval
        session.userAuthToken = userToken;
        session.status = "VERIFIED";

        // Fetch authorized demographic profile using X-Token
        const profileResult = await abdmGatewayService.getAccountProfile({ userToken });

        let matchingPatients = [];
        if (profileResult.success && profileResult.data) {
            session.verifiedProfile = profileResult.data;
            // Search candidate matching hospital records within organization (Read-Only)
            matchingPatients = await patientLinkingService.findCandidateMatches({
                org_id,
                verifiedProfile: profileResult.data
            });
        }

        await session.save();

        return res.status(200).json({
            success: true,
            message: "Mobile OTP verified successfully.",
            transactionId: session.transactionId,
            profile: session.verifiedProfile || null,
            matchingPatients
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error while confirming Mobile OTP",
            error: error.message
        });
    }
};

/**
 * 4. Confirm Aadhaar OTP
 * Mapped to: POST v1/auth/confirmWithAadhaarOtp
 * SECURITY: OTP is not logged.
 */
const confirmAadhaarOtp = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const { transactionId, otp } = req.body;

        if (!transactionId || !otp) {
            return res.status(400).json({
                success: false,
                message: "transactionId and otp are required."
            });
        }

        const session = await AbhaVerificationSession.findOne({
            transactionId: transactionId.trim(),
            org_id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Verification session not found or has expired."
            });
        }

        const gatewayResult = await abdmGatewayService.confirmWithAadhaarOtp({
            transactionId: transactionId.trim(),
            otp: String(otp).trim()
        });

        if (!gatewayResult.success) {
            session.status = "FAILED";
            session.failureReason = gatewayResult.error?.message || "Aadhaar OTP verification failed at gateway";
            await session.save();
            return res.status(400).json(gatewayResult);
        }

        const userToken = gatewayResult.data?.token;

        if (!userToken) {
            session.status = "FAILED";
            session.failureReason = "Gateway did not return an authorization token";
            await session.save();
            return res.status(502).json({
                success: false,
                message: "Gateway did not return an authorization token post-OTP.",
                details: gatewayResult.data
            });
        }

        session.userAuthToken = userToken;
        session.status = "VERIFIED";

        const profileResult = await abdmGatewayService.getAccountProfile({ userToken });

        let matchingPatients = [];
        if (profileResult.success && profileResult.data) {
            session.verifiedProfile = profileResult.data;
            matchingPatients = await patientLinkingService.findCandidateMatches({
                org_id,
                verifiedProfile: profileResult.data
            });
        }

        await session.save();

        return res.status(200).json({
            success: true,
            message: "Aadhaar OTP verified successfully.",
            transactionId: session.transactionId,
            profile: session.verifiedProfile || null,
            matchingPatients
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error while confirming Aadhaar OTP",
            error: error.message
        });
    }
};

/**
 * 5. Retrieve Profile after Successful Authorization
 * Mapped to: GET v1/account/profile
 */
const getProfile = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: "transactionId parameter is required."
            });
        }

        const session = await AbhaVerificationSession.findOne({
            transactionId: transactionId.trim(),
            org_id
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Verification session not found or expired."
            });
        }

        if (session.status !== "VERIFIED" || !session.userAuthToken) {
            return res.status(403).json({
                success: false,
                message: "Access Denied: Patient identity has not been successfully authenticated."
            });
        }

        // If profile was already fetched and cached in session
        if (session.verifiedProfile) {
            const matchingPatients = await patientLinkingService.findCandidateMatches({
                org_id,
                verifiedProfile: session.verifiedProfile
            });

            return res.status(200).json({
                success: true,
                profile: session.verifiedProfile,
                matchingPatients
            });
        }

        // Fetch fresh profile from gateway using stored X-Token
        const gatewayResult = await abdmGatewayService.getAccountProfile({
            userToken: session.userAuthToken
        });

        if (!gatewayResult.success) {
            return res.status(502).json(gatewayResult);
        }

        session.verifiedProfile = gatewayResult.data;
        await session.save();

        const matchingPatients = await patientLinkingService.findCandidateMatches({
            org_id,
            verifiedProfile: gatewayResult.data
        });

        return res.status(200).json({
            success: true,
            profile: session.verifiedProfile,
            matchingPatients
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error while retrieving ABHA profile",
            error: error.message
        });
    }
};

/**
 * 6. Obtain Public Certificate
 * Mapped to: GET v1/auth/cert
 */
const getPublicCert = async (req, res) => {
    try {
        const gatewayResult = await abdmGatewayService.getAuthCert();

        if (!gatewayResult.success) {
            return res.status(502).json(gatewayResult);
        }

        return res.status(200).json({
            success: true,
            certificate: gatewayResult.data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching public certificate",
            error: error.message
        });
    }
};

/**
 * Check Verification Session Status
 */
const getSessionStatus = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const { transactionId } = req.params;

        const session = await AbhaVerificationSession.findOne({
            transactionId: transactionId.trim(),
            org_id
        }).select("-userAuthToken");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Verification session not found or expired."
            });
        }

        return res.status(200).json({
            success: true,
            session
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error while checking session status",
            error: error.message
        });
    }
};

module.exports = {
    searchAccount,
    initiateAuth,
    confirmMobileOTP,
    confirmAadhaarOtp,
    getProfile,
    getPublicCert,
    getSessionStatus
};
