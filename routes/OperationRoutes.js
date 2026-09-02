const express = require('express')
const {createOperation,getAllOperations, getOperationById, updateOperation, deleteOperation} = require("../controllers/OperationController")
const { verifyTokenUser } = require("../middleware/Verification")

const OperationRoutes = express.Router()

OperationRoutes.post("/create-operation", verifyTokenUser, createOperation)
OperationRoutes.get("/get-all-operation", verifyTokenUser, getAllOperations)
OperationRoutes.get("/get-operation/:id",getOperationById)
OperationRoutes.put("/update-operation/:id",updateOperation)
OperationRoutes.delete("/delete-operation/:id", deleteOperation)

module.exports = OperationRoutes