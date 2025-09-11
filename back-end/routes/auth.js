const express = require('express');
const router = express.Router();
const db = require("../db"); 
const verifyToken = require('./jwtMiddleware');
const jwt = require('jsonwebtoken');

router.post('/check-user', (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ error: 'Email is required' });
  }

  const query = 'SELECT * FROM user WHERE email = ?';
  db.query(query, [email], (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      if (results.length > 0) {
          const user = results[0];

          const token = jwt.sign(
              { id: user.id, email: user.email, role: user.role },
              'your-secret-key',
              { expiresIn: '1h' } 
          );

          return res.json({
              exists: true,
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              course_code: user.course_code,
              token: token 
          });
      } else {
          return res.json({ exists: false });
      }
  });
});

router.post('/manual-login', (req, res) => {
    const { email, password } = req.body;

    console.log("Login request:", email, password);

    const query = 'SELECT * FROM user WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("MySQL error:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const user = results[0];

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, 'your-secret-key', { expiresIn: '1h' });

        return res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                course_code: user.course_code
            },
            token: token 
        });
    });
});

module.exports = router;
