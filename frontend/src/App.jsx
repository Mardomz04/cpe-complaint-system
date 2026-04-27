import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

import Stats from './components/Stats';
import ComplaintForm from './components/ComplaintForm';
import ComplaintList from './components/ComplaintList';
import QRCodeBox from './components/QRCodeBox';
import Login from './components/Login';
import QRRedirect from './components/QRRedirect';
import AdminNotification from './components/AdminNotification';

import SubjectManager from './SubjectManager';
import InstructorManager from './InstructorManager';

import './App.css';

function AdminLayout({ children, onLogout }) {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      setIsLightMode(true);
    } else {
      document.body.classList.remove('light-mode');
      setIsLightMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !isLightMode;

    if (nextMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }

    setIsLightMode(nextMode);
  };

  return (
    <div className="dashboard">
      <AdminNotification />

      <div className="header">
        <div className="header-top">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
          >
            {isLightMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>

        <h1 className="page-title">Instructor Feedback Dashboard</h1>
        <p className="subtitle">Anonymous Feedback Monitoring System</p>
      </div>

      <nav className="nav-bar">
        <Link to="/">Dashboard</Link>
        <Link to="/admin/subjects">Manage Subjects</Link>
        <Link to="/admin/instructors">Manage Instructors</Link>
        <Link to="/complaint">Student Form</Link>

        <div className="nav-right">
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      {children}
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login setIsAuthenticated={setIsAuthenticated} />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AdminLayout onLogout={handleLogout}>
                <Stats />
                <QRCodeBox />
                <ComplaintList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AdminLayout onLogout={handleLogout}>
                <SubjectManager />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/instructors"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AdminLayout onLogout={handleLogout}>
                <InstructorManager />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/qr" element={<QRRedirect />} />

        <Route path="/complaint" element={<ComplaintForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;