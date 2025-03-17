import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middlewares/errorMiddleware';
import { initContainer } from './services/azureStorageService';
import bcrypt from 'bcryptjs';
import { pool } from './config/db';

// 路由導入
import userRoutes from './routes/userRoutes';
import tripRoutes from './routes/tripRoutes';
import photoRoutes from './routes/photoRoutes';

// 環境變量配置
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 確保數據庫表已創建
const ensureTablesExist = async () => {
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
    }

    // 檢查 user_settings 表
    const settingsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_settings'
      );
    `);

    if (!settingsTableCheck.rows[0].exists) {
      console.log('創建用戶設置表...');
      await pool.query(`
        CREATE TABLE user_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          theme VARCHAR(20) DEFAULT 'light',
          language VARCHAR(10) DEFAULT 'zh',
          notifications BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('用戶設置表創建成功');
    }

    return true;
  } catch (error) {
    console.error('確保表存在時出錯:', error);
    return false;
  }
};

// 初始化默認用戶
const initDefaultUsers = async () => {
  try {
    console.log('檢查默認用戶是否存在...');

    // 首先確保表存在
    const tablesExist = await ensureTablesExist();
    if (!tablesExist) {
      console.log('表創建失敗，無法初始化用戶');
      return;
    }

    // 檢查默認郵箱是否已被使用
    const email = 'admin@example.com';
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length === 0) {
      // 創建管理員用戶
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const result = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        ['admin', email, hashedPassword, 'admin']
      );

      const user = result.rows[0];

      // 創建用戶設置
      await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1)',
        [user.id]
      );

      console.log('默認管理員用戶創建成功', {
        email: user.email,
        password: 'admin123'  // 只在日誌中顯示，不存儲明文密碼
      });
    } else {
      console.log('管理員用戶已存在，跳過初始化');
    }

    // 也創建一個測試用戶
    const testEmail = 'test@example.com';
    const testUserCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [testEmail]
    );

    if (testUserCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const testPassword = await bcrypt.hash('password123', salt);
      const testResult = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        ['test', testEmail, testPassword, 'user']
      );

      const testUser = testResult.rows[0];

      // 創建用戶設置
      await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1)',
        [testUser.id]
      );

      console.log('測試用戶創建成功', {
        email: testUser.email,
        password: 'password123'  // 只在日誌中顯示，不存儲明文密碼
      });
    }

    console.log('默認用戶初始化完成');
  } catch (error) {
    console.error('初始化用戶時出錯:', error);
  }
};

// 中間件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));

// 添加中間件來檢查並創建初始用戶
app.use(async (req, res, next) => {
  // 如果是第一次請求，則嘗試初始化用戶
  if (!app.locals.initialized) {
    try {
      await initDefaultUsers();
      app.locals.initialized = true;
    } catch (error) {
      console.error('初始化用戶失敗，但仍將繼續處理請求:', error);
    }
  }
  next();
});

// 路由設置
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/photos', photoRoutes);

// 錯誤處理中間件
app.use(errorHandler);

// 靜態文件服務
app.use(express.static(path.join(__dirname, '../../build')));

// 所有其他路由返回React應用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../build', 'index.html'));
});

// 啟動服務器
const startServer = async () => {
  try {
    // 嘗試初始化 Azure 存儲容器，但如果失敗，不要阻止服務器啟動
    try {
      await initContainer();
      console.log('Azure 存儲容器已初始化');
    } catch (error) {
      console.warn('Azure 存儲容器初始化失敗，但服務器將繼續啟動:', error);
    }
    
    // 初始化默認用戶
    await initDefaultUsers();

    app.listen(PORT, () => {
      console.log(`服務器運行在端口 ${PORT}`);
      console.log(`環境: ${process.env.NODE_ENV}`);
      console.log(`訪問憑據: admin@example.com / admin123 或 test@example.com / password123`);
    });
  } catch (error) {
    console.error('服務器啟動失敗:', error);
    console.error('應用將終止運行');
  }
};

startServer();

export default app;
