const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit'); // เพิ่ม express-rate-limit

const app = express();
const PORT = 3000;

// Secret key สำหรับการเซ็น JWT
const SECRET_KEY = 'your_secret_key'; // เปลี่ยนเป็นคีย์ลับของคุณ

// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'pattananpxndptn01',
  database: 'hotel_users_db',
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.use(cors());
app.use(bodyParser.json());

// **Rate Limiter สำหรับ /login**
const loginLimiter = rateLimit({
  windowMs:  60 * 1000, // 1 นาที
  max: 5, // อนุญาตให้ลองเข้าสู่ระบบได้สูงสุด 5 ครั้งต่อ IP
  message: 'Too many login attempts, please try again after 1 minutes', // ข้อความเมื่อถูกบล็อก
});

// Endpoint สำหรับการลงทะเบียน
app.post('/register', async (req, res) => {
  const { username, email, password, phoneNumber, country } = req.body;

  if (!username || !email || !password || !phoneNumber || !country) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Database error during user check:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        'INSERT INTO users (username, email, password, phoneNumber, country) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, phoneNumber, country],
        (err) => {
          if (err) {
            console.error('Database insertion error:', err);
            return res.status(500).json({ message: 'Database error' });
          }
          res.status(200).json({ message: 'User registered successfully' });
        }
      );
    } catch (error) {
      console.error('Hashing error:', error);
      res.status(500).json({ message: 'Error hashing password' });
    }
  });
});

// Endpoint สำหรับการเข้าสู่ระบบ
app.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // ตรวจสอบข้อมูลในตาราง users
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      const user = results[0];

      // ตรวจสอบรหัสผ่าน
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // สร้าง JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: 'Login successful',
        token,
        role: user.role,
      });
    }

    // ตรวจสอบข้อมูลในตาราง role หากไม่พบใน users
    db.query('SELECT * FROM role WHERE username = ?', [username], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length > 0) {
        const roleUser = results[0];

        // ตรวจสอบรหัสผ่าน (กรณีไม่มี bcrypt)
        if (password !== roleUser.password) {
          return res.status(401).json({ message: 'Invalid username or password' });
        }

        // สร้าง JWT
        const token = jwt.sign(
          {
            id: roleUser.id,
            username: roleUser.username,
            role: roleUser.role,
          },
          SECRET_KEY,
          { expiresIn: '1h' }
        );

        return res.status(200).json({
          message: 'Login successful',
          token,
          role: roleUser.role,
        });
      }

      // หากไม่พบข้อมูลในทั้งสองตาราง
      return res.status(404).json({ message: 'User not found' });
    });
  });
});



// Middleware สำหรับตรวจสอบ Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

// ตัวอย่าง Endpoint ที่ต้องใช้ Token
app.get('/protected', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Welcome to the protected route!', user: req.user });
});


app.get('/profile', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT username, email, phoneNumber, country FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Database error during profile retrieval:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
});

// API: ดึงข้อมูลห้องพัก
app.get('/api/rooms', (req, res) => {
  const query = 'SELECT * FROM rooms'; // Query ดึงข้อมูลห้องพักทั้งหมด
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching rooms:', err); // แสดงข้อผิดพลาดในคอนโซล
      res.status(500).json({ message: 'Server error' }); // ส่งข้อความข้อผิดพลาดกลับไปยัง Client
    } else if (results.length === 0) {
      res.status(404).json({ message: 'No rooms found' }); // ส่งข้อความถ้าไม่มีข้อมูลในตาราง
    } else {
      res.json(results); // ส่งข้อมูลห้องพักในรูปแบบ JSON กลับไปยัง Client
    }
  });
});

// API: ดึงข้อมูลการจองเรียงตาม ID
app.get('/api/bookings', (req, res) => {
  const query = 'SELECT * FROM bookings ORDER BY id DESC'; // เรียงตาม ID จากมากไปน้อย
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ message: 'Server error' });
    } else {
      res.json(results);
    }
  });
});

// API: เพิ่มการจอง
app.post('/api/bookings', (req, res) => {
  const { guest_name, room_number, check_in_date, check_out_date, total_price, status } = req.body;

  // ตรวจสอบว่า Check-In Date ไม่ย้อนหลัง
  const today = new Date();
  const checkInDate = new Date(check_in_date);
  const checkOutDate = new Date(check_out_date);

  if (checkInDate < today) {
    return res.status(400).json({ message: 'Check-In date cannot be in the past.' });
  }

  // ตรวจสอบว่า Check-Out Date ต้องหลัง Check-In Date
  if (checkOutDate <= checkInDate) {
    return res.status(400).json({ message: 'Check-Out date must be after Check-In date.' });
  }

  // ตรวจสอบห้องว่าง
  db.query(
    'SELECT is_available FROM rooms WHERE room_number = ?',
    [room_number],
    (err, results) => {
      if (err) {
        console.error('Error checking room availability:', err);
        res.status(500).json({ message: 'Server error' });
      } else if (results.length === 0 || !results[0].is_available) {
        res.status(400).json({ message: 'Room is not available' });
      } else {
        // เพิ่มการจอง
        db.query(
          'INSERT INTO bookings (guest_name, room_number, check_in_date, check_out_date, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
          [guest_name, room_number, check_in_date, check_out_date, total_price, status],
          (err) => {
            if (err) {
              console.error('Error adding booking:', err);
              res.status(500).json({ message: 'Server error' });
            } else {
              // อัปเดตสถานะห้องเป็นไม่ว่าง
              db.query(
                'UPDATE rooms SET is_available = FALSE WHERE room_number = ?',
                [room_number],
                (err) => {
                  if (err) {
                    console.error('Error updating room status:', err);
                    res.status(500).json({ message: 'Error updating room status' });
                  } else {
                    res.status(200).json({ message: 'Booking added successfully' });
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

// API: เช็คอิน
app.put('/api/checkin/:id', (req, res) => {
  const bookingId = req.params.id;

  db.query(
    'UPDATE bookings SET status = "Checked-in" WHERE id = ?',
    [bookingId],
    (err, results) => {
      if (err) {
        console.error('Error during check-in:', err);
        res.status(500).json({ message: 'Server error' });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ message: 'Booking not found' });
      } else {
        res.status(200).json({ message: 'Checked-in successfully' });
      }
    }
  );
});

// API: เช็คเอาท์ห้อง
app.put('/api/checkout/room/:roomNumber', (req, res) => {
  const roomNumber = req.params.roomNumber;

  // อัปเดตสถานะห้องเป็น Available และอัปเดตการจองที่เกี่ยวข้องเป็น Checked-out
  db.query(
    'UPDATE rooms SET is_available = TRUE WHERE room_number = ?',
    [roomNumber],
    (err, roomResults) => {
      if (err) {
        console.error('Error updating room status:', err);
        res.status(500).json({ message: 'Server error' });
      } else if (roomResults.affectedRows === 0) {
        res.status(404).json({ message: 'Room not found' });
      } else {
        // อัปเดตสถานะการจองล่าสุดของห้องเป็น Checked-out
        db.query(
          'UPDATE bookings SET status = "Checked-out" WHERE room_number = ? AND status != "Checked-out" ORDER BY id DESC LIMIT 1',
          [roomNumber],
          (err, bookingResults) => {
            if (err) {
              console.error('Error updating booking status:', err);
              res.status(500).json({ message: 'Server error' });
            } else if (bookingResults.affectedRows === 0) {
              res.status(404).json({ message: 'No active booking found for this room' });
            } else {
              res.status(200).json({ message: 'Room checked-out successfully' });
            }
          }
        );
      }
    }
  );
});

// API: ดึงข้อมูลการจองทั้งหมด
app.get('/api/bookings', (req, res) => {
  db.query('SELECT * FROM bookings ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ message: 'Server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

// API: ดึงข้อมูลห้องทั้งหมด
app.get('/api/rooms', (req, res) => {
  db.query('SELECT * FROM rooms', (err, results) => {
    if (err) {
      console.error('Error fetching rooms:', err);
      res.status(500).json({ message: 'Server error' });
    } else {
      res.status(200).json(results);
    }
  });
});

// API: ดึงรายรับรายเดือน/ปี
app.get('/api/revenue', (req, res) => {
  const { startDate, endDate, roomType } = req.query;

  let query = `
    SELECT 
      SUM(total_price) AS totalRevenue, 
      DATE_FORMAT(check_in_date, '%Y-%m') AS monthYear, 
      room_type 
    FROM bookings
    JOIN rooms ON bookings.room_number = rooms.room_number
    WHERE check_in_date BETWEEN ? AND ?
  `;
  
  // Filter by roomType if provided
  if (roomType) {
    query += ' AND room_type = ?';
  }
  
  query += ' GROUP BY monthYear, room_type ORDER BY monthYear DESC';
  
  const queryParams = [startDate, endDate];
  if (roomType) queryParams.push(roomType);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching revenue data:', err);
      res.status(500).json({ message: 'Server error' });
    } else {
      res.json(results);
    }
  });
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
