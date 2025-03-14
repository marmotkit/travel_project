import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import TripItem from '../components/trips/TripItem';
import { v4 as uuidv4 } from 'uuid';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

const Trips: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 檢查用戶登入狀態
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.isAdmin) setIsAdmin(user.isAdmin);
    }

    // 從localStorage獲取旅程數據，若無則使用默認數據
    const storedTrips = localStorage.getItem('trips');
    if (storedTrips) {
      setTrips(JSON.parse(storedTrips));
    } else {
      // 示例數據
      const demoTrips: Trip[] = [
        {
          id: uuidv4(),
          title: '東京商務出差',
          destination: '日本，東京',
          startDate: '2023-11-10',
          endDate: '2023-11-15',
          status: 'upcoming',
        },
        {
          id: uuidv4(),
          title: '峇里島度假',
          destination: '印尼，峇里島',
          startDate: '2023-12-20',
          endDate: '2023-12-31',
          status: 'upcoming',
        },
        {
          id: uuidv4(),
          title: '舊金山科技大會',
          destination: '美國，舊金山',
          startDate: '2023-09-05',
          endDate: '2023-09-12',
          status: 'completed',
        },
      ];
      
      setTrips(demoTrips);
      localStorage.setItem('trips', JSON.stringify(demoTrips));
    }
  }, []);

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

  // 篩選旅程
  const filteredTrips = trips
    .filter(trip => {
      if (filter === 'all') return true;
      return trip.status === filter;
    })
    .filter(trip => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        trip.title.toLowerCase().includes(query) ||
        trip.destination.toLowerCase().includes(query)
      );
    });

  const handleDeleteTrip = (id: string) => {
    const updatedTrips = trips.filter(trip => trip.id !== id);
    setTrips(updatedTrips);
    localStorage.setItem('trips', JSON.stringify(updatedTrips));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 overflow-auto">
        <Header 
          title="旅遊專案" 
          isAdmin={isAdmin} 
          onToggleAdmin={toggleAdminMode} 
        />
        
        <main className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">我的旅程</h2>
              <p className="text-gray-600">管理你的旅遊專案</p>
            </div>
            
            <Link
              to="/trips/new"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md inline-flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              建立新旅程
            </Link>
          </div>
          
          {/* 搜尋與篩選 */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="md:flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜尋旅程..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>
            
            <div className="flex overflow-x-auto space-x-2 pb-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                所有旅程
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filter === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                即將到來
              </button>
              <button
                onClick={() => setFilter('ongoing')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filter === 'ongoing' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                進行中
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                已完成
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filter === 'cancelled' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                已取消
              </button>
            </div>
          </div>
          
          {/* 旅程列表 */}
          {filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map(trip => (
                <TripItem 
                  key={trip.id} 
                  trip={trip} 
                  onDelete={handleDeleteTrip} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-suitcase-rolling text-blue-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">沒有符合條件的旅程</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? '找不到符合搜尋條件的旅程'
                  : filter === 'all' 
                    ? '你還沒有建立任何旅程' 
                    : `目前沒有${filter === 'upcoming' ? '即將到來' : filter === 'ongoing' ? '進行中' : filter === 'completed' ? '已完成' : '已取消'}的旅程`
                }
              </p>
              {(filter === 'all' && !searchQuery) && (
                <Link
                  to="/trips/new"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
                >
                  <i className="fas fa-plus mr-2"></i>
                  建立第一個旅程
                </Link>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md"
                >
                  清除搜尋
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Trips; 