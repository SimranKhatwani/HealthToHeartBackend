const express = require('express')
const {createBloodEntry, getBloodEntries, updateBloodEntry, deleteBloodEntry, getBloodByType, createBloodRequest, getAllBloodRequests, deleteBloodRequest, createBloodDonation, getAllBloodDonations} = require('../controllers/BloodBankController');
const { verifyTokenUser } = require("../middleware/Verification")

const BloodBankRoutes = express.Router()

BloodBankRoutes.post("/create", verifyTokenUser, createBloodEntry)
BloodBankRoutes.get("/get-all", verifyTokenUser, getBloodEntries)
BloodBankRoutes.get("/get-by-type", verifyTokenUser, getBloodByType )
BloodBankRoutes.put("/update/:id",updateBloodEntry)
BloodBankRoutes.delete("/delete/:id", deleteBloodEntry)
BloodBankRoutes.post("/create-req", verifyTokenUser,  createBloodRequest)
BloodBankRoutes.get("/get-all-req", verifyTokenUser, getAllBloodRequests)
BloodBankRoutes.delete("/delete-req/:id", deleteBloodRequest)
BloodBankRoutes.post("/create-blood-donation", verifyTokenUser, createBloodDonation)
BloodBankRoutes.get("/get-all-donation", verifyTokenUser, getAllBloodDonations)

module.exports = BloodBankRoutes