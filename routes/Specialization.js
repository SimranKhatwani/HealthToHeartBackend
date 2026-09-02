const express = require('express')

const {createSpecialization, getSpecialization, updateSpecialization, deleteSpecialization} = require('../controllers/Specialization')

const SpecializationRoutes = express.Router()

SpecializationRoutes.post("/create-specialization",createSpecialization)
SpecializationRoutes.get("/get-specialization", getSpecialization)
SpecializationRoutes.put("/update-specialization/:id",updateSpecialization)
SpecializationRoutes.delete("/delete-specialization/:id", deleteSpecialization)


module.exports = SpecializationRoutes