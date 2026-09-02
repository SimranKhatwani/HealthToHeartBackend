const express = require('express');
const { createRoom, updateRoom, getAllRooms, getRoomById, DeleteRoom, createRoomAssignment, getRoomAssignments, deleteRoomAssignment } = require('../controllers/RoomController');
const { verifyTokenUser } = require("../middleware/Verification")

const RoomRoutes = express.Router();

RoomRoutes.post("/create", verifyTokenUser, createRoom);
RoomRoutes.get("/get", verifyTokenUser, getAllRooms)
RoomRoutes.get("/get-room/:roomId", getRoomById); 
RoomRoutes.put("/update/:roomId", updateRoom); 
RoomRoutes.delete("/delete/:roomId", DeleteRoom);
RoomRoutes.post("/assign-room", verifyTokenUser, createRoomAssignment);
RoomRoutes.get("/get-assign-room", verifyTokenUser, getRoomAssignments);
RoomRoutes.delete("/delete-assign-room/:assignmentId", deleteRoomAssignment);


module.exports = RoomRoutes;
