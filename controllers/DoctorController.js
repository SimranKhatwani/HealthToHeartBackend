const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const MedicalStaffSchema = require("../models/MedicalStaff")

const createDoctor = async (req,res) =>{
    try{
        const {name, email,department,address,phoneNo, password, roleType} = req.body
        

        const existingUser = await MedicalStaffSchema.findOne({email})

        if(existingUser){
            return res.status(400).json({success:false, message:"Email already exists"})
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const newDoctor = new MedicalStaffSchema({
            name,email,department,address,phoneNo,password:hashedPassword,previewPassword:password, roleType
        })
        
        await newDoctor.save()
        res.status(200).json({success:true, message:"Doctor created successfully",data:newDoctor})
    }catch(error){
        // console.log(error)
        res.status(500).json({success:false, message:error.message})
    }
}

const getDoctors = async (req,res) =>{
    try{
      const doctors = await MedicalStaffSchema.find().sort({createdAt:-1})
      
      cosole.log(doctors)
      res.status(200).json({success:true, message:"Doctors fetched successfully" , data:doctors})
    }catch(error){
      // console.log(error)
      res.status(500).json({success:false, message:error.message})
    }
}

const updateDoctor = async (req,res) =>{
    try{
     const {name,email,department,address,phoneNo,password} =req.body
     const {id} = req.params
     const doctor = await MedicalStaffSchema.findById(id)
     if(!doctor){
        return res.status(400).json({success:false, message:"Doctor not found"})
     }
     doctor.name = name || doctor.name
     doctor.email = email || doctor.email
     doctor.department = department || doctor.department
     doctor.address = address || doctor.address
     doctor.phoneNo = phoneNo || doctor.phoneNo
     doctor.password = password || doctor.password
     await doctor.save()
     res.status(200).json({success:true, message:"Doctor updated successfully" , data:doctor})
    }catch(error){
        // console.log(error)
        res.status(500).json({success:false, message:error.message})
    }
}


const DeleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await MedicalStaffSchema.findById(id);

        if (!doctor) {
            return res.status(400).json({ success: false, message: "Doctor not found" });
        }

        await MedicalStaffSchema.findByIdAndDelete(id); 
        
        res.status(200).json({ success: true, message: "Doctor deleted successfully", data: doctor });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};



module.exports = {createDoctor, getDoctors, updateDoctor, DeleteDoctor}
