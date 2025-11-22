// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwtConfig');
const Institution = require('../models/Institution');
const Department = require('../models/Department');
const Candidate = require('../models/Candidate');

// Helper function to validate password and generate response
const authenticateAndRespond = async (user, password, role, res, scopeIdName, scopeId) => {
    if (user && (await bcrypt.compare(password, user.auth_password_hash || user.manager_password_hash || user.candidate_password_hash))) {
        
        // Payload for the JWT, including the user's role and their scope ID
        const payload = {
            id: user._id,
            role: role,
            [scopeIdName]: scopeId 
        };

        return res.json({
            _id: user._id,
            username: user.username || user.manager_username || user.candidate_username,
            role: role,
            token: generateToken(payload),
            [scopeIdName]: scopeId, // Send the scope ID back to the client
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

// ------------------------------------
// 1. Unified Login (Handling all 3 roles)
// ------------------------------------
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter username and password' });
    }

    try {
        // --- Attempt 1: Authority Login ---
        let user = await Institution.findOne({ auth_username: username });
        if (user) {
            return authenticateAndRespond(user, password, 'authority', res, 'institutionId', user._id);
        }

        // --- Attempt 2: Department Manager Login ---
        user = await Department.findOne({ manager_username: username });
        if (user) {
            return authenticateAndRespond(user, password, 'department', res, 'departmentId', user._id);
        }

        // --- Attempt 3: Candidate Login ---
        user = await Candidate.findOne({ candidate_username: username });
        if (user) {
            return authenticateAndRespond(user, password, 'candidate', res, 'departmentId', user.department_id); 
            // Candidate scope is their department, but they only see their own data
        }

        // If no user found in any collection
        res.status(401).json({ message: 'Invalid credentials' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// ------------------------------------
// 2. Authority Registration (Initial Setup)
// ------------------------------------
exports.registerAuthority = async (req, res) => {
    const { name, username, password } = req.body;

    // This route is typically run only once to create the root admin
    if (await Institution.findOne({ auth_username: username })) {
        return res.status(400).json({ message: 'Authority username already exists' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const authority = await Institution.create({
            name,
            auth_username: username,
            auth_password_hash: password_hash,
        });

        // Respond with token for immediate login
        const payload = { id: authority._id, role: 'authority', institutionId: authority._id };
        res.status(201).json({
            _id: authority._id,
            username: authority.auth_username,
            role: 'authority',
            token: generateToken(payload),
            institutionId: authority._id,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};