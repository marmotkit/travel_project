import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import UpcomingTrips from '../components/dashboard/UpcomingTrips';
import RecentActivities from '../components/dashboard/RecentActivities';
import TripStats from '../components/dashboard/TripStats';

const Dashboard: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    upcomingTrips: 2,
    totalTrips: 12,
    photos: 256,
    expenses: '124,500 TWD',
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    // 檢查用戶是否已登入
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      // 未登入，導向登入頁面
      navigate('/login');
      return;
    }
    
    // 解析用戶數據
    try {
      const user = JSON.parse(userStr);
      setUserData(prevData => ({
        ...prevData,
        name: user.name || '用戶',
      }));
      
      // 設置管理員狀態
      if (user.isAdmin) {
        setIsAdmin(user.isAdmin);
      }
    } catch (err) {
      console.error('解析用戶數據出錯:', err);
      navigate('/login');
    }
  }, [navigate]);

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
    
    // 更新 localStorage 中的用戶管理員狀態
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        user.isAdmin = !isAdmin;
        localStorage.setItem('user', JSON.stringify(user));
      } catch (err) {
        console.error('更新用戶管理員狀態出錯:', err);
      }
    }
  };

  const handleLogout = () => {
    // 清除用戶數據
    localStorage.removeItem('user');
    // 導向登入頁面
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 overflow-auto">
        <Header 
          title="個人儀表板" 
          isAdmin={isAdmin} 
          onToggleAdmin={toggleAdminMode} 
          userName={userData.name}
        />
        
        <main className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">歡迎回來，{userData.name}</h2>
              <p className="text-gray-600">
                {isAdmin ? '目前處於管理員模式' : '目前處於一般用戶模式'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              登出
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <TripStats 
              upcomingTrips={userData.upcomingTrips}
              totalTrips={userData.totalTrips}
              photos={userData.photos}
              expenses={userData.expenses}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingTrips />
            <RecentActivities />
          </div>
          
          <div className="mt-6">
            <Link
              to="/trips/new"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md"
            >
              <i className="fas fa-plus mr-2"></i>
              建立新旅程
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 