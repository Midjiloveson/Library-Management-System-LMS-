const { admin } = require('../config/firebaseAdmin');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      // Check if a pre-seeded doc exists with this email (e.g. from setAdmin.js)
      user = await User.findOne({ email: decoded.email });
      if (user) {
        user.firebaseUid = decoded.uid;
        await user.save();
      } else {
        const nameParts = (decoded.name || '').split(' ');
        user = await User.create({
          firebaseUid: decoded.uid,
          email: decoded.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          role: 'user',
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Firebase token error:', err.message);
    res.status(401).json({ message: 'Token is not valid', reason: err.message });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

module.exports = { protect, adminOnly };
