const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Check for token in the header
    const token = req.header('x-auth-token');

    // 2. If no token, return 401 (Unauthorized)
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        /* 4. CRITICAL FIX: Robust payload extraction
           We check if the ID is inside 'decoded.user' OR just 'decoded'.
           This ensures req.user.id is never undefined regardless of 
           how you signed the token in the login route.
        */
        req.user = decoded.user || decoded; 

        // Double check: if req.user exists but doesn't have an id, 
        // something is wrong with the token generation.
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Token valid but user ID missing' });
        }

        next();
    } catch (err) {
        // 5. Cybersecurity improvement: Handle expired vs. invalid tokens
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token has expired, please log in again' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
};