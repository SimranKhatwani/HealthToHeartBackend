const express = require('express')
const {createInventoryItem, getAllInventoryItems, getInventoryItemById, updateInventoryItem, deleteInventoryItem} = require('../controllers/HospitalInventory')
const { verifyTokenUser } = require("../middleware/Verification")

const InventoryRoutes = express.Router()

InventoryRoutes.post("/create",verifyTokenUser, createInventoryItem )
InventoryRoutes.get("/get", verifyTokenUser, getAllInventoryItems)
InventoryRoutes.put("/update/:id", verifyTokenUser, updateInventoryItem)
InventoryRoutes.delete("/delete/:id", verifyTokenUser, deleteInventoryItem)

module.exports = InventoryRoutes