import { useEffect, useState } from 'react';
import api from './api';

function InstructorManager() {
  const [instructors, setInstructors] = useState([]);
  const [instructorName, setInstructorName] = useState('');
  const [message, setMessage] = useState('');

  const fetchInstructors = () => {
    api.get('/instructors')
      .then(res => setInstructors(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!instructorName) {
      setMessage('Please enter instructor name.');
      return;
    }

    api.post('/instructors', {
      instructor_name: instructorName
    })
      .then(() => {
        setMessage('Instructor added successfully.');
        setInstructorName('');
        fetchInstructors();
      })
      .catch(err => {
        console.error(err);
        setMessage('Error adding instructor.');
      });
  };

  return (
    <div className="card">
      <h2>Manage Instructors</h2>
      <p className="section-desc">Add instructor names that students can select in the complaint form.</p>

      <form className="manager-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Instructor Name</label>
          <input
            type="text"
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            placeholder="Example: Engr. Dela Cruz"
          />
        </div>

        <button type="submit">Add Instructor</button>
      </form>

      {message && <p className="form-message">{message}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Instructor Name</th>
              <th>Date Added</th>
            </tr>
          </thead>

          <tbody>
            {instructors.length === 0 ? (
              <tr>
                <td colSpan="2">No instructors added yet.</td>
              </tr>
            ) : (
              instructors.map(instructor => (
                <tr key={instructor.instructor_id}>
                  <td>{instructor.instructor_name}</td>
                  <td>{new Date(instructor.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InstructorManager;