const Permission = require('../models/Permission');
const jwt = require('jsonwebtoken');
const MedicalStaff = require("../models/MedicalStaff");
const SuperAdminSchema = require('../models/SuperAdmin');

// Create a new permission
const createPermission = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let org_id = decoded.org_id;
    if (!org_id) {
        org_id = req.body.org_id;
    }
    try {
        const { permission_name } = req.body;
        const existingPermission = await Permission.findOne({ permission_name, org_id });
        if (existingPermission) {
            return res.status(200).json({ message: 'Permission already exists' });
        }
        const newPermission = new Permission({ permission_name, org_id });
        await newPermission.save();
        res.status(201).json({ message: 'Permission created successfully', newPermission });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all permissions
const getAllPermissions = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await MedicalStaff.findById(decoded.userId) || await SuperAdminSchema.findById(decoded.userId);
    if (!user) {
        return res.status(403).json({ success: false, message: "Unauthorized: User is not Valid" });
    }
    try {
        if (user.role === 'superadmin') {
            const permissions = await Permission.find();
            // sort permissions by alphabetical order
            permissions.sort((a, b) => a.permission_name.localeCompare(b.permission_name));
            res.status(200).json(permissions);
        } else if (user.role === 'admin') {
            const permissions = await Permission.find({ org_id: user.org_id });
            permissions.sort((a, b) => a.permission_name.localeCompare(b.permission_name));
            res.status(200).json(permissions);
        }
        else {
            const permissions = await Permission.find({ org_id: user.org_id });
            permissions.sort((a, b) => a.permission_name.localeCompare(b.permission_name));
            res.status(200).json(permissions);
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single permission by ID
const getPermissionById = async (req, res) => {
    try {
        const permission = await Permission.findById(req.params.id);
        if (!permission) return res.status(404).json({ message: 'Permission not found' });
        res.status(200).json(permission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a permission
const updatePermission = async (req, res) => {
    const { id } = req.params;
    // console.log(id);
    // console.log(req.body)
    const { permission_name, org_id } = req.body;
    try {
        const updatedPermission = await Permission.findOne({ _id: id }).updateOne({ permission_name, org_id });
        if (!updatedPermission) return res.status(404).json({ message: 'Permission not found' });
        res.status(200).json({ message: 'Permission updated successfully', updatedPermission} );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a permission
const deletePermission = async (req, res) => {
    try {
        const deletedPermission = await Permission.findByIdAndDelete(req.params.id);
        if (!deletedPermission) return res.status(404).json({ message: 'Permission not found' });
        res.status(200).json({ message: 'Permission deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createPermission, getAllPermissions, getPermissionById, updatePermission, deletePermission };