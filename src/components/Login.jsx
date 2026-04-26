import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../api";

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    api.post('http://localhost:5000/api/auth/login', {
      username,
      password
    })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        navigate('/');
      })
      .catch((err) => {
        console.error(err);
        setError('Invalid username or password.');
      });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Login</h2>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;