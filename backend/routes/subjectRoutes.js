const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all subjects
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM subjects ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('GET SUBJECTS ERROR:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

// ADD subject
router.post('/', (req, res) => {
  const { subject_code, subject_description } = req.body;

  if (!subject_code || !subject_description) {
    return res.status(400).json({ error: 'Subject code and description are required.' });
  }

  const sql = `
    INSERT INTO subjects (subject_code, subject_description)
    VALUES (?, ?)
  `;

  db.query(sql, [subject_code, subject_description], (err, result) => {
    if (err) {
      console.error('ADD SUBJECT ERROR:', err);
      return res.status(500).json({ error: 'Insert failed' });
    }

    res.json({
      message: 'Subject added successfully',
      subject_id: result.insertId
    });
  });
});

// DELETE subject
router.delete('/:subject_id', (req, res) => {
  const { subject_id } = req.params;

  const checkSql = `
    SELECT COUNT(*) AS complaintCount
    FROM complaints
    WHERE subject_id = ?
  `;

  db.query(checkSql, [subject_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('CHECK SUBJECT ERROR:', checkErr);
      return res.status(500).json({ error: 'Database error while checking subject.' });
    }

    if (checkResult[0].complaintCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete this subject because it is already used in complaints.'
      });
    }

    const deleteSql = 'DELETE FROM subjects WHERE subject_id = ?';

    db.query(deleteSql, [subject_id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('DELETE SUBJECT ERROR:', deleteErr);
        return res.status(500).json({ error: 'Delete failed' });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Subject not found.' });
      }

      res.json({ message: 'Subject deleted successfully' });
    });
  });
});

module.exports = router;
