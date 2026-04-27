
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// LOGIN ADMIN
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT * FROM admins
    WHERE username = ?
  `;

  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

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
  });
});

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// LOGIN ADMIN
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT * FROM admins
    WHERE username = ?
  `;

  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }


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
  });
});

module.exports = router;
    console.log('Admin account created successfully');
    console.log('Username:', username);
    console.log('Password:', password);
    process.exit();
  });

createAdmin();
