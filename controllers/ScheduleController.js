// const MedicalStaff = require("../models/MedicalStaff")
// const ScheduleSchema = require("../models/Schedule")

// const createSchedule = async (req,res) =>{
//     try{
//      const {doctorId,day,startTime,endTime,slots} = req.body
//      const newSchedule = new ScheduleSchema({doctorId,day,startTime,endTime,slots})
//      await newSchedule.save()
//      await MedicalStaff.findByIdAndUpdate(doctorId,{$push:{schedule:newSchedule._id}})
//      res.status(200).json({success:true, message:"Schedule created successfully" , data:newSchedule})
//     }catch(error){
//         console.log(error)
//         res.status(500).json({success:false, message:error.message})
//     }
// }

// // ➤ Get Schedule by Doctor ID

// const getDoctorSchedule = async (req,res) =>{
//     try{
//      const {doctorId} = req.params
//      const schedule = await ScheduleSchema.find({doctorId})
//      res.status(200).json({success:true,message:"Schedule fetched successfully",data:schedule})
//     }catch(error){
//         console.log(error)
//         res.status(500).json({success:false, message:error.message})
//     }
// }

// const deleteSchedule = async (req,res) =>{
//     try{
//      const {scheduleId} = req.params
//      const schedule = await ScheduleSchema.findByIdAndDelete(scheduleId)
//      res.status(200).json({success:true, message:"Schedule deleted successfully" , data:schedule})
//     }catch{
//         console.log(error)
//         res.status(500).json({success:false, message:error.message})
//     }
// }

// const updateSchedule = async (req,res) =>{
//     try {
//         const {day,startTime,endTime,slots} = req.body
//         const {scheduleId} = req.params
//         const schedule = await ScheduleSchema.findById(scheduleId)
//         if(!schedule){
//             return res.status(400).json({success:false, message:"Schedule not found"})
//         }
//         schedule.day = day || schedule.day
//         schedule.startTime = startTime || schedule.startTime
//         schedule.endTime = endTime || schedule.endTime
//         schedule.slots = slots || schedule.slots
//         await schedule.save()
//         res.status(200).json({success:true, message:"Schedule updated successfully" , data:schedule})
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({success:false, message:error.message})
//     }
// }

// module.exports = {createSchedule, getDoctorSchedule, deleteSchedule, updateSchedule}



const MedicalStaff = require("../models/MedicalStaff");
const Schedule = require("../models/Schedule");
const { getUserFromToken } = require("../utils/auth");

//  Create a New Schedule with Break Time Support
exports.createSchedule = async (req, res) => {
    try {
        // console.log(req.body)
        const { org_id } = await getUserFromToken(req);
        const { doctorId, date, startTime, endTime, breakTime, slotDuration } = req.body;

        if (!doctorId || !date || !startTime || !endTime || !slotDuration || !breakTime) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let slots = [];
        let currentTime = new Date(startTime);
        const end = new Date(endTime);

        // Parse break times
        let breaks = breakTime.map(b => ({
            start: new Date(b.start),
            end: new Date(b.end)
        }));
        // check is Shedule is alereay preent ot not
        const existingSchedule = await Schedule.findOne({ doctorId, date });
        if (existingSchedule) {
            return res.status(400).json({ error: "Schedule already exists for this date" });
        }

        while (currentTime < end) {
            let slotEnd = new Date(currentTime);
            slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

            if (slotEnd > end) break;

            // Skip break times
            let isBreak = breaks.some(b => currentTime >= b.start && currentTime < b.end);
            if (!isBreak) {
                slots.push({ time: new Date(currentTime), status: "available" });
            }

            currentTime = slotEnd;
        }

        const schedule = await Schedule.create({ doctorId, date, startTime, endTime, breakTime, slots, org_id });
        // find the doctor and add the schedule to their schedule array
        await MedicalStaff.findByIdAndUpdate(doctorId, { $push: { schedule: schedule._id } });
        // console.log("success")
        res.status(201).json({ success: true, message: "Schedule created successfully", data: schedule });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Get All Schedules for a Doctor
exports.getSchedules = async (req, res) => {
    try {
        // console.log("req.params")
        const { doctorId } = req.params;
        const schedules = await Schedule.find({ doctorId }).populate("doctorId");
        res.json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Get Available Slots for a Specific Date
exports.getAvailableSlots = async (req, res) => {
    try {

        let { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ error: "Missing doctorId or date" });
        }
       

        const formattedDate = new Date(date);
        if (isNaN(formattedDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // console.log("Fetching schedule for:", doctorId, formattedDate);

        const schedule = await Schedule.findOne({
            doctorId: doctorId,
            date: formattedDate,
        });

        if (!schedule) {
            return res.status(404).json({ error: "No schedule found for this date" });
        }

        const availableSlots = schedule.slots.filter(slot => slot.status === "available");

        res.json({ success: true, data: availableSlots });
    } catch (error) {
        // console.error("Error fetching available slots:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Delete a Schedule
exports.deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        await Schedule.findByIdAndDelete(scheduleId);
        res.json({ success: true, message: "Schedule deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

//  Update a Schedule
exports.updateSchedule = async (req, res) => {
    try {
        // console.log(req.body)
        // console.log(req.params)
      const { org_id } = await getUserFromToken(req);
      const { scheduleId } = req.params;
      const { doctorId, startTime, endTime, breakTime, slotDuration, status } = req.body;
  
      if (!doctorId || !startTime || !endTime || !slotDuration || !breakTime) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // Validate schedule exists
      const existingSchedule = await Schedule.findById(scheduleId);
      if (!existingSchedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
  
      // Generate new slots excluding break times
      const newSlots = [];
      let currentTime = new Date(startTime);
      const end = new Date(endTime);
  
      const breaks = breakTime.map(b => ({
        start: new Date(b.start),
        end: new Date(b.end),
      }));
  
      while (currentTime < end) {
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
  
        if (slotEnd > end) break;
  
        const isBreak = breaks.some(b => currentTime >= b.start && currentTime < b.end);
        if (!isBreak) {
          newSlots.push({ time: new Date(currentTime), status: "available" });
        }
  
        currentTime = slotEnd;
      }
  
      // Update schedule
      const updatedSchedule = await Schedule.findByIdAndUpdate(
        scheduleId,
        {
          doctorId,
          startTime,
          endTime,
          slotDuration,
          breakTime,
          slots: newSlots,
          status,
          org_id,
        },
        { new: true }
      );
      // console.log("updatedSchedule")
  
      res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        data: updatedSchedule,
      });
    } catch (error) {
      // console.error("Update Schedule Error:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };
  
//  get all Schedules
exports.getAllSchedules = async (req, res) => {
    const { org_id, isSuperAdmin } = await getUserFromToken(req);

    try {
        let schedules;

        // If the user is a super admin, return all schedules from all organizations
        if (isSuperAdmin) {
            schedules = await Schedule.find().populate("doctorId");
        } else {
            // If the user is part of an organization, only return schedules for that organization
            schedules = await Schedule.find({ org_id }).populate("doctorId");
        }

        // Calculate the number of slots and available slots for each schedule
        const schedulesWithSlotCount = schedules.map(schedule => {
            const totalSlots = schedule.slots.length;
            const availableSlots = schedule.slots.filter(slot => slot.status === 'available').length;
            const filledSlots = totalSlots - availableSlots;

            return {
                ...schedule.toObject(),
                totalSlots, 
                availableSlots,
                filledSlots
            };
        });

        // Return the schedules along with the total slots and available slots
        res.json({ success: true, data: schedulesWithSlotCount });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
