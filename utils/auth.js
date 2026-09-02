const MedicalStaff = require("../models/MedicalStaff");
const SuperAdmin = require("../models/SuperAdmin");
const jwt = require('jsonwebtoken');
const Organization = require("../models/Organization");

getUserFromToken = async (req) => {
    const authorization = req.headers.authorization;
    const token = req.cookies.token || authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await MedicalStaff.findById(decoded.userId);

    if (!user) {
        // console.log("User not found");
        return;
    };

    let org_id = user.org_id;

    if (user?.role === "superadmin") {
        org_id = req.params.org || req.body.org || org_id || null;
    }
    let isAdmin = (user?.role === 'admin' || user?.role === 'superadmin');
    let isSuperAdmin = (user?.role === 'superadmin');
    return { userId: user._id, org_id, isAdmin, isSuperAdmin };
};


const fetchLoggedInUser = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user = await MedicalStaff.findById(decoded.userId).populate("org_id");

        if (!user) {
            user = await SuperAdmin.findById(decoded.userId).populate("org_id");
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

  

module.exports = { getUserFromToken, fetchLoggedInUser };

