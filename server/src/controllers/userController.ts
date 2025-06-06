import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

// 生成JWT Token
const generateToken = (id: number, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'defaultsecret', {
    expiresIn: '30d',
  });
};

// 生成刷新令牌
const generateRefreshToken = (id: number, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET || 'refreshsecret', {
    expiresIn: '60d',
  });
};

// 確保表存在並創建默認用戶
const ensureDefaultUsersExist = async () => {
  try {
    // 檢查 users 表是否存在
    const usersTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    // 如果不存在，創建基本表結構
    if (!usersTableCheck.rows[0].exists) {
      console.log('創建用戶表...');
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('用戶表創建成功');
      
      // 檢查 user_settings 表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          theme_mode VARCHAR(20) DEFAULT 'light',
          theme_color VARCHAR(20) DEFAULT '#000',
          font_size VARCHAR(10) DEFAULT '16px',
          sidebar_collapsed BOOLEAN DEFAULT false,
          language VARCHAR(10) DEFAULT 'zh',
          timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
          date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
          time_format VARCHAR(20) DEFAULT 'HH:mm:ss',
          notifications_email BOOLEAN DEFAULT true,
          notifications_system BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // 檢查是否有任何用戶
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('創建默認用戶...');
      
      // 創建管理員用戶
      const adminSalt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('admin123', adminSalt);
      
      await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@example.com', adminPassword, 'admin']
      );
      
      // 創建測試用戶
      const testSalt = await bcrypt.genSalt(10);
      const testPassword = await bcrypt.hash('password123', testSalt);
      
      await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        ['test', 'test@example.com', testPassword, 'user']
      );
      
      console.log('默認用戶創建成功');
    }
    
    return true;
  } catch (error) {
    console.error('創建默認用戶時出錯:', error);
    return false;
  }
};

// @desc   註冊新用戶
// @route  POST /api/users/register
// @access Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: '請提供所有必填字段' });
    return;
  }

  try {
    // 檢查用戶名或郵箱是否已存在
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      res.status(400).json({ message: '用戶名或郵箱已被使用' });
      return;
    }

    // 加密密碼
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 創建用戶
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'user']
    );

    const user = result.rows[0];

    // 創建用戶設置
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role),
      refreshToken: generateRefreshToken(user.id, user.role),
    });
  } catch (error) {
    console.error('註冊用戶時出錯:', error);
    res.status(500).json({ message: '註冊用戶失敗' });
  }
};

// @desc   用戶登入
// @route  POST /api/users/login
// @access Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: '請提供郵箱和密碼' });
    return;
  }

  try {
    // 檢查是否需要創建默認用戶
    await ensureDefaultUsersExist();
    
    // 檢查用戶是否存在
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: '郵箱或密碼不正確' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role),
      refreshToken: generateRefreshToken(user.id, user.role),
    });
  } catch (error) {
    console.error('用戶登入時出錯:', error);
    res.status(500).json({ message: '登入失敗' });
  }
};

// @desc   獲取用戶個人資料
// @route  GET /api/users/profile
// @access Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: '未授權' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT u.id, u.username, u.email, u.role, u.created_at, us.* FROM users u LEFT JOIN user_settings us ON u.id = us.user_id WHERE u.id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: '用戶未找到' });
      return;
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      settings: {
        theme_mode: user.theme_mode,
        theme_color: user.theme_color,
        font_size: user.font_size,
        sidebar_collapsed: user.sidebar_collapsed,
        language: user.language,
        timezone: user.timezone,
        date_format: user.date_format,
        time_format: user.time_format,
        notifications_email: user.notifications_email,
        notifications_system: user.notifications_system,
      }
    });
  } catch (error) {
    console.error('獲取用戶資料時出錯:', error);
    res.status(500).json({ message: '獲取用戶資料失敗' });
  }
};

// @desc   更新用戶個人資料
// @route  PUT /api/users/profile
// @access Private
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: '未授權' });
    return;
  }

  const { username, email, password, settings } = req.body;

  try {
    // 先獲取當前用戶信息
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: '用戶未找到' });
      return;
    }

    const user = userResult.rows[0];

    // 更新用戶基本信息
    let updateQuery = 'UPDATE users SET';
    const updateValues = [];
    let valueIndex = 1;

    if (username) {
      updateQuery += ` username = $${valueIndex},`;
      updateValues.push(username);
      valueIndex++;
    }

    if (email) {
      updateQuery += ` email = $${valueIndex},`;
      updateValues.push(email);
      valueIndex++;
    }

    if (password) {
      // 加密新密碼
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      updateQuery += ` password = $${valueIndex},`;
      updateValues.push(hashedPassword);
      valueIndex++;
    }

    // 移除最後的逗號
    updateQuery = updateQuery.slice(0, -1);
    updateQuery += ` WHERE id = $${valueIndex} RETURNING id, username, email, role`;
    updateValues.push(req.user.id);

    // 如果有提供需要更新的字段
    if (updateValues.length > 1) {
      const updateResult = await pool.query(updateQuery, updateValues);
      user.username = updateResult.rows[0].username;
      user.email = updateResult.rows[0].email;
    }

    // 更新用戶設置（如果提供了）
    if (settings) {
      let settingsUpdateQuery = 'UPDATE user_settings SET';
      const settingsUpdateValues = [];
      let settingsValueIndex = 1;
      
      // 遍歷設置對象的鍵值對
      for (const [key, value] of Object.entries(settings)) {
        // 確保只更新允許的字段
        if ([
          'theme_mode', 'theme_color', 'font_size', 'sidebar_collapsed',
          'language', 'timezone', 'date_format', 'time_format',
          'notifications_email', 'notifications_system'
        ].includes(key)) {
          settingsUpdateQuery += ` ${key} = $${settingsValueIndex},`;
          settingsUpdateValues.push(value);
          settingsValueIndex++;
        }
      }

      // 如果有設置需要更新
      if (settingsUpdateValues.length > 0) {
        // 移除最後的逗號
        settingsUpdateQuery = settingsUpdateQuery.slice(0, -1);
        settingsUpdateQuery += ` WHERE user_id = $${settingsValueIndex}`;
        settingsUpdateValues.push(req.user.id);

        await pool.query(settingsUpdateQuery, settingsUpdateValues);
      }
    }

    res.json({
      message: '用戶資料已更新',
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role),
      refreshToken: generateRefreshToken(user.id, user.role),
    });
  } catch (error) {
    console.error('更新用戶資料時出錯:', error);
    res.status(500).json({ message: '更新用戶資料失敗' });
  }
};
