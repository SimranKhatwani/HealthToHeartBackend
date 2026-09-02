const InsuranceProvider = require("../models/InsuranceProvider");
const { getUserFromToken } = require("../utils/auth");

//  Create a new insurance provider
exports.createInsuranceProvider = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const userId = req.user._id;

        // console.log("req.user", req.user)
        const { name, type, contactPerson, phone, email, governmentId, patientsCount, status } = req.body;

        const provider = new InsuranceProvider({
            name,
            type,
            contactPerson,
            phone,
            email,
            status,
            governmentId,
            org_id,
            patientsCount,
            createdBy: userId
        });


        await provider.save();
        // console.log("Provider created successfully:");
        res.status(201).json({ success: true, message: "Insurance provider created successfully", provider });
    } catch (error) {
        // console.error("Error creating provider:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Get all insurance providers
exports.getAllInsuranceProviders = async (req, res) => {
    try {
        // const { org_id, isSuperAdmin } = await getUserFromToken(req);
        
        const org_id = req.user.org_id;

        const filter = {};
        // if (!isSuperAdmin) {
        filter.org_id = org_id;
        // }

        const providers = await InsuranceProvider.find(filter);
        res.json({ success: true, providers });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Get an insurance provider by ID
exports.getInsuranceProviderById = async (req, res) => {
    try {
        // const { org_id, isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;

        const filter = { _id: req.params.id };
        // if (!isSuperAdmin) {
        filter.org_id = org_id;
        // }

        const provider = await InsuranceProvider.findOne(filter);

        if (!provider) return res.status(404).json({ error: "Provider not found" });

        res.json({ success: true, provider });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Update an insurance provider by ID
exports.updateInsuranceProvider = async (req, res) => {
    try {
        // const { org_id, isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        const { name, type, contactPerson, phone, email, status, patientsCount } = req.body;

        const filter = { id: req.params.id };
        // if (!isSuperAdmin) {
            filter.org_id = org_id;
        // }

        const updatedProvider = await InsuranceProvider.findOneAndUpdate(
            filter,
            { name, type, contactPerson, phone, email, status, patientsCount },
            { new: true }
        );

        if (!updatedProvider) return res.status(404).json({ error: "Provider not found" });

        res.json({ success: true, message: "Insurance provider updated successfully", updatedProvider });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Delete an insurance provider by ID
exports.deleteInsuranceProvider = async (req, res) => {
    try {
        // const { org_id, isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;

        const filter = { _id: req.params.id };
        // if (!isSuperAdmin) {
            filter.org_id = org_id;
        // }

        const deletedProvider = await InsuranceProvider.findOneAndDelete(filter);

        if (!deletedProvider) return res.status(404).json({ error: "Provider not found" });

        res.json({ success: true, message: "Insurance provider deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
