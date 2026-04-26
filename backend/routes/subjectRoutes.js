const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add subject
router.post('/', (req, res) => {
  const { subject_code, subject_description } = req.body;

  const sql = 'INSERT INTO subjects (subject_code, subject_description) VALUES (?, ?)';

  db.query(sql, [subject_code, subject_description], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: 'Subject added successfully', subject_id: result.insertId });
  });
});

// Get all subjects
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM subjects ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add subject
router.post('/', (req, res) => {
  const { subject_code, subject_description } = req.body;

  const sql = 'INSERT INTO subjects (subject_code, subject_description) VALUES (?, ?)';

  db.query(sql, [subject_code, subject_description], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: 'Subject added successfully', subject_id: result.insertId });
  });
});

// Get all subjects
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM subjects ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

module.exports = router;
