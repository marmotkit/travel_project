import React, { useState } from 'react';
import { Button, Card, Space, Divider, Alert, Typography, Switch, Row, Col } from 'antd';
import TravelMap from '../components/analytics/TravelMap';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

// 定義測試數據
const testTrips = [
  {
    id: 't1',
    title: '東京之旅',
    startDate: '2023-01-05',
    endDate: '2023-01-10',
    destination: '東京',
    country: '日本',
    coordinates: [139.6917, 35.6895],
    budget: 15000,
    expenses: 12500
  },
  {
    id: 't2',
    title: '台北之旅',
    startDate: '2023-02-15',
    endDate: '2023-02-20',
    destination: '台北',
    country: '台灣',
    coordinates: [121.5654, 25.0330],
    budget: 10000,
    expenses: 9500
  },
  {
    id: 't3',
    title: '紐約之旅',
    startDate: '2023-04-10',
    endDate: '2023-04-18',
    destination: '紐約',
    country: '美國',
    coordinates: [-74.0060, 40.7128],
    budget: 30000,
    expenses: 32000
  },
  {
    id: 't4',
    title: '倫敦之旅',
    startDate: '2023-06-20',
    endDate: '2023-06-28',
    destination: '倫敦',
    country: '英國',
    coordinates: [-0.1278, 51.5074],
    budget: 25000,
    expenses: 26500
  },
  {
    id: 't5',
    title: '香港之旅',
    startDate: '2023-08-08',
    endDate: '2023-08-12',
    destination: '香港',
    country: '香港',
    coordinates: [114.1694, 22.3193],
    budget: 12000,
    expenses: 11000
  }
];

/**
 * 地圖測試頁面
 * 用於測試和驗證地圖顯示功能
 */
const MapTest: React.FC = () => {
  // 狀態管理
  const [trips, setTrips] = useState<any[]>([]);
  const [showCoordinateSystem, setShowCoordinateSystem] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // 添加測試數據
  const addTestData = () => {
    console.log('添加測試數據...');
    setTrips(testTrips);
  };
  
  // 清除測試數據
  const clearTestData = () => {
    console.log('清除測試數據...');
    setTrips([]);
  };

  // 切換年份過濾
  const toggleYearFilter = () => {
    if (selectedYear === null) {
      setSelectedYear(2023);
    } else {
      setSelectedYear(null);
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <Card title="地圖測試頁面" className="shadow-md">
        <Alert
          message="測試說明"
          description={
            <ul>
              <li>此頁面用於測試和驗證地圖標記顯示功能</li>
              <li>您可以添加測試數據，查看不同座標在地圖上的顯示情況</li>
              <li>綠色點表示測試參考位置（左上、右上、左下、右下各25%和75%位置）</li>
              <li>紅色點表示行程目的地</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Space style={{ marginBottom: '20px' }}>
          <Button type="primary" onClick={addTestData}>
            添加測試數據
          </Button>
          <Button onClick={clearTestData}>
            清除測試數據
          </Button>
          <Switch 
            checked={showCoordinateSystem} 
            onChange={setShowCoordinateSystem} 
            checkedChildren="顯示座標系統" 
            unCheckedChildren="隱藏座標系統" 
          />
          <Switch 
            checked={selectedYear !== null} 
            onChange={toggleYearFilter} 
            checkedChildren="僅顯示2023年" 
            unCheckedChildren="顯示所有年份" 
          />
        </Space>
        
        <div style={{ marginBottom: '20px' }}>
          <Title level={4}>測試數據 ({trips.length} 筆旅行記錄)</Title>
          <Row gutter={[16, 16]}>
            {trips.map((trip, index) => (
              <Col span={8} key={trip.id}>
                <Card size="small" title={trip.title}>
                  <p><Text strong>目的地:</Text> {trip.destination}</p>
                  <p><Text strong>國家:</Text> {trip.country}</p>
                  <p><Text strong>座標:</Text> [{trip.coordinates[0]}, {trip.coordinates[1]}]</p>
                  <p><Text strong>日期:</Text> {trip.startDate} 至 {trip.endDate}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        
        <Divider>地圖顯示</Divider>
        
        <div className="map-container">
          <TravelMap 
            trips={trips} 
            selectedYear={selectedYear} 
            showCoordinateSystem={showCoordinateSystem}
          />
        </div>
        
        <Divider />
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Space>
            <Link to="/analytics">
              <Button type="primary">返回報表分析頁面</Button>
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default MapTest;
