const jwt = require('jsonwebtoken');
const secretKey = 'your-secret-key'; 

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; 

  console.log("Token from request header:", token);

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    } 

    console.log("Decoded token:", decoded);

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
