const Organization = require("../models/Organization");
const SuperAdmin = require("../models/SuperAdmin");
const jwt = require('jsonwebtoken');


const getUserFromToken = async (req) => {
    const token = req.cookies.token;
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId);

    if (!user) throw new Error("Unauthorized: User not found");

    let org_id = user.org_id;
    if (user?.role === "superadmin") {
        org_id = req.params.org || req.body.org || org_id || null;
    }
    let isAdmin = (user?.role === 'admin' || user?.role === 'superadmin');
    let isSuperAdmin = (user?.role === 'superadmin');
    return { userId: user._id, org_id, isAdmin, isSuperAdmin };
};


exports.createOrganization = async (req, res) => {
  try {
    const {isSuperAdmin} = await getUserFromToken(req);
    if (!isSuperAdmin) {
        return res.status(403).json({ message: "Unauthorized: Trying to create organization" });
    }
    const { org_name, location, org_type, other_org_type } = req.body;
    const newOrg = new Organization({ org_name, location, org_type, other_org_type });

    await newOrg.save();
    res.status(201).json({ message: "Organization created successfully", data: newOrg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllOrganizations = async (req, res) => {
  try {
    const {isSuperAdmin} = await getUserFromToken(req);
    if (!isSuperAdmin) {
        return res.status(403).json({ message: "Unauthorized: Trying to create organization" });
    }
    const organizations = await Organization.find();
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const {isSuperAdmin} = await getUserFromToken(req);
    if (!isSuperAdmin) {
        return res.status(403).json({ message: "Unauthorized: Trying to create organization" });
    }
    const organization = await Organization.findById(req.params.id);
    if (!organization) return res.status(404).json({ message: "Organization not found" });

    res.status(200).json(organization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const {isSuperAdmin} = await getUserFromToken(req);
    if (!isSuperAdmin) {
        return res.status(403).json({ message: "Unauthorized: Trying to create organization" });
    }
    const { org_name, location, org_type, other_org_type } = req.body;
    const updatedOrg = await Organization.findByIdAndUpdate(
      req.params.id,
      { org_name, location, org_type, other_org_type, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedOrg) return res.status(404).json({ message: "Organization not found" });

    res.status(200).json({ message: "Organization updated successfully", data: updatedOrg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const {isSuperAdmin} = await getUserFromToken(req);
    if (!isSuperAdmin) {
        return res.status(403).json({ message: "Unauthorized: Trying to create organization" });
    }
    const deletedOrg = await Organization.findByIdAndDelete(req.params.id);
    if (!deletedOrg) return res.status(404).json({ message: "Organization not found" });

    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
