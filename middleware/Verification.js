const jwt = require('jsonwebtoken');
const MedicalStaff = require("../models/MedicalStaff");
const SuperAdminSchema = require('../models/SuperAdmin')

    const verifyTokenUser = async (req, res, next) => {
        try {
            const authorization = req.headers.authorization;
            const token = req.cookies.token || authorization?.replace(/^Bearer\s+/i, "");
            if (!token) {
                return res.status(401).json({ message: "Session Expired: Login Again" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // console.log("decoded", decoded);

            // Try finding user in MedicalStaff
            let user = await MedicalStaff.findById(decoded.userId);

            // If not found, try SuperAdmin
            if (!user) {
                user = await SuperAdminSchema.findById(decoded.userId);
            }

            // Still not found — unauthorized
            if (!user) {
                return res.status(403).json({ success: false, message: "Unauthorized: User is not valid" });
            }

            req.user = user;
            req.user.role = user.role 
            // console.log("req.user", req.user);

            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message });
        }
    };


const verifyAdminToken = async(req, res, next) => {
    try {
        const token = req.cookies.token;
        // console.log("token from admin", token)
        if(!token){
            return res.status(401).json({message:"Session Expired: Login Again"})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // console.log(decoded)
        const user = await SuperAdminSchema.findById(decoded.userId)


        if(!user){
            return res.status(403).json({ success: false, message: "Unauthorized: User is not Valid" });
        }

        req.user = user;
        // console.log("req.user", req.user)
        next();
    } catch (error) {
        // console.error(error);
        return res.status(500).json({ message: error.message});
    }
}

const checkPermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ message: "Unauthorized: No token provided" });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            let user = await SuperAdminSchema.findById(decoded.userId);
            if (!user) {
                user = await MedicalStaff.findById(decoded.userId);
            }
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            const userRoleId = user.role || user.role_id;
            // const additionalPermissions = user.additional_permissions || [];
            // const blockedPermissions = user.blocked_permissions || [];


            if (user.role_id) {
                const role = await RoleSchema.findOne(userRoleId);

                if (!role) {
                    return res.status(403).json({ message: 'Role not found' });
                }
                const rolePermissions = role.permissions || [];
                const allPermissions = [
                    // ...new Set([...rolePermissions, ...additionalPermissions].filter(p => !blockedPermissions.includes(p)))
                    ...new Set([...rolePermissions])
                ];


                const hasPermission = allPermissions.includes(permissionKey);
                if (hasPermission || userRoleId === 'admin' || userRoleId === 'superadmin') {
                    return next();
                } else {
                    return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
                }
            } else {
                if (userRoleId === 'admin' || userRoleId === 'superadmin') {
                    return next();
                } else {
                    return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
                }
            }
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};


module.exports = {verifyTokenUser, verifyAdminToken, checkPermission}