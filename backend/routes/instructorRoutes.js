const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all instructors
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM instructors ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

// ADD instructor
router.post('/', (req, res) => {
  const { instructor_name } = req.body;

  const sql = `
    INSERT INTO instructors (instructor_name)
    VALUES (?)
  `;

  db.query(sql, [instructor_name], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Insert failed' });
    }

    res.json({ message: 'Instructor added successfully' });
  });
});

module.exports = router;
