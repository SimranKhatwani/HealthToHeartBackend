const BloodInventory = require("../models/BloodInventory");
const BloodRequest = require("../models/BloodRequest")
const BloodDonation = require("../models/BloodDonation")
const jwt = require("jsonwebtoken");
const MedicalStaff = require("../models/MedicalStaff");
const SuperAdmin = require("../models/SuperAdmin");
const Patient = require("../models/Patients")

const createBloodEntry = async (req, res) => {
  // let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);

  try {
    const org_id = req.user.org_id;
    const { bloodType, units, addedDate, expiryDate, status } = req.body;
    
    // if (isSuperAdmin) {
    //   org_id = req.body.org_id || req.params.org_id || org_id || null;
    // }

    // Check if blood type already exists
    const existingBlood = await BloodInventory.findOne({ bloodType, org_id });

    if (existingBlood) {
      // If the blood type exists, update the units
      existingBlood.units += Number(units); // Add new units to the existing ones
      await existingBlood.save();

      res.status(200).json({
        success: true,
        message: `Updated blood stock for ${bloodType}`,
        data: existingBlood
      });

    } else {
      // If blood type doesn't exist, create a new entry
      const newBlood = new BloodInventory({
        org_id : org_id,
        bloodType,
        units,
        addedDate,
        expiryDate,
        status,
      });

      await newBlood.save();

      res.status(201).json({
        success: true,
        message: "New blood entry created successfully",
        data: newBlood
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getBloodEntries = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const bloodEntries = await BloodInventory.find({org_id}).sort({ createdAt: -1 });   

    res.status(200).json({
      success: true,
      message: "Blood entries fetched successfully",
      data: bloodEntries,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBloodByType = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const { bloodType } = req.body;  // Extract blood type from params
        const bloodEntries = await BloodBankSchema.find({ 
          bloodType: bloodType, 
          org_id: org_id 
      });

        if (bloodEntries.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No blood entries found for type ${bloodType}`
            });
        }

        res.status(200).json({
            success: true,
            message: `Blood entries of type ${bloodType} fetched successfully`,
            data: bloodEntries
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const updateBloodEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodType, quantity, donorName, contactNumber, expiryDate, status } = req.body;

    const blood = await BloodBankSchema.findById(id);

    if (!blood) {
      return res.status(400).json({ success: false, message: "Blood entry not found" });
    }

    // Update the fields only if new values are provided
    blood.bloodType = bloodType || blood.bloodType;
    blood.quantity = quantity || blood.quantity;
    blood.donorName = donorName || blood.donorName;
    blood.contactNumber = contactNumber || blood.contactNumber;
    blood.expiryDate = expiryDate || blood.expiryDate;
    blood.status = status || blood.status;

    await blood.save();
    res.status(200).json({
      success: true,
      message: "Blood entry updated successfully",
      data: blood,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteBloodEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const blood = await BloodBankSchema.findById(id);

    if (!blood) {
      return res.status(400).json({ success: false, message: "Blood entry not found" });
    }

    await BloodBankSchema.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Blood entry deleted successfully",
      data: blood,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBloodRequest = async (req, res) => {
  // let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);
  try {
    // if (isSuperAdmin) {
    //   org_id = req.body.org_id || req.params.org_id || org_id || null;
    // }

    const { patientName, bloodType, unitsRequested, requestDate, status, urgency, contact } = req.body;
    const org_id = req.user.org_id;

    if (!patientName || !bloodType || !unitsRequested || !contact) {
      console.log("Missing fields in createBloodRequest:", req.body);
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Validate blood type
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(bloodType)) {
      console.log("Invalid blood type:", bloodType);
      return res.status(400).json({
        success: false,
        message: "Invalid blood type"
      });
    }

    // Fetch the patient based on patientName
    const patient = await Patient.findOne({ name: patientName });  // Assuming 'name' is the field you're searching by
    if (!patient) {
      console.log("Patient not found in DB for name:", patientName);
      return res.status(400).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Create a new blood request
    const newRequest = new BloodRequest({
      org_id : org_id,
      patient_details: patient._id,  // Store the ObjectId of the patient
      bloodType,
      unitsRequested,
      requestDate: requestDate || new Date(),
      status: status || 'pending',
      urgency: urgency || 'normal',
      contact
    });

    // Save the new blood request
    await newRequest.save();

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Blood request created successfully",
      data: newRequest
    });

  } catch (error) {
    console.error("Error creating blood request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getAllBloodRequests = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const bloodRequests = await BloodRequest.find({org_id})
      .populate('patient_details', 'name') 
      .sort({ requestDate: -1 });  

    res.status(200).json({
      success: true,
      message: "Blood requests retrieved successfully",
      data: bloodRequests
    });

  } catch (error) {
    console.error("Error fetching blood requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


const deleteBloodRequest = async (req, res) => {
  try {
    const { id } = req.params; 

    const bloodRequest = await BloodRequest.findByIdAndDelete(id);
    
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Blood request deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting blood request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


const createBloodDonation = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const { donorName, bloodType, unitsDonated, contact, hospital, donationDate } = req.body;

    if (!donorName || !bloodType || !unitsDonated || !contact || !hospital) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }


    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(bloodType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blood type"
      });
    }


    const newDonation = new BloodDonation({
      donorName,
      bloodType,
      unitsDonated,
      donationDate: donationDate || new Date(),
      contact,
      hospital
    });

    await newDonation.save();

    const bloodInventory = await BloodInventory.findOne({ bloodType, org_id });

    if (bloodInventory) {
      bloodInventory.units += unitsDonated;  // Add units to stock
      await bloodInventory.save();
    } else {
      // If blood type doesn't exist, create a new stock entry
      const newInventory = new BloodInventory({
        org_id,
        bloodType,
        units: unitsDonated,
        addedDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days expiry
        status: "available"
      });

      await newInventory.save();
    }

    res.status(201).json({
      success: true,
      message: "Blood donation recorded successfully",
      data: newDonation
    });

  } catch (error) {
    console.error("Error creating blood donation:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getAllBloodDonations = async (req, res) => {
  try {
    // Fetch all blood donations
    const donations = await BloodDonation.find();

    // console.log("donations", donations)
    res.status(200).json({
      success: true,
      message: "Blood donations retrieved successfully",
      data: donations
    });

  } catch (error) {
    console.error("Error fetching blood donations:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



module.exports = {
  createBloodEntry,
  getBloodEntries,
  getBloodByType,
  updateBloodEntry,
  deleteBloodEntry,
  createBloodRequest,
  getAllBloodRequests,
  deleteBloodRequest,
  createBloodDonation,
  getAllBloodDonations
};
