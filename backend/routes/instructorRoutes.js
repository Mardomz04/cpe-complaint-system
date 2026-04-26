const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add instructor
router.post('/', (req, res) => {
  const { instructor_name } = req.body;

  const sql = 'INSERT INTO instructors (instructor_name) VALUES (?)';

  db.query(sql, [instructor_name], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: 'Instructor added successfully', instructor_id: result.insertId });
  });
});

// Get all instructors
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM instructors ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

module.exports = router;