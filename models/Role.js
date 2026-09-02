const mongoose = require('mongoose');
const Organization = require('./Organization');

const defaultPermissions = [
    "ManagePatientRecords",
    "ScheduleAppointments",
    "AccessMedicalReports",
    "AdministerMedication",
    "ManageBilling",
    "UpdatePatientStatus",
    "AssignMedicalStaff",
    "MonitorHospitalInventory"
];

const RoleSchema = new mongoose.Schema({
    role_id: { type: String, unique: true },
    role_name: { type: String, required: true, unique: true },
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    permissions: {
        type: [String],
        default: defaultPermissions
    }
}, { timestamps: true });

RoleSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            // Find the organization based on org_id
            const organization = await Organization.findOne({
                $or: [{ _id: this.org_id }, { org_id: this.org_id }]
            });

            if (!organization) {
                throw new Error('Organization not found');
            }

            // Merge incoming permissions with default, avoiding duplicates
            if (this.permissions && this.permissions.length > 0) {
                const uniquePermissions = new Set([...defaultPermissions, ...this.permissions]);
                this.permissions = Array.from(uniquePermissions);
            } else {
                this.permissions = defaultPermissions;
            }

            // Get the organization name and format it for role_id
            const org_name = organization.org_name
                .split(" ")
                .map(word => word.charAt(0).toUpperCase())
                .join("-");
            const role_name = this.role_name;

            // Get the serial number by counting existing roles with the same role_name and org_id
            const count = await this.model('Role').countDocuments({
                role_name: role_name,
                org_id: this.org_id
            });

            // Generate the role_id in the format: "ROLE_NAME-ORG_NAME-SERIAL_NUMBER"
            this.role_id = `${role_name}-${org_name}-${count + 1}`;
        } catch (error) {
            return next(error);
        }
    }

    next();
});

module.exports = mongoose.model('Role', RoleSchema);
