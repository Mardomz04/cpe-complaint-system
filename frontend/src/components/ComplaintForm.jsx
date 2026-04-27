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
    complaint_message: ''
  });

  useEffect(() => {
    api.get('/subjects')
      .then(res => setSubjects(res.data))
      .catch(err => console.error('Subjects error:', err));

    api.get('/instructors')
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
      !form.complaint_message.trim()
    ) {
      setMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setMessage('');

    api.post('/complaints', form)
      .then(() => {
        setSubmitted(true);
        setForm({
          subject_id: '',
          instructor_id: '',
          complaint_message: ''
        });
      })
      .catch(err => {
        console.error('Submit error:', err);
        setMessage('Error submitting feedback.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (submitted) {
    return (
      <div className="form-container success-container">
        <h1>Feedback Submitted</h1>
        <p>Your feedback has been recorded anonymously.</p>

        <button type="button" onClick={() => setSubmitted(false)}>
          Submit Another Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h1>Submit Feedback</h1>

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
          <label>Feedback</label>
          <textarea
            name="complaint_message"
            value={form.complaint_message}
            onChange={handleChange}
            placeholder="Enter your feedback..."
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      {message && <p className="form-message">{message}</p>}
    </div>
  );
}

export default ComplaintForm;