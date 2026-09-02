const Notifications = require("../models/Notification");
const SuperAdminSchema = require("../models/SuperAdmin")
const MedicalStaff = require("../models/MedicalStaff");
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Patient = require("../models/Patients");

const createNotification = async(req, res) => {
    try {
        const org_id = req.user.org_id;
        const { sender, receiver, message, notDesc } = req.body;
    
        // console.log("req.body", req.body)
        // Validate required fields
        if (!sender || !receiver || !message) {
          return res.status(400).json({ message: "Missing required fields: sender, receiver, message." });
        }
    
        // Create new notification instance
        const notification = new Notifications({
            org_id,
            sender,
            receiver,
            message,
            notDesc
        });
    
        // Save notification to database
        await notification.save();
        
        res.status(201).json({
          message: "Notification created successfully!",
          success: true,
          data: notification,
        });
      } catch (error) {
        // console.error("Error creating notification:", error);
        res.status(500).json({ 
            message: error.message 
        });
      }
}

const getAllNotifications = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await MedicalStaff.findById(decoded.userId) || await SuperAdminSchema.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = await Notifications.find({ receiver: user._id }).sort({ timestamp: -1 });

    if (!notifications.length) {
      return res.status(200).json({
        success: true,
        message: "No notifications available.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully!",
      data: notifications,
    });
  } catch (error) {
    // console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message
    });
  }
};

const getPatientAllNotifications = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await Patient.findOne({ email }); 

    if (!user) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const notifications = await Notifications.find({ receiver: user._id }).sort({ timestamp: -1 });

    if (!notifications.length) {
      return res.status(200).json({
        success: true,
        message: "No notifications available.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully!",
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Notification ID is required." });
    }
    // Check if ID is a valid ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID format." });
    }

    const deletedNotification = await Notifications.findByIdAndDelete({_id: id});

    if (!deletedNotification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    res.status(200).json({
      status: 200,
      message: "Notification deleted successfully.",
      data: deletedNotification,
    });
  } catch (error) {
    // console.error("Error deleting notification:", error);
    res.status(500).json({
      status: 400,
      message: "Failed to delete notification.",
      error: error.message
    });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notifications.deleteMany({}); 
    
    res.status(200).json({
      status: 200,
      message: "All notifications deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    // console.error("Error deleting all notifications:", error);
    res.status(500).json({
      status: 400,
      message: "Failed to delete all notifications.",
      error: error.message,
    });
  }
};



module.exports = { createNotification, getAllNotifications, deleteNotification, deleteAllNotifications, getPatientAllNotifications }