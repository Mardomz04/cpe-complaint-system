router.get("/notifications/latest", (req, res) => {
  const sql = `
    SELECT 
      complaints.complaint_id,
      subjects.subject_code,
      instructors.instructor_name,
      complaints.severity_level,
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
      console.error("Notification fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch notification" });
    }

    const latest = result[0];
    if (!latest) return res.json(null);

    res.json({
      complaint_id: latest.complaint_id,
      subject_code: latest.subject_code,
      instructor_name: latest.instructor_name,
      severity: latest.severity_level,
      complaint_text: latest.complaint_message,
      created_at: latest.created_at
    });
  });
});
