import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  title: string;
  description: string;
  activities: ItineraryActivity[];
  accommodationId?: string;
  transportationIds?: string[];
  mealIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ItineraryActivity {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  cost?: number;
  currency?: string;
  category: 'sightseeing' | 'activity' | 'transportation' | 'accommodation' | 'meal' | 'other';
  notes?: string;
}

const Itinerary: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<string | null>(null);

  // 檢查用戶身份並加載數據
  useEffect(() => {
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

    const loadTrips = () => {
      // 從 localStorage 加載旅程數據
      const tripsStr = localStorage.getItem('trips');
      if (tripsStr) {
        const parsedTrips = JSON.parse(tripsStr);
        setTrips(parsedTrips);
        
        // 如果有旅程，默認選擇第一個
        if (parsedTrips.length > 0) {
          setSelectedTripId(parsedTrips[0].id);
        }
      }
      
      // 從 localStorage 加載行程數據
      const itineraryStr = localStorage.getItem('itinerary');
      if (itineraryStr) {
        const parsedItinerary = JSON.parse(itineraryStr);
        setItineraryDays(parsedItinerary);
      }
      
      setIsLoading(false);
    };

    const isAuth = checkAuth();
    if (isAuth) {
      loadTrips();
    }
  }, [navigate]);

  // 根據選擇的旅程過濾行程日
  const filteredItineraryDays = selectedTripId
    ? itineraryDays.filter(day => day.tripId === selectedTripId)
    : [];
  
  // 對行程日進行排序（依據日期）
  const sortedItineraryDays = [...filteredItineraryDays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 獲取選定旅程的信息
  const selectedTrip = trips.find(trip => trip.id === selectedTripId);

  // 處理旅程選擇變更
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTripId(e.target.value);
  };

  // 創建新行程日
  const handleCreateItineraryDay = () => {
    if (!selectedTripId) return;
    
    // 導航到行程日創建頁面，並傳遞選定的旅程 ID
    navigate(`/itinerary/day/new?tripId=${selectedTripId}`);
  };

  // 編輯行程日
  const handleEditItineraryDay = (dayId: string) => {
    navigate(`/itinerary/day/${dayId}/edit`);
  };

  // 查看行程日詳情
  const handleViewItineraryDay = (dayId: string) => {
    navigate(`/itinerary/day/${dayId}`);
  };

  // 顯示刪除確認對話框
  const handleConfirmDelete = (dayId: string) => {
    setDayToDelete(dayId);
    setShowDeleteModal(true);
  };

  // 刪除行程日
  const handleDeleteItineraryDay = () => {
    if (!dayToDelete) return;

    try {
      // 從 localStorage 獲取現有行程日
      const itineraryStr = localStorage.getItem('itinerary');
      if (!itineraryStr) {
        setShowDeleteModal(false);
        return;
      }

      const allItineraryDays: ItineraryDay[] = JSON.parse(itineraryStr);
      // 過濾掉要刪除的行程日
      const updatedItineraryDays = allItineraryDays.filter(day => day.id !== dayToDelete);
      
      // 保存更新後的行程日數據
      localStorage.setItem('itinerary', JSON.stringify(updatedItineraryDays));
      
      // 更新本地狀態
      setItineraryDays(updatedItineraryDays);
      
      // 關閉確認對話框
      setShowDeleteModal(false);
      setDayToDelete(null);
    } catch (err) {
      console.error('刪除行程日時出錯:', err);
      setShowDeleteModal(false);
    }
  };

  // 取消刪除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDayToDelete(null);
  };

  // 格式化日期顯示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="行程管理"
          isAdmin={isAdmin}
          onToggleAdmin={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {/* 旅程選擇器 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-semibold text-gray-800">選擇旅程</h2>
                <p className="text-gray-600 text-sm">請選擇要管理行程的旅遊專案</p>
              </div>
              
              <div className="w-full md:w-1/3">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTripId || ''}
                  onChange={handleTripChange}
                >
                  <option value="" disabled>-- 選擇旅程 --</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title} ({trip.destination})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedTrip && (
              <div className="mt-4 bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-700">{selectedTrip.title}</h3>
                <div className="flex flex-wrap mt-2 text-sm">
                  <div className="mr-6">
                    <span className="text-gray-600">目的地:</span>
                    <span className="ml-2 text-gray-800">{selectedTrip.destination}</span>
                  </div>
                  <div className="mr-6">
                    <span className="text-gray-600">開始日期:</span>
                    <span className="ml-2 text-gray-800">{new Date(selectedTrip.startDate).toLocaleDateString('zh-TW')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">結束日期:</span>
                    <span className="ml-2 text-gray-800">{new Date(selectedTrip.endDate).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 行程日列表 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">行程日管理</h2>
              
              {selectedTripId && (
                <button
                  onClick={handleCreateItineraryDay}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                >
                  <i className="fas fa-plus mr-2"></i>
                  新增行程日
                </button>
              )}
            </div>
            
            {!selectedTripId ? (
              <div className="text-center py-12">
                <i className="fas fa-calendar-alt text-gray-300 text-5xl mb-4"></i>
                <p className="text-gray-500">請先選擇一個旅遊專案以管理行程</p>
              </div>
            ) : sortedItineraryDays.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-calendar-plus text-gray-300 text-5xl mb-4"></i>
                <p className="text-gray-500">還沒有創建任何行程日</p>
                <button
                  onClick={handleCreateItineraryDay}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  立即創建第一個行程日
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedItineraryDays.map((day) => (
                  <div
                    key={day.id}
                    className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center p-4">
                      <div className="flex-shrink-0 text-center md:text-left md:w-24 mb-3 md:mb-0">
                        <div className="text-3xl font-bold text-blue-600">第 {day.dayNumber} 天</div>
                        <div className="text-sm text-gray-500">{formatDate(day.date)}</div>
                      </div>
                      
                      <div className="flex-grow px-4 border-l ml-0 md:ml-4 border-l-0 md:border-l">
                        <h3 className="text-lg font-semibold text-gray-800">{day.title}</h3>
                        <p className="text-gray-600 line-clamp-2">{day.description}</p>
                        
                        <div className="mt-2 flex flex-wrap gap-2">
                          {day.activities.map((activity, index) => (
                            <span
                              key={activity.id}
                              className={`text-xs px-2 py-1 rounded-full ${
                                activity.category === 'sightseeing' ? 'bg-green-100 text-green-800' :
                                activity.category === 'activity' ? 'bg-blue-100 text-blue-800' :
                                activity.category === 'transportation' ? 'bg-yellow-100 text-yellow-800' :
                                activity.category === 'accommodation' ? 'bg-purple-100 text-purple-800' :
                                activity.category === 'meal' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {activity.title}
                            </span>
                          ))}
                          {day.activities.length === 0 && (
                            <span className="text-xs text-gray-500">未添加活動</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end items-center mt-4 md:mt-0">
                        <button
                          onClick={() => handleViewItineraryDay(day.id)}
                          className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
                          title="查看"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleEditItineraryDay(day.id)}
                          className="ml-2 px-3 py-1 border border-blue-300 rounded-md text-blue-600 hover:bg-blue-50"
                          title="編輯"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(day.id)}
                          className="ml-2 px-3 py-1 border border-red-300 rounded-md text-red-600 hover:bg-red-50"
                          title="刪除"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 刪除確認對話框 */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">確認刪除</h2>
                <p className="text-gray-700 mb-6">確定要刪除此行程日嗎？此操作無法撤銷。</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeleteItineraryDay}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    確認刪除
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Itinerary; 