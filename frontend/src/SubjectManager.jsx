import { useEffect, useState } from 'react';
import api from './api';

function SubjectManager() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    subject_code: '',
    subject_description: ''
  });
  const [message, setMessage] = useState('');

  const fetchSubjects = () => {
    api.get('/subjects')
      .then(res => setSubjects(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.subject_code || !form.subject_description) {
      setMessage('Please fill in all fields.');
      return;
    }

    api.post('/subjects', form)
      .then(() => {
        setMessage('Subject added successfully.');
        setForm({
          subject_code: '',
          subject_description: ''
        });
        fetchSubjects();
      })
      .catch(err => {
        console.error(err);
        setMessage('Error adding subject.');
      });
  };

  return (
    <div className="card">
      <h2>Manage Subjects</h2>
      <p className="section-desc">Add subject codes and descriptions used in the complaint form.</p>

      <form className="manager-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Subject Code</label>
          <input
            type="text"
            name="subject_code"
            value={form.subject_code}
            onChange={handleChange}
            placeholder="Example: CPE101"
          />
        </div>

        <div className="form-group">
          <label>Subject Description</label>
          <input
            type="text"
            name="subject_description"
            value={form.subject_description}
            onChange={handleChange}
            placeholder="Example: Introduction to Computer Engineering"
          />
        </div>

        <button type="submit">Add Subject</button>
      </form>

      {message && <p className="form-message">{message}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Description</th>
              <th>Date Added</th>
            </tr>
          </thead>

          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="3">No subjects added yet.</td>
              </tr>
            ) : (
              subjects.map(subject => (
                <tr key={subject.subject_id}>
                  <td>{subject.subject_code}</td>
                  <td>{subject.subject_description}</td>
                  <td>{new Date(subject.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SubjectManager;