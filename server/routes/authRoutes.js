// server/routes/authRoutes.js
const express = require('express');
const { loginUser, registerAuthority } = require('../controllers/authController');

const router = express.Router();

// Public route for unified login
router.post('/login', loginUser);

// Public route for initial Authority registration (to be secured/removed after initial setup)
router.post('/register/authority', registerAuthority); 

module.exports = router;