const express = require('express')
const {createBilling} = require('../controllers/BillingController')

const BillingRoutes = express.Router()

BillingRoutes.post("/", createBilling)
// BillingRoutes.get("/",getDoctors)
// BillingRoutes.put("/update-bill/:id",updateDoctor)
// BillingRoutes.delete("/delete-bill/:id", DeleteDoctor)

module.exports = BillingRoutes