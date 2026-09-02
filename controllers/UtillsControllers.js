const Role = require("../models/Role");
const {getUserFromToken} = require("../utils/auth");

exports.getAllRoles = async (req, res) => {
    try {
        const{org_id, isSuperAdmin} = await getUserFromToken(req);
        if(isSuperAdmin) {
            const roles = await Role.find().populate("org_id");
            return res.status(200).json(roles);
        }
        const roles = await Role.find({org_id}).populate("org_id");
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};