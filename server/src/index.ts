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

// 中間件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));

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

// 初始化默認用戶
const initDefaultUsers = async () => {
  try {
    console.log('檢查默認用戶是否存在...');

    // 檢查 users 表是否存在
    const tablesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tablesCheck.rows[0].exists) {
      console.log('用戶表不存在，將在第一次請求後自動創建');
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
  } catch (error) {
    console.error('初始化用戶時出錯:', error);
  }
};

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
