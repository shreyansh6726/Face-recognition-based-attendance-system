// server/routes/attendanceRoutes.js
const express = require('express');
const { markAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/attendance/mark
// Attendance can only be marked by Authority OR Department Manager
router.post('/mark', protect, authorize(['authority', 'department']), markAttendance);

module.exports = router;