const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// LOGIN ADMIN
router.post('/login', (req, res) => {
  console.log('LOGIN ROUTE HIT');

  const { username, password } = req.body;

  if (!username || !password) {
    console.log('Missing username or password');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const sql = `
    SELECT * FROM admins
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('LOGIN DB ERROR:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log('LOGIN DB RESULTS:', results.length);

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      const admin = results[0];

      console.log('Checking password...');
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);

      console.log('Password match:', passwordMatch);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing');
        return res.status(500).json({ error: 'Server JWT secret missing' });
      }

      const token = jwt.sign(
        {
          admin_id: admin.admin_id,
          username: admin.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        admin: {
          admin_id: admin.admin_id,
          username: admin.username
        }
      });
    } catch (error) {
      console.error('LOGIN PROCESS ERROR:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

module.exports = router;
