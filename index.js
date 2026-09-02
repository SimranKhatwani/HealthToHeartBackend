const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);


const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const fileUpload = require("express-fileupload");
const cors = require("cors");
const OrganizationRoutes = require("./routes/Organization");
const RoleRoutes = require("./routes/RoleRoutes");
const MedicalStaffRoutes = require("./routes/MedicalStaffRoutes");
const AuthRoutes = require("./routes/AuthRoute");
const AdminsRoutes = require("./routes/AdminsRoutes");
const PatientRoutes = require("./routes/PatientRoutes");
const OperationRoutes = require("./routes/OperationRoutes");
const BloodBankRoutes = require("./routes/BloodBankRoutes");
const InventoryRoutes = require("./routes/InventoryRoutes");
const ScheduleRoutes = require("./routes/ScheduleRoutes");
const AppointmentRoutes = require("./routes/AppointmentRoutes");
const PrescriptionRoutes = require("./routes/Prescription");
const UtillsRoutes = require("./routes/UtillsRoutes");
const ShiftsRoutes = require("./routes/ShiftsRoutes");
const InsuranceRoutes = require("./routes/InsuranceRoutes");

const otpRoutes = require("./routes/otpRoutes");
const PendingAppointmentsRoutes = require("./routes/PendingAppointmentsRoutes");
const MealPlansRoutes = require("./routes/MealPlansRoutes");
const GenAiRotes = require("./routes/GenAiRotes");
const labTestRoutes = require("./routes/labTestRoutes");
const TestReportRoutes = require("./routes/TestReportRoutes");
const RoomRoutes = require("./routes/RoomRoutes");
const NotificationRoutes = require("./routes/NotificationRoutes");
const PermissionRoutes = require("./routes/PermissionRoute")
const socket = require("socket.io");
const ReportRoutes = require("./routes/ReportRoutes");
const aiDiagnosticRoutes = require("./routes/aiDiagnosticRoutes");
const BillingRoutes = require("./routes/BillingRoutes");
const MessagesRoutes = require("./routes/MessageRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(fileUpload());
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173',
  "http://localhost:5000",

];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,  // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use("/api/operations", OperationRoutes)
app.use("/api/organization", OrganizationRoutes);
app.use("/api/roles", RoleRoutes);
app.use("/api/medicalstaff", MedicalStaffRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/MospiltalAdmin", AdminsRoutes);
app.use("/api/patients", PatientRoutes);
app.use("/api/schedules", ScheduleRoutes)
app.use("/api/blood-bank", BloodBankRoutes)
app.use("/api/inventory", InventoryRoutes)
app.use("/api/appointments", AppointmentRoutes)
app.use("/api/prescription", PrescriptionRoutes)
app.use("/api/shift", ShiftsRoutes)
app.use("/api/insurance", InsuranceRoutes)
app.use("/api/utills", UtillsRoutes)

app.use("/api/otp", otpRoutes);
app.use("/api/pending-appointments", PendingAppointmentsRoutes);
app.use("/api/meal-plans", MealPlansRoutes);
app.use("/api/gen-ai-rotes", GenAiRotes);
app.use("/api/labtests", labTestRoutes);
app.use("/api/report", TestReportRoutes);
app.use("/api/diagnostics", aiDiagnosticRoutes);
app.use("/api/room", RoomRoutes);
app.use("/api/notification", NotificationRoutes);
app.use("/api/permission", PermissionRoutes);
app.use("/api/reports", ReportRoutes);
app.use("/api/billing", BillingRoutes);
app.use("/api/message", MessagesRoutes);


// Connect to MongoDB
const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};


// Start the server
connectToDb().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173", // no trailing slash
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  global.onlineUsers = new Map();

  io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}`);
    global.HMASocket = socket;
    // console.log(`User connected: ${socket.id}`);

    // Track Online Users
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);

      const onlineUsersArray = Array.from(onlineUsers.entries()).map(
        ([userId, socketId]) => ({ userId, socketId })
      );

      // console.log("Current Online Users:", onlineUsersArray);

      io.emit("getOnlineUsers", onlineUsersArray);
    });

    // Handle User Disconnect
    socket.on("disconnect", () => {
      const userId = [...onlineUsers].find(([id, sockId]) => sockId === socket.id)?.[0];

      if (userId) {
        // console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);
        onlineUsers.delete(userId);
        io.emit("user-logout", { userId });

        const onlineUsersArray = Array.from(onlineUsers.entries()).map(
          ([userId, socketId]) => ({ userId, socketId })
        );

        // console.log("Updated Online Users After Disconnect:", onlineUsersArray);
        io.emit("getOnlineUsers", onlineUsersArray);
      }
    });

    // Handle Operation Schedule
    socket.on("operation-scheduled", (data) => {
      // console.log("Received 'assign-client' event with data:", data);

      const sendUserSocket = onlineUsers.get(data.to);

      if (sendUserSocket) {
        // console.log(`operation: ${data.to}, Socket ID: ${sendUserSocket}`);
        io.to(sendUserSocket).emit("schedule-Operation", {
          message: "An operation has been schedule for you",
        });
      } else {
        // console.log(`User ${data.to} is not online, unable to send notification.`);
      }
    });

    socket.on("appointment-scheduled", (data) => {
      // console.log("Received 'assign-client' event with data:", data);

      const sendUserSocket = onlineUsers.get(data.to);

      if (sendUserSocket) {
        // console.log(`appointment: ${data.to}, Socket ID: ${sendUserSocket}`);
        io.to(sendUserSocket).emit("schedule-appointment", {
          message: "An appointment has been schedule for you",
        });
      } else {
        // console.log(`User ${data.to} is not online, unable to send notification.`);
      }
    });

    socket.on("meal-plan-assigned", (data) => {
      // console.log("Received 'assign-client' event with data:", data);

      const sendUserSocket = onlineUsers.get(data.to);

      if (sendUserSocket) {
        // console.log(`appointment: ${data.to}, Socket ID: ${sendUserSocket}`);
        io.to(sendUserSocket).emit("assign-meal-plan", {
          message: "Meal plan assign to you",
        });
      } else {
        // console.log(`User ${data.to} is not online, unable to send notification.`);
      }
    });

    socket.on("notification-sent", (data) => {
      // console.log("data", data)
      const sendUserSocket = Array.isArray(data.to)
        ? data.to.map(userId => onlineUsers.get(userId))
        : onlineUsers.get(data.to);
      if (sendUserSocket) {
        io.to(sendUserSocket).emit("notification-received", {
          message: data.message,
          notDesc: data.notDesc
        });
      } else {
        // console.log(`User ${data.to} is not online, unable to send notification.`);
      }
    });

    socket.on("message-sent", (data) => {
      // console.log("data", data)
      const sendUserSocket = Array.isArray(data.to)
        ? data.to.map(userId => onlineUsers.get(userId))
        : onlineUsers.get(data.to);
      if (sendUserSocket) {
        io.to(sendUserSocket).emit("message-received", {
          message: data.message,
        });
      } else {
        // console.log(`User ${data.to} is not online, unable to send notification.`);
      }
    });
  });
});


