import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ใช้สำหรับนำทาง
import './style/Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // ใช้สำหรับ redirect

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token'); // ดึง token จาก LocalStorage
      if (!token) {
        setError('You are not logged in!');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/profile', {
          headers: {
            Authorization: `Bearer ${token}`, // ส่ง token ไปใน header
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError(
          <>
          'Failed to load profile'
          <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
          
        );
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // ลบ token ออกจาก LocalStorage
    navigate('/'); // นำทางกลับไปยังหน้า overview
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!profile) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <div className="profile-details">
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Phone Number:</strong> {profile.phoneNumber}</p>
        <p><strong>Country:</strong> {profile.country}</p>
      </div>
      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
};

export default Profile;
