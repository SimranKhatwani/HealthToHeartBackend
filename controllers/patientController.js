const Patient = require("../models/Patients");
const Visit = require("../models/Visit");;
const { getUserFromToken } = require("../utils/auth");
const Schedule = require("../models/Schedule");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");


// Create a new patient
exports.createPatient = async (req, res) => {
    try {
        let { org_id, userId } = await getUserFromToken(req);
        let { name, email, phone, dateOfBirth, gender, address, doctorAssigned, bloodGroup, patientType, emergencyContact, insuranceDetails, guardianDetails } = req.body;

        if (!name || !email || !phone || !dateOfBirth || !gender || !address || !doctorAssigned || !patientType) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const patient = await Patient.create({
            org_id,
            name,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            doctorAssigned,
            bloodGroup,
            patientType,
            emergencyContact,
            insuranceDetails,
            guardianDetails,
            createdBy: userId,
        });

        res.status(201).json({ success: true, message: "Patient created successfully", data: patient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get all patients
exports.getPatients = async (req, res) => {
    try {
        let { org_id, isSuperAdmin } = await getUserFromToken(req);
        const filter = isSuperAdmin ? {} : { org_id };

        const patients = await Patient.find(filter)
            .populate("doctorAssigned")
            .populate("org_id")
            .populate("room")
            .populate("appointments")
            .populate("messages")
            .populate({
                path: "prescriptions.prescriptionId",
                model: "Prescription",
            })
            .populate({
                path: "visitDates",
                model: "Visit",
            })
            .populate({
                path: "medicalHistory.doctor",
                model: "MedicalStaff",              
              });

        res.status(200).json({ success: true, data: patients });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get a single patient by ID
exports.getPatientById = async (req, res) => {
    try {
        let { org_id, isSuperAdmin } = await getUserFromToken(req);
        const filter = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, org_id };

        const patient = await Patient.findOne(filter)
            .populate("doctorAssigned")
            .populate("room")
            .populate("appointments")
            .populate("visitDates")
            .populate("medicalHistory.visit")
            .populate("messages")
        // .populate("prescriptions.prescriptionId");

        if (!patient) return res.status(404).json({ error: "Patient not found" });

        res.status(200).json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Update patient details
exports.updatePatient = async (req, res) => {
    try {
        let { org_id, isSuperAdmin } = await getUserFromToken(req);
        const filter = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, org_id };

        const updatedPatient = await Patient.findOneAndUpdate(filter, req.body, { new: true });

        if (!updatedPatient) return res.status(404).json({ error: "Patient not found" });

        res.status(200).json({ success: true, message: "Patient updated successfully", data: updatedPatient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Delete a patient
exports.deletePatient = async (req, res) => {
    try {
        let { org_id, isSuperAdmin } = await getUserFromToken(req);
        const filter = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, org_id };

        const deletedPatient = await Patient.findOneAndDelete(filter);

        if (!deletedPatient) return res.status(404).json({ error: "Patient not found" });

        res.status(200).json({ success: true, message: "Patient deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Add a visit record
exports.addVisit = async (req, res) => {
    try {
        let { org_id } = await getUserFromToken(req);
        const { doctor, notes, diagnosis, treatment, slotTime, reason } = req.body;
        let date = new Date().toISOString().split("T")[0];

        const patient = await Patient.findOne({ _id: req.params.id, org_id });
        if (!patient) return res.status(404).json({ error: "Patient not found" });

        const visit = await Visit.create({
            patient: patient._id,
            doctor,
            notes,
            diagnosis,
            treatment,
            org_id
        });

        // Check if the patient already has an appointment
        const existingAppointment = await Appointment.findOne({ patientId: patient._id, doctorId: doctor, org_id, status: "scheduled" });

        if (!existingAppointment) {
            // Get today's date in YYYY-MM-DD format
            const today = new Date(`${date}T${"00:00"}:00.000Z`);
            // today.setHours(0, 0, 0, 0);
            // console.log(today);

            // Fetch schedule ID using doctor ID and today's date
            const schedule = await Schedule.findOne({ doctorId: doctor, date: today });
            // console.log(schedule);
            if (!schedule) {
                return res.status(404).json({ error: "Schedule not found for the given doctor and today's date" });
            }
            const scheduleId = schedule._id;

            // Convert slotTime to Date
            const fullSlotTime = new Date(`${date}T${slotTime || "00:00"}:00.000Z`);
            if (isNaN(fullSlotTime.getTime())) {
                return res.status(400).json({ error: "Invalid slotTime format" });
            }

            // Check if the slot exists and is available
            const slot = schedule.slots.find(
                (s) => s.time.getTime() === fullSlotTime.getTime() && s.status === "available"
            );

            if (!slot) {
                return res.status(400).json({ error: "Slot is not available" });
            }

            // Create the appointment
            const appointment = await Appointment.create({
                org_id,
                patientId: patient._id,
                doctorId: doctor,
                scheduleId,
                slotTime: fullSlotTime,
                reason,
            });

            // Update the slot status to "booked"
            await Schedule.updateOne(
                { _id: scheduleId, "slots.time": fullSlotTime },
                { $set: { "slots.$.status": "booked", "slots.$.bookedBy": patient._id } }
            );
        }

        patient.visitDates.push(visit._id);
        patient.lastVisit = new Date();
        await patient.save();

        res.status(201).json({ success: true, message: "Visit added successfully", data: visit });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};


// Add medical history
exports.addMedicalHistory = async (req, res) => {
    try {
        // console.log(req.body);
        let { org_id } = await getUserFromToken(req);
        const { visit, diagnosis, treatment, doctor } = req.body;

        const patient = await Patient.findOneAndUpdate(
            { _id: req.params.id, org_id },
            { $push: { medicalHistory: { visit, diagnosis, treatment, doctor } } },
            { new: true }
        );

        if (!patient) return res.status(404).json({ error: "Patient not found" });

        res.status(200).json({ success: true, message: "Medical history updated", data: patient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Add a prescription
exports.addPrescription = async (req, res) => {
    try {
        let { org_id } = await getUserFromToken(req);
        const { visit, prescriptionId } = req.body;

        const patient = await Patient.findOne({ _id: req.params.id, org_id });

        if (!patient) return res.status(404).json({ error: "Patient not found" });
        //check pricription, visit is valid or not
        if (!visit || !prescriptionId) {
            return res.status(400).json({ error: "Visit and Prescription ID are required" });
        }

        const prescription = await Prescription.findById(prescriptionId);

        if (!prescription) {
            return res.status(404).json({ error: "Prescription not found" });
        }
        const visitDate = await Visit.findById(visit);
        if (!visitDate) {
            return res.status(404).json({ error: "Visit not found" });
        }


        // Check if prescriptionId already exists
        const existingPrescription = patient.prescriptions.find(p => p.prescriptionId.toString() === prescriptionId);

        if (existingPrescription) {
            // Update the visit field instead of adding a duplicate entry
            await Patient.findOneAndUpdate(
                { _id: req.params.id, org_id, "prescriptions.prescriptionId": prescriptionId },
                { $set: { "prescriptions.$.visit": visit } }, // ✅ Update visit for existing prescription
                { new: true }
            );
        } else {
            // Add new prescription if it doesn't exist
            await Patient.findOneAndUpdate(
                { _id: req.params.id, org_id },
                { $push: { prescriptions: { visit, prescriptionId } } },
                { new: true }
            );
        }

        const updatedPatient = await Patient.findById(req.params.id);

        res.status(200).json({ success: true, message: "Prescription updated successfully", data: updatedPatient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//admit patient
exports.admitPatient = async (req, res) => {
    try {
        let { org_id } = await getUserFromToken(req);
        const { room, bed } = req.body;
        const patient = await Patient.findOneAndUpdate(
            { _id: req.params.id, org_id },
            { $set: { status: "Admitted", room } },
            { new: true }
        );
        if (!patient) return res.status(404).json({ error: "Patient not found" });
        res.status(200).json({ success: true, message: "Patient admitted successfully", data: patient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};


// Update discharge details
exports.updateDischarge = async (req, res) => {
    try {
        let { org_id } = await getUserFromToken(req);
        const { date, reason } = req.body;

        const patient = await Patient.findOneAndUpdate(
            { _id: req.params.id, org_id },
            {
                $set: {
                    status: "Discharged",
                    dischargeDetails: { date, reason },
                    room: null,
                    "admitDetails.$[elem].discharge": true // Correct array update
                }
            },
            {
                new: true,
                arrayFilters: [{ "elem": { $eq: { $last: "$admitDetails" } } }] // Targets last admit entry
            }
        );

        if (!patient) return res.status(404).json({ error: "Patient not found" });

        res.status(200).json({ success: true, message: "Discharge details updated", data: patient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// get all details of a patient by email / phone number / id 
// exports.getPatientDetails = async (req, res) => {
//     try {
//         console.log(req.body);
//         const { email, phone, id } = req.body;
//         let filter;
//         if (email) {
//             filter = { email };
//         } else if (phone) {
//             filter = { phone };
//         } else if (id) {
//             filter = { id };
//         }
//         const patient = await Patient.findOne({ $or: [{ email }, { phone }, { id: id }] })
//         .populate("doctorAssigned")
//         .populate("room")
//         .populate("appointments")
//         .populate({
//             path: "prescriptions.prescriptionId", 
//             model: "Prescription", 
//         })
//         .populate({
//             path: "visitDates", 
//             model: "Visit", 
//         }).populate("medicalHistory.visit");
//         console.log(patient);
//         if (!patient) return res.status(404).json({ error: "Patient not found" });
//         res.status(200).json({ success: true, data: patient });
//     } catch (error) {
//         res.status(500).json({ error: "Internal Server Error", details: error.message });
//     }
// };

exports.getPatientDetails = async (req, res) => {
    try {
        // console.log(req.body); // For debugging, shows the request body

        // Destructure email, phone, and id from request body
        const { email, phone, id } = req.body;

        // If none of the fields (email, phone, id) are provided, return an error
        if (!email && !phone && !id) {
            return res.status(400).json({ error: "No identifier (email, phone, or id) provided" });
        }

        // Construct a filter object based on the provided fields (email, phone, or id)
        let filter = {};

        if (email) {
            filter.email = email;
        } else if (phone) {
            filter.phone = phone;
        } else if (id) {
            filter.id = id;
        }

        // Now fetch the patient with the constructed filter
        const patient = await Patient.findOne(filter)
            .populate("doctorAssigned")
            .populate("org_id")
            .populate("room")
            .populate("appointments")
            .populate("prescriptions.prescriptionId")
            .populate("prescriptions.visit")
            .populate("visitDates")
            .populate("medicalHistory.visit")
            .populate("medicalHistory.doctor")
            .populate("messages")
            .populate({
                path: "labTests",
                populate: [
                    { path: "DoctorId" },
                    {
                        path: "report",
                        populate: [
                            { path: "performedBy" },
                            { path: "reviewedBy" }
                        ]
                    }
                ]
            });



        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.status(200).json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
