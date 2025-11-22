const mongoose = require('mongoose');
const { Schema } = mongoose;

const CandidateSchema = new mongoose.Schema({
    department_id: {
        type: Schema.Types.ObjectId,
        ref: 'Department', // Links to the Candidate's specific Department
        required: true
    },
    name: {
        type: String,
        required: [true, 'Candidate name is required'],
        trim: true
    },
    enrollment_id: {
        type: String,
        required: [true, 'Enrollment/Employee ID is required'],
        unique: true,
        trim: true
    },
    // Credentials for the Candidate's self-service panel
    candidate_username: {
        type: String,
        required: [true, 'Candidate username is required'],
        unique: true,
        trim: true
    },
    candidate_password_hash: {
        type: String,
        required: [true, 'Password hash is required']
    },
    // The crucial 128-dimensional face vector (array of floats)
    face_encoding: {
        type: [Number], // Stored as an array of numbers (128 elements)
        required: [true, 'Face encoding is required for attendance']
    }
});

module.exports = mongoose.model('Candidate', CandidateSchema);