const SpecializationSchema = require("../models/Specialization")

const createSpecialization = async (req, res) => {
    try {
        const { specialization_name } = req.body;

        // ✅ Don't manually provide specializationId, it is auto-generated
        const newSpecialization = new SpecializationSchema({ specialization_name });

        await newSpecialization.save();

        res.status(200).json({
            success: true,
            message: "Specialization created successfully",
            data: newSpecialization
        });

    } catch (error) {
        // console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSpecialization = async (req,res) =>{
    try {
     const specialization = await SpecializationSchema.find().sort({createdAt:-1})
     res.status(200).json({success:true, message:"Specialization fetched successfully", data:specialization})
    } catch{
        // console.log(error)
        res.status(500).json({success:false, message:error.message})
    }
}

const updateSpecialization = async (req,res) =>{
    try {
        const {id} = req.params
        const {specialization_name} = req.body
        const specialization = await SpecializationSchema.findById(id)
        specialization.specialization_name = specialization_name || specialization.specialization_name
        await specialization.save()
        res.status(200).json({success:true, message:"Specialization updated successfully", data:specialization})
    } catch (error) {
        // console.log(error)
        res.status(500).json({success:false, message:error.message})
    }
}

const deleteSpecialization = async (req,res) =>{
    try {
      const {id} = req.params
      const specialization = await SpecializationSchema.findByIdAndDelete(id)
      res.status(200).json({success:true, message:"Specialization deleted successfully",data:specialization})
    }catch (error){
        // console.log(error)
        res.status(500).json({success:false, message:error.message})
    }
}



module.exports = {createSpecialization, getSpecialization, updateSpecialization, deleteSpecialization}
