const PendingAppointment = require("../models/PendingAppointment");
const Schedule = require("../models/Schedule");
const Patient = require("../models/Patients");

// Create Pending Appointment
exports.createPendingAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, scheduleId, slotTime, reason, org_id } = req.body;

        // console.log(req.body);

        if (!patientId || !doctorId || !scheduleId || !slotTime || !org_id) {
            // console.log("Missing required fields");
            return res.status(400).json({ error: "Missing required fields" });
        }

        const schedule = await Schedule.findById(scheduleId);
        // console.log("schedule");
        if (!schedule) return res.status(404).json({ error: "Schedule not found" });

        const slot = schedule.slots.find(
            (s) => new Date(s.time).getTime() === new Date(slotTime).getTime() && s.status === "available"
        );
        if (!slot) return res.status(400).json({ error: "Slot is not available" });

        const newAppointment = await PendingAppointment.create({
            patientId,
            doctorId,
            scheduleId,
            slotTime,
            reason,
            org_id
        });

        res.status(201).json({
            success: true,
            message: "Pending appointment created",
            data: newAppointment
        });
    } catch (err) {
        // console.error("Create Pending Appointment Error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Get all pending appointments
exports.getAllPendingAppointments = async (req, res) => {
    try {
        const { org_id } = req.query;

        const filter = org_id ? { org_id } : {};
        const data = await PendingAppointment.find(filter).populate("doctorId patientId scheduleId");

        res.json({ success: true, data });
    } catch (err) {
        // console.error("Get All Pending Appointments Error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Get single pending appointment by ID
exports.getPendingAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await PendingAppointment.findById(id).populate("doctorId patientId scheduleId");

        if (!appointment) return res.status(404).json({ error: "Pending appointment not found" });

        res.json({ success: true, data: appointment });
    } catch (err) {
        // console.error("Get Pending Appointment By ID Error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Update pending appointment
exports.updatePendingAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await PendingAppointment.findByIdAndUpdate(id, req.body, { new: true });

        if (!updated) return res.status(404).json({ error: "Pending appointment not found" });

        res.json({ success: true, message: "Pending appointment updated", data: updated });
    } catch (err) {
        // console.error("Update Pending Appointment Error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Delete pending appointment
exports.deletePendingAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PendingAppointment.findByIdAndDelete(id);

        if (!deleted) return res.status(404).json({ error: "Pending appointment not found" });

        res.json({ success: true, message: "Pending appointment deleted" });
    } catch (err) {
        // console.error("Delete Pending Appointment Error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Get pending appointments for a patient
exports.getPendingAppointmentsForPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        // console.log("patientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientIdpatientId",patientId);
        const appointments = await PendingAppointment.find({ patientId }).populate("doctorId patientId scheduleId");

        res.json({ success: true, data: appointments });
    } catch (err) {
        // console.error("Get Pending Appointments for Patient Error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};