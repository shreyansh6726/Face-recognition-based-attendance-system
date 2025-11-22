const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Institution name is required'],
        unique: true,
        trim: true
    },
    auth_username: {
        type: String,
        required: [true, 'Authority username is required'],
        unique: true,
        trim: true
    },
    auth_password_hash: {
        type: String,
        required: [true, 'Password hash is required']
    },
    // The date the institution was registered
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Institution', InstitutionSchema);