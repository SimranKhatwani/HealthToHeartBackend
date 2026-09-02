const express = require('express')
const { checkDrugInteractions } = require('../controllers/GenAiControllers')

const GenAiRotes = express.Router()

GenAiRotes.post("/checkDrugInteractions",checkDrugInteractions)
module.exports = GenAiRotes