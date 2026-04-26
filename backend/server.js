const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('./config/db');

const subjectRoutes = require('./routes/subjectRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/complaints', complaintRoutes);

// ROOT
app.get('/', (req, res) => {
  res.send('CPE Complaint System Backend is running');
});

// DB TEST
app.get('/api/db-test', (req, res) => {
  db.query('SELECT 1 AS connected', (error, rows) => {
    if (error) {
      console.error('DB TEST ERROR:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, result: rows });
  });
});

// 🔥 TEMP RESET ADMIN PASSWORD (SAFE)
app.get('/api/create-admin-temp', async (req, res) => {
  const username = 'admin';
  const password = 'admin123';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'UPDATE admins SET password_hash = ? WHERE username = ?',
      [hashedPassword, username],
      (err, result) => {
        if (err) {
          console.error('UPDATE ADMIN ERROR:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          message: 'Admin password reset successfully',
          username,
          password,
          affectedRows: result.affectedRows
        });
      }
    );
  } catch (error) {
    console.error('BCRYPT ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
