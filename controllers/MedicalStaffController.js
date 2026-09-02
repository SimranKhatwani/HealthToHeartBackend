const MedicalStaff = require("../models/MedicalStaff");
const Organization = require("../models/Organization");
const Education = require("../models/Education");
const Experience = require("../models/Experience");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");
const shortUUID = require("short-uuid");
const bcrypt = require("bcrypt");
const SuperAdmin = require("../models/SuperAdmin");
const AWS = require("aws-sdk");


const translator = shortUUID("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");

const s3 = new AWS.S3({
    endpoint:"https://nyc3.digitaloceanspaces.com",
    region:"us-east-1",
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRETACCESSKEY
  });

// Function to generate ID based on role
const generateShortId = (roleName) => {
    const prefixMap = {
        Doctor: "DOC",
        Nurse: "NUR",
        WardBoy: "WRD",
        Staff: "STF",
    };
    const prefix = prefixMap[roleName] || "GEN"; // Default to "GEN"
    return `${prefix}-${translator.generate().slice(0, 5)}`;
};
const getUserFromToken = async (req) => {
    const authorization = req.headers.authorization;
    const token = req.cookies.token || authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await SuperAdmin.findById(decoded.userId);

    if (!user) {
        user = await MedicalStaff.findById(decoded.userId);
    }

    if (!user) throw new Error("Unauthorized: User not found");

    let org_id = user.org_id;
    const role = user.role || decoded.role;
    
    if (role === "superadmin") {
        org_id = req.params.org || req.body.org || org_id || null;
    }
    let isAdmin = (role === 'admin' || role === 'superadmin' || role === 'Hospital Administrator');
    let isSuperAdmin = (role === 'superadmin');
    return { userId: user._id, org_id, isAdmin, isSuperAdmin };
};


/**
 * @desc Create a new medical or non-medical staff member
 * @route POST /api/staff
 */
exports.createStaff = async (req, res) => {

    try {
        let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);
        let {
            prefix, first_name, last_name, email, phone, gender, avatar, joinDate, status, roleName, category, department, specialization,
            educationDetails, experienceDetails, experienceYears,
            description, availability, schedule, password
        } = req.body;

        if (isSuperAdmin) {
            org_id = req.body.org_id || req.params.org_id || org_id || null;
        }
        
        if (isAdmin || isSuperAdmin) {
            
            // Validate required fields
            if (!first_name || !email || !roleName || !org_id || !category || !password) {
                console.log("Missing fields in createStaff:", req.body);
                return res.status(400).json({ error: "Missing required fields" });
            }
            
            // Fetch role details
            const role = await Role.findOne({ role_name: roleName , org_id }); // Find role by name
            // console.log("org_id", org_id);

            if (!role) {
                return res.status(404).json({ error: "Role not found" });
            }

            const role_id = role._id;
            // hash password
            let previewPassword;
            if (password) {
                previewPassword = password;
                const salt = await bcrypt.genSalt(7);
                const hashedPassword = await bcrypt.hash(password, salt);
                password = hashedPassword;
            }

            // Generate unique ID
            const id = generateShortId(role.role_name);

            // Check if email already exists
            const existingUser = await SuperAdmin.findOne({ email }) || await MedicalStaff.findOne({ email }) || await require("../models/Patients").findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: "Email already exists" });
            }

            // Create new staff record
            const staff = await MedicalStaff.create({
                id,
                prefix,
                first_name, last_name,
                name: `${prefix ? prefix + ". " : ""}${first_name}${last_name ? " " + last_name : ""}`,
                email,
                phone,
                gender,
                ...(avatar && typeof avatar === "object" && avatar.data
                    ? { avatar }
                    : {}),
                joinDate: joinDate || Date.now(),
                status: status || "active",
                org_id,
                role_id,
                category,
                department,
                specialization,
                educationDetails,
                experienceDetails,
                experienceYears,
                description,
                availability: availability || false,
                schedule,
                password,
                previewPassword
            });
            // console.log("res- suscess");

            res.status(201).json({ success: true, message: "Staff created successfully", data: staff });
        }
        else{

            res.status(403).json({ error: "Unauthorized: Trying to create staff" });
        }
    } catch (error) {
        // console.log(error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

/**
 * @desc Get all medical and non-medical staff
 * @route GET /api/staff
 */
exports.getAllStaff = async (req, res) => {
    try {
        // const { isAdmin, isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        // if (!isAdmin && !isSuperAdmin) {
        if (!org_id) {
            return res.status(403).json({ error: "Unauthorized: Trying to get all staff" });
        }
        const staff = await MedicalStaff.find({org_id})
            .populate("role_id", "role_name")
            .populate("org_id", "org_name")
            .populate("education")
            .populate("experience")
            .populate("schedule");

        // console.log("staff", staff)
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        // console.log("error", error)
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
exports.getAllStaffCategory = async (req, res) => {
    try {
        // console.log("req.params", req.params, req.query)
        // const { isAdmin, isSuperAdmin, org_id } = await getUserFromToken(req);
        // if (!isAdmin && !isSuperAdmin) {
        //     return res.status(403).json({ error: "Unauthorized: Trying to get all staff" });
        // }
        const org_id = req.user.org_id;
        const staffRoles = await Role.find({ role_name: req.params.role_name,  org_id: org_id});
        // console.log("staffRoles", staffRoles)
        const staff = await MedicalStaff.find({role_id: staffRoles[0]?._id, org_id: req.query.orgId })
            .populate("role_id", "role_name")
            .populate("org_id", "org_name")
            .populate("education")
            .populate("experience")
            .populate("schedule");

        // console.log("staff", staff)
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        // console.log("error", error)
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

/**
 * @desc Get a single staff member by ID
 * @route GET /api/staff/:id
 */
exports.getStaffById = async (req, res) => {
    try {
        // const { isAdmin, isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        // if (!isAdmin && !isSuperAdmin) {
        if (!org_id) {
            return res.status(403).json({ error: "Unauthorized: Trying to get all staff" });
        }
        const staff = await MedicalStaff.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] })
            .populate("role_id", "role_name")
            .populate("org_id", "org_name")
            .populate("education")
            .populate("experience")
            .populate("schedule");

        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

/**
 * @desc Update staff member details
 * @route PUT /api/staff/:id
 */
exports.updateStaff = async (req, res) => {
    // console.log(req.body)
    try {
        // const { isAdmin, isSuperAdmin } = await getUserFromToken(req);
        const org_id = req.user.org_id;
        // if (isAdmin || isSuperAdmin) {

            const updates = req.body;
            if (updates.password) {
                const salt = await bcrypt.genSalt(7);
                const hashedPassword = await bcrypt.hash(updates.password, salt);
                updates.previewPassword = updates.password;
                updates.password = hashedPassword;
            }
            if (updates.prefix || updates.first_name || updates.last_name) {
                updates.name = `${updates.prefix ? updates.prefix + ". " : ""}${updates.first_name}${updates.last_name ? " " + updates.last_name : ""}`;
                
            }
            const staff = await MedicalStaff.findOneAndUpdate({ id: req.params.id }, updates, { new: true });

            if (!staff) {
                return res.status(404).json({ error: "Staff member not found" });
            }

            res.status(200).json({ success: true, message: "Staff updated successfully", data: staff });
        
    } catch (error) {
        // console.log(error)
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

/**
 * @desc Delete a staff member
 * @route DELETE /api/staff/:id
 */
exports.deleteStaff = async (req, res) => {
    try {
        const { isAdmin, isSuperAdmin } = await getUserFromToken(req);
        if (!isAdmin && !isSuperAdmin) {
            return res.status(403).json({ error: "Unauthorized: Trying to delete staff" });
        }
        const staff = await MedicalStaff.findOneAndDelete({ _id: req.params.id });

        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        res.status(200).json({ success: true, message: "Staff deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

exports.editStaff = async (req, res) => {
    try {
        const staffId = req.user._id;
        const org_id = req.user.org_id;
        const updates = { ...req.body };
        const avatar = req.files?.avatar;

        // console.log("req.body", req.body)

        // Fetch the staff by ID and org
        const staff = await MedicalStaff.findOne({ _id: staffId, org_id });
        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        // Prevent updates to org_id and role_id
        delete updates.org_id;
        delete updates.role_id;

        // Handle password update
        if (updates.password) {
            updates.previewPassword = updates.password;
            const salt = await bcrypt.genSalt(7);
            updates.password = await bcrypt.hash(updates.password, salt);
        } else {
            delete updates.password;
        }

        // Recalculate full name only if prefix/first_name/last_name is present
        const prefix = updates.prefix !== undefined ? updates.prefix : staff.prefix;
        const firstName = updates.first_name !== undefined ? updates.first_name : staff.first_name;
        const lastName = updates.last_name !== undefined ? updates.last_name : staff.last_name;
        updates.name = `${prefix ? prefix + ". " : ""}${firstName}${lastName ? " " + lastName : ""}`;

        // Handle avatar upload
        if (avatar) {
            updates.avatar = {
                data: avatar.data,
                contentType: avatar.mimetype,
            };
        }

        // Merge existing fields with only the ones provided
        const fieldsToUpdate = {};
        for (let key in updates) {
            if (updates[key] !== undefined && updates[key] !== null && updates[key] !== '') {
                fieldsToUpdate[key] = updates[key];
            }
        }

        // console.log("fieldsToUpdate", fieldsToUpdate)

        // Perform the update
        const updatedStaff = await MedicalStaff.findByIdAndUpdate(staffId, fieldsToUpdate, { new: true });

        // console.log("updatedStaff", updatedStaff)
        res.status(200).json({
            success: true,
            message: "Staff updated successfully",
            data: updatedStaff,
        });
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: error.message });
    }
};


exports.getStaffAvatar = async (req, res) => {
  try {
    const staff = await MedicalStaff.findById(req.params.id);

    if (!staff || !staff.avatar || !staff.avatar.data) {
      return res.status(404).send("No avatar found");
    }

    res.set("Content-Type", staff.avatar.contentType);
    res.send(staff.avatar.data);
  } catch (err) {
    res.status(500).send("Error retrieving avatar");
  }
};