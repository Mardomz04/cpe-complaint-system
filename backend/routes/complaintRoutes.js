const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const analyzeFeedback = require('../services/aiAnalyzer');

// =======================================
// PUBLIC: ADD FEEDBACK WITH AI ANALYSIS
// =======================================
router.post('/', async (req, res) => {
  const { subject_id, instructor_id, complaint_message } = req.body;

  if (!subject_id || !instructor_id || !complaint_message || !complaint_message.trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let ai = {
    sentiment: 'Neutral',
    category: 'Uncategorized',
    severity_level: 'None',
    severity_reason: 'AI analysis unavailable.',
    confidence: 0
  };

  try {
    ai = await analyzeFeedback(complaint_message);
  } catch (error) {
    console.error('AI analysis failed, using fallback:', error.message);
  }

  const safeSentiment = ai.sentiment || 'Neutral';
  const safeCategory = ai.category || 'Uncategorized';
  let safeSeverity = ai.severity_level || 'None';
  const safeReason = ai.severity_reason || 'No reason provided.';
  const safeConfidence = Number(ai.confidence || 0);

  if (safeSentiment === 'Positive' || safeSentiment === 'Neutral') {
    safeSeverity = 'None';
  }

  const sql = `
    INSERT INTO complaints 
    (
      subject_id,
      instructor_id,
      category,
      complaint_message,
      sentiment,
      ai_category,
      severity_level,
      ai_severity_reason,
      ai_confidence
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      subject_id,
      instructor_id,
      safeCategory,
      complaint_message.trim(),
      safeSentiment,
      safeCategory,
      safeSeverity,
      safeReason,
      safeConfidence
    ],
    (err, result) => {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: 'Feedback submitted successfully',
        complaint_id: result.insertId,
        ai_analysis: {
          sentiment: safeSentiment,
          category: safeCategory,
          severity_level: safeSeverity,
          severity_reason: safeReason,
          confidence: safeConfidence
        }
      });
    }
  );
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
      complaints.category,
      complaints.complaint_message,
      complaints.sentiment,
      complaints.ai_category,
      complaints.severity_level,
      complaints.ai_severity_reason,
      complaints.ai_confidence,
      complaints.ai_validated,
      complaints.admin_correction,
      complaints.status,
      complaints.created_at
    FROM complaints
    JOIN subjects ON complaints.subject_id = subjects.subject_id
    JOIN instructors ON complaints.instructor_id = instructors.instructor_id
    ORDER BY complaints.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Get feedback error:', err);
      return res.status(500).json({ error: err.message });
    }

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
    if (err) {
      console.error('Bulk status update error:', err);
      return res.status(500).json({ error: err.message });
    }

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
    if (err) {
      console.error('Bulk delete error:', err);
      return res.status(500).json({ error: err.message });
    }

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
    if (err) {
      console.error('Status update error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback status updated successfully' });
  });
});

// =======================================
// AI VALIDATION / ADMIN CORRECTION
// =======================================
router.put('/:complaint_id/ai-validation', verifyToken, (req, res) => {
  const { complaint_id } = req.params;
  const { ai_validated, admin_correction } = req.body;

  const sql = `
    UPDATE complaints
    SET ai_validated = ?, admin_correction = ?
    WHERE complaint_id = ?
  `;

  db.query(
    sql,
    [Boolean(ai_validated), admin_correction || null, complaint_id],
    (err, result) => {
      if (err) {
        console.error('AI validation update error:', err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Feedback not found' });
      }

      res.json({ message: 'AI validation updated successfully' });
    }
  );
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
    if (err) {
      console.error('Delete feedback error:', err);
      return res.status(500).json({ error: err.message });
    }

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
      SUM(status = 'Rejected') AS rejected,
      SUM(sentiment = 'Positive') AS positive,
      SUM(sentiment = 'Negative') AS negative,
      SUM(sentiment = 'Neutral') AS neutral,
      SUM(severity_level = 'High') AS highSeverity,
      AVG(ai_confidence) AS avgConfidence
    FROM complaints
  `;

  db.query(totalSql, (err, totalResult) => {
    if (err) {
      console.error('Analytics total error:', err);
      return res.status(500).json({ error: err.message });
    }

    const topInstructorSql = `
      SELECT instructors.instructor_name, COUNT(*) AS count
      FROM complaints
      JOIN instructors ON complaints.instructor_id = instructors.instructor_id
      GROUP BY instructors.instructor_name
      ORDER BY count DESC
      LIMIT 1
    `;

    db.query(topInstructorSql, (err, instructorResult) => {
      if (err) {
        console.error('Analytics instructor error:', err);
        return res.status(500).json({ error: err.message });
      }

      const topCategorySql = `
        SELECT 
          COALESCE(ai_category, category, 'Uncategorized') AS category,
          COUNT(*) AS count
        FROM complaints
        GROUP BY COALESCE(ai_category, category, 'Uncategorized')
        ORDER BY count DESC
        LIMIT 1
      `;

      db.query(topCategorySql, (err, categoryResult) => {
        if (err) {
          console.error('Analytics category error:', err);
          return res.status(500).json({ error: err.message });
        }

        const total = totalResult[0] || {};

        res.json({
          total: total.total || 0,
          pending: total.pending || 0,
          resolved: total.resolved || 0,
          rejected: total.rejected || 0,
          positive: total.positive || 0,
          negative: total.negative || 0,
          neutral: total.neutral || 0,
          highSeverity: total.highSeverity || 0,
          avgConfidence: Number(total.avgConfidence || 0),
          topInstructor: instructorResult[0] || null,
          topCategory: categoryResult[0] || null
        });
      });
    });
  });
});

// =======================================
// PROTECTED: GET STATS PER INSTRUCTOR
// =======================================
router.get('/stats/:instructor_id', verifyToken, (req, res) => {
  const { instructor_id } = req.params;

  const categorySql = `
    SELECT 
      COALESCE(ai_category, category, 'Uncategorized') AS category,
      COUNT(*) AS count
    FROM complaints
    WHERE instructor_id = ?
    GROUP BY COALESCE(ai_category, category, 'Uncategorized')
  `;

  db.query(categorySql, [instructor_id], (err, categoryResults) => {
    if (err) {
      console.error('Stats category error:', err);
      return res.status(500).json({ error: err.message });
    }

    const severitySql = `
      SELECT 
        COALESCE(severity_level, 'None') AS severity_level,
        COUNT(*) AS count
      FROM complaints
      WHERE instructor_id = ?
      GROUP BY COALESCE(severity_level, 'None')
    `;

    db.query(severitySql, [instructor_id], (err, severityResults) => {
      if (err) {
        console.error('Stats severity error:', err);
        return res.status(500).json({ error: err.message });
      }

      const totalSql = `
        SELECT COUNT(*) AS total
        FROM complaints
        WHERE instructor_id = ?
      `;

      db.query(totalSql, [instructor_id], (err, totalResult) => {
        if (err) {
          console.error('Stats total error:', err);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          total: totalResult[0].total || 0,
          categories: categoryResults || [],
          severity: severityResults || []
        });
      });
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
      complaints.sentiment,
      COALESCE(complaints.ai_category, complaints.category, 'Uncategorized') AS category,
      complaints.severity_level,
      complaints.ai_severity_reason,
      complaints.ai_confidence,
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

    res.json({
      complaint_id: latest.complaint_id,
      subject_code: latest.subject_code,
      instructor_name: latest.instructor_name,
      complaint_text: latest.complaint_message,
      sentiment: latest.sentiment || 'Neutral',
      category: latest.category || 'Uncategorized',
      severity: latest.severity_level || 'None',
      severity_reason: latest.ai_severity_reason || 'No reason provided.',
      confidence: Number(latest.ai_confidence || 0),
      created_at: latest.created_at
    });
  });
});

module.exports = router;