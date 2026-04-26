const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('./config/db');

const verifyToken = require('./middleware/authMiddleware');

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

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/complaints', complaintRoutes);

app.get('/api/create-admin-temp', async (req, res) => {
  console.log('STEP 1: Route hit');

  const username = 'admin';
  const password = 'admin123';

  try {
    console.log('STEP 2: Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('STEP 3: Running INSERT...');

    db.query(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword],
      (err, result) => {
        console.log('STEP 4: Query callback reached');

        if (err) {
          console.error('QUERY ERROR:', err);
          return res.status(500).json({ error: err.message });
        }

        console.log('STEP 5: Success');

        res.json({
          message: 'Admin created',
          username,
          password
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
