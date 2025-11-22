// server/routes/candidateRoutes.js
const express = require('express');
const { createCandidate, getCandidates } = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/candidates/enroll
// Allows Authority OR Department Manager to create a candidate
// The controller handles the specific scope check.
router.post('/enroll', protect, authorize(['authority', 'department']), createCandidate);

// GET /api/candidates/
// Allows Authority to see all, Department Manager to see their own, Candidate to see self.
// The controller handles the filtering based on the logged-in user's role.
router.get('/', protect, authorize(['authority', 'department', 'candidate']), getCandidates);

module.exports = router;