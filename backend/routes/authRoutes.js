router.get('/reset-admin-cpe', async (req, res) => {
  try {
    const username = 'CPEadmin';
    const password = 'CPE2026!';
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'UPDATE admins SET username = ?, password_hash = ? WHERE admin_id = 1',
      [username, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          message: 'Admin updated successfully',
          username,
          password
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
