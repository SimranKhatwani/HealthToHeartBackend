const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SuperAdminSchema = require('../models/SuperAdmin');
const PatientSchema = require('../models/Patients')
const GeneralStaffSchema = require('../models/GeneralStaff');
const RoleSchema = require('../models/Role');
const Organization = require('../models/Organization');
const MedicalStaffSchema = require('../models/MedicalStaff');

const registerController = async (req, res) => {
    try {
        let { email, password, name, roleType } = req.body;
        email = email?.toLowerCase();

        // Define roles that belong to Medical Staff
        const medicalRoles = ["Doctor", "Nurse", "WardBoy"];

        // Determine the model based on roleType
        let UserModel;
        if (!roleType) {
            UserModel = require("../models/Patients");  // Use the model, not the schema
            roleType = "Patient";
        } else if (medicalRoles.includes(roleType)) {
            UserModel = require("../models/MedicalStaff");  // Model for medical staff
        } else {
            UserModel = require("../models/GeneralStaff");  // Model for general staff
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        // Find the role ID for non-patient users
        let role_id = null;
        if (roleType !== "Patient") {
            const roleData = await RoleSchema.findOne({ role_name: roleType });
            if (!roleData) {
                return res.status(400).json({ success: false, message: "Invalid role provided" });
            }
            role_id = roleData._id;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user using the model
        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            role_id: role_id || undefined,  // Use the default if `role_id` is null
        });

        await newUser.save();

        // Generate JWT Token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email, role: newUser.role_id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            message: `${roleType} registered successfully`,
            token,
        });
    } catch (error) {
        // console.error("Error in registerController:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// const loginController = async (req, res) => {

//     try {
//         let { email, password } = req.body;
//         email = email?.toLowerCase();
//         let roleName = null;

//         // Check for SuperAdmin first
//         let user = await SuperAdminSchema.findOne({ email });
//         if (!user) {
//             // If not SuperAdmin, check for Medical Staff, General Staff, or Patient
//             user = await GeneralStaffSchema.findOne({ email })
//             if (!user) {
//                 user = await MedicalStaffSchema.findOne({ email })
//             }
//             if (!user) {
//                 user = await PatientSchema.findOne({ email });
//             }
//             if (!user) {
//                 return res.status(404).json({ message: "Invalid credentials" });
//             }

//             // Assign role name if user found
//             if (user.role_id) {
//                 roleName = user.role_id.role_name;
//             } else {
//                 roleName = "Patient"; // Default role for Patient
//             }
//         }

//         // Check if password matches
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         // Generate JWT token with user details
//         const token = jwt.sign(
//             { userId: user._id, email: user.email, role: roleName, organization: user.org_id },
//             process.env.JWT_SECRET,
//             { expiresIn: '1h' }
//         );

//         // Set cookie with token
//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production', // Use true in production
//             maxAge: 1000 * 60 * 60 * 1  // Cookie expires in 1 hour
//         });

//         // Return success response with token
//         res.status(200).json({
//             success: true,
//             message: "Login successful",
//             token
//         });
//     } catch (error) {
//         console.error("Error in loginController:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };




const loginController = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        let user = null;
        let roleName = "Patient";  // Default role

        // Search for user in SuperAdminSchema first, then in PatientSchema
        user = await PatientSchema.findOne({ email });
        // Assign role name dynamically
        // if (user.role_id && user.role_id.role_name) {
        //     roleName = user.role_id.role_name;
        // }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: roleName },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Use true in production
            maxAge: 1000 * 60 * 60  // 1 hour expiration
        });

        // Return success response with token
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            role: roleName
        });

    } catch (error) {
        // console.error("Error in loginController:", error);
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


module.exports = { loginController, registerController, logout };
