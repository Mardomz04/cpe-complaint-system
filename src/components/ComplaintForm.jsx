import { useEffect, useState } from 'react';
import api from '../api';

function ComplaintForm() {
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    subject_id: '',
    instructor_id: '',
    category: '',
    severity_level: '',
    complaint_message: ''
  });

  useEffect(() => {
    api.get('/api/subjects')
      .then(res => setSubjects(res.data))
      .catch(err => console.error('Subjects error:', err));

    api.get('/api/instructors')
      .then(res => setInstructors(res.data))
      .catch(err => console.error('Instructors error:', err));
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.subject_id ||
      !form.instructor_id ||
      !form.category ||
      !form.severity_level ||
      !form.complaint_message
    ) {
      setMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setMessage('');

    api.post('/api/complaints', form)
      .then(() => {
        setSubmitted(true);
        setForm({
          subject_id: '',
          instructor_id: '',
          category: '',
          severity_level: '',
          complaint_message: ''
        });
      })
      .catch(err => {
        console.error('Submit error:', err);
        setMessage('Error submitting complaint.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (submitted) {
    return (
      <div className="form-container success-container">
        <h1>Complaint Submitted</h1>
        <p>Your complaint has been recorded anonymously.</p>

        <button type="button" onClick={() => setSubmitted(false)}>
          Submit Another Complaint
        </button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h1>Submit Complaint</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Subject</label>
          <select
            name="subject_id"
            value={form.subject_id}
            onChange={handleChange}
          >
            <option value="">Select Subject</option>
            {subjects.map(sub => (
              <option key={sub.subject_id} value={sub.subject_id}>
                {sub.subject_code} - {sub.subject_description}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Instructor</label>
          <select
            name="instructor_id"
            value={form.instructor_id}
            onChange={handleChange}
          >
            <option value="">Select Instructor</option>
            {instructors.map(inst => (
              <option key={inst.instructor_id} value={inst.instructor_id}>
                {inst.instructor_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            <option>Teaching Method</option>
            <option>Grading Concern</option>
            <option>Attendance</option>
            <option>Behavior</option>
            <option>Communication</option>
          </select>
        </div>

        <div className="form-group">
          <label>Severity Level</label>
          <select
            name="severity_level"
            value={form.severity_level}
            onChange={handleChange}
          >
            <option value="">Select Severity</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div className="form-group">
          <label>Complaint</label>
          <textarea
            name="complaint_message"
            value={form.complaint_message}
            onChange={handleChange}
            placeholder="Enter your complaint..."
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>

      {message && <p className="form-message">{message}</p>}
    </div>
  );
}

export default ComplaintForm;
