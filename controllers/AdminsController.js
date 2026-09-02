const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdmin");
const MedicalStaff = require("../models/MedicalStaff");
const PatientSchema = require("../models/Patients");
const { v4: uuidv4 } = require("uuid");


const getUserFromToken = async (req) => {
    const token = req.cookies.token;
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("JWT_SECRET decodeddecodeddecodeddecodeddecodeddecodeddecodeddecodeddecodeddecodeddecodeddecoded", decoded);
    const user = await SuperAdmin.findById(decoded.userId);
    
    if (!user) throw new Error("Unauthorized: User not found");

    let org_id = user.org_id;
    if (user?.role === "superadmin") {
        org_id = req.params.org || req.body.org || org_id || null;
    }
    let isAdmin = (user?.role === 'admin' || user?.role === 'superadmin' );
    let isSuperAdmin = (user?.role === 'superadmin' );
    return { userId: user._id, org_id , isAdmin , isSuperAdmin };
};


// Create SuperAdmin
const createAdmins = async (req, res) => {
    try {
        const {  isSuperAdmin } = await getUserFromToken(req);
        let { first_name, last_name, email, password, phone, role, org_id } = req.body;
        email = email.toLowerCase();

        if (!isSuperAdmin) {
            return res.status(403).json({ message: "Unauthorized: Trying to create admins" });
        }

        // Check if email already exists
        const existingUser = await SuperAdmin.findOne({ email }) || await MedicalStaff.findOne({ email }) || await PatientSchema.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const newSuperAdmin = new SuperAdmin({
            user_id: uuidv4(),
            first_name,
            last_name,
            name: `${first_name}${last_name?" "+last_name:""}`,
            email,
            password: hashedPassword,
            previewPassword: password,
            phone,
            role: role || "admin",
            org_id
        });

        await newSuperAdmin.save();

        res.status(201).json({ message: "Admin created successfully", data: newSuperAdmin });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Get All SuperAdmins
const getAllSuperAdmins = async (req, res) => {
    try {
        const { isSuperAdmin, isAdmin, org_id } = await getUserFromToken(req);
        if (isSuperAdmin) {
        
            const admins = await SuperAdmin.find();
            res.status(200).json({ success: true, data: admins });
        } else if (isAdmin) {
            const admins = await SuperAdmin.find({ org_id });
            res.status(200).json({ success: true, data: admins });

        }
        else {
            res.status(403).json({ message: "Unauthorized: Trying to get all admins" });
        }
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Get SuperAdmin by ID
const getSuperAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await SuperAdmin.findOne({_id: id});
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.status(200).json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Update SuperAdmin
const updateSuperAdmin = async (req, res) => {
    try {
        const { isSuperAdmin, isAdmin } = await getUserFromToken(req);
        if (!isSuperAdmin && !isAdmin) {
            return res.status(403).json({ message: "Unauthorized: Trying to update admins" });
        }

        const { id } = req.params;
        let { first_name, last_name, phone, status } = req.body;

        const updates = {
            ...(first_name && { first_name }),
            ...(last_name && { last_name }),
            ...(phone && { phone }),
            ...(status && { status }),
        };

        if (first_name || last_name) {
            updates.name = `${first_name || ''}${last_name ? ' ' + last_name : ''}`;
        }

        // Handle avatar upload if provided via req.files
        if (req.files?.avatar) {
            updates.avatar = {
                data: req.files.avatar.data,  // Assuming data is available for direct access
                contentType: req.files.avatar.mimetype, // Assuming mimetype is available
            };
        }

        // Merge updates and ensure only defined fields are updated
        const fieldsToUpdate = {};
        for (let key in updates) {
            if (updates[key] !== undefined && updates[key] !== null && updates[key] !== '') {
                fieldsToUpdate[key] = updates[key];
            }
        }

        // Perform the update
        const admin = await SuperAdmin.findOneAndUpdate(
            { _id: id },
            fieldsToUpdate,
            { new: true }
        );

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ message: "Admin updated successfully", data: admin });
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getAdminAvatar = async (req, res) => {
  try {
    const admin = await SuperAdmin.findById(req.params.id);

    if (!admin || !admin.avatar || !admin.avatar.data) {
      return res.status(404).send("No avatar found");
    }

    res.set("Content-Type", admin.avatar.contentType);
    res.send(admin.avatar.data);
  } catch (err) {
    res.status(500).send("Error retrieving avatar");
  }
};

// Delete SuperAdmin
const deleteSuperAdmin = async (req, res) => {
    try {
        const { isSuperAdmin } = await getUserFromToken(req);
        if (!isSuperAdmin) {
            return res.status(403).json({ message: "Unauthorized: Trying to delete admins 🌚" });
        }
        const { id } = req.params;
        const admin = await SuperAdmin.findOneAndDelete({ _id: id });

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

module.exports = {
    createAdmins,
    getAllSuperAdmins,
    getSuperAdminById,
    getAdminAvatar,
    updateSuperAdmin,
    deleteSuperAdmin
};
