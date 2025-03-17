import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Spin } from 'antd';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status?: string;
}

const UpcomingTrips: React.FC = () => {
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 從 localStorage 獲取旅行數據
    const loadTrips = () => {
      try {
        const tripsData = localStorage.getItem('trips');
        if (tripsData) {
          const allTrips: Trip[] = JSON.parse(tripsData);
          
          // 過濾未來的旅程（今天日期之後開始的旅程）
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const future = allTrips.filter(trip => {
            const startDate = new Date(trip.startDate);
            return startDate >= today;
          });
          
          // 按開始日期排序
          const sorted = future.sort((a, b) => {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          });
          
          // 只顯示最近的 5 個旅程
          setUpcomingTrips(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error('載入旅程資料時發生錯誤:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrips();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Spin tip="載入旅程資料..." />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">即將到來的旅程</h3>
        <Link to="/trips" className="text-blue-500 hover:text-blue-700 text-sm">
          查看全部
        </Link>
      </div>
      
      {upcomingTrips.length > 0 ? (
        <div className="space-y-4">
          {upcomingTrips.map((trip) => (
            <div key={trip.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <Link to={`/trips/${trip.id}`} className="block hover:bg-gray-50 rounded-md p-2 -mx-2">
                <h4 className="font-semibold text-gray-800 mb-1">{trip.title}</h4>
                <p className="text-gray-600 text-sm mb-1">{trip.destination}</p>
                <p className="text-gray-500 text-sm">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <Empty 
          description="沒有即將到來的旅程" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Link
            to="/trips/new"
            className="inline-block text-blue-500 hover:text-blue-700 text-sm"
          >
            建立新旅程
          </Link>
        </Empty>
      )}
    </div>
  );
};

export default UpcomingTrips;