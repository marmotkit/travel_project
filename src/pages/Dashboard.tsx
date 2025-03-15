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
              title="近期旅程"
              value={userData.upcomingTrips.toString()}
              icon="calendar-alt"
              color="bg-blue-500"
            />
            <TripStats 
              title="總旅程數"
              value={userData.totalTrips.toString()}
              icon="suitcase"
              color="bg-green-500"
            />
            <TripStats 
              title="總花費"
              value={userData.expenses}
              icon="dollar-sign"
              color="bg-purple-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold mb-4">即將到來的旅程</h3>
                <UpcomingTrips />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">近期活動</h3>
                <RecentActivities />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">旅遊事項提醒</h3>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <h4 className="font-medium">日本東京之旅</h4>
                  <p className="text-sm text-gray-600">
                    出發前記得辦理日本旅遊保險。截止日期: 2023/12/01
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <h4 className="font-medium">歐洲多國行</h4>
                  <p className="text-sm text-gray-600">
                    3個月內需申請申根簽證。截止日期: 2024/01/15
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                  <h4 className="font-medium">台南美食之旅</h4>
                  <p className="text-sm text-gray-600">
                    訂房即將到期，請確認。截止日期: 今天
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 