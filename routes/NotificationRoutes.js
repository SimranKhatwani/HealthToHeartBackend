const express = require('express');
const { createNotification, getAllNotifications, deleteNotification, deleteAllNotifications, getPatientAllNotifications } = require('../controllers/NotificationController');
const { verifyTokenUser } = require("../middleware/Verification")

const NotificationsRoutes = express.Router();

NotificationsRoutes.post('/create-notification', verifyTokenUser, createNotification);
NotificationsRoutes.get('/get-notifications', verifyTokenUser, getAllNotifications);
NotificationsRoutes.get('/get-patient-notifications',getPatientAllNotifications);
NotificationsRoutes.delete('/delete-allnotifications',deleteAllNotifications);
NotificationsRoutes.delete('/delete-notification/:id',deleteNotification);

module.exports = NotificationsRoutes;