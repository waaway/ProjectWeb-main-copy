import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RevenueDashboard = () => {
  const [revenues, setRevenues] = useState([]);
  const [filteredRevenues, setFilteredRevenues] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomType, setRoomType] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [newRoomType, setNewRoomType] = useState('');
  const [newTotalPrice, setNewTotalPrice] = useState('');
  const [newCheckInDate, setNewCheckInDate] = useState('');
  const [newCheckOutDate, setNewCheckOutDate] = useState('');

  useEffect(() => {
    // ดึงข้อมูลรายรับจาก backend
    axios.get('http://localhost:3000/api/bookings')
      .then(response => {
        setRevenues(response.data);
        setFilteredRevenues(response.data);
      })
      .catch(error => {
        console.error("There was an error fetching the revenue data:", error);
      });

    // ดึงรายการประเภทห้องจาก backend
    axios.get('http://localhost:3000/api/roomtypes')
      .then(response => {
        setRoomTypes(response.data); // กำหนดประเภทห้อง
      })
      .catch(error => {
        console.error("There was an error fetching the room types:", error);
      });
  }, []);

  // ฟังก์ชันกรองข้อมูล
  const filterRevenue = () => {
    const filtered = revenues.filter((revenue) => {
      const checkInDate = new Date(revenue.check_in_date);
      const checkOutDate = new Date(revenue.check_out_date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();

      return (
        checkInDate >= start &&
        checkOutDate <= end &&
        (roomType ? revenue.type === roomType : true)
      );
    });
    setFilteredRevenues(filtered);
  };

  // ฟังก์ชันส่งข้อมูลเพื่อเพิ่มรายรับใหม่
  const handleAddRevenue = (e) => {
    e.preventDefault();
    const newRevenue = {
      room_type: newRoomType,
      total_price: newTotalPrice,
      check_in_date: newCheckInDate,
      check_out_date: newCheckOutDate,
    };

    // ส่งข้อมูลไปยัง backend เพื่อเพิ่มรายรับใหม่
    axios.post('http://localhost:3000/api/bookings', newRevenue)
      .then(response => {
        // รีเฟรชข้อมูลรายรับหลังจากเพิ่มเสร็จ
        setRevenues([...revenues, response.data]);
        setFilteredRevenues([...revenues, response.data]);
        // เคลียร์ฟอร์ม
        setNewRoomType('');
        setNewTotalPrice('');
        setNewCheckInDate('');
        setNewCheckOutDate('');
      })
      .catch(error => {
        console.error("There was an error adding the revenue:", error);
      });
  };

  const data = {
    labels: filteredRevenues.map((revenue) => new Date(revenue.check_in_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Revenue',
        data: filteredRevenues.map((revenue) => revenue.total_price),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div>
      <h1>Revenue Dashboard</h1>
      <div>
        <h3>Filters</h3>
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>End Date</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <label>Room Type</label>
        <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
          <option value="">All Room Types</option>
          
          {roomTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button onClick={filterRevenue}>Apply Filters</button>
      </div>

      <div>
        <h3>Revenue Graph</h3>
        <Line data={data} />
      </div>

      <div>
        <h3>Revenue Table</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Room Type</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredRevenues.map((revenue, index) => (
              <tr key={index}>
                <td>{new Date(revenue.check_in_date).toLocaleDateString()}</td>
                <td>{revenue.type}</td>
                <td>{revenue.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </div>
  );
};

export default RevenueDashboard;
