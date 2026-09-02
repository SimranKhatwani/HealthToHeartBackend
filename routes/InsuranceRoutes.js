const express = require("express");
const InsuranceRoutes = express.Router();
const insuranceProviderController = require("../controllers/insuranceProviderController");
const insuranceClaimController = require("../controllers/insuranceClaimController");
const { verifyTokenUser } = require("../middleware/Verification");

//  Insurance Providers
InsuranceRoutes.post("/providers", verifyTokenUser, insuranceProviderController.createInsuranceProvider);
InsuranceRoutes.get("/providers", verifyTokenUser, insuranceProviderController.getAllInsuranceProviders);
InsuranceRoutes.get("/providers/:id", verifyTokenUser, insuranceProviderController.getInsuranceProviderById);
InsuranceRoutes.put("/providers/:id", verifyTokenUser, insuranceProviderController.updateInsuranceProvider);
InsuranceRoutes.delete("/providers/:id", verifyTokenUser, insuranceProviderController.deleteInsuranceProvider);

//  Insurance Claims
InsuranceRoutes.post("/claims", verifyTokenUser, insuranceClaimController.createInsuranceClaim);
InsuranceRoutes.get("/claims", verifyTokenUser, insuranceClaimController.getAllInsuranceClaims);
InsuranceRoutes.get("/claims/:id", verifyTokenUser, insuranceClaimController.getInsuranceClaimById);
InsuranceRoutes.put("/claims/:id", verifyTokenUser, insuranceClaimController.updateInsuranceClaim);
InsuranceRoutes.delete("/claims/:id", verifyTokenUser, insuranceClaimController.deleteInsuranceClaim);

module.exports = InsuranceRoutes;
