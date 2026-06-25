const jwt = require('jsonwebtoken');
const User = require('../Models/Users');

const protect = async (req, res, next) => {
    const token = req.cookies?.accessToken;         // read http-only cookie

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = protect ;