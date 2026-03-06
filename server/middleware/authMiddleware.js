const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // 1. Get the full header
  const authHeader = req.header('Authorization');

  // 2. Check if header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // 3. Extract just the token (the part after "Bearer ")
    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'p1DajAoimN3beDcP55uAMLXyMzFfgenrpjs4RQoaXwF5sfqpbBn2BDntybMbgy');
    
    req.user = decoded; 
    next();
  } catch (err) {
    console.error("JWT Error:", err.message); 
    res.status(401).json({ 
      message: "Token is not valid", 
      reason: err.message 
    });
  }
};
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, let them through
  } else {
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

module.exports = { protect, adminOnly };