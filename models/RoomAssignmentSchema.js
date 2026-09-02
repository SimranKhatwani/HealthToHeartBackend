const mongoose = require('mongoose');

const roomAssignmentSchema = new mongoose.Schema({
  org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  bedNumber: {
    type: Number,
    required: true,
  },
  // assignedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Staff',
  //   required: true,
  // },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expectedDischarge: {
    type: Date,
  },
  actualDischarge: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'discharged', 'transferred'],
    default: 'active',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true, 
});


const RoomAssignment = mongoose.model('RoomAssignment', roomAssignmentSchema);

module.exports = RoomAssignment;