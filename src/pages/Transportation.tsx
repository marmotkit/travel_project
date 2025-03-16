import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';

// 交通類型定義
export type TransportationType = 'flight' | 'train' | 'rental' | 'taxi' | 'charter';

// 交通狀態定義
export type TransportationStatus = 'confirmed' | 'pending' | 'cancelled';

// 交通資料介面
export interface Transportation {
  id: string;
  tripId: string;
  itineraryDayId?: string;
  type: TransportationType;
  title: string;
  description?: string;
  departureDateTime: string;
  arrivalDateTime: string;
  departureLocation: string;
  arrivalLocation: string;
  status: TransportationStatus;
  price: number;
  currency: string;
  bookingReference?: string;
  notes?: string;
  
  // 不同交通類型的特定欄位
  // 機票特定欄位
  airline?: string;
  flightNumber?: string;
  cabinClass?: 'economy' | 'business' | 'first';
  bookingPlatform?: string;
  baggageAllowance?: string;
  seatNumber?: string;
  
  // 高鐵特定欄位
  trainNumber?: string;
  carNumber?: string;
  ticketType?: string;
  
  // 租車特定欄位
  rentalCompany?: string;
  carModel?: string;
  pickupLocation?: string;
  returnLocation?: string;
  pickupDateTime?: string;
  returnDateTime?: string;
  insuranceDetails?: string;
  
  // 計程車特定欄位
  company?: string;
  driverContact?: string;
  estimatedDuration?: string;
  
  // 包車特定欄位
  driverName?: string;
  vehicleType?: string;
  passengerCapacity?: number;
  itinerary?: string;
  
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

// 分組後的交通項目
interface ItineraryDayWithTransportations {
  day: ItineraryDay;
  transportations: Transportation[];
}

const Transportation: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [transportations, setTransportations] = useState<Transportation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transportationToDelete, setTransportationToDelete] = useState<string | null>(null);
  
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
      
      // 加載交通數據
      const transportationsStr = localStorage.getItem('transportations');
      if (transportationsStr) {
        const parsedTransportations = JSON.parse(transportationsStr);
        setTransportations(parsedTransportations);
      } else {
        // 首次使用，創建空數組
        localStorage.setItem('transportations', JSON.stringify([]));
        setTransportations([]);
      }
      
      setIsLoading(false);
    };
    
    const isAuth = checkAuth();
    if (isAuth) {
      loadData();
    }
  }, [navigate]);
  
  // 篩選交通項目
  const filteredTransportations = transportations.filter(transport => {
    // 按旅程篩選
    if (selectedTripId && transport.tripId !== selectedTripId) {
      return false;
    }
    
    return true;
  });
  
  // 獲取選定旅程的所有行程日
  const filteredItineraryDays = itineraryDays.filter(day => 
    day.tripId === selectedTripId
  ).sort((a, b) => a.dayNumber - b.dayNumber);
  
  // 將交通項目按行程日分組
  const getTransportationsByDay = (): ItineraryDayWithTransportations[] => {
    // 首先將交通項目分配到對應的行程日
    const dayMap: {[dayId: string]: Transportation[]} = {};
    
    // 初始化每個行程日的交通項目列表
    filteredItineraryDays.forEach(day => {
      dayMap[day.id] = [];
    });
    
    // 分配交通項目到對應的行程日
    filteredTransportations.forEach(transport => {
      if (transport.itineraryDayId && dayMap[transport.itineraryDayId]) {
        dayMap[transport.itineraryDayId].push(transport);
      }
    });
    
    // 創建最終分組結果
    return filteredItineraryDays.map(day => ({
      day,
      transportations: dayMap[day.id].sort((a, b) => 
        new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime()
      )
    }));
  };
  
  // 沒有行程日關聯的交通項目
  const unassignedTransportations = filteredTransportations.filter(
    transport => !transport.itineraryDayId || !filteredItineraryDays.some(day => day.id === transport.itineraryDayId)
  ).sort((a, b) => new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime());
  
  // 獲取選定旅程的信息
  const selectedTrip = trips.find(trip => trip.id === selectedTripId);
  
  // 處理旅程選擇變更
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTripId(e.target.value);
  };
  
  // 創建新交通項目 (帶有行程日ID)
  const handleCreateTransportation = (itineraryDayId?: string) => {
    if (!selectedTripId) return;
    
    let url = `/transportation/new?tripId=${selectedTripId}`;
    if (itineraryDayId) {
      url += `&itineraryDayId=${itineraryDayId}`;
    }
    
    // 導航到交通創建頁面，並傳遞選定的旅程ID和可選的行程日ID
    navigate(url);
  };
  
  // 查看交通詳情
  const handleViewTransportation = (id: string) => {
    navigate(`/transportation/${id}`);
  };
  
  // 編輯交通項目
  const handleEditTransportation = (id: string) => {
    navigate(`/transportation/${id}/edit`);
  };
  
  // 確認刪除
  const handleConfirmDelete = (id: string) => {
    setTransportationToDelete(id);
    setShowDeleteModal(true);
  };
  
  // 刪除交通項目
  const handleDeleteTransportation = () => {
    if (!transportationToDelete) return;
    
    try {
      // 從 localStorage 獲取現有交通數據
      const transportationsStr = localStorage.getItem('transportations');
      if (!transportationsStr) {
        setShowDeleteModal(false);
        return;
      }
      
      const allTransportations: Transportation[] = JSON.parse(transportationsStr);
      // 過濾掉要刪除的交通項目
      const updatedTransportations = allTransportations.filter(item => item.id !== transportationToDelete);
      
      // 保存更新後的交通數據
      localStorage.setItem('transportations', JSON.stringify(updatedTransportations));
      
      // 更新本地狀態
      setTransportations(updatedTransportations);
      
      // 關閉確認對話框
      setShowDeleteModal(false);
      setTransportationToDelete(null);
    } catch (err) {
      console.error('刪除交通項目時出錯:', err);
      setShowDeleteModal(false);
    }
  };
  
  // 取消刪除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTransportationToDelete(null);
  };
  
  // 格式化日期時間顯示
  const formatDateTime = (dateTimeString: string) => {
    const dateTime = new Date(dateTimeString);
    return dateTime.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 格式化時間顯示
  const formatTime = (dateTimeString: string) => {
    const dateTime = new Date(dateTimeString);
    return dateTime.toLocaleString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  // 獲取交通類型圖標和顏色
  const getTransportTypeInfo = (type: TransportationType) => {
    switch (type) {
      case 'flight':
        return { icon: 'fa-plane', color: 'blue', label: '機票' };
      case 'train':
        return { icon: 'fa-train', color: 'green', label: '高鐵' };
      case 'rental':
        return { icon: 'fa-car', color: 'orange', label: '租車' };
      case 'taxi':
        return { icon: 'fa-taxi', color: 'yellow', label: '計程車' };
      case 'charter':
        return { icon: 'fa-bus', color: 'purple', label: '包車' };
      default:
        return { icon: 'fa-car', color: 'gray', label: '其他' };
    }
  };
  
  // 獲取狀態標籤和顏色
  const getStatusInfo = (status: TransportationStatus) => {
    switch (status) {
      case 'confirmed':
        return { color: 'green', label: '已確認' };
      case 'pending':
        return { color: 'yellow', label: '待確認' };
      case 'cancelled':
        return { color: 'red', label: '已取消' };
      default:
        return { color: 'gray', label: '未知' };
    }
  };
  
  // 渲染交通項目表格
  const renderTransportationTable = (items: Transportation[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500">尚無交通項目</p>
        </div>
      );
    }
    
    // 對交通項目進行排序 - 按照出發時間
    const sortedItems = [...items].sort((a, b) => 
      new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime()
    );

    return (
      <div className="space-y-4">
        {sortedItems.map((transportation, index) => {
          const typeInfo = getTransportTypeInfo(transportation.type);
          const statusInfo = getStatusInfo(transportation.status);
          const isConnectingWithPrevious = index > 0 && 
            new Date(transportation.departureDateTime).getTime() - 
            new Date(sortedItems[index-1].arrivalDateTime).getTime() <= 3600000; // 1小時內的連接視為轉乘
          
          return (
            <div key={transportation.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* 連接指示器 */}
              {isConnectingWithPrevious && (
                <div className="bg-blue-50 text-blue-700 text-xs font-medium px-4 py-1 flex items-center">
                  <i className="fas fa-exchange-alt mr-2"></i>
                  <span>轉乘接駁 ({Math.round((new Date(transportation.departureDateTime).getTime() - 
                    new Date(sortedItems[index-1].arrivalDateTime).getTime()) / 60000)} 分鐘)</span>
                </div>
              )}
              
              {/* 交通卡片頭部 */}
              <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-${typeInfo.color}-100 flex items-center justify-center mr-3`}>
                    <i className={`fas ${typeInfo.icon} text-${typeInfo.color}-600`}></i>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{transportation.title}</div>
                    <div className="text-sm text-gray-500">{typeInfo.label}</div>
                  </div>
                </div>
                <div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              
              {/* 交通卡片內容 */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* 出發信息 */}
                  <div className="md:col-span-5">
                    <div className="text-sm font-medium text-gray-500 mb-1">出發</div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-1 mr-2">
                        <i className="fas fa-circle text-xs text-blue-600"></i>
                      </div>
                      <div>
                        <div className="text-base font-medium">{formatTime(transportation.departureDateTime)}</div>
                        <div className="text-sm text-gray-600">{formatDate(transportation.departureDateTime)}</div>
                        <div className="text-sm text-gray-800 mt-1">{transportation.departureLocation}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 連接箭頭 */}
                  <div className="md:col-span-2 flex justify-center items-center">
                    <div className="w-full h-0.5 bg-gray-300 hidden md:block"></div>
                    <i className="fas fa-arrow-right text-gray-400 md:hidden"></i>
                  </div>
                  
                  {/* 到達信息 */}
                  <div className="md:col-span-5">
                    <div className="text-sm font-medium text-gray-500 mb-1">到達</div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center mt-1 mr-2">
                        <i className="fas fa-map-marker-alt text-xs text-red-600"></i>
                      </div>
                      <div>
                        <div className="text-base font-medium">{formatTime(transportation.arrivalDateTime)}</div>
                        <div className="text-sm text-gray-600">{formatDate(transportation.arrivalDateTime)}</div>
                        <div className="text-sm text-gray-800 mt-1">{transportation.arrivalLocation}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 費用信息 */}
                <div className="mt-4 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">費用: </span>
                    <span className="text-gray-800">{transportation.price.toLocaleString()} {transportation.currency}</span>
                  </div>
                  
                  {transportation.description && (
                    <div className="text-gray-600 max-w-xs truncate">
                      {transportation.description}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 操作按鈕 */}
              <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                <button
                  onClick={() => handleEditTransportation(transportation.id)}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-blue-600 hover:bg-blue-50"
                  title="編輯"
                >
                  <i className="fas fa-edit mr-1"></i>
                  編輯
                </button>
                <button
                  onClick={() => handleConfirmDelete(transportation.id)}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-red-600 hover:bg-red-50"
                  title="刪除"
                >
                  <i className="fas fa-trash-alt mr-1"></i>
                  刪除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="交通管理"
          isAdmin={isAdmin}
          onToggleAdmin={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {/* 旅程選擇區 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">旅程</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTripId || ''}
                  onChange={handleTripChange}
                >
                  <option value="" disabled>-- 選擇旅程 --</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                {selectedTripId && (
                  <button
                    onClick={() => handleCreateTransportation()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    添加未分配的交通項目
                  </button>
                )}
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
          
          {!selectedTripId ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <i className="fas fa-route text-gray-300 text-5xl mb-4"></i>
                <p className="text-gray-500">請先選擇一個旅遊專案以管理交通</p>
              </div>
            </div>
          ) : (
            <>
              {/* 按行程日分組的交通項目 */}
              {getTransportationsByDay().map(({ day, transportations }) => (
                <div key={day.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      第 {day.dayNumber} 天: {day.title} 
                      <span className="ml-2 text-sm text-gray-500">
                        ({formatDateTime(day.date)})
                      </span>
                    </h2>
                    <button
                      onClick={() => handleCreateTransportation(day.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center text-sm"
                    >
                      <i className="fas fa-plus mr-1"></i>
                      添加交通
                    </button>
                  </div>
                  
                  {renderTransportationTable(transportations)}
                </div>
              ))}
              
              {/* 未分配到行程日的交通項目 */}
              {unassignedTransportations.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">未分配到行程日的交通項目</h2>
                  </div>
                  
                  {renderTransportationTable(unassignedTransportations)}
                </div>
              )}
              
              {/* 如果沒有行程日和未分配的交通項目 */}
              {filteredItineraryDays.length === 0 && unassignedTransportations.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center py-12">
                    <i className="fas fa-calendar-day text-gray-300 text-5xl mb-4"></i>
                    <p className="text-gray-500">此旅遊專案尚未建立行程日</p>
                    <p className="text-gray-500 mt-2">請先在行程管理中建立行程日，或添加未分配的交通項目</p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* 刪除確認對話框 */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">確認刪除</h2>
                <p className="text-gray-700 mb-6">確定要刪除此交通項目嗎？此操作無法撤銷。</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeleteTransportation}
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

export default Transportation; 