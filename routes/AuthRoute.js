const express = require("express");
const { loginPatientController } = require("../controllers/AuthpatientsController");
const { loginStaffController, logout} = require("../controllers/AuthStaffController");


const AuthRoutes = express.Router();


AuthRoutes.post("/login", loginPatientController);
AuthRoutes.post("/staff-login", loginStaffController);
//logout
AuthRoutes.post("/logout", logout);


module.exports = AuthRoutes;
