const express = require("express");
const abhaRoutes = express.Router();
const abhaController = require("../controllers/abhaController");
const { verifyTokenUser } = require("../middleware/Verification");



// 1. Search for existing ABHA account
abhaRoutes.post("/search", verifyTokenUser, abhaController.searchAccount);

// 2. Initiate authentication (sends OTP)
abhaRoutes.post("/auth/init", verifyTokenUser, abhaController.initiateAuth);

// 3. Confirm Mobile OTP
abhaRoutes.post("/auth/confirm-mobile-otp", verifyTokenUser, abhaController.confirmMobileOTP);

// 4. Confirm Aadhaar OTP
abhaRoutes.post("/auth/confirm-aadhaar-otp", verifyTokenUser, abhaController.confirmAadhaarOtp);

// 5. Retrieve patient profile post-authorization
abhaRoutes.get("/account/profile/:transactionId", verifyTokenUser, abhaController.getProfile);

// 6. Retrieve public certificate
abhaRoutes.get("/auth/cert", verifyTokenUser, abhaController.getPublicCert);

// 7. Check ephemeral session status
abhaRoutes.get("/session/:transactionId", verifyTokenUser, abhaController.getSessionStatus);

module.exports = abhaRoutes;
