const InsuranceClaim = require("../models/InsuranceClaim");
const InsuranceProvider = require("../models/InsuranceProvider");
const Patients = require("../models/Patients");
const { getUserFromToken } = require("../utils/auth");

//  Create a new insurance claim
exports.createInsuranceClaim = async (req, res) => {
    try {
        // const { userId, org_id } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        const userId = req.user._id;
        const { patientId, providerId, service, amount, governmentId, status, notes } = req.body;

        const claim = new InsuranceClaim({
            patientId,
            providerId,
            service,
            amount,
            status,
            notes,
            org_id,
            governmentId,
            createdBy: userId
        });
        //check the paitent and provider exist
        const patient = await Patients.findById(patientId);
        if (!patient) return res.status(404).json({ error: "Patient not found" });
        const provider = await InsuranceProvider.findById(providerId);
        if (!provider) return res.status(404).json({ error: "Provider not found" });
        // Check if there is an existing claim with the same patient and provider and its status
        const existingClaim = await InsuranceClaim.findOne({
            patientId,
            providerId
        });
        // console.log(existingClaim)

        
        if (existingClaim) {
            if (existingClaim.status === "pending") {
                return res.status(400).json({
                    error: "Patient has already been claimed by this provider and the claim is either pending or approved"
                });
            }else if(existingClaim.status === "approved"){
                // check submissionDate is less than 30 days
                const today = new Date();
                const submissionDate = new Date(existingClaim.submissionDate);
                const diffTime = Math.abs(today - submissionDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 30) {
                    return res.status(400).json({
                        error: `Patient has already been claimed by this provider and the claim is approved try again in ${30 - diffDays} days`
                    })
                }

            }


        }

        await claim.save();
        // find the provider and increment the patients count
        // const provider = await InsuranceProvider.findById(providerId);
        provider.patientsCount += 1;
        await provider.save();
        res.status(201).json({ success: true, message: "Insurance claim created successfully", claim });
    } catch (error) {
        // console.error("Error creating claim:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Get all insurance claims
exports.getAllInsuranceClaims = async (req, res) => {
    try {
        const org_id = req.user.org_id;

        const filter = {};
        // if (!isSuperAdmin) {
        filter.org_id = org_id;
        // }

        const claims = await InsuranceClaim.find(filter).populate("patientId providerId");
        res.json({ success: true, claims });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Get an insurance claim by ID
exports.getInsuranceClaimById = async (req, res) => {
    try {
        const org_id = req.user.org_id;

        const filter = { _id: req.params.id };
        // if (!isSuperAdmin) {
        filter.org_id = org_id;
        // 
        const claim = await InsuranceClaim.findOne(filter).populate("patientId providerId");

        if (!claim) return res.status(404).json({ error: "Claim not found" });

        res.json({ success: true, claim });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Update an insurance claim by ID
exports.updateInsuranceClaim = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const { service, amount, status, notes } = req.body;

        const filter = { id: req.params.id }; 
        // if (!isSuperAdmin) {
            filter.org_id = org_id;
        // }

        const updatedClaim = await InsuranceClaim.findOneAndUpdate(
            filter,
            { service, amount, status, notes },
            { new: true }
        );

        if (!updatedClaim) return res.status(404).json({ error: "Claim not found" });

        res.json({ success: true, message: "Insurance claim updated successfully", updatedClaim });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Delete an insurance claim by ID
exports.deleteInsuranceClaim = async (req, res) => {
    try {
        // const { org_id, isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;

        const filter = { _id: req.params.id };
        // if (!isSuperAdmin) {
            filter.org_id = org_id;
        // }

        const deletedClaim = await InsuranceClaim.findOneAndDelete(filter);
        if (deletedClaim) {
            // find the provider and decrement the patients count
            const provider = await InsuranceProvider.findById(deletedClaim.providerId);
            provider.patientsCount -= 1;
            await provider.save();
        }

        if (!deletedClaim) return res.status(404).json({ error: "Claim not found" });

        res.json({ success: true, message: "Insurance claim deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
