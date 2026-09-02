const GeneralStaffSchema = require("../models/GeneralStaff")
const jwt = require("jsonwebtoken");
const Pharmacy = require("../models/Pharmacy"); 
const Organization = require("../models/Organization");

const createPharmacy = async (req, res) => {
    try {
        const token = req.cookies.token;

        // Check if token exists
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        // Decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await GeneralStaffSchema.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // console.log(decoded)

        // Extract organization ID from token or query param
        const org_id = user.org_id ? user.org_id : req.query.org_id;

        const { medicines } = req.body;

        // console.log(medicines)
        // Validate required fields
        if (!org_id ) {
            return res.status(400).json({ 
                success: false, 
                message: "Organization ID and at least one medicine are required" 
            });
        }

        // Check if the organization exists
        const orgExists = await Organization.findById(org_id);
        if (!orgExists) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        // Validate medicine expiry dates
        const invalidMedicine = medicines.find(med => new Date(med.expiryDate) <= new Date(med.mfgDate));
        if (invalidMedicine) {
            return res.status(400).json({ 
                success: false, 
                message: `Expiry date must be later than the manufacturing date for medicine: ${invalidMedicine.name}` 
            });
        }

        // Create new pharmacy
        const newPharmacy = new Pharmacy({
            org_id,
            pharmacistDetails: user._id,  // Set logged-in user ID as the pharmacist reference
            medicines
        });

        await newPharmacy.save();

        res.status(201).json({
            success: true,
            message: "Pharmacy created successfully",
            data: newPharmacy
        });

    } catch (error) {
        // console.error("Error in createPharmacy:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {createPharmacy}

