// server/controllers/departmentController.js
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');

// Authority creates a new Department
exports.createDepartment = async (req, res) => {
    // Authority's ID and institution ID are retrieved from the JWT payload 
    // and attached to req.user by the 'protect' middleware.
    const { institutionId } = req.user; 
    const { name, manager_username, password } = req.body;

    if (!name || !manager_username || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // 1. Check if a manager with that username already exists globally (usernames are unique)
        if (await Department.findOne({ manager_username })) {
            return res.status(400).json({ message: 'Manager username is already taken' });
        }
        
        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const manager_password_hash = await bcrypt.hash(password, salt);

        // 3. Create the department, linking it to the Authority's institution
        const department = await Department.create({
            institution_id: institutionId, // Scoped to the authority's institution
            name,
            manager_username,
            manager_password_hash,
        });

        // Respond with the newly created department (excluding the password hash)
        res.status(201).json({
            _id: department._id,
            name: department.name,
            manager_username: department.manager_username,
            institution_id: department.institution_id,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during department creation' });
    }
};

// Authority gets all Departments in their Institution
exports.getDepartments = async (req, res) => {
    const { institutionId } = req.user; 

    try {
        // Find all departments linked to the logged-in Authority's institutionId
        const departments = await Department.find({ institution_id: institutionId }).select('-manager_password_hash');

        res.status(200).json(departments);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving departments' });
    }
};