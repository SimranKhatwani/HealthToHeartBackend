const Messages = require('../models/MessageModel'); 
const Patient = require('../models/Patients'); 

// getUserFromToken = async (req) => {
//     const token = req.cookies.token;
//     if (!token) throw new Error("Unauthorized: No token provided");

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await SuperAdmin.findById(decoded.userId) || await MedicalStaff.findById(decoded.userId);

//     if (!user) {
//         console.log("User not found");
//         return;
//     };

//     let org_id = user.org_id;

//     if (user?.role === "superadmin") {
//         org_id = req.params.org || req.body.org || org_id || null;
//     }
//     let isAdmin = (user?.role === 'admin' || user?.role === 'superadmin');
//     let isSuperAdmin = (user?.role === 'superadmin');
//     return { userId: user._id, org_id, isAdmin, isSuperAdmin };
// };
const createMessage = async (req, res) => {
    try {
        const org_id = req.user.org_id;
        const { receiver, subject, message } = req.body;

        if (!receiver || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        console.log(req.user)
        const sender = req.user._id; 
        console.log("sender", sender)


        const newMessage = new Messages({ org_id, sender, receiver, subject, message });
        await newMessage.save();

        console.log("newMessage", newMessage)

        await Patient.updateMany(
            { _id: { $in: [sender, receiver] } },
            { $push: { messages: newMessage._id } }
          );

        res.status(201).json({ 
            message: 'Message created', 
            data: newMessage,
            success:true
         });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: error.message });
    }
};  


const getMessages = async (req, res) => {
    try {
        const userId = req.user._id; 

        const messages = await Messages.find({
            $or: [
                { sender: userId },   
                { receiver: userId } 
            ]
        })
            .populate("receiver", "name email")  
            .populate("sender", "name email")    
            .sort({ timestamp: -1 }); 

        res.status(200).json({ success: true, count: messages.length, messages });

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const getAllMessages = async (req, res) => {
    try {
        const messages = await Messages.find()
            .populate("receiver", "name") 
            .sort({ timestamp: -1 });

        res.status(200).json({ success: true, count: messages.length, messages });

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

module.exports = {createMessage, getMessages, getAllMessages}