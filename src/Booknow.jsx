import React, { useState } from 'react';
import './style/Booknow.css';

const Booknow = () => {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [roomType, setRoomType] = useState('');
  const [guests, setGuests] = useState(1);
  const [availableRooms, setAvailableRooms] = useState([]);

  const todayDate = new Date().toISOString().split('T')[0];

  const getMinCheckOutDate = () => {
    if (!checkInDate) return todayDate;
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      alert('Check-out date must be at least one day after the check-in date.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/available-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checkInDate, checkOutDate, roomType }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available rooms');
      }

      const data = await response.json();
      setAvailableRooms(data);
    } catch (error) {
      console.error(error);
      alert('Error fetching available rooms. Please try again later.');
    }
  };

  return (
    <div className="booking-container">
      <h2 className="booking-header">Book a Room</h2>
      <form onSubmit={handleCheckAvailability} className="booking-form">
        <div className="form-group">
          <label htmlFor="checkInDate">Check-In Date</label>
          <input
            type="date"
            id="checkInDate"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            min={todayDate}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="checkOutDate">Check-Out Date</label>
          <input
            type="date"
            id="checkOutDate"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            min={getMinCheckOutDate()}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="roomType">Room Type</label>
          <select
            id="roomType"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            required
          >
            <option value="">Select a room type</option>
            <option value="Standard Room">Standard Room</option>
            <option value="Grand Standard Room">Grand Standard Room</option>
            <option value="Suite">Suite</option>
          </select>
        </div>
        <button type="submit" className="booking-button">View Availability</button>
      </form>

      {/* แสดงห้องที่ว่าง */}
      {availableRooms.length > 0 && (
        <div className="available-rooms">
          <h3>Available Rooms</h3>
          <div className="rooms-list">
            {availableRooms.map((room) => (
              <div key={room.id} className="room-card">
                <h4>{room.type}</h4>
                <p><strong>Room Number:</strong> {room.room_number}</p>
                <p><strong>Price:</strong> ${room.price_per_night} / night</p>
                <p><strong>Capacity:</strong> {room.capacity} People</p>
                <button className="book-room-button">Book Now</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Booknow;
