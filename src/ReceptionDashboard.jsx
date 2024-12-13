import React, { useState, useEffect } from 'react';
import './style/ReceptionDashboard.css';

const ReceptionDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // ข้อความค้นหาหมายเลขห้อง
  const [selectedRoomType, setSelectedRoomType] = useState(''); // ประเภทห้องที่เลือก
  const [newBooking, setNewBooking] = useState({
    guest_name: '',
    room_number: '',
    check_in_date: '',
    check_out_date: '',
    total_price: '',
    status: 'Confirmed',
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const todayDate = new Date().toISOString().split('T')[0]; // วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD

  const getMinCheckOutDate = () => {
    if (!newBooking.check_in_date) return todayDate;
    const date = new Date(newBooking.check_in_date);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();

    // Validation: ตรวจสอบวันที่
    if (new Date(newBooking.check_in_date) < new Date(todayDate)) {
      alert('Check-In date cannot be in the past.');
      return;
    }
    if (new Date(newBooking.check_out_date) <= new Date(newBooking.check_in_date)) {
      alert('Check-Out date must be at least one day after the Check-In date.');
      return;
    }

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
        fetchData(); // อัปเดตข้อมูลห้องและการจอง
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error adding booking:', error);
    }
  };

  const handleCheckOut = async (roomNumber) => {
    try {
      const response = await fetch(`http://localhost:3000/api/checkout/room/${roomNumber}`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Room checked-out successfully!');
        fetchData(); // อัปเดตข้อมูลห้องและการจอง
      } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error during room check-out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // คำนวณจำนวนห้องที่ว่างและไม่ว่าง
  const totalAvailableRooms = rooms.filter((room) => room.is_available).length;
  const totalOccupiedRooms = rooms.length - totalAvailableRooms;

  // สถิติจำนวนห้องแยกตามประเภท
  const roomTypes = [...new Set(rooms.map((room) => room.type))];
  const roomStatsByType = roomTypes.map((type) => {
    const roomsByType = rooms.filter((room) => room.type === type);
    const availableByType = roomsByType.filter((room) => room.is_available).length;
    const occupiedByType = roomsByType.length - availableByType;
    return {
      type,
      available: availableByType,
      occupied: occupiedByType,
      total: roomsByType.length,
    };
  });

   // ฟิลเตอร์ห้องที่ต้องการค้นหา
  const filteredRooms = rooms.filter((room) => 
    room.room_number.toString().includes(searchQuery) &&
    (selectedRoomType === '' || room.type === selectedRoomType)
  );


  return (
    <div className="dashboard-container">
      <h1 className="text-3xl font-bold mb-4">Reception Dashboard</h1>

      {/* สถิติจำนวนห้องทั้งหมด */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold text-gray-400">Total Available Rooms</h2>
          <p className="text-4xl font-bold text-white">{totalAvailableRooms}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold text-gray-400">Total Occupied Rooms</h2>
          <p className="text-4xl font-bold text-white">{totalOccupiedRooms}</p>
        </div>
      </div>

       {/* สถิติจำนวนห้องแยกตามประเภท */}
       <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Room Statistics by Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roomStatsByType.map((stats) => (
            <div key={stats.type} className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-400">{stats.type}</h3>
              <p className="text-sm text-gray-400">Total Rooms: {stats.total}</p>
              <p className="text-sm text-green-400">Available: {stats.available}</p>
              <p className="text-sm text-red-400">Occupied: {stats.occupied}</p>
            </div>
          ))}
        </div>
      </div>

  {/* ฟิลเตอร์ค้นหา */}
  <div className="section mt-8">
        <h2>ค้นหาห้องพัก</h2>
        <div className="flex mb-4">
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="ค้นหาโดย หมายเลขห้อง" 
            className="p-2 mr-2 w-full rounded bg-gray-700 text-white" 
          />

          <select 
            value={selectedRoomType} 
            onChange={(e) => setSelectedRoomType(e.target.value)} 
            className="p-2 w-full rounded bg-gray-700 text-white"
          >
            <option value="">เลือกประเภทห้อง</option>
            {roomTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <table className="status-table">
          <thead>
            <tr>
              <th>หมายเลขห้อง</th>
              <th>ประเภท</th>
              <th>ราคา/คืน</th>
              <th>ความจุ</th>
              <th>สถานะ</th>
              <th>การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => (
              <tr key={room.room_number}>
                <td>{room.room_number}</td>
                <td>{room.type}</td>
                <td>{room.price_per_night} THB</td>
                <td>{room.capacity}</td>
                <td className={room.is_available ? 'available' : 'occupied'}>
                  {room.is_available ? 'Available' : 'Occupied'}
                </td>
                <td>
                  {!room.is_available && (
                    <button 
                      className="bg-blue-500 text-white px-4 py-2 rounded" 
                      onClick={() => handleCheckOut(room.room_number)}
                    >
                      Check-Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* ตารางแสดงห้องพัก */}
      <div className="section mt-8">
        <h2>Room List</h2>
        <table className="status-table">
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Type</th>
              <th>Price/Night</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
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
                <td>
                  {!room.is_available && (
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                      onClick={() => handleCheckOut(room.room_number)}
                    >
                      Check-Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ฟอร์มเพิ่มการจอง */}
      <div className="section mb-8">
        <h2 className="text-2xl font-bold mb-4">Add Booking</h2>
        <form onSubmit={handleAddBooking} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            Guest Name:
            <input
              type="text"
              value={newBooking.guest_name}
              onChange={(e) =>
                setNewBooking({ ...newBooking, guest_name: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </label>
          <label>
            Room Number:
            <select
              value={newBooking.room_number}
              onChange={(e) =>
                setNewBooking({ ...newBooking, room_number: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            >
              <option value="">Select Room</option>
              {rooms
                .filter((room) => room.is_available) // แสดงเฉพาะห้องว่าง
                .map((room) => (
                  <option key={room.room_number} value={room.room_number}>
                    {room.room_number}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Check-In Date:
            <input
              type="date"
              value={newBooking.check_in_date}
              onChange={(e) =>
                setNewBooking({ ...newBooking, check_in_date: e.target.value })
              }
              min={todayDate}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </label>
          <label>
            Check-Out Date:
            <input
              type="date"
              value={newBooking.check_out_date}
              onChange={(e) =>
                setNewBooking({ ...newBooking, check_out_date: e.target.value })
              }
              min={getMinCheckOutDate()}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
          </label>
          <label>
            Total Price:
          <input
            type="number"
            value={newBooking.total_price}
            onChange={(e) => {
              const rawValue = e.target.value;
              const value = rawValue === '' ? '' : Math.max(0, Number(rawValue));
              setNewBooking({ ...newBooking, total_price: value });
            }}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
        />


          </label>
          <button
            type="submit"
            className="w-full md:col-span-2 bg-blue-500 p-2 rounded text-white font-bold hover:bg-blue-600"
          >
            Add Booking
          </button>
        </form>
      </div>

      {/* ตารางแสดงประวัติการจอง */}
      <div className="section">
        <h2 className="text-2xl font-bold mb-4">Booking History</h2>
        <table className="status-table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest Name</th>
              <th>Room Number</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Total Price</th>
              <th>Status</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceptionDashboard; 