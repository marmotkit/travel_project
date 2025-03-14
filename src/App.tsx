import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import TripForm from './pages/TripForm';

// 路由保護組件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    // 用戶未登入，重定向到登入頁面
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // 初始化默認旅程數據（如果不存在）
    const trips = localStorage.getItem('trips');
    if (!trips) {
      const defaultTrips = [
        {
          id: '1',
          title: '東京五日遊',
          destination: '日本東京',
          startDate: '2023-12-15',
          endDate: '2023-12-20',
          status: 'upcoming',
          description: '期待已久的東京旅行，將會參觀多個景點並體驗當地美食。',
          budget: 50000,
          currency: 'TWD',
          categories: ['leisure', 'cultural', 'food'],
          participants: [
            { id: '101', name: '王小明', email: 'wang@example.com' },
            { id: '102', name: '李小華', email: 'lee@example.com' }
          ],
          notes: '記得帶轉接頭和保暖衣物',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: '台南三日遊',
          destination: '台灣台南',
          startDate: '2023-11-10',
          endDate: '2023-11-12',
          status: 'completed',
          description: '短暫的台南小旅行，主要是品嚐美食和參觀歷史景點。',
          budget: 8000,
          currency: 'TWD',
          categories: ['leisure', 'food'],
          participants: [
            { id: '201', name: '張小美', email: 'mei@example.com' }
          ],
          notes: '安平古堡、赤崁樓必去',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('trips', JSON.stringify(defaultTrips));
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* 公開路由 */}
        <Route path="/login" element={<Login />} />
        
        {/* 保護路由 */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/trips" element={
          <ProtectedRoute>
            <Trips />
          </ProtectedRoute>
        } />
        
        {/* 注意：特定路由需要放在參數路由之前，避免路由衝突 */}
        <Route path="/trips/new" element={
          <ProtectedRoute>
            <TripForm />
          </ProtectedRoute>
        } />
        
        <Route path="/trips/:id/edit" element={
          <ProtectedRoute>
            <TripForm />
          </ProtectedRoute>
        } />
        
        <Route path="/trips/:id" element={
          <ProtectedRoute>
            <TripDetail />
          </ProtectedRoute>
        } />
        
        {/* 默認路由 */}
        <Route path="/" element={<Navigate replace to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
