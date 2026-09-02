const bcrypt = require("bcrypt");   
const jwt = require("jsonwebtoken");
const MedicalStaffSchema = require("../models/MedicalStaff");
const SuperAdminSchema = require("../models/SuperAdmin");

const loginStaffController = async (req, res) => {
    try {
        let { email, password } = req.body;
        // console.log(req.body);
        email = email?.toLowerCase();
        let user, roleName;

        // Check if user is SuperAdmin
        user = await SuperAdminSchema.findOne({ email });
        if (user){
            roleName = user.role;
        };

        // Check if user is Medical Staff
        if (!user) {
            user = await MedicalStaffSchema.findOne({ email }).populate("role_id");
            if (user) roleName = user.role_id?.role_name || "MedicalStaff";
        }

        if (!user) {
            return res.status(404).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.status === "Inactive") {
            return res.status(401).json({
                message: "Your account is deactivated. Contact your admin."
            });
        }

        // Generate JWT Token with Role-based Access
        const token = jwt.sign(
            { userId: user._id, role: roleName, org_id: user.org_id || null },
            process.env.JWT_SECRET,
            {expiresIn: "1h" }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 1
        })
        // res.cookie("token", token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     maxAge: 1000 * 60 * 60 * 1
        // });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            path: '/'
        });
        res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


module.exports = { loginStaffController, logout };
