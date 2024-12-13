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