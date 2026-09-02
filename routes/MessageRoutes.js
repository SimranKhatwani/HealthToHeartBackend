const express = require('express');
const { createMessage, getMessages, getAllMessages } = require('../controllers/MessageController');
const { verifyTokenUser } = require('../middleware/Verification');

const MessagesRoutes = express.Router();

MessagesRoutes.post('/', verifyTokenUser, createMessage);
MessagesRoutes.get('/', verifyTokenUser, getMessages);
MessagesRoutes.get('/all', verifyTokenUser, getAllMessages);
// NotificationsRoutes.get('/get-notifications', getAllNotifications);
// NotificationsRoutes.get('/get-patient-notifications', getPatientAllNotifications);
// NotificationsRoutes.delete('/delete-notification/:id',deleteNotification);
// NotificationsRoutes.delete('/delete-allnotifications',deleteAllNotifications);
module.exports = MessagesRoutes;