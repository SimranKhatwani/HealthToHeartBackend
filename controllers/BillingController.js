const Billing = require('../models/BillingSchema'); 
const Patient = require("../models/Patients");
const SuperAdmin = require("../models/SuperAdmin");
const MedicalStaff = require("../models/MedicalStaff")
const jwt = require("jsonwebtoken");

getUserFromToken = async (req) => {
    const token = req.cookies.token;
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await MedicalStaff.findById(decoded.userId);

    if (!user) {
        console.log("User not found");
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

// Create a new billing
const createBilling = async (req, res) => {
    let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);

    try {
        let {
            dueDate,
            PatientName,
            totalAmount,
            balance,
            paymentMethod = "Cash", // default
        } = req.body;

        if (isSuperAdmin) {
            org_id = req.body.org_id || req.params.org_id || org_id || null;
        }

        const patient = Patient.findOne({name:PatientName})

        if(!patient){
            return res.status(400).json({
                success: false,
                message: "Patient not found.",
            });
        }
        // Validate required fields
        if (!org_id || !dueDate || !totalAmount || !balance) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing: org_id, dueDate, totalAmount, or balance.",
            });
        }

        const billing = new Billing({
            org_id,
            dueDate,
            PatientId:patient._id,
            totalAmount,
            balance,
            paymentMethod,
        });

        await billing.save();

        return res.status(201).json({
            success: true,
            message: "Billing record created successfully.",
            data: billing,
        });
    } catch (error) {
        console.error("Error creating billing record:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

module.exports = {createBilling};
