const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all subjects
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM subjects ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

// ADD subject
router.post('/', (req, res) => {
  const { subject_code, subject_description } = req.body;

  const sql = `
    INSERT INTO subjects (subject_code, subject_description)
    VALUES (?, ?)
  `;

  db.query(sql, [subject_code, subject_description], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Insert failed' });
    }

    res.json({ message: 'Subject added successfully' });
  });
});

module.exports = router;
