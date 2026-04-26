<<<<<<< HEAD
const bcrypt = require('bcrypt');
const db = require('./config/db');

const createAdmin = async () => {
  const username = 'admin';
  const password = 'admin123';

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO admins (username, password_hash)
    VALUES (?, ?)
  `;

  db.query(sql, [username, hashedPassword], (err) => {
    if (err) {
      console.error('Error creating admin:', err.message);
      process.exit();
    }

    console.log('Admin account created successfully');
    console.log('Username:', username);
    console.log('Password:', password);
    process.exit();
  });
};

=======
const bcrypt = require('bcrypt');
const db = require('./config/db');

const createAdmin = async () => {
  const username = 'admin';
  const password = 'admin123';

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO admins (username, password_hash)
    VALUES (?, ?)
  `;

  db.query(sql, [username, hashedPassword], (err) => {
    if (err) {
      console.error('Error creating admin:', err.message);
      process.exit();
    }

    console.log('Admin account created successfully');
    console.log('Username:', username);
    console.log('Password:', password);
    process.exit();
  });
};

>>>>>>> 51647ce9afc43e3b298509a28c0b9efd31c06b5b
createAdmin();