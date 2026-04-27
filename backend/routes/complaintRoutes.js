const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const analyzeFeedback = require('../services/aiAnalyzer');

// =======================================
// PUBLIC: ADD FEEDBACK (NO CATEGORY/SEVERITY)
// =======================================
router.post('/', async (req, res) => {
  const {
    subject_id,
    instructor_id,
    complaint_message
  } = req.body;

  if (!subject_id || !instructor_id || !complaint_message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 🔥 AI ANALYSIS
    const ai = await analyzeFeedback(complaint_message);

    const sql = `
      INSERT INTO complaints 
      (subject_id, instructor_id, complaint_message, sentiment, ai_category, severity_level, ai_severity_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        subject_id,
        instructor_id,
        complaint_message,
        ai.sentiment,
        ai.category,
        ai.severity_level,
        ai.severity_reason
      ],
      (err, result) => {
        if (err) {
          console.error('Insert error:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          message: 'Feedback submitted with AI analysis',
          complaint_id: result.insertId,
          ai_analysis: ai   // optional (good for debugging)
        });
      }
    );

  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Server error during AI analysis' });
  }
});
// =======================================
// PROTECTED: GET ALL FEEDBACK
// =======================================
router.get('/', verifyToken, (req, res) => {
  const sql = `
    SELECT 
      complaints.complaint_id,
      subjects.subject_code,
      subjects.subject_description,
      instructors.instructor_name,
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

// =======================================
// BULK STATUS UPDATE
// =======================================
router.put('/bulk/status', verifyToken, (req, res) => {
  const { complaint_ids, status } = req.body;

  const allowedStatuses = ['Pending', 'Resolved', 'Rejected'];

  if (!Array.isArray(complaint_ids) || complaint_ids.length === 0) {
    return res.status(400).json({ error: 'Please select at least one feedback.' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = `
    UPDATE complaints
    SET status = ?
    WHERE complaint_id IN (?)
  `;

  db.query(sql, [status, complaint_ids], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      message: 'Selected feedback updated successfully',
      affectedRows: result.affectedRows
    });
  });
});

// =======================================
// BULK DELETE
// =======================================
router.post('/bulk/delete', verifyToken, (req, res) => {
  const { complaint_ids } = req.body;

  if (!Array.isArray(complaint_ids) || complaint_ids.length === 0) {
    return res.status(400).json({ error: 'Please select at least one feedback.' });
  }

  const sql = `
    DELETE FROM complaints
    WHERE complaint_id IN (?)
  `;

  db.query(sql, [complaint_ids], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      message: 'Selected feedback deleted successfully',
      affectedRows: result.affectedRows
    });
  });
});

// =======================================
// UPDATE ONE STATUS
// =======================================
router.put('/:complaint_id/status', verifyToken, (req, res) => {
  const { complaint_id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['Pending', 'Resolved', 'Rejected'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const sql = `
    UPDATE complaints
    SET status = ?
    WHERE complaint_id = ?
  `;

  db.query(sql, [status, complaint_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback status updated successfully' });
  });
});

// =======================================
// DELETE ONE
// =======================================
router.delete('/:complaint_id', verifyToken, (req, res) => {
  const { complaint_id } = req.params;

  const sql = `
    DELETE FROM complaints
    WHERE complaint_id = ?
  `;

  db.query(sql, [complaint_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  });
});

// =======================================
// ANALYTICS SUMMARY
// =======================================
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

      res.json({
        total: totalResult[0].total || 0,
        pending: totalResult[0].pending || 0,
        resolved: totalResult[0].resolved || 0,
        rejected: totalResult[0].rejected || 0,
        topInstructor: instructorResult[0] || null
      });
    });
  });
});

// =======================================
// STATS PER INSTRUCTOR (NO CATEGORY/SEVERITY NOW)
// =======================================
router.get('/stats/:instructor_id', verifyToken, (req, res) => {
  const { instructor_id } = req.params;

  const totalSql = `
    SELECT COUNT(*) AS total
    FROM complaints
    WHERE instructor_id = ?
  `;

  db.query(totalSql, [instructor_id], (err, totalResult) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      total: totalResult[0].total || 0
    });
  });
});

// =======================================
// LATEST NOTIFICATION
// =======================================
router.get('/notifications/latest', (req, res) => {
  const sql = `
    SELECT 
      complaints.complaint_id,
      subjects.subject_code,
      instructors.instructor_name,
      complaints.complaint_message,
      complaints.created_at
    FROM complaints
    JOIN subjects ON complaints.subject_id = subjects.subject_id
    JOIN instructors ON complaints.instructor_id = instructors.instructor_id
    ORDER BY complaints.created_at DESC
    LIMIT 1
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Notification fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch notification' });
    }

    const latest = result[0];
    if (!latest) return res.json(null);

    res.json(latest);
  });
});

module.exports = router;