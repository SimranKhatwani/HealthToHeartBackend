const jwt = require("jsonwebtoken");
const Role = require("../models/Role");
const Organization = require("../models/Organization");
const SuperAdmin = require("../models/SuperAdmin");

const getUserFromToken = async (req) => {
    const authorization = req.headers.authorization;
    const token = req.cookies.token || authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await SuperAdmin.findById(decoded.userId);

    if (!user) {
        const MedicalStaff = require("../models/MedicalStaff");
        user = await MedicalStaff.findById(decoded.userId);
    }

    if (!user) throw new Error("Unauthorized: User not found");

    let org_id = user.org_id;
    const role = user.role || decoded.role;
    if (role === "superadmin") {
        org_id = req.params.org || req.body.org || org_id || null;
    }
    let isAdmin = (role === 'admin' || role === 'superadmin' || role === 'Hospital Administrator');
    let isSuperAdmin = (role === 'superadmin');
    return { userId: user._id, org_id, isAdmin, isSuperAdmin };
};


exports.createRole = async (req, res) => {
    try {
        const { isSuperAdmin, isAdmin } = await getUserFromToken(req);
        if (!isSuperAdmin || !isAdmin) {
            return res.status(403).json({ message: "Unauthorized: Trying to create organization" });
        }
        const { role_name, org_id, permissions } = req.body;

        // Check if organization exists
        const organization = await Organization.findOne({
            $or: [{ _id: org_id }, { org_id: org_id }]
        });
        // console.log(organization);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Create new role
        const newRole = new Role({
            role_name,
            org_id,
            permissions
        });

        await newRole.save();
        res.status(201).json(newRole);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllRoles = async (req, res) => {
    try {
        const{org_id, isSuperAdmin, isAdmin} = await getUserFromToken(req);
        if(isSuperAdmin || isAdmin) {
            const roles = await Role.find().populate("org_id");
            return res.status(200).json(roles);
        }
        const roles = await Role.find({org_id}).populate("org_id");
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id).populate("org_id", "org_name");
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }
        res.status(200).json(role);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { role_name, permissions } = req.body;
        console.log("req.body", req.body)
        const updatedRole = await Role.findByIdAndUpdate(
            req.params.id,
            { role_name, permissions },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.status(200).json(updatedRole);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { isSuperAdmin, isAdmin } = await getUserFromToken(req);
        if (!isSuperAdmin && !isAdmin) {
            return res.status(403).json({ message: "Unauthorized: Trying to create organization" });
        }
        const deletedRole = await Role.findByIdAndDelete(req.params.id);
        if (!deletedRole) {
            return res.status(404).json({ message: "Role not found" });
        }

        res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRolePermissions = async (req, res) => {
    try {
        const orgId = req.user?.org_id;
        const roleId = req.user?.role_id; 
        const role = req.user?.role;

        if (role === 'admin' || role === 'superadmin') {
            return res.status(200).json({ permissionsspecial: ['all'] });
        }

        if (!orgId || !roleId) {
            return res.status(401).json({ message: 'Unauthorized: Missing organization or role ID' });
        }

        const roleData = await Role.findOne({ _id: roleId, org_id: orgId });

        if (!roleData) {
            return res.status(404).json({ message: 'Role not found or access denied' });
        }

        return res.status(200).json({ permissionsspecial: roleData.permissions });
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



