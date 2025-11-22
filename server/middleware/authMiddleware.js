// server/middleware/authMiddleware.js
const { verifyToken } = require('../config/jwtConfig');

// Middleware to check for a valid JWT and attach user data to the request
const protect = (req, res, next) => {
    let token;

    // Check for token in the 'Authorization' header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = verifyToken(token);

            if (!decoded) {
                return res.status(401).json({ message: 'Not authorized, token failed or expired' });
            }

            // Attach the decoded user data (id, role, scope) to the request
            // We use req.user to track who is making the request
            req.user = decoded; 
            next();

        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check for specific roles
const authorize = (roles = []) => {
    // Ensure roles is an array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({ message: `Forbidden: User role '${req.user.role}' is not allowed to access this resource` });
        }
        next();
    };
};

module.exports = { protect, authorize };