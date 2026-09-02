const express = require('express');
const {
    createPharmacy
} = require('../controllers/PharmacyController');
const {verifyTokenUser} = require('../middleware/Verification')

const PharmacyRoutes = express.Router();

PharmacyRoutes.post('/create', verifyTokenUser, createPharmacy);

module.exports = PharmacyRoutes;
