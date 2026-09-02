const MealPlanSchema = require("../models/MealPlans")
const MealPlansToPatients = require("../models/MealPlansToPatients")
const jwt = require('jsonwebtoken');
const SuperAdmin = require("../models/SuperAdmin");
const Patient = require("../models/Patients");
getUserFromToken = async (req) => {
    const token = req.cookies.token;
    if (!token) throw new Error("Unauthorized: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await MedicalStaff.findById(decoded.userId);

    if (!user) {
        // console.log("User not found");
        return;
    };

    let org_id = user.org_id;

    if (user?.role === "superadmin") {
        org_id = req.params.org || req.body.org || org_id || null;
    }
    let isAdmin = (user?.role === 'admin' || user?.role === 'superadmin');
    let isSuperAdmin = (user?.role === 'superadmin');
    return { userId: user._id, org_id, isAdmin, isSuperAdmin };
};


const createMealPlan = async (req, res) => {
    let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);
    const orgId = req.user.org_id;

    try {
        const {
            name,
            type = "Basic",
            calories,
            costPerDay,
            status = "Active",
        } = req.body;

        if (isSuperAdmin) {
            org_id = req.body.org_id || req.params.org_id || org_id || null;
        }else{
          org_id = orgId
        }

        // Required field validation for Andro
        if (!org_id || !name || !calories || !costPerDay) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing: org_id, name, calories, or costPerDay.",
            });
        }

        const mealPlan = new MealPlanSchema({
            org_id,
            name,
            type,
            calories,
            costPerDay,
            status,
        });

        await mealPlan.save();

        return res.status(201).json({
            success: true,
            message: "Meal plan created successfully.",
            data: mealPlan,
        });
    } catch (error) {
        // console.error("Error creating meal plan:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

const getMealPlans = async (req, res) => {
  const org_id = req.user.org_id;
  try {
      const mealPlans = await MealPlanSchema.find({org_id}).sort({ name: 1 });
      return res.status(200).json({
          success: true,
          data: mealPlans,
      });

  } catch (error) {
      // console.error("Error fetching meal plans:", error);
      return res.status(500).json({
          success: false,
          message: "Internal server error.",
          error: error.message,
      });
  }
};

const deleteMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMealPlan = await MealPlanSchema.findByIdAndDelete(id);

    if (!deletedMealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully.",
      data: deletedMealPlan,
    });

  } catch (error) {
    // console.error("Error deleting meal plan:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const editMealPlan = async (req, res) => {
  try {
      const mealPlanId = req.params.id;

      // console.log("mealPlanId", mealPlanId)
      const {
          name,
          type,
          calories,
          costPerDay,
          status,
      } = req.body;

      // Validate required fields
      if (!mealPlanId) {
          return res.status(400).json({
              success: false,
              message: "Required field missing: mealPlanId.",
          });
      }

      // Find the meal plan
      const mealPlan = await MealPlanSchema.findOne({ _id: mealPlanId });

      if (!mealPlan) {
          return res.status(404).json({
              success: false,
              message: "Meal plan not found.",
          });
      }

      // Update only provided fields
      if (name !== undefined) mealPlan.name = name;
      if (type !== undefined) mealPlan.type = type;
      if (calories !== undefined) mealPlan.calories = calories;
      if (costPerDay !== undefined) mealPlan.costPerDay = costPerDay;
      if (status !== undefined) mealPlan.status = status;

      await mealPlan.save();

      return res.status(200).json({
          success: true,
          message: "Meal plan updated successfully.",
          data: mealPlan,
      });
  } catch (error) {
      // console.error("Error editing meal plan:", error);
      return res.status(500).json({
          success: false,
          message: "Internal server error.",
          error: error.message,
      });
  }
};

const createMealPlansToPatients = async (req, res) => {
  const orgId = req.user.org_id;
  let { isAdmin, org_id, isSuperAdmin } = await getUserFromToken(req);

  try {
    const {
      patientId,
      mealPlanId,
      startDate,
      endDate,
      status,
      billingStatus,
      invoiceDate,
    } = req.body;

    // console.log("req.body", req.body)

    if (isSuperAdmin) {
      org_id = req.body.org_id || req.params.org_id || org_id || null;
    }else{
      org_id = orgId
    }

    // if (!org_id || !patientId || !mealPlanId || !startDate || !endDate) {
    //   return res.status(400).json({ message: "Required fields are missing." });
    // }

    // Fetch the patient by ID
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Fetch the meal plan by name
    const mealPlanData = await MealPlanSchema.findOne(mealPlanId);
    if (!mealPlanData) {
      return res.status(404).json({ message: "Meal plan not found." });
    }

    // console.log("mealPlanData", mealPlanData)

    const ratePerMeal = mealPlanData.costPerDay || 0;

    // Calculate number of days (inclusive)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const payAmount = ratePerMeal * days;

    const newAssignment = new MealPlansToPatients({
      org_id,
      patientDetails: patient._id, // Use the fetched patient's _id
      MealPlan: mealPlanData._id, // Use the fetched meal plan's _id
      startDate,
      endDate,
      status: status || "Active",
      billingStatus: billingStatus || "Not Billed",
      payAmount,
      invoiceDate,
    });
    

    await newAssignment.save();

    return res.status(201).json({
      message: "Meal plan assigned to patient successfully.",
      data: newAssignment,
      success:true
    });
  } catch (error) {
    // console.error("Error creating meal plan assignment:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};


const getMealPlansToPatients = async (req, res) => {
  const org_id = req.user.org_id;
  try {
    const assignments = await MealPlansToPatients.find({org_id}).sort({ startDate: -1 })
      .populate("org_id")
      .populate("patientDetails")
      .populate("MealPlan");

    res.status(200).json({
      message: "Meal plan assignments fetched successfully.",
      data: assignments,
    });
  } catch (error) {
    // console.error("Error fetching meal plan assignments:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const editMealPlansToPatients = async (req, res) => {
  const { id } = req.params;

  try {
    const {
      patientId,
      mealPlanId,
      startDate,
      endDate,
      status,
      billingStatus,
      invoiceDate,
    } = req.body;

    // Find the existing assignment
    const existingAssignment = await MealPlansToPatients.findById(id);
    if (!existingAssignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    // Fetch updated patient if provided
    const patient = await Patient.findById(patientId || existingAssignment.patientDetails);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Fetch updated meal plan if provided
    const mealPlanData = await MealPlanSchema.findById(mealPlanId || existingAssignment.MealPlan);
    if (!mealPlanData) {
      return res.status(404).json({ message: "Meal plan not found." });
    }

    const ratePerMeal = mealPlanData.costPerDay || 0;

    const start = new Date(startDate || existingAssignment.startDate);
    const end = new Date(endDate || existingAssignment.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const payAmount = ratePerMeal * days;

    // Update the fields
    existingAssignment.patientDetails = patient._id;
    existingAssignment.MealPlan = mealPlanData._id;
    existingAssignment.startDate = startDate || existingAssignment.startDate;
    existingAssignment.endDate = endDate || existingAssignment.endDate;
    existingAssignment.status = status || existingAssignment.status;
    existingAssignment.billingStatus = billingStatus || existingAssignment.billingStatus;
    existingAssignment.invoiceDate = invoiceDate || existingAssignment.invoiceDate;
    existingAssignment.payAmount = payAmount;

    await existingAssignment.save();

    return res.status(200).json({
      message: "Meal plan assignment updated successfully.",
      data: existingAssignment,
      success: true,
    });
  } catch (error) {
    console.log("error", error)
    return res.status(500).json({ message: error.message });
  }
};


const deleteAssignedMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAssignMealPlan = await MealPlansToPatients.findByIdAndDelete(id);

    if (!deletedAssignMealPlan) {
      return res.status(404).json({
        success: false,
        message: "Assigned Meal plan not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assigned Meal plan deleted successfully.",
      data: deletedAssignMealPlan,
    });

  } catch (error) {
    // console.error("Error deleting Assigned meal plan:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports = {
  createMealPlan,
  getMealPlans,
  deleteMealPlan,
  editMealPlan,
  createMealPlansToPatients,
  getMealPlansToPatients,
  editMealPlansToPatients,
  deleteAssignedMealPlan
};
