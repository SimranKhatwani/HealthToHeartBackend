const Room = require("../models/RoomSchema"); 
const jwt = require('jsonwebtoken');
const SuperAdmin = require("../models/SuperAdmin");
const RoomAssignment = require("../models/RoomAssignmentSchema")


const createRoom = async (req, res) => {
  const org_id = req.user.org_id;
  // let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);

  try {
    const {
      room_number,
      room_name,
      bedsCount,
      occupiedBedsCount,
      roomType,
      roomStatus
    } = req.body;

    // Ensure org_id remains valid even for superadmin
    // if (isSuperAdmin || isAdmin) {
    //   org_id = req.body.org_id || req.params.org_id || org_id;
    // }

    if (!org_id) {
      return res.status(400).json({ message: "Missing org_id. Cannot create room." });
    }

    if (!room_number || !room_name || !roomType || !occupiedBedsCount || !roomStatus) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const newRoom = new Room({
      room_number,
      room_name,
      org_id,
      bedsCount,
      roomType,
      occupiedBedsCount,
      roomStatus
    });

    const savedRoom = await newRoom.save();

    return res.status(201).json({
      message: "Room created successfully.",
      data: savedRoom,
    });
  } catch (error) {
    // console.error("Error creating room:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getAllRooms = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const rooms = await Room.find({org_id});
    res.status(200).json({ success: true, message: "Rooms fetched successfully", data: rooms });
  } catch (error) {
    // console.error("Error fetching rooms:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRoomById = async (req,res) =>{
    try {
     const {roomId} = req.params
     const room = await Room.findById(roomId)
     res.status(200).json({success:true, message:"Room fetched successfully",data:room})
    } catch(error){
      // console.log("error",error)
      res.status(500).json({success:false, message:error.message})
    }
}

const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      room_number,
      room_name,
      bedsCount,
      occupiedBedsCount,
      roomType,
      roomStatus,
    } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    // Only update fields if they are provided
    if (room_number !== undefined) room.room_number = room_number;
    if (room_name !== undefined) room.room_name = room_name;
    if (bedsCount !== undefined) room.bedsCount = bedsCount;
    if (occupiedBedsCount !== undefined) room.occupiedBedsCount = occupiedBedsCount;
    if (roomType !== undefined) room.roomType = roomType;
    if (roomStatus !== undefined) room.roomStatus = roomStatus;
  
    const updatedRoom = await room.save();

    return res.status(200).json({
      message: "Room updated successfully.",
      data: updatedRoom,
    });
  } catch (error) {
    // console.error("Error updating room:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const DeleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findById(roomId);
    
        if (!room) {
            return res.status(400).json({ success: false, message: "Room not found" });
        }
    
        await Room.findByIdAndDelete(roomId); // Corrected this line
    
        res.status(200).json({ success: true, message: "Room deleted successfully", data: room });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createRoomAssignment = async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const {
      patientId,
      roomId,
      bedNumber,
      // assignedBy,
      admissionDate,
      expectedDischarge,
      notes,
    } = req.body;

    // Validation
    if (!patientId || !roomId || !bedNumber) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const assignment = new RoomAssignment({
      patientId,
      roomId,
      bedNumber,
      // assignedBy,
      admissionDate,
      expectedDischarge,
      notes,
      org_id
    });

    const savedAssignment = await assignment.save();

    res.status(201).json({
      message: 'Room assigned successfully',
      data: savedAssignment,
    });
  } catch (error) {
    // console.error('Error creating room assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getRoomAssignments = async (req, res) => {
  try {
    const org_id = req.user.org_id;
    const assignments = await RoomAssignment.find({org_id})
      .populate('patientId', 'id name age gender') 
      .populate('roomId', 'room_number roomType')

    res.status(200).json(assignments);
  } catch (error) {
    // console.error('Error fetching room assignments:', error);
    res.status(500).json({ message: 'Failed to fetch room assignments' });
  }
};

const deleteRoomAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await RoomAssignment.findByIdAndDelete(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: 'Room assignment not found' });
    }

    res.status(200).json({ message: 'Room assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting room assignment:', error);
    res.status(500).json({ message: 'Failed to delete room assignment' });
  }
};


module.exports = { createRoom, getAllRooms, getRoomById, updateRoom , DeleteRoom, createRoomAssignment, getRoomAssignments, deleteRoomAssignment};
