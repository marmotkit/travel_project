# 旅行計劃管理系統雲端部署指南

*版本 1.0.0 - 2025年3月17日*

## 目錄

1. [簡介](#簡介)
2. [部署架構](#部署架構)
3. [後端 API 開發](#後端-api-開發)
4. [數據庫設計與遷移](#數據庫設計與遷移)
5. [API 路由開發](#api-路由開發)
6. [Azure Blob Storage 整合](#azure-blob-storage-整合)
7. [前端應用適配改造](#前端應用適配改造)
8. [數據遷移腳本](#數據遷移腳本)
9. [Render 部署配置](#render-部署配置)
10. [前端改造與API整合](#前端改造與api整合)
11. [部署自動化設置](#部署自動化設置)
12. [本地開發與線上環境統一](#本地開發與線上環境統一)
13. [執行部署流程](#執行部署流程)
14. [持續集成與自動部署](#持續集成與自動部署)
15. [最終測試與遷移](#最終測試與遷移)
16. [執行計劃時間表](#執行計劃時間表)

## 簡介

本文檔提供將旅行計劃管理系統從本地存儲(localStorage)遷移到雲端架構的詳細指南。系統將使用 Render 作為前後端託管服務，Render 提供的 PostgreSQL 作為數據庫，以及 Azure Blob Storage 作為照片存儲解決方案。

## 部署架構

系統將採用以下架構：
- **前端**：部署在 Render 上的 React 應用
- **後端**：部署在 Render 上的 Express.js API
- **數據庫**：Render 提供的 PostgreSQL 數據庫
- **照片存儲**：Azure Blob Storage
- **認證**：基於 JWT 的自定義認證系統

## 後端 API 開發

### 建立 Express.js 後端架構

```bash
# 建立後端資料夾
mkdir travel-plan-api
cd travel-plan-api

# 初始化 Node.js 專案
npm init -y

# 安裝必要依賴
npm install express cors pg dotenv bcrypt jsonwebtoken multer @azure/storage-blob helmet compression
npm install --save-dev typescript ts-node @types/express @types/node @types/cors @types/pg @types/jsonwebtoken @types/multer nodemon

設定 TypeScript 配置文件
建立 tsconfig.json 檔案:
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}

建立基本目錄結構
travel-plan-api/
├── src/
│   ├── config/        # 配置文件
│   ├── controllers/   # 控制器
│   ├── middlewares/   # 中間件
│   ├── models/        # 數據模型
│   ├── routes/        # 路由
│   ├── services/      # 業務邏輯
│   ├── utils/         # 工具函數
│   └── app.ts         # 應用程序入口
├── .env               # 環境變數
├── package.json       # 依賴管理
└── tsconfig.json      # TypeScript 配置

建立環境變數文件 (.env)
# 服務配置
PORT=4000

# 數據庫配置
DB_HOST=postgres-db-host-from-render
DB_PORT=5432
DB_USER=postgres-user-from-render
DB_PASSWORD=postgres-password-from-render
DB_NAME=travel_plan_db

# JWT 配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d

# Azure 存儲配置
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
AZURE_STORAGE_CONTAINER_NAME=travel-plan-images

數據庫設計與遷移
創建主要數據表格
建立 src/models/database.sql 文件:
-- 用戶表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系統設置表
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  version VARCHAR(20) NOT NULL,
  last_updated DATE NOT NULL,
  developer_name VARCHAR(100),
  contact_email VARCHAR(100),
  website_url VARCHAR(200),
  description TEXT,
  copyright TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 個人設置表
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  theme_mode VARCHAR(20) DEFAULT 'light',
  theme_color VARCHAR(20) DEFAULT '#1890ff',
  font_size VARCHAR(10) DEFAULT 'medium',
  sidebar_collapsed BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'zh-TW',
  timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(10) DEFAULT '24hour',
  notifications_email BOOLEAN DEFAULT true,
  notifications_system BOOLEAN DEFAULT true,
  data_backup_frequency VARCHAR(20) DEFAULT 'weekly',
  data_retention_period VARCHAR(20) DEFAULT '1year',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 旅行計劃表
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'planning',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 行程表
CREATE TABLE itineraries (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 行程活動表
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location VARCHAR(200),
  description TEXT,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 住宿表
CREATE TABLE accommodations (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(200),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  booking_reference VARCHAR(100),
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 交通表
CREATE TABLE transportations (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  departure_location VARCHAR(200) NOT NULL,
  arrival_location VARCHAR(200) NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  booking_reference VARCHAR(100),
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 照片表
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  azure_url VARCHAR(500) NOT NULL,
  description TEXT,
  taken_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有表添加觸發器
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_system_settings_modtime BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_user_settings_modtime BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_trips_modtime BEFORE UPDATE ON trips FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_itineraries_modtime BEFORE UPDATE ON itineraries FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_activities_modtime BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_accommodations_modtime BEFORE UPDATE ON accommodations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_transportations_modtime BEFORE UPDATE ON transportations FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 插入系統設置初始數據
INSERT INTO system_settings (id, version, last_updated, developer_name, contact_email, website_url, description, copyright)
VALUES (1, '1.4.7', CURRENT_DATE, '旅行計劃系統開發團隊', 'contact@travelplan.example.com', 'https://travelplan.example.com', '專業的旅行計劃管理系統', '© 2025 旅行計劃系統. 保留所有權利。');

數據庫連接文件
建立 src/config/db.ts:
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params)
};

API 路由開發
主應用程序入口
建立 src/app.ts:
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import userRoutes from './routes/userRoutes';
import tripRoutes from './routes/tripRoutes';
import settingsRoutes from './routes/settingsRoutes';
import authRoutes from './routes/authRoutes';
import photoRoutes from './routes/photoRoutes';
import { errorHandler } from './middlewares/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 4000;

// 中間件
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/photos', photoRoutes);

// 錯誤處理中間件
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

用戶認證路由
建立 src/routes/authRoutes.ts:
import express from 'express';
import { register, login, refreshToken, forgotPassword, resetPassword } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

其他主要路由文件
同樣方式創建其他路由文件，包括 userRoutes.ts, tripRoutes.ts, settingsRoutes.ts, photoRoutes.ts。

Azure Blob Storage 整合
Azure 存儲服務
建立 src/services/azureStorageService.ts:
import { BlobServiceClient, BlockBlobClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'travel-plan-images';

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export const getBlobClient = (filename: string): BlockBlobClient => {
  return containerClient.getBlockBlobClient(filename);
};

export const uploadFile = async (file: Express.Multer.File): Promise<string> => {
  try {
    const blobName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(file.buffer, file.size);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading file to Azure Blob Storage:', error);
    throw new Error('Failed to upload file to storage');
  }
};

export const deleteFile = async (blobName: string): Promise<void> => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error('Error deleting file from Azure Blob Storage:', error);
    throw new Error('Failed to delete file from storage');
  }
};

照片上傳控制器
建立 src/controllers/photoController.ts:
import { Request, Response } from 'express';
import { uploadFile, deleteFile } from '../services/azureStorageService';
import db from '../config/db';
import multer from 'multer';

// 配置 multer 用於處理文件上傳
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 限制
});

export const uploadMiddleware = upload.single('photo');

export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未提供照片文件' });
    }
    
    const file = req.file;
    const { trip_id, activity_id, description } = req.body;
    
    // 上傳到 Azure Blob Storage
    const azureUrl = await uploadFile(file);
    
    // 保存到數據庫
    const result = await db.query(
      'INSERT INTO photos (trip_id, activity_id, file_name, azure_url, description, taken_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [trip_id, activity_id || null, file.originalname, azureUrl, description || null, new Date()]
    );
    
    res.status(201).json({
      message: '照片上傳成功',
      photo: {
        id: result.rows[0].id,
        trip_id,
        activity_id,
        file_name: file.originalname,
        azure_url: azureUrl,
        description
      }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: '照片上傳失敗' });
  }
};

export const getPhotosByTrip = async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM photos WHERE trip_id = $1 ORDER BY taken_at DESC',
      [trip_id]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: '獲取照片失敗' });
  }
};

export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 先獲取照片記錄
    const photoResult = await db.query('SELECT azure_url FROM photos WHERE id = $1', [id]);
    
    if (photoResult.rows.length === 0) {
      return res.status(404).json({ message: '照片不存在' });
    }
    
    const azureUrl = photoResult.rows[0].azure_url;
    const blobName = azureUrl.split('/').pop() || '';
    
    // 從 Azure 刪除
    await deleteFile(blobName);
    
    // 從數據庫刪除
    await db.query('DELETE FROM photos WHERE id = $1', [id]);
    
    res.status(200).json({ message: '照片刪除成功' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: '刪除照片失敗' });
  }
};

前端應用適配改造
API 服務層建立
建立 src/services/api.ts:
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// 創建 axios 實例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 請求攔截器添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 響應攔截器處理錯誤和 token 刷新
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是 401 錯誤且不是重試請求
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 嘗試刷新 token
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        // 更新 Authorization 頭並重試
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Token 刷新失敗，登出用戶
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

改造現有 Context 使用 API
以 SettingsContext 為例，從 localStorage 遷移到 API:
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// 類型定義
export interface SystemSettings {
  // 保持原有類型定義
}

interface SettingsContextType {
  settings: SystemSettings;
  updateTheme: (theme: Partial<SystemSettings['theme']>) => Promise<void>;
  updateLocalization: (localization: SystemSettings['localization']) => Promise<void>;
  updateNotifications: (notifications: SystemSettings['notifications']) => Promise<void>;
  updateDataManagement: (dataManagement: SystemSettings['dataManagement']) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  applyTheme: (theme: SystemSettings['theme']) => void;
  setSidebarCollapsed: (collapsed: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    // 初始設定值保持不變
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // 首次載入時從 API 獲取設定
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userId = localStorage.getItem('userId');
        
        if (userId) {
          // 獲取用戶個人設定
          const response = await api.get(`/settings/user/${userId}`);
          setSettings(response.data);
        } else {
          // 獲取系統默認設定
          const response = await api.get('/settings/system');
          setSettings(response.data);
        }
      } catch (error) {
        console.error('獲取設定失敗:', error);
        // 如果 API 請求失敗，使用 localStorage 的備份設定
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // 更新主題設定
  const updateTheme = async (theme: Partial<SystemSettings['theme']>) => {
    try {
      const updatedSettings = {
        ...settings,
        theme: {
          ...settings.theme,
          ...theme
        }
      };
      
      setSettings(updatedSettings);
      
      const userId = localStorage.getItem('userId');
      if (userId) {
        await api.put(`/settings/user/${userId}/theme`, theme);
      }
      
      // 保留本地備份
      localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('更新主題設定失敗:', error);
    }
  };
  
  // 應用其他方法的類似修改...
  
  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateTheme,
        updateLocalization,
        updateNotifications,
        updateDataManagement,
        updateSettings,
        resetSettings,
        applyTheme,
        setSidebarCollapsed
      }}
    >
      {!isLoading && children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

數據遷移腳本
從 localStorage 遷移到數據庫
建立 src/components/DataMigration.tsx:
import React, { useState } from 'react';
import { Button, Steps, message, Card, Progress, Alert } from 'antd';
import api from '../services/api';

const { Step } = Steps;

const DataMigration: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);
  
  const migrateUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 步驟 1: 獲取本地存儲的用戶數據
      setProgress(10);
      const userDataRaw = localStorage.getItem('userData');
      if (!userDataRaw) {
        throw new Error('找不到本地用戶數據');
      }
      
      const userData = JSON.parse(userDataRaw);
      setProgress(20);
      
      // 步驟 2: 發送數據到 API
      await api.post('/users/migrate', userData);
      setProgress(60);
      
      // 步驟 3: 遷移設置數據
      const settingsRaw = localStorage.getItem('systemSettings');
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        await api.post('/settings/migrate', settings);
      }
      setProgress(90);
      
      // 步驟 4: 清理本地緩存
      setProgress(100);
      
      message.success('數據遷移成功！');
      setMigrationComplete(true);
      setCurrent(2);
    } catch (err: any) {
      console.error('數據遷移錯誤:', err);
      setError(err.message || '數據遷移過程中發生錯誤');
      setCurrent(1);
    } finally {
      setLoading(false);
    }
  };
  
  const steps = [
    {
      title: '開始遷移',
      content: (
        <Card title="準備遷移數據" style={{ marginTop: 20 }}>
          <p>此操作將把您本地存儲的所有數據遷移到雲端服務器。遷移後，您可以在任何設備上訪問您的旅行計劃。</p>
          <p>請確保您已經登錄，並且有穩定的網絡連接。</p>
          <Button type="primary" onClick={() => setCurrent(1)}>
            準備開始
          </Button>
        </Card>
      ),
    },
    {
      title: '執行遷移',
      content: (
        <Card title="數據遷移進行中" style={{ marginTop: 20 }}>
          {error ? (
            <Alert
              message="遷移錯誤"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : null}
          
          <Progress percent={progress} status={error ? 'exception' : 'active'} />
          
          <div style={{ marginTop: 20 }}>
            <Button
              type="primary"
              loading={loading}
              onClick={migrateUserData}
              disabled={migrationComplete}
            >
              {migrationComplete ? '遷移已完成' : loading ? '遷移中...' : '開始遷移'}
            </Button>
          </div>
        </Card>
      ),
    },
    {
      title: '完成',
      content: (
        <Card title="遷移完成" style={{ marginTop: 20 }}>
          <Alert
            message="遷移成功"
            description="您的數據已成功遷移到雲端。現在您可以在任何設備上訪問您的旅行計劃。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Button type="primary" onClick={() => window.location.href = '/dashboard'}>
            繼續使用應用
          </Button>
        </Card>
      ),
    },
  ];
  
  return (
    <div style={{ padding: 24 }}>
      <h1>數據遷移工具</h1>
      <Steps current={current}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      
      <div className="steps-content">{steps[current].content}</div>
    </div>
  );
};

export default DataMigration;

Render 部署配置
前端部署配置
建立 render.yaml 在前端項目根目錄:
services:
  - type: web
    name: travel-plan-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./build
    envVars:
      - key: REACT_APP_API_URL
        value: https://travel-plan-api.onrender.com/api
      - key: NODE_VERSION
        value: 16
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

後端部署配置
建立 Procfile 在後端項目根目錄:
web: node dist/app.js

services:
  - type: web
    name: travel-plan-api
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DB_HOST
        fromDatabase:
              - key: DB_HOST
        fromDatabase:
          name: travel-plan-db
          property: host
      - key: DB_PORT
        fromDatabase:
          name: travel-plan-db
          property: port
      - key: DB_USER
        fromDatabase:
          name: travel-plan-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: travel-plan-db
          property: password
      - key: DB_NAME
        fromDatabase:
          name: travel-plan-db
          property: database
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRE
        value: 7d
      - key: AZURE_STORAGE_CONNECTION_STRING
        sync: false
      - key: AZURE_STORAGE_CONTAINER_NAME
        value: travel-plan-images

databases:
  - name: travel-plan-db
    plan: free
    databaseName: travel_plan_db

前端改造與API整合
API 服務集成
在前端專案中建立各業務功能對應的 API 服務文件，例如 src/services/tripsApi.ts:
import api from './api';

export interface Trip {
  id: number;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string;
  status: string;
}

export const getAllTrips = async (): Promise<Trip[]> => {
  const response = await api.get('/trips');
  return response.data;
};

export const getTrip = async (id: number): Promise<Trip> => {
  const response = await api.get(`/trips/${id}`);
  return response.data;
};

export const createTrip = async (tripData: Omit<Trip, 'id'>): Promise<Trip> => {
  const response = await api.post('/trips', tripData);
  return response.data;
};

export const updateTrip = async (id: number, tripData: Partial<Trip>): Promise<Trip> => {
  const response = await api.put(`/trips/${id}`, tripData);
  return response.data;
};

export const deleteTrip = async (id: number): Promise<void> => {
  await api.delete(`/trips/${id}`);
};

改造組件使用 API
以 TripList 組件為例進行改造:
import React, { useState, useEffect } from 'react';
import { List, Card, Button, Skeleton, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getAllTrips, Trip } from '../services/tripsApi';

const TripList: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const data = await getAllTrips();
        setTrips(data);
      } catch (error) {
        console.error('獲取旅行計劃失敗:', error);
        message.error('獲取旅行計劃失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  return (
    <div className="trip-list-container">
      <div className="trip-list-header">
        <h1>我的旅行計劃</h1>
        <Link to="/trips/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新增計劃
          </Button>
        </Link>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
        dataSource={trips}
        loading={loading}
        renderItem={(trip) => (
          <List.Item>
            <Link to={`/trips/${trip.id}`}>
              <Card
                hoverable
                title={trip.title}
                extra={<span className={`status ${trip.status}`}>{trip.status}</span>}
              >
                <p><strong>目的地:</strong> {trip.destination}</p>
                <p><strong>日期:</strong> {trip.start_date} 至 {trip.end_date}</p>
                {trip.description && (
                  <p className="trip-description">{trip.description}</p>
                )}
              </Card>
            </Link>
          </List.Item>
        )}
      />
    </div>
  );
};

export default TripList;

部署自動化設置
GitHub Actions 配置
在前端項目中創建 .github/workflows/deploy.yml:
name: Deploy to Render

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Frontend to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_FRONTEND_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          
      - name: Wait for Frontend Deployment
        run: sleep 60
      
      - name: Deploy Backend to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_BACKEND_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

本地開發與線上環境統一
環境變數配置
在前端項目中創建 .env.development 和 .env.production:

.env.development:
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_ENV=development

.env.production:
REACT_APP_API_URL=https://travel-plan-api.onrender.com/api
REACT_APP_ENV=production

在後端項目中創建 .env.development 和 .env.production (應用程序需要根據 NODE_ENV 載入對應的環境變數):

.env.development:
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=travel_plan_local
JWT_SECRET=local-dev-secret-key
JWT_EXPIRE=1d
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
AZURE_STORAGE_CONTAINER_NAME=travel-plan-images-dev

執行部署流程
部署前檢查清單
代碼準備:
  前端代碼已完成本地存儲到 API 的遷移
  後端 API 已實現所有需要的接口
  數據庫遷移腳本已測試通過
  環境變數文件已配置好
Render 帳戶準備:
  已創建 Render 帳戶
  已連接 GitHub 倉庫
Azure 存儲準備:
  已創建 Azure 存儲帳戶
  已創建 Blob 容器
  已獲取連接字符串
部署步驟
數據庫部署:
  在 Render 上創建 PostgreSQL 數據庫
  記下連接信息
後端部署:
  將後端代碼推送到 GitHub
  在 Render 上創建新的 Web 服務
  選擇 Node.js 運行時
  設置環境變數，包括數據庫連接信息和 Azure 存儲連接字符串
  部署服務
前端部署:
  將前端代碼推送到 GitHub
  在 Render 上創建新的靜態網站
  設置環境變數，包括 API URL
  部署靜態網站
設置自動部署:
  對 GitHub 倉庫設置 webhook
最終測試與遷移
部署後測試清單
基本功能測試:
  用戶註冊和登錄
  旅行計劃的新增、編輯和刪除
  照片上傳和顯示
數據遷移測試:
  執行數據遷移工具
  確認所有數據已正確遷移
跨瀏覽器和設備測試:
  在不同瀏覽器上測試
  在移動設備上測試響應式設計
故障排除和監控
監控設置:
  設置 Render 的基本監控
  配置錯誤報告
備份策略:
  設置 PostgreSQL 數據庫的定期備份
  配置 Azure Blob 存儲的備份策略
