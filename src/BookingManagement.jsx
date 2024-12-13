import React, { useState, useEffect } from 'react';
import './style/ReceptionDashboard.css';

const ReceptionDashboard = () => {
  const [rooms, setRooms] = useState([]); // เก็บข้อมูลห้องพัก
  const [bookings, setBookings] = useState([]); // เก็บข้อมูลการจอง
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล
  const [newBooking, setNewBooking] = useState({
    guest_name: '',
    room_number: '',
    check_in_date: '',
    check_out_date: '',
    total_price: '',
    status: 'Confirmed',
  }); // ข้อมูลการจองใหม่

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsResponse = await fetch('http://localhost:3000/api/rooms');
        const bookingsResponse = await fetch('http://localhost:3000/api/bookings');
        const roomsData = await roomsResponse.json();
        const bookingsData = await bookingsResponse.json();
        setRooms(roomsData);
        setBookings(bookingsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // เพิ่มการจอง
  const handleAddBooking = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBooking),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Booking added successfully!');
        setNewBooking({
          guest_name: '',
          room_number: '',
          check_in_date: '',
          check_out_date: '',
          total_price: '',
          status: 'Confirmed',
        });
        refreshData(); // โหลดข้อมูลใหม่
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error adding booking:', error);
    }
  };

  // เช็คอิน
  const handleCheckIn = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/checkin/${id}`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Checked-in successfully!');
        refreshData(); // โหลดข้อมูลใหม่
      } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  // เช็คเอาท์
  const handleCheckOut = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/checkout/${id}`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Checked-out successfully!');
        refreshData(); // โหลดข้อมูลใหม่
      } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  // โหลดข้อมูลใหม่
  const refreshData = async () => {
    try {
      const roomsResponse = await fetch('http://localhost:3000/api/rooms');
      const bookingsResponse = await fetch('http://localhost:3000/api/bookings');
      const roomsData = await roomsResponse.json();
      const bookingsData = await bookingsResponse.json();
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Reception Dashboard</h1>

      {/* ตารางแสดงข้อมูลห้องพัก */}
      <div className="section">
        <h2>Rooms</h2>
        <table className="status-table">
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Type</th>
              <th>Price/Night</th>
              <th>Capacity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.room_number}>
                <td>{room.room_number}</td>
                <td>{room.type}</td>
                <td>{room.price_per_night} THB</td>
                <td>{room.capacity}</td>
                <td className={room.is_available ? 'available' : 'occupied'}>
                  {room.is_available ? 'Available' : 'Occupied'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ตารางแสดงข้อมูลการจอง */}
      <div className="section">
        <h2>Bookings</h2>
        <table className="status-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest Name</th>
              <th>Room Number</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Total Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.guest_name}</td>
                <td>{booking.room_number}</td>
                <td>{booking.check_in_date}</td>
                <td>{booking.check_out_date}</td>
                <td>{booking.total_price} THB</td>
                <td>{booking.status}</td>
                <td>
                  {booking.status === 'Confirmed' && (
                    <button onClick={() => handleCheckIn(booking.id)}>Check-In</button>
                  )}
                  {booking.status === 'Checked-in' && (
                    <button onClick={() => handleCheckOut(booking.id)}>Check-Out</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ฟอร์มเพิ่มการจอง */}
      <div className="section">
        <h2>Add Booking</h2>
        <form onSubmit={handleAddBooking}>
          <label>
            Guest Name:
            <input
              type="text"
              name="guest_name"
              value={newBooking.guest_name}
              onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
              required
            />
          </label>
          <label>
            Room Number:
            <input
              type="number"
              name="room_number"
              value={newBooking.room_number}
              onChange={(e) => setNewBooking({ ...newBooking, room_number: e.target.value })}
              required
            />
          </label>
          <label>
            Check-In Date:
            <input
              type="date"
              name="check_in_date"
              value={newBooking.check_in_date}
              onChange={(e) => setNewBooking({ ...newBooking, check_in_date: e.target.value })}
              required
            />
          </label>
          <label>
            Check-Out Date:
            <input
              type="date"
              name="check_out_date"
              value={newBooking.check_out_date}
              onChange={(e) => setNewBooking({ ...newBooking, check_out_date: e.target.value })}
              required
            />
          </label>
          <label>
            Total Price:
            <input
              type="number"
              name="total_price"
              value={newBooking.total_price}
              onChange={(e) => setNewBooking({ ...newBooking, total_price: e.target.value })}
              required
            />
          </label>
          <button type="submit">Add Booking</button>
        </form>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
