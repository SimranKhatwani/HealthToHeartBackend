const express = require("express");
const { sendOtp, verifyOtp } = require("../controllers/otpController");

const otpRoutes = express.Router();

otpRoutes.post("/send-otp", sendOtp);
otpRoutes.post("/verify-otp", verifyOtp);

module.exports = otpRoutes;
