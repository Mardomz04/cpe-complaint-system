const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// TEMP: UPDATE ADMIN CREDENTIALS
router.get('/reset-admin-cpe', async (req, res) => {
  try {
    const username = 'CPEadmin';
    const password = 'CPE2026!';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'UPDATE admins SET username = ?, password_hash = ? WHERE admin_id = 1',
      [username, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          message: 'Admin updated successfully',
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
  const { username, password } = req.body;

  const sql = `
    SELECT * FROM admins
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      const admin = results[0];
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);

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
