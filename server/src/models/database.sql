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
  country VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'planning',
  type VARCHAR(50),
  coordinates DECIMAL[] DEFAULT NULL,
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
VALUES (1, '1.0.0', CURRENT_DATE, '旅行計劃系統開發團隊', 'contact@travelplan.example.com', 'https://github.com/marmotkit/travel_project', '專業的旅行計劃管理系統', '© 2025 旅行計劃系統. 保留所有權利。');
