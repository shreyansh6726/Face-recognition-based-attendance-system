const mongoose = require('mongoose');
const { Schema } = mongoose;

const DepartmentSchema = new mongoose.Schema({
    institution_id: {
        type: Schema.Types.ObjectId,
        ref: 'Institution', // Links to the Authority/Institution
        required: true
    },
    name: {
        type: String,
        required: [true, 'Department name is required'],
        trim: true
    },
    manager_username: {
        type: String,
        required: [true, 'Manager username is required'],
        unique: true,
        trim: true
    },
    manager_password_hash: {
        type: String,
        required: [true, 'Password hash is required']
    }
    // Note: We don't need a unique index on (institution_id, name) 
    // unless we enforce unique names across the entire institution.
});

module.exports = mongoose.model('Department', DepartmentSchema);