const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttendanceSchema = new mongoose.Schema({
    candidate_id: {
        type: Schema.Types.ObjectId,
        ref: 'Candidate', // Links to the person who was marked
        required: true
    },
    department_id: {
        type: Schema.Types.ObjectId,
        ref: 'Department', // Added for quicker reporting/filtering by department
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present'
    },
    
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
