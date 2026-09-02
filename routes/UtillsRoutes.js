const express = require('express')
const { fetchLoggedInUser } = require('../utils/auth')

const UtillsRoutes = express.Router()

UtillsRoutes.get("/user-details",fetchLoggedInUser)


module.exports = UtillsRoutes