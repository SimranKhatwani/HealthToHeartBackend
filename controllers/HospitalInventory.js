const HospitalInventory = require("../models/HospitalInventorySchema");

// Create a new inventory item
const createInventoryItem = async (req, res) => {
  try {
    // const {org_id} = await getUserFromToken(req);
    const org_id = req.user.org_id || req.body.org_id;
    if (!org_id) return res.status(400).json({ success: false, message: "Organization ID is missing" });
    const { itemName, quantity, minStock, unit, category, price, supplier, status } = req.body;

    if (!itemName || !quantity || !unit || !category || !price || !supplier || !minStock || !status) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newItem = new HospitalInventory({
      itemName,
      quantity,
      unit,
      minStock,
      category,
      price,
      supplier,
      status,
      org_id
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: newItem
    });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get all inventory items with pagination and filtering
const getAllInventoryItems = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    // const {org_id} = await getUserFromToken(req);
    // const org_id = req.user.org_id;
    // console.log("org_id", org_id)
    // const { page = 1, limit = 10, category, supplier } = req.query;

    // const filter = {};
    // if (category) filter.category = category; 
    // if (supplier) filter.supplier = new RegExp(supplier, "i");  
    // if(org_id) filter.org_id = org_id

    const items = await HospitalInventory.find({org_id}).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      message: "Inventory items retrieved successfully",
      data: items
    });
  } catch (error) {
    // console.error("Error fetching inventory items:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

//   try {
    
//     const {org_id} = await getUserFromToken(req);
//     const { page = 1, limit = 10, category, supplier } = req.query;

//     const filter = {};
//     if (category) filter.category = category;  // Filter by category
//     if (supplier) filter.supplier = new RegExp(supplier, "i");  // Case-insensitive search
//     if(org_id) filter.org_id = org_id

//     const items = await HospitalInventory.find(filter)
//       .sort({ createdAt: -1 })     // Sort by newest first
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const total = await HospitalInventory.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       message: "Inventory items retrieved successfully",
//       data: items,
//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit)
//       }
//     });
//   } catch (error) {
//     // console.error("Error fetching inventory items:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// Get a single inventory item by ID
const getInventoryItemById = async (req, res) => {
  try {
    
    const { id } = req.params;

    const item = await HospitalInventory.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item retrieved successfully",
      data: item
    });
  } catch (error) {
    // console.error("Error fetching inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Update an inventory item by ID
const updateInventoryItem = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const { id } = req.params;
    const { itemName, quantity, unit, category, price, supplier } = req.body;

    const updatedItem = await HospitalInventory.findByIdAndUpdate(
      id,
      { itemName, quantity, unit, category, price, supplier },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    // console.error("Error updating inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete an inventory item by ID
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await HospitalInventory.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
      data: deletedItem
    });
  } catch (error) {
    // console.error("Error deleting inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem
};
