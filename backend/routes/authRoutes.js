const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// TEMP: RESET ADMIN PASSWORD
router.get('/reset-admin-temp', async (req, res) => {
  try {
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'UPDATE admins SET password_hash = ? WHERE username = ?',
      [hashedPassword, username],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          message: 'Admin password reset successfully',
          username,
          password,
          affectedRows: result.affectedRows
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN ADMIN
router.post('/login', (req, res) => {
  console.log('LOGIN ROUTE HIT');

  const { username, password } = req.body;

  const sql = `
    SELECT * FROM admins
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

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

      const token = jwt.sign(
        {
          admin_id: admin.admin_id,
          username: admin.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.json({
        message: 'Login successful',
        token,
        admin: {
          admin_id: admin.admin_id,
          username: admin.username
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

module.exports = router;
