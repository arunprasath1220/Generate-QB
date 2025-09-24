const express = require('express');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/check-user', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const query = `
    SELECT u.id, u.email, r.role AS role_name
    FROM users u
    LEFT JOIN role r ON u.role = r.id
    WHERE u.email = ?
    LIMIT 1
  `;
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!results.length) return res.status(404).json({ success: false, message: 'User not found' });

    const user = results[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      success: true,
      user: {
        // id: user.id,
        email: user.email,
        role: user.role_name
      },
      token
    });
  });
});

router.post('/manual-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  const query = `
    SELECT u.id, u.email, u.password, r.role AS role_name
    FROM users u
    LEFT JOIN role r ON u.role = r.id
    WHERE u.email = ? AND u.password = ?
    LIMIT 1
  `;
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!results.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = results[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      success: true,
      user: {
        // id: user.id,
        email: user.email,
        role: user.role_name
      },
      token
    });
  });
});

module.exports = router;
