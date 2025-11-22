// server/controllers/candidateController.js
const bcrypt = require('bcryptjs');
const Candidate = require('../models/Candidate');
const Department = require('../models/Department');

// Helper function for Hashing Password
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// --- CORE FUNCTION: Create a New Candidate ---
exports.createCandidate = async (req, res) => {
    const { name, enrollment_id, candidate_username, password, departmentId, face_encoding } = req.body;
    const { role, departmentId: userDeptId, institutionId } = req.user;

    if (!name || !enrollment_id || !candidate_username || !password || !departmentId || !face_encoding) {
        return res.status(400).json({ message: 'Missing required candidate data.' });
    }

    try {
        // 1. Enforce Scope Control
        if (role === 'department' && departmentId.toString() !== userDeptId.toString()) {
            // Department managers can ONLY create candidates for their own department.
            return res.status(403).json({ message: 'Forbidden: Department managers can only enroll candidates in their own department.' });
        }
        
        // If the user is an 'authority', we must verify the department belongs to their institution
        if (role === 'authority') {
            const department = await Department.findById(departmentId);
            if (!department || department.institution_id.toString() !== institutionId.toString()) {
                return res.status(403).json({ message: 'Department not found under your institution.' });
            }
        }

        // 2. Uniqueness Checks
        if (await Candidate.findOne({ enrollment_id })) {
            return res.status(400).json({ message: 'Enrollment ID already exists.' });
        }
        if (await Candidate.findOne({ candidate_username })) {
            return res.status(400).json({ message: 'Candidate username already exists.' });
        }

        // 3. Hash Password and Create Candidate
        const candidate_password_hash = await hashPassword(password);

        const candidate = await Candidate.create({
            department_id: departmentId,
            name,
            enrollment_id,
            candidate_username,
            candidate_password_hash,
            face_encoding, // Store the 128-vector array
        });

        // Respond with success (excluding password hash and encoding for security)
        res.status(201).json({
            _id: candidate._id,
            name: candidate.name,
            enrollment_id: candidate.enrollment_id,
            department_id: candidate.department_id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during candidate enrollment.' });
    }
};

// --- FUNCTION: Get Candidates based on Role ---
exports.getCandidates = async (req, res) => {
    const { role, departmentId, institutionId } = req.user;
    let filter = {};

    try {
        if (role === 'department') {
            // Department Manager: ONLY see candidates in their department
            filter = { department_id: departmentId };
        } else if (role === 'authority') {
            // Authority: See all candidates within their institution's departments
            // This requires finding all departments first, then querying candidates.
            const departments = await Department.find({ institution_id: institutionId }).select('_id');
            const departmentIds = departments.map(d => d._id);
            filter = { department_id: { $in: departmentIds } };
        } else if (role === 'candidate') {
            // Candidate: ONLY see their own profile
            filter = { _id: req.user.id };
        } else {
            return res.status(403).json({ message: 'Forbidden: Invalid role for this action.' });
        }

        const candidates = await Candidate.find(filter)
            .select('-candidate_password_hash -face_encoding') // Do not send sensitive data!
            .populate('department_id', 'name'); // Display Department name

        res.status(200).json(candidates);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving candidates.' });
    }
};