import { useEffect, useState } from 'react';
import api from './api';

function InstructorManager() {
  const [instructors, setInstructors] = useState([]);
  const [instructorName, setInstructorName] = useState('');
  const [message, setMessage] = useState('');

  const fetchInstructors = () => {
    api.get('/instructors')
      .then(res => setInstructors(res.data))
      .catch(err => {
        console.error(err);
        setMessage('Error loading instructors.');
      });
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
        setMessage(err.response?.data?.error || 'Error adding instructor.');
      });
  };

  const handleDelete = (instructorId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this instructor?'
    );

    if (!confirmDelete) return;

    api.delete(`/instructors/${instructorId}`)
      .then(() => {
        setMessage('Instructor deleted successfully.');
        fetchInstructors();
      })
      .catch(err => {
        console.error(err);
        setMessage(err.response?.data?.error || 'Error deleting instructor.');
      });
  };

  return (
    <div className="card">
      <h2>Manage Instructors</h2>
      <p className="section-desc">Add or remove instructor names that students can select in the complaint form.</p>

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
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {instructors.length === 0 ? (
              <tr>
                <td colSpan="3">No instructors added yet.</td>
              </tr>
            ) : (
              instructors.map(instructor => (
                <tr key={instructor.instructor_id}>
                  <td>{instructor.instructor_name}</td>
                  <td>{new Date(instructor.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="small-btn reject-btn"
                      onClick={() => handleDelete(instructor.instructor_id)}
                    >
                      Delete
                    </button>
                  </td>
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
