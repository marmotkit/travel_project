import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middlewares/errorMiddleware';
import userRoutes from './routes/userRoutes';
import tripRoutes from './routes/tripRoutes';
import photoRoutes from './routes/photoRoutes';
import { initContainer } from './services/azureStorageService';

// 加載環境變量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 中間件
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/photos', photoRoutes);

// 靜態文件服務（僅在生產環境使用）
if (process.env.NODE_ENV === 'production') {
  // 指向前端構建目錄
  app.use(express.static(path.join(__dirname, '../../build')));

  // 所有未匹配的路由都返回 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
}

// 錯誤處理中間件
app.use(errorHandler);

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

    app.listen(PORT, () => {
      console.log(`服務器運行在: http://localhost:${PORT}`);
      console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('服務器啟動失敗:', error);
    console.error('應用將終止運行');
  }
};

startServer();

export default app;
