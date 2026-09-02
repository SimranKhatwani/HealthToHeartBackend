const express = require('express')
const {createMealPlan, getMealPlans, deleteMealPlan, editMealPlan, createMealPlansToPatients, getMealPlansToPatients, editMealPlansToPatients, deleteAssignedMealPlan} = require('../controllers/MealsControllers')
const { verifyTokenUser } = require("../middleware/Verification")

const MealPlansRoutes = express.Router()

MealPlansRoutes.post("/create", verifyTokenUser, createMealPlan )
MealPlansRoutes.get("/get-all", verifyTokenUser, getMealPlans)
MealPlansRoutes.delete("/delete/:id", deleteMealPlan)
MealPlansRoutes.put("/edit/:id", editMealPlan)
MealPlansRoutes.post("/create-patient-meal", verifyTokenUser, createMealPlansToPatients)
MealPlansRoutes.get("/get-patient-meal", verifyTokenUser, getMealPlansToPatients)
MealPlansRoutes.put("/edit-assign-meal/:id", verifyTokenUser, editMealPlansToPatients)
MealPlansRoutes.delete("/delete-assign-plan/:id", deleteAssignedMealPlan)


module.exports = MealPlansRoutes