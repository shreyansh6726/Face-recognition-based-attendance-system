// server/routes/departmentRoutes.js
const express = require('express');
const { createDepartment, getDepartments } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here require a valid token (protect)
// and specifically the 'authority' role (authorize('authority'))

// POST /api/departments/
// Authority creates a new department
router.post('/', protect, authorize('authority'), createDepartment);

// GET /api/departments/
// Authority gets all departments in their institution
router.get('/', protect, authorize('authority'), getDepartments);

module.exports = router;