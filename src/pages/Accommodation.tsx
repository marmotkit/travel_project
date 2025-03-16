import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';

// 住宿類型定義
export type AccommodationType = 'hotel' | 'hostel' | 'apartment' | 'resort' | 'guesthouse' | 'airbnb';

// 住宿狀態定義
export type AccommodationStatus = 'confirmed' | 'pending' | 'cancelled';

// 住宿資料介面
export interface Accommodation {
  id: string;
  tripId: string;
  itineraryDayId?: string;
  type: AccommodationType;
  name: string;
  address: string;
  description?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  status: AccommodationStatus;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  bookingReference?: string;
  bookingPlatform?: string;
  roomType?: string;
  numberOfRooms?: number;
  numberOfGuests?: number;
  includesBreakfast?: boolean;
  breakfastDetails?: string;
  amenities?: string[];
  googleMapsUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// 旅程介面 (簡化版本，僅包含所需欄位)
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

// 行程日介面 (簡化版本，僅包含所需欄位)
interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  title: string;
}

// 分組後的住宿項目
interface ItineraryDayWithAccommodations {
  day: ItineraryDay;
  accommodations: Accommodation[];
}

const Accommodation: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accommodationToDelete, setAccommodationToDelete] = useState<string | null>(null);
  
  // 篩選條件
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  
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
    
    const loadData = () => {
      // 加載旅程數據
      const tripsStr = localStorage.getItem('trips');
      if (tripsStr) {
        const parsedTrips = JSON.parse(tripsStr);
        setTrips(parsedTrips);
        
        // 如果有旅程，默認選擇第一個
        if (parsedTrips.length > 0) {
          setSelectedTripId(parsedTrips[0].id);
        }
      }
      
      // 加載行程日數據
      const itineraryStr = localStorage.getItem('itinerary');
      if (itineraryStr) {
        const parsedItinerary = JSON.parse(itineraryStr);
        setItineraryDays(parsedItinerary);
      }
      
      // 加載住宿數據
      const accommodationsStr = localStorage.getItem('accommodations');
      if (accommodationsStr) {
        const parsedAccommodations = JSON.parse(accommodationsStr);
        setAccommodations(parsedAccommodations);
      } else {
        // 首次使用，創建空數組
        localStorage.setItem('accommodations', JSON.stringify([]));
        setAccommodations([]);
      }
      
      setIsLoading(false);
    };
    
    const isAuth = checkAuth();
    if (isAuth) {
      loadData();
    }
  }, [navigate]);
  
  // 篩選住宿項目
  const filteredAccommodations = accommodations.filter(accommodation => {
    // 按旅程篩選
    if (selectedTripId && accommodation.tripId !== selectedTripId) {
      return false;
    }
    
    return true;
  });
  
  // 獲取選定旅程的所有行程日
  const filteredItineraryDays = itineraryDays.filter(day => 
    day.tripId === selectedTripId
  ).sort((a, b) => a.dayNumber - b.dayNumber);
  
  // 將住宿項目按行程日分組
  const getAccommodationsByDay = (): ItineraryDayWithAccommodations[] => {
    // 首先將住宿項目分配到對應的行程日
    const dayMap: {[dayId: string]: Accommodation[]} = {};
    
    // 初始化每個行程日的住宿項目列表
    filteredItineraryDays.forEach(day => {
      dayMap[day.id] = [];
    });
    
    // 分配住宿項目到對應的行程日
    filteredAccommodations.forEach(accommodation => {
      if (accommodation.itineraryDayId && dayMap[accommodation.itineraryDayId]) {
        dayMap[accommodation.itineraryDayId].push(accommodation);
      }
    });
    
    // 創建最終分組結果
    return filteredItineraryDays.map(day => ({
      day,
      accommodations: dayMap[day.id].sort((a, b) => 
        new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
      )
    }));
  };
  
  // 沒有行程日關聯的住宿項目
  const unassignedAccommodations = filteredAccommodations.filter(
    accommodation => !accommodation.itineraryDayId || !filteredItineraryDays.some(day => day.id === accommodation.itineraryDayId)
  ).sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
  
  // 獲取選定旅程的信息
  const selectedTrip = trips.find(trip => trip.id === selectedTripId);
  
  // 處理旅程選擇變更
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTripId(e.target.value);
  };
  
  // 創建新住宿項目 (帶有行程日ID)
  const handleCreateAccommodation = (itineraryDayId?: string) => {
    if (!selectedTripId) return;
    
    let url = `/accommodation/new?tripId=${selectedTripId}`;
    if (itineraryDayId) {
      url += `&itineraryDayId=${itineraryDayId}`;
    }
    
    // 導航到住宿創建頁面，並傳遞選定的旅程ID和可選的行程日ID
    navigate(url);
  };
  
  // 查看住宿詳情
  const handleViewAccommodation = (id: string) => {
    navigate(`/accommodation/${id}`);
  };
  
  // 編輯住宿項目
  const handleEditAccommodation = (id: string) => {
    navigate(`/accommodation/${id}/edit`);
  };
  
  // 確認刪除
  const handleConfirmDelete = (id: string) => {
    setAccommodationToDelete(id);
    setShowDeleteModal(true);
  };
  
  // 刪除住宿項目
  const handleDeleteAccommodation = () => {
    if (!accommodationToDelete) return;
    
    const updatedAccommodations = accommodations.filter(
      accommodation => accommodation.id !== accommodationToDelete
    );
    
    setAccommodations(updatedAccommodations);
    localStorage.setItem('accommodations', JSON.stringify(updatedAccommodations));
    setShowDeleteModal(false);
    setAccommodationToDelete(null);
  };
  
  // 取消刪除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setAccommodationToDelete(null);
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // 獲取住宿類型的中文名稱
  const getAccommodationTypeName = (type: AccommodationType): string => {
    const typeNames: Record<AccommodationType, string> = {
      hotel: '飯店',
      hostel: '背包客棧',
      apartment: '公寓',
      resort: '度假村',
      guesthouse: '民宿',
      airbnb: 'Airbnb'
    };
    
    return typeNames[type] || type;
  };
  
  // 獲取住宿狀態的中文名稱
  const getAccommodationStatusName = (status: AccommodationStatus): string => {
    const statusNames: Record<AccommodationStatus, string> = {
      confirmed: '已確認',
      pending: '待確認',
      cancelled: '已取消'
    };
    
    return statusNames[status] || status;
  };
  
  // 獲取狀態的顏色標籤
  const getStatusColor = (status: AccommodationStatus): string => {
    const statusColors: Record<AccommodationStatus, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // 添加未分配的住宿項目按鈕
  const renderAddUnassignedButton = () => (
    <div className="flex justify-end mb-4">
      <button
        onClick={() => handleCreateAccommodation()}
        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        <i className="fas fa-plus mr-2"></i>
        添加未分配的住宿項目
      </button>
    </div>
  );
  
  // 渲染分組後的住宿卡片
  const renderAccommodationsByDay = () => {
    const dayGroups = getAccommodationsByDay();
    
    return (
      <div className="space-y-6 mt-4">
        {dayGroups.map(({ day, accommodations }) => (
          <div key={day.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  第 {day.dayNumber} 天: {day.title} 
                  <span className="ml-2 text-gray-500 text-sm">({formatDate(day.date)})</span>
                </h3>
                <button
                  onClick={() => handleCreateAccommodation(day.id)}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <i className="fas fa-plus mr-1"></i>
                  添加住宿
                </button>
              </div>
            </div>
            
            {accommodations.length > 0 ? (
              <div className="p-4">
                {accommodations.map(accommodation => (
                  <div key={accommodation.id} className="mb-4 border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                          <i className={`fas fa-${accommodation.type === 'hotel' ? 'hotel' : 'home'} text-xl`}></i>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900">{accommodation.name}</h4>
                          <p className="text-gray-500 text-sm">{accommodation.address}</p>
                          <div className="flex items-center mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(accommodation.status)}`}>
                              {getAccommodationStatusName(accommodation.status)}
                            </span>
                            <span className="mx-2 text-gray-400">|</span>
                            <span className="text-gray-600 text-sm">
                              {getAccommodationTypeName(accommodation.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0 flex flex-col items-end">
                        <div className="text-gray-900 font-medium">
                          {accommodation.totalPrice} {accommodation.currency}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {formatDate(accommodation.checkInDate)} - {formatDate(accommodation.checkOutDate)}
                        </div>
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => handleViewAccommodation(accommodation.id)}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            <i className="fas fa-eye mr-1"></i>
                            查看
                          </button>
                          <button
                            onClick={() => handleEditAccommodation(accommodation.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                          >
                            <i className="fas fa-edit mr-1"></i>
                            編輯
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(accommodation.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          >
                            <i className="fas fa-trash-alt mr-1"></i>
                            刪除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                尚未安排住宿。點擊「添加住宿」按鈕開始安排吧！
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // 渲染未分配的住宿項目
  const renderUnassignedAccommodations = () => {
    if (unassignedAccommodations.length === 0) return null;
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">未分配到特定日期的住宿</h3>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="p-4">
            {unassignedAccommodations.map(accommodation => (
              <div key={accommodation.id} className="mb-4 border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                      <i className={`fas fa-${accommodation.type === 'hotel' ? 'hotel' : 'home'} text-xl`}></i>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{accommodation.name}</h4>
                      <p className="text-gray-500 text-sm">{accommodation.address}</p>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(accommodation.status)}`}>
                          {getAccommodationStatusName(accommodation.status)}
                        </span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-gray-600 text-sm">
                          {getAccommodationTypeName(accommodation.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex flex-col items-end">
                    <div className="text-gray-900 font-medium">
                      {accommodation.totalPrice} {accommodation.currency}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {formatDate(accommodation.checkInDate)} - {formatDate(accommodation.checkOutDate)}
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleViewAccommodation(accommodation.id)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      >
                        <i className="fas fa-eye mr-1"></i>
                        查看
                      </button>
                      <button
                        onClick={() => handleEditAccommodation(accommodation.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        編輯
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(accommodation.id)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      >
                        <i className="fas fa-trash-alt mr-1"></i>
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // 刪除確認模態框
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    
    const accommodation = accommodations.find(a => a.id === accommodationToDelete);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900">確認刪除</h3>
          <p className="mt-4 text-gray-600">
            您確定要刪除住宿「{accommodation?.name}」嗎？此操作無法撤銷。
          </p>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDeleteAccommodation}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1">
          <Header title="住宿管理" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
          <main className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1">
        <Header title="住宿管理" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
        <main className="p-6">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">旅程</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="trip" className="block text-sm font-medium text-gray-700 mb-1">選擇旅程</label>
                <select
                  id="trip"
                  value={selectedTripId || ''}
                  onChange={handleTripChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                {selectedTripId && (
                  <button
                    onClick={() => handleCreateAccommodation()}
                    className="w-full flex justify-center items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    添加未分配的住宿項目
                  </button>
                )}
              </div>
            </div>
            
            {selectedTrip && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium text-gray-800">{selectedTrip.title}</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">目的地:</span> {selectedTrip.destination}
                  </div>
                  <div>
                    <span className="text-gray-500">開始日期:</span> {formatDate(selectedTrip.startDate)}
                  </div>
                  <div>
                    <span className="text-gray-500">結束日期:</span> {formatDate(selectedTrip.endDate)}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {selectedTripId && (
            <>
              {renderAccommodationsByDay()}
              {renderUnassignedAccommodations()}
            </>
          )}
          
          {renderDeleteModal()}
        </main>
      </div>
    </div>
  );
};

export default Accommodation; 