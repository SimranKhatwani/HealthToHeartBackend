const express = require('express')
const {createDoctor, getDoctors, updateDoctor, DeleteDoctor} = require('../controllers/DoctorController')

const DoctorRoutes = express.Router()

DoctorRoutes.post("/create-doctor", createDoctor)
DoctorRoutes.get("/get-doctors",getDoctors)
DoctorRoutes.put("/update-doctor/:id",updateDoctor)
DoctorRoutes.delete("/delete-doctor/:id", DeleteDoctor)
module.exports = DoctorRoutes