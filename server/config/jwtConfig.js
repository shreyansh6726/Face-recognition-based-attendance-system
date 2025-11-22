// server/config/jwtConfig.js
const jwt = require('jsonwebtoken');

// Load secret from environment variables defined in server.js
const JWT_SECRET = process.env.JWT_SECRET; 

const generateToken = (payload) => {
    // Payload will contain { id, role, departmentId/institutionId }
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1d' // Token expires in 1 day
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Token is invalid or expired
    }
};

module.exports = { generateToken, verifyToken };