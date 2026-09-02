const Appointment = require("../models/Appointment");
const Patient = require("../models/Patients");
const Schedule = require("../models/Schedule");
const { getUserFromToken } = require("../utils/auth");

// Create a new appointment
exports.createAppointment = async (req, res) => {
    try {
        // let { org_id, userId } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        const userId = req.user._id;

        let { patient, doctorId, date, slotTime, reason, scheduleId } = req.body;
        // console.log(req.body);

        if (!patient || !doctorId || !date || !slotTime || !reason || !scheduleId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert slotTime to a proper Date object
        const fullSlotTime = new Date(`${date}T${slotTime}:00.000Z`);
        if (isNaN(fullSlotTime.getTime())) {
            return res.status(400).json({ error: "Invalid slotTime format" });
        }

        // Fetch schedule from DB
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
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
            patientId: patient,
            doctorId,
            date,
            slotTime: fullSlotTime,
            reason,
            scheduleId,
            createdBy: userId
        });

        // Update the slot status to "booked"
        await Schedule.updateOne(
            { _id: scheduleId, "slots.time": fullSlotTime },
            { $set: { "slots.$.status": "booked", "slots.$.bookedBy": patient } }
        );
        await Patient.updateOne({ _id: patient }, { $push: { appointments: appointment._id } });

        res.status(201).json({ success: true, message: "Appointment created successfully", data: appointment });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get all appointments for an org
exports.getAllAppointments = async (req, res) => {
    try {

        // if (isSuperAdmin) {
        //     const appointments = await Appointment.find().sort({ createdAt: -1 }).populate("patientId").populate("doctorId");
        //     return res.json({ success: true, data: appointments });
        // }
        const org_id = req.user.org_id;
        const appointments = await Appointment.find({ org_id }) // filter by org_id
            .sort({ createdAt: -1 })
            .populate("patientId")
            .populate("doctorId");
        // console.log(appointments);
        res.json({ success: true, data: appointments });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get an appointment by ID
exports.getAppointmentById = async (req, res) => {
    try {
        let { isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        if (!isSuperAdmin) {

            const appointment = await Appointment.findById(req.params.id, { org_id }).populate("patientId doctorId");
            if (!appointment) return res.status(404).json({ error: "Appointment not found" });
            res.json({ success: true, data: appointment });
        }
        else {
            const appointment = await Appointment.findById(req.params.id).populate("patientId doctorId");
            if (!appointment) return res.status(404).json({ error: "Appointment not found" });
            res.json({ success: true, data: appointment });

        }
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
//get all appointments for a doctor
exports.getDoctorAppointments = async (req, res) => {
    try {
        const { isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        const { doctorId } = req.params;
        if (isSuperAdmin) {
            const appointments = await Appointment.find({ doctorId }).populate("patientId doctorId");
            return res.json({ success: true, data: appointments });
        }

        const appointments = await Appointment.find({ doctorId: doctorId, org_id }).populate("patientId doctorId");
        res.json({ success: true, data: appointments });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// get all appointments for a patient
exports.getPatientAppointments = async (req, res) => {
    try {
        const { isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        const { patientId } = req.params;
        if (isSuperAdmin) {
            const appointments = await Appointment.find({ patientId }).populate("patientId doctorId");
            return res.json({ success: true, data: appointments });
        }

        const appointments = await Appointment.find({ patientId: patientId, org_id }).populate("patientId doctorId");
        res.json({ success: true, data: appointments });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
//get all appointments for a date
exports.getAppointmentsByDate = async (req, res) => {
    try {
        const {org_id, isSuperAdmin } = await getUserFromToken(req);
        const { date } = req.params;
        if (isSuperAdmin) {
            const appointments = await Appointment.find({ date }).populate("patientId doctorId");
            return res.json({ success: true, data: appointments });
        }

        const appointments = await Appointment.find({ date: date, org_id }).populate("patientId doctorId");
        res.json({ success: true, data: appointments });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}

// Update appointment details
exports.updateAppointment = async (req, res) => {
    // console.log("req.body", req.body);
    
    try {
        const { isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        const { slotTime, date, scheduleId, reason, patientId, doctorId, status } = req.body;

        let filter = isSuperAdmin ? {} : { org_id };

        // Ensure slotTime and date are provided
        if (!slotTime || !date) {
            return res.status(400).json({ error: "Both date and slotTime are required" });
        }

        // Convert slotTime into a valid Date object
        let fullSlotTime = new Date(`${date}T${slotTime}:00.000Z`);
        if (isNaN(fullSlotTime.getTime())) {
            return res.status(400).json({ error: "Invalid slotTime format" });
        }

       

        // Check if the slot is available
        if (scheduleId) {
            // console.log("Checking schedule for slot availability...");

            const schedule = await Schedule.findById(scheduleId);
            if (!schedule) {
                return res.status(404).json({ error: "Schedule not found" });
            }

            // Ensure the slot exists and is available
            const slot = schedule.slots.find(
                (s) => s.time.getTime() === fullSlotTime.getTime() && s.status === "available"
            );

            if (!slot) {
                return res.status(400).json({ error: "Slot is not available" });
            }


            // Free up the old slot if changing slot
            const oldAppointment = await Appointment.findById(req.params.id);
            if (oldAppointment && oldAppointment.slotTime) {
                const oldSlotTimeISO = new Date(oldAppointment.slotTime).toISOString();
                const newSlotTimeISO = fullSlotTime.toISOString();
                

                // Only update if the slot time is changing
                if (oldSlotTimeISO !== newSlotTimeISO) {
                    // console.log("Freeing old slot:", oldSlotTimeISO);

                    // Free up the old slot
                    const updateOldSlot = await Schedule.updateOne(
                        { _id: oldAppointment.scheduleId, "slots.time": new Date(oldSlotTimeISO) },
                        { $set: { "slots.$.status": "available", "slots.$.bookedBy": null } }
                    );

                    // console.log("Old slot updated:", updateOldSlot);

                    // console.log("Booking new slot:", newSlotTimeISO);

                    // Mark the new slot as booked
                    const updateNewSlot = await Schedule.updateOne(
                        { _id: scheduleId, "slots.time": new Date(newSlotTimeISO) },
                        { $set: { "slots.$.status": "booked", "slots.$.bookedBy": oldAppointment.patientId } }
                    );

                    // console.log("New slot booked:", updateNewSlot);
                }
            }
        }

        // 🚀 **Ensure slotTime is saved as a Date**
        req.body.slotTime = fullSlotTime;

        // Update the appointment
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { ...req.body, ...filter },
            { new: true }
        );

        if (!updatedAppointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        res.json({ success: true, message: "Appointment updated", data: updatedAppointment });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};


// Delete an appointment
// Delete an appointment
exports.deleteAppointment = async (req, res) => {
    try {
        const { isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;

        // Find appointment with access control
        const appointment = isSuperAdmin
            ? await Appointment.findById(req.params.id)
            : await Appointment.findOne({ _id: req.params.id, org_id });

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        // Store necessary references before deleting
        const { schedule: scheduleId, patient: patientId, slotTime } = appointment;

        // Delete the appointment
        await appointment.deleteOne();

        // Update Schedule: free the slot
        if (scheduleId && slotTime) {
            await Schedule.updateOne(
                { _id: scheduleId, "slots.time": slotTime },
                {
                    $set: {
                        "slots.$.status": "available",
                        "slots.$.bookedBy": null
                    }
                }
            );
        }

        // Remove appointment from Patient's appointments array
        if (patientId) {
            await Patient.updateOne(
                { _id: patientId },
                { $pull: { appointments: appointment._id } }
            );
        }

        res.json({ success: true, message: "Appointment deleted" });

    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

