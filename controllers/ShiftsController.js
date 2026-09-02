const Shift = require("../models/Shifts");
const { getUserFromToken } = require("../utils/auth");

// Create a new shift
exports.createShift = async (req, res) => {
    try {
        const { userId, org_id, isAdmin } = await getUserFromToken(req);
        

        let { staffId, date, startTime, endTime, status, breakTime } = req.body;

        // Validate required fields
        if (!staffId || !date || !startTime || !endTime) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert date string to Date object
        const shiftDate = new Date(date);
        if (isNaN(shiftDate)) return res.status(400).json({ error: "Invalid date format" });

        // Get day name from date
        const day = shiftDate.toLocaleDateString("en-US", { weekday: "long" });

        // Convert startTime to hours for determining shift type
        const startHour = parseInt(startTime.split(":")[0], 10);
        if (breakTime && breakTime.start && breakTime.end) {
            // const shiftDate = new Date(date);
            
            breakTime.start = breakTime.start;
            breakTime.end = breakTime.end;
            // breakTime.start = `${shiftDate.toISOString().split('T')[0]}T${breakTime.start}:00+05:30`;
            // breakTime.end = `${shiftDate.toISOString().split('T')[0]}T${breakTime.end}:00+05:30`;
        }

        let type;
        if (startHour >= 5 && startHour < 12) type = "Morning";
        else if (startHour >= 12 && startHour < 18) type = "Day";
        else if (startHour >= 18 && startHour < 22) type = "Evening";
        else type = "Night";

        // Check if shift already exists
        const existingShift = await Shift.findOne({ staffId, date: shiftDate, org_id });
        if (existingShift) return res.status(400).json({ error: "Shift already exists for this staff member on this date" });
        
        // Create shift object
        const shift = new Shift({
            staffId,
            date: shiftDate,
            day,
            startTime,
            endTime,
            type,
            status,
            breakTime,
            org_id,
            createdBy: userId
        });

        await shift.save();
        res.status(201).json({ success: true, message: "Shift created successfully", shift });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get all shifts
exports.getAllShifts = async (req, res) => {
    try {
        const { org_id, isAdmin } = await getUserFromToken(req);

        const shifts = await Shift.find({ org_id }).populate("staffId org_id");
        res.json({ success: true, shifts });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get a shift by ID
exports.getShiftById = async (req, res) => {
    try {
        const { org_id, isSuperAdmin } = await getUserFromToken(req);

        // Apply filter logic for superadmin
        const filter = { _id: req.params.id };
        if (!isSuperAdmin) {
            filter.org_id = org_id;
        }

        const shift = await Shift.findOne(filter).populate("staffId org_id");
        if (!shift) return res.status(404).json({ error: "Shift not found" });

        res.json({ success: true, shift });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Update a shift by ID
exports.updateShift = async (req, res) => {
    try {
        const { org_id, isAdmin } = await getUserFromToken(req);

        const { staffId, date, startTime, endTime, status, breakTime } = req.body;

        // Validate date
        const shiftDate = date ? new Date(date) : undefined;
        if (shiftDate && isNaN(shiftDate)) return res.status(400).json({ error: "Invalid date format" });

        // Get day name from date if date is provided
        const day = shiftDate ? shiftDate.toLocaleDateString("en-US", { weekday: "long" }) : undefined;

        // Determine shift type based on startTime
        const startHour = startTime ? parseInt(startTime.split(":")[0], 10) : undefined;
        let type;
        if (startHour !== undefined) {
            type = startHour < 12 ? "Morning" : startHour < 18 ? "Day" : startHour < 22 ? "Evening" : "Night";
        }

        const updatedShift = await Shift.findOneAndUpdate(
            { _id: req.params.id, org_id },
            { staffId, date: shiftDate, day, startTime, endTime, type, status, breakTime },
            { new: true }
        );

        if (!updatedShift) return res.status(404).json({ error: "Shift not found" });

        res.json({ success: true, message: "Shift updated successfully", updatedShift });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Delete a shift by ID
exports.deleteShift = async (req, res) => {
    try {
        const { org_id, isAdmin, isSuperAdmin } = await getUserFromToken(req);
        let deletedShift;
        if (isSuperAdmin) {
            deletedShift = await Shift.findOneAndDelete({ _id: req.params.id });

        }

        deletedShift = await Shift.findOneAndDelete({ _id: req.params.id, org_id });

        if (!deletedShift) return res.status(404).json({ error: "Shift not found" });

        res.json({ success: true, message: "Shift deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get shifts for a specific staff member
exports.getShiftsByStaffId = async (req, res) => {
    try {
        const { org_id } = await getUserFromToken(req);
        const shifts = await Shift.find({ staffId: req.params.staffId, org_id }).populate("staffId org_id");
        res.json({ success: true, shifts });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get shifts for a specific organization (only for superadmin)
exports.getShiftsByOrganization = async (req, res) => {
    try {
        const { isSuperAdmin } = await getUserFromToken(req);
        if (!isSuperAdmin) return res.status(403).json({ error: "Forbidden: Superadmin access required" });

        const shifts = await Shift.find({ org_id: req.params.orgId }).populate("staffId org_id");
        res.json({ success: true, shifts });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get shifts for a specific day
exports.getShiftsByDay = async (req, res) => {
    try {
        const { org_id, isSuperAdmin } = await getUserFromToken(req);

        let shifts;
        if (isSuperAdmin) {

            shifts = await Shift.find({ day: req.params.day }).populate("staffId org_id");
        }
        shifts = await Shift.find({ day: req.params.day, org_id }).populate("staffId org_id");
        res.json({ success: true, shifts });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get active shifts
exports.getActiveShifts = async (req, res) => {
    try {
        const { org_id } = await getUserFromToken(req);
        const shifts = await Shift.find({ status: "active", org_id }).populate("staffId org_id");
        res.json({ success: true, shifts });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
