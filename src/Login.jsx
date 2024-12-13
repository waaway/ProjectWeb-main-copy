import React, { useState } from 'react';
import './style/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // สถานะแสดง/ซ่อนรหัสผ่าน
  const [loading, setLoading] = useState(false); // สถานะ Loading
  const [error, setError] = useState(''); // สถานะแสดงข้อความ Error

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
  
    const userData = { username, password };
  
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // เก็บ Token
        localStorage.setItem('token', data.token);
  
        // ตรวจสอบบทบาท และเปลี่ยนเส้นทาง
        switch (data.role) {
          case 'admin':
            window.location.href = '/admin';
            break;
          case 'Reception':
            window.location.href = '/ReceptionDashboard';
            break;
          case 'marketing':
            window.location.href = '/marketing';
            break;
          case 'accounting':
            window.location.href = '/Accounting/Accounting'; 
            break;
          default:
            window.location.href = '/overview';
        }
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="error-message">{error}</div>} {/* แสดงข้อความ Error */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'} // แสดง/ซ่อนรหัสผ่าน
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            
          </div>
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'} {/* แสดงสถานะ Loading */}
        </button>
        <div className="register-link-container">
          Don't have an account?{' '}
          <a href="/register" className="register-link">
            Register
          </a>{' '}
          here to get started.
        </div>
      </form>
    </div>
  );
};

export default Login;
