const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PatientSchema = require("../models/Patients");

const loginPatientController = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email?.toLowerCase();

        // Find Patient
        const patient = await PatientSchema.findOne({ email });
        if (!patient) {
            return res.status(404).json({ message: "Invalid credentials" });
        }

        // Verify Password
        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token (Only for Authentication, No Roles)
        const token = jwt.sign(
            { userId: patient._id, type: "Patient" },
            process.env.JWT_SECRET,
            { algorithm: "HS256", expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 1
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            path: "/"
        });
        res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { loginPatientController, logout };
