console.log("🔥 complaintRoutes LOADED");

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

// PUBLIC: ADD COMPLAINT
router.post('/', (req, res) => {
  const {
    subject_id,
    instructor_id,
    category,
    severity_level,
    complaint_message
  } = req.body;

  const sql = `
    INSERT INTO complaints 
    (subject_id, instructor_id, category, severity_level, complaint_message)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [subject_id, instructor_id, category, severity_level, complaint_message],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        message: 'Complaint submitted successfully',
        complaint_id: result.insertId
      });
    }
  );
});

// PROTECTED: TEST PUT ROUTE
router.put('/test/status', verifyToken, (req, res) => {
  res.json({ message: 'PUT test route is working' });
});

// PROTECTED: GET ALL COMPLAINTS
router.get('/', verifyToken, (req, res) => {
  const sql = `
    SELECT 
      complaints.complaint_id,
      subjects.subject_code,
      subjects.subject_description,
      instructors.instructor_name,
      complaints.category,
      complaints.severity_level,
      complaints.complaint_message,
      complaints.status,
      complaints.created_at
    FROM complaints
    JOIN subjects ON complaints.subject_id = subjects.subject_id
    JOIN instructors ON complaints.instructor_id = instructors.instructor_id
    ORDER BY complaints.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(results);
  });
});

// PROTECTED: GET OVERALL ANALYTICS
router.get('/analytics/summary', verifyToken, (req, res) => {
  const totalSql = `
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'Pending') AS pending,
      SUM(status = 'Resolved') AS resolved,
      SUM(status = 'Rejected') AS rejected
    FROM complaints
  `;

  db.query(totalSql, (err, totalResult) => {
    if (err) return res.status(500).json({ error: err.message });

    const topInstructorSql = `
      SELECT instructors.instructor_name, COUNT(*) AS count
      FROM complaints
      JOIN instructors ON complaints.instructor_id = instructors.instructor_id
      GROUP BY instructors.instructor_name
      ORDER BY count DESC
      LIMIT 1
    `;

    db.query(topInstructorSql, (err, instructorResult) => {
      if (err) return res.status(500).json({ error: err.message });

      const topCategorySql = `
        SELECT category, COUNT(*) AS count
        FROM complaints
        GROUP BY category
        ORDER BY count DESC
        LIMIT 1
      `;

      db.query(topCategorySql, (err, categoryResult) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          total: totalResult[0].total || 0,
          pending: totalResult[0].pending || 0,
          resolved: totalResult[0].resolved || 0,
          rejected: totalResult[0].rejected || 0,
          topInstructor: instructorResult[0] || null,
          topCategory: categoryResult[0] || null
        });
      });
    });
  });
});

// PROTECTED: GET STATS PER INSTRUCTOR
router.get('/stats/:instructor_id', verifyToken, (req, res) => {
  const { instructor_id } = req.params;

  const categorySql = `
    SELECT category, COUNT(*) as count
    FROM complaints
    WHERE instructor_id = ?
    GROUP BY category
  `;

  db.query(categorySql, [instructor_id], (err, categoryResults) => {
    if (err) return res.status(500).json({ error: err.message });

    const severitySql = `
      SELECT severity_level, COUNT(*) as count
      FROM complaints
      WHERE instructor_id = ?
      GROUP BY severity_level
    `;

    db.query(severitySql, [instructor_id], (err, severityResults) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalSql = `
        SELECT COUNT(*) as total
        FROM complaints
        WHERE instructor_id = ?
      `;

      db.query(totalSql, [instructor_id], (err, totalResult) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          total: totalResult[0].total,
          categories: categoryResults,
          severity: severityResults
        });
      });
    });
  });
});

// PROTECTED: UPDATE COMPLAINT STATUS
router.put('/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['Pending', 'Resolved', 'Rejected'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Allowed values: Pending, Resolved, Rejected'
    });
  }

  const sql = `
    UPDATE complaints
    SET status = ?
    WHERE complaint_id = ?
  `;

  db.query(sql, [status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({
      message: 'Complaint status updated successfully',
      complaint_id: id,
      status
    });
  });
});

module.exports = router;