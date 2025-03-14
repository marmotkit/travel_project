import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
  budget?: number;
  currency?: string;
  categories?: string[];
  participants?: { id: string; name: string; email?: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 類別選項查詢表
  const categoryMap: Record<string, string> = {
    'leisure': '休閒旅遊',
    'business': '商務旅行',
    'family': '家庭旅遊',
    'adventure': '冒險旅行',
    'cultural': '文化體驗',
    'food': '美食之旅',
    'shopping': '購物休閒',
    'education': '教育旅行'
  };

  useEffect(() => {
    // 檢查用戶身份
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return false;
      }
      
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user.isAdmin || false);
        return true;
      } catch (err) {
        navigate('/login');
        return false;
      }
    };

    const loadTrip = () => {
      if (!id) {
        setError('找不到指定的旅程');
        return;
      }

      try {
        const tripsStr = localStorage.getItem('trips');
        if (!tripsStr) {
          setError('找不到旅程數據');
          return;
        }

        const trips: Trip[] = JSON.parse(tripsStr);
        const foundTrip = trips.find(t => t.id === id);

        if (!foundTrip) {
          setError('找不到指定的旅程');
          return;
        }

        setTrip(foundTrip);
      } catch (err) {
        setError('加載旅程數據時出錯');
        console.error(err);
      }
    };

    const isAuth = checkAuth();
    if (isAuth) {
      loadTrip();
    }
    
    setIsLoading(false);
  }, [id, navigate]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusText = (status: Trip['status']): string => {
    switch (status) {
      case 'upcoming':
        return '即將到來';
      case 'ongoing':
        return '進行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '';
    }
  };

  const getStatusColor = (status: Trip['status']): string => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteTrip = () => {
    if (!trip) return;
    
    if (window.confirm('確定要刪除這個旅程嗎？此操作無法復原。')) {
      try {
        const tripsStr = localStorage.getItem('trips');
        if (!tripsStr) return;
        
        const trips: Trip[] = JSON.parse(tripsStr);
        const updatedTrips = trips.filter(t => t.id !== trip.id);
        
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
        navigate('/trips');
      } catch (err) {
        setError('刪除旅程時出錯');
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加載中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button 
            onClick={() => navigate('/trips')}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
          >
            返回旅程列表
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-xl mb-4">找不到旅程資料</div>
          <button 
            onClick={() => navigate('/trips')}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
          >
            返回旅程列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="旅程詳情" 
          isAdmin={isAdmin} 
          onToggleAdmin={() => {}} 
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* 頂部導航與動作 */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <Link to="/trips" className="text-blue-500 hover:text-blue-700 flex items-center mb-2">
                  <i className="fas fa-arrow-left mr-2"></i>
                  返回旅程列表
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">{trip.title}</h1>
              </div>
              
              <div className="flex space-x-2">
                <Link
                  to={`/trips/${trip.id}/edit`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                >
                  <i className="fas fa-edit mr-2"></i>
                  編輯旅程
                </Link>
                <button
                  onClick={handleDeleteTrip}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  刪除旅程
                </button>
              </div>
            </div>
            
            {/* 旅程詳情卡片 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* 頂部資訊區 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(trip.status)}`}>
                      {getStatusText(trip.status)}
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 mt-2">{trip.destination}</h2>
                    <p className="text-gray-600 mt-1">
                      <i className="far fa-calendar-alt text-blue-500 mr-2"></i>
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </p>
                  </div>
                  
                  {trip.budget !== undefined && (
                    <div className="bg-blue-50 px-4 py-3 rounded-md">
                      <p className="text-sm text-gray-500">預算</p>
                      <p className="text-xl font-bold text-gray-800">
                        {trip.budget.toLocaleString()} {trip.currency || 'TWD'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 詳細資訊區 */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 旅程描述 */}
                  {trip.description && (
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">旅程描述</h3>
                      <p className="text-gray-700">{trip.description}</p>
                    </div>
                  )}
                  
                  {/* 類別 */}
                  {trip.categories && trip.categories.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">旅程類型</h3>
                      <div className="flex flex-wrap gap-2">
                        {trip.categories.map(categoryId => (
                          <span 
                            key={categoryId} 
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                          >
                            {categoryMap[categoryId] || categoryId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 參與者 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">參與者</h3>
                    {trip.participants && trip.participants.length > 0 ? (
                      <ul className="space-y-2">
                        {trip.participants.map(person => (
                          <li key={person.id} className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                              <span className="text-blue-500 font-medium">
                                {person.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{person.name}</p>
                              {person.email && (
                                <p className="text-sm text-gray-500">{person.email}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">沒有參與者</p>
                    )}
                  </div>
                  
                  {/* 備註 */}
                  {trip.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">備註</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{trip.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 底部資訊 */}
              <div className="bg-gray-50 px-6 py-4 text-sm text-gray-500 border-t border-gray-200">
                <p>建立於: {new Date(trip.createdAt).toLocaleString('zh-TW')}</p>
                <p>上次更新: {new Date(trip.updatedAt).toLocaleString('zh-TW')}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TripDetail; 