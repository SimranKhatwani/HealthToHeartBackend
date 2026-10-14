/**
 * Patient Linking Service (Internal Helper)
 * 
 * Provides read-only candidate discovery and validation to help hospital staff match
 * an ABDM-verified patient profile with existing hospital patient records.
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. READ-ONLY: This service does NOT create, edit, or delete patient records.
 * 2. NO SCHEMA CHANGES: Does not add fields to or mutate the existing Patient model.
 * 3. NO AUTOMATIC OVERWRITE: Demographic information from ABHA must never silently
 *    overwrite hospital medical history or patient data without manual staff confirmation.
 * 4. MULTI-TENANCY: Scoped strictly by `org_id` to prevent cross-hospital data leakage.
 */

const Patient = require("../models/Patients");

class PatientLinkingService {
    /**
     * Normalizes a phone number for consistent string matching.
     * Strips non-digit characters and standardizes 10-digit Indian mobile formats.
     * 
     * @param {string} phone - Raw phone input
     * @returns {string} Normalized 10-digit phone number, or trimmed input
     */
    _normalizePhone(phone) {
        if (!phone || typeof phone !== "string") return "";
        const digits = phone.replace(/\D/g, "");
        // If prefixed with 91 (country code) and length 12, take last 10 digits
        if (digits.length === 12 && digits.startsWith("91")) {
            return digits.slice(2);
        }
        return digits.length >= 10 ? digits.slice(-10) : digits;
    }

    /**
     * Normalizes a name string for fuzzy demographic comparison.
     * 
     * @param {string} name - Raw name string
     * @returns {string} Lowercase, trimmed, single-spaced string
     */
    _normalizeName(name) {
        if (!name || typeof name !== "string") return "";
        return name.toLowerCase().trim().replace(/\s+/g, " ");
    }

    /**
     * Searches for existing patient records within an organization that match
     * a verified ABDM profile.
     * 
     * MATCHING STRATEGY (Read-Only):
     * 1. Exact Phone Match: Patients in the organization sharing the same 10-digit mobile number.
     * 2. Demographic Match: Patients in the organization sharing similar name and date of birth.
     * 
     * PENDING DECISIONS (Rules requiring confirmation before implementation):
     * - Rule A: Whether an exact phone match alone is sufficient for 1-click linking,
     *   or if full demographic confirmation (Name + DOB) is mandatory.
     * - Rule B: How to handle multi-patient phone sharing (common for families).
     * - Rule C: Whether to allow linking when only Year of Birth (YOB) is returned by ABDM.
     * 
     * @param {Object} params
     * @param {string|mongoose.Types.ObjectId} params.org_id - The hospital organization ID
     * @param {Object} params.verifiedProfile - Profile returned by verified ABDM session
     * @param {string} [params.verifiedProfile.mobile] - Verified mobile number
     * @param {string} [params.verifiedProfile.name] - Verified full name
     * @param {string|Date} [params.verifiedProfile.dateOfBirth] - Verified date of birth
     * @param {string} [params.verifiedProfile.gender] - Verified gender
     * @returns {Promise<Array<Object>>} List of candidate patient matches with match reasons
     */
    async findCandidateMatches({ org_id, verifiedProfile }) {
        if (!org_id) {
            throw new Error("Organization ID (org_id) is required for tenant isolation.");
        }

        if (!verifiedProfile || typeof verifiedProfile !== "object") {
            throw new Error("A valid verifiedProfile object is required to search candidate matches.");
        }

        const candidates = [];
        const normalizedMobile = this._normalizePhone(verifiedProfile.mobile);
        const normalizedVerifiedName = this._normalizeName(verifiedProfile.name);

        // 1. Check for exact phone match within the organization
        if (normalizedMobile) {
            // Find patients with matching phone or regex for the 10 digits
            const phoneMatches = await Patient.find({
                org_id,
                phone: { $regex: new RegExp(`${normalizedMobile}$`) }
            }).select("_id id name phone dateOfBirth gender patientType status");

            for (const patient of phoneMatches) {
                const patientNameNormalized = this._normalizeName(patient.name);
                const isNameMatch = patientNameNormalized === normalizedVerifiedName;

                candidates.push({
                    patientId: patient._id,
                    customId: patient.id,
                    name: patient.name,
                    phone: patient.phone,
                    dateOfBirth: patient.dateOfBirth,
                    gender: patient.gender,
                    status: patient.status,
                    matchReason: isNameMatch ? "EXACT_PHONE_AND_NAME_MATCH" : "PHONE_NUMBER_MATCH",
                    confidence: isNameMatch ? "HIGH" : "MEDIUM"
                });
            }
        }

        // 2. Check for demographic match if name and DOB are provided and no exact match found
        if (verifiedProfile.name && verifiedProfile.dateOfBirth) {
            const verifiedDob = new Date(verifiedProfile.dateOfBirth);

            if (!isNaN(verifiedDob.getTime())) {
                // Find patients within +/- 1 year or exact DOB in the same organization
                const dobStart = new Date(verifiedDob);
                dobStart.setFullYear(dobStart.getFullYear() - 1);
                const dobEnd = new Date(verifiedDob);
                dobEnd.setFullYear(dobEnd.getFullYear() + 1);

                const demographicMatches = await Patient.find({
                    org_id,
                    dateOfBirth: { $gte: dobStart, $lte: dobEnd }
                }).select("_id id name phone dateOfBirth gender patientType status");

                for (const patient of demographicMatches) {
                    const patientNameNormalized = this._normalizeName(patient.name);
                    // Avoid adding duplicates already captured in phone search
                    const alreadyFound = candidates.some(c => c.patientId.toString() === patient._id.toString());
                    
                    if (!alreadyFound && patientNameNormalized === normalizedVerifiedName) {
                        candidates.push({
                            patientId: patient._id,
                            customId: patient.id,
                            name: patient.name,
                            phone: patient.phone,
                            dateOfBirth: patient.dateOfBirth,
                            gender: patient.gender,
                            status: patient.status,
                            matchReason: "DEMOGRAPHIC_NAME_AND_DOB_MATCH",
                            confidence: "MEDIUM"
                        });
                    }
                }
            }
        }

        return candidates;
    }

    /**
     * Validates linking preconditions before a verified identity can be associated
     * with a target hospital patient record.
     * 
     * Read-only validation; does NOT modify the patient document.
     * 
     * @param {Object} params
     * @param {string|mongoose.Types.ObjectId} params.patientId - Existing hospital patient ID
     * @param {string|mongoose.Types.ObjectId} params.org_id - Active staff organization ID
     * @param {Object} params.verifiedProfile - Verified ABDM profile
     * @returns {Promise<{ canLink: boolean, errors: string[], warnings: string[] }>}
     */
    async validateLinkingPreconditions({ patientId, org_id, verifiedProfile }) {
        const errors = [];
        const warnings = [];

        if (!patientId || !org_id) {
            errors.push("Missing required patientId or org_id parameter.");
            return { canLink: false, errors, warnings };
        }

        const patient = await Patient.findOne({ _id: patientId, org_id });
        if (!patient) {
            errors.push("Target patient does not exist or does not belong to your organization.");
            return { canLink: false, errors, warnings };
        }

        // Validate demographic parity
        if (verifiedProfile) {
            const normalizedPatientPhone = this._normalizePhone(patient.phone);
            const normalizedProfilePhone = this._normalizePhone(verifiedProfile.mobile);

            if (normalizedPatientPhone && normalizedProfilePhone && normalizedPatientPhone !== normalizedProfilePhone) {
                warnings.push(
                    "Patient phone number on record differs from verified ABHA mobile number."
                );
            }

            const normalizedPatientName = this._normalizeName(patient.name);
            const normalizedProfileName = this._normalizeName(verifiedProfile.name);

            if (normalizedPatientName && normalizedProfileName && normalizedPatientName !== normalizedProfileName) {
                warnings.push(
                    "Patient name on record differs from verified ABHA profile name."
                );
            }
        }

        return {
            canLink: errors.length === 0,
            errors,
            warnings
        };
    }
}

// Export singleton instance of patient linking helper
module.exports = new PatientLinkingService();
