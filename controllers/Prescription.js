// const Prescription = require('../models/Prescription');
// const MedicalStaff = require('../models/MedicalStaff');
// const PatientSchema = require('../models/Patients')

// const createPrescription = async (req, res) => {
//   try {
//     const { patient, prescription, diagnosis, consultationDate, notes } = req.body;

//     const doctor = req.user._id
//     const existingDoctor = await MedicalStaff.findById(doctor);
//     if (!existingDoctor) {
//       return res.status(404).json({ message: 'Doctor not found' });
//     }

//     const newPrescription = new Prescription({
//       patient,
//       doctor,
//       prescription,
//       diagnosis,
//       consultationDate,
//       notes,
//     });

//     await newPrescription.save();

//     res.status(201).json({ message: 'Prescription created successfully', prescription: newPrescription });
//   } catch (error) {
//     console.error('Error creating prescription:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// const getPrescriptionsByEmail = async (req, res) => {
//     try {
//       const { email } = req.query;

//       if (!email) {
//         return res.status(400).json({ message: "Email is required" });
//       }

//       // Find the patient by email
//       const patient = await PatientSchema.findOne({ email });

//       if (!patient) {
//         return res.status(404).json({ message: "Patient not found" });
//       }

//       console.log("patient", patient)

//       // Retrieve prescriptions for the patient
//       const prescriptions = await Prescription.find({ "patient.email": email });


//       if (!prescriptions.length) {
//         return res.status(404).json({ message: "No prescriptions found for this patient" });
//       }

//       res.status(200).json({ prescriptions });
//     } catch (error) {
//       console.error("Error fetching prescriptions:", error);
//       res.status(500).json({ message: "Server error", error: error.message });
//     }
//   };

// const updatePrescription = async (req, res) => {
//     try {
//         const { id } = req.params; // Get prescription ID from URL params
//         const { prescription, diagnosis, consultationDate, notes } = req.body;

//         // Find the prescription by ID
//         let existingPrescription = await Prescription.findById(id);
//         if (!existingPrescription) {
//             return res.status(404).json({ message: "Prescription not found" });
//         }

//         if (prescription) existingPrescription.prescription = prescription;
//         if (diagnosis) existingPrescription.diagnosis = diagnosis;
//         if (consultationDate) existingPrescription.consultationDate = consultationDate;
//         if (notes) existingPrescription.notes = notes;

//         // Save the updated prescription
//         await existingPrescription.save();

//         res.status(200).json({
//             message: "Prescription updated successfully",
//             prescription: existingPrescription,
//         });
//     } catch (error) {
//         console.error("Error updating prescription:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };


// module.exports = { createPrescription, getPrescriptionsByEmail, updatePrescription };




const Prescription = require("../models/Prescription");
const MedicalStaff = require("../models/MedicalStaff");
const PatientSchema = require("../models/Patients");
const { getUserFromToken } = require("../utils/auth");

// Create a new prescription
const createPrescription = async (req, res) => {
  try {
    let { org_id, isSuperAdmin, userId, isAdmin } = await getUserFromToken(req);
    const { patient_id, prescription, diagnosis, consultationDate, notes } = req.body;
    let doctor;
    if (!doctor) {
      if (isAdmin || isSuperAdmin) {
        doctor = req.body.doctor;
      }
      else {
        doctor = userId;
       
      }
    }
    else {
      return res.status(400).json({ message: "Doctor login required" });
    }
    // calculate quantity using dose and duration and frequency
    for (let item of prescription) {
      const { dosage, frequency, duration } = item;

      // Assuming duration is in days and frequency is per day (e.g., "3 times a day")
      const frequencyPerDay = parseInt(frequency.split(' ')[0]); 
      const durationInDays = parseInt(duration.split(' ')[0]); 

      // Calculate the quantity
      item.quantity = dosage * frequencyPerDay * durationInDays;
    }


    const existingDoctor = await MedicalStaff.findById(doctor);
    if (!existingDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
        // check patient exits or not
        const existingPatient = await PatientSchema.findById(patient_id);
    if (!existingPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const newPrescription = new Prescription({
      patient_id,
      doctor,
      prescription,
      diagnosis,
      consultationDate,
      notes,
      org_id
    });

    await newPrescription.save();
    // push prescription to patient 


    // console.log("New Prescription ID:", newPrescription._id);
    // console.log("Updating Patient ID:", patient_id);
    // console.log("Visit ID being added:", req.body?.visit);

    const updatedPatient = await PatientSchema.findOneAndUpdate(
      { _id: patient_id, org_id },
      {
        $push: {
          prescriptions: { visit: req.body?.visit, prescriptionId: newPrescription._id }
        }
      },
      { new: true }
    );

    // console.log("Updated Patient Prescriptions:", updatedPatient.prescriptions);
    res.status(201).json({ message: "Prescription created successfully", prescription: newPrescription });
  } catch (error) {
    // console.error("Error creating prescription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get prescriptions by patient email
const getPrescriptionsByEmail = async (req, res) => {
  try {
    let { org_id, isSuperAdmin } = await getUserFromToken(req);
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    // Find the patient by email or phone, considering org_id (unless super admin)
    const patientQuery = { $or: [{ email }, { phone }] };
    if (!isSuperAdmin) {
      patientQuery.org_id = org_id;
    }

    const patient = await PatientSchema.findOne(patientQuery);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Retrieve prescriptions based on patient_id
    const prescriptions = await Prescription.find({ patient_id: patient._id });

    if (!prescriptions.length) {
      return res.status(404).json({ message: "No prescriptions found for this patient" });
    }

    res.status(200).json({ prescriptions });
  } catch (error) {
    // console.error("Error fetching prescriptions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update prescription
const updatePrescription = async (req, res) => {
  try {
    let { org_id, isSuperAdmin } = await getUserFromToken(req);
    const { id } = req.params;
    const { prescription, diagnosis, consultationDate, notes } = req.body;

    // Find the prescription by ID and filter by org_id (unless super admin)
    const filter = { _id: id };
    if (!isSuperAdmin) {
      filter.org_id = org_id;
    }

    let existingPrescription = await Prescription.findOne(filter);
    if (!existingPrescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (prescription) existingPrescription.prescription = prescription;
    if (diagnosis) existingPrescription.diagnosis = diagnosis;
    if (consultationDate) existingPrescription.consultationDate = consultationDate;
    if (notes) existingPrescription.notes = notes;

    await existingPrescription.save();

    res.status(200).json({
      message: "Prescription updated successfully",
      prescription: existingPrescription,
    });
  } catch (error) {
    // console.error("Error updating prescription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all prescriptions (with org_id filtering)
const getAllPrescriptions = async (req, res) => {
  try {
    let { org_id, isSuperAdmin } = await getUserFromToken(req);

    const filter = isSuperAdmin ? {} : { org_id };
    const prescriptions = await Prescription.find(filter).populate("patient_id doctor");

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    // console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Delete prescription
const deletePrescription = async (req, res) => {
  try {
    let { org_id, isSuperAdmin } = await getUserFromToken(req);
    const { id } = req.params;

    const filter = { _id: id };
    if (!isSuperAdmin) {
      filter.org_id = org_id;
    }

    const prescription = await Prescription.findOneAndDelete(filter);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Remove the prescription from the patient's prescriptions array
    await PatientSchema.findOneAndUpdate(
      { _id: prescription.patient_id, org_id },
      { $pull: { prescriptions: { prescriptionId: prescription._id } } },  // ✅ Correct structure
      { new: true }
    );

    res.status(200).json({ message: "Prescription deleted successfully" });
  } catch (error) {
    // console.error("Error deleting prescription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//chage filled stutus
const changeFilledStatus = async (req, res) => {
  try {
    let { org_id, isSuperAdmin } = await getUserFromToken(req);
    const { id } = req.params;

    const filter = { _id: id };
    if (!isSuperAdmin) {
      filter.org_id = org_id;
    }
    // console.log("--------------------------------------",id);

    const prescription = await Prescription.findOneAndUpdate(
      filter,
      { filled: true },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.status(200).json({ message: "Prescription status updated successfully", prescription });
  } catch (error) {
    // console.error("Error updating prescription status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {
  createPrescription,
  getPrescriptionsByEmail,
  updatePrescription,
  getAllPrescriptions,
  deletePrescription,
  changeFilledStatus
};
