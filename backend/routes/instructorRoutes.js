const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all instructors
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM instructors ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('GET INSTRUCTORS ERROR:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});


// ADD instructor
const db = require('../config/db');

// Add instructor
router.post('/', (req, res) => {
  const { instructor_name } = req.body;

  if (!instructor_name) {
    return res.status(400).json({ error: 'Instructor name is required.' });
  }

  const sql = `
    INSERT INTO instructors (instructor_name)
    VALUES (?)
  `;

  db.query(sql, [instructor_name], (err, result) => {
    if (err) {
      console.error('ADD INSTRUCTOR ERROR:', err);
      return res.status(500).json({ error: 'Insert failed' });
    }

    res.json({
      message: 'Instructor added successfully',
      instructor_id: result.insertId
    });
  });
});

// DELETE instructor
router.delete('/:instructor_id', (req, res) => {
  const { instructor_id } = req.params;

  const checkSql = `
    SELECT COUNT(*) AS complaintCount
    FROM complaints
    WHERE instructor_id = ?
  `;

  db.query(checkSql, [instructor_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('CHECK INSTRUCTOR ERROR:', checkErr);
      return res.status(500).json({ error: 'Database error while checking instructor.' });
    }

    if (checkResult[0].complaintCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete this instructor because they are already used in complaints.'
      });
    }

    const deleteSql = 'DELETE FROM instructors WHERE instructor_id = ?';

    db.query(deleteSql, [instructor_id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('DELETE INSTRUCTOR ERROR:', deleteErr);
        return res.status(500).json({ error: 'Delete failed' });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Instructor not found.' });
      }

      res.json({ message: 'Instructor deleted successfully' });
    });
  });
});

module.exports = router;
