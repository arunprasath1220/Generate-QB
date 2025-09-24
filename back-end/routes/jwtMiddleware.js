const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; 

  if (process.env.NODE_ENV === 'development') {
    console.debug("Token from request header:", token);
  }

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (process.env.NODE_ENV === 'development') {
        console.debug("Token verification error:", err);
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    } 

    if (process.env.NODE_ENV === 'development') {
      console.debug("Decoded token:", decoded);
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
