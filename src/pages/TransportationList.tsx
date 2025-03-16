import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { 
  TransportationRecord, 
  TransportationType,
  TransportationStatus 
} from '../types/transportation';

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
}

const TransportationList: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transportations, setTransportations] = useState<TransportationRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  
  // 過濾條件
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 排序選項
  const [sortField, setSortField] = useState<string>('departureDateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // 確認刪除彈窗
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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
        // 如果不存在交通數據，初始化一個空數組
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

  // 過濾後的交通列表
  const filteredTransportations = transportations
    .filter(item => {
      const matchesTrip = selectedTripId === 'all' || item.tripId === selectedTripId;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.departureLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.arrivalLocation.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTrip && matchesType && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortField === 'price') {
        return sortDirection === 'asc' 
          ? a.price - b.price 
          : b.price - a.price;
      }
      
      if (sortField === 'departureDateTime') {
        return sortDirection === 'asc' 
          ? new Date(a.departureDateTime).getTime() - new Date(b.departureDateTime).getTime()
          : new Date(b.departureDateTime).getTime() - new Date(a.departureDateTime).getTime();
      }
      
      if (sortField === 'title') {
        return sortDirection === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      
      return 0;
    });

  // 前往交通詳情頁
  const handleViewTransportation = (id: string) => {
    navigate(`/transportation/${id}`);
  };

  // 前往編輯頁面
  const handleEditTransportation = (id: string) => {
    navigate(`/transportation/${id}/edit`);
  };

  // 刪除確認
  const handleConfirmDelete = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  // 執行刪除
  const handleDeleteTransportation = () => {
    if (!itemToDelete) return;
    
    try {
      const updatedTransportations = transportations.filter(item => item.id !== itemToDelete);
      setTransportations(updatedTransportations);
      localStorage.setItem('transportations', JSON.stringify(updatedTransportations));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('刪除交通記錄時出錯:', err);
    }
  };

  // 創建新交通記錄
  const handleCreateTransportation = () => {
    navigate('/transportation/new');
  };

  // 切換排序方向
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 獲取交通類型標籤顏色
  const getTypeColor = (type: TransportationType) => {
    switch (type) {
      case 'flight':
        return 'bg-blue-100 text-blue-800';
      case 'train':
        return 'bg-red-100 text-red-800';
      case 'rental_car':
        return 'bg-yellow-100 text-yellow-800';
      case 'taxi':
        return 'bg-green-100 text-green-800';
      case 'charter':
        return 'bg-purple-100 text-purple-800';
      case 'ferry':
        return 'bg-indigo-100 text-indigo-800';
      case 'bus':
        return 'bg-orange-100 text-orange-800';
      case 'subway':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取交通類型顯示文字
  const getTypeText = (type: TransportationType) => {
    switch (type) {
      case 'flight':
        return '機票';
      case 'train':
        return '高鐵/火車';
      case 'rental_car':
        return '租車';
      case 'taxi':
        return '計程車';
      case 'charter':
        return '包車';
      case 'ferry':
        return '渡輪';
      case 'bus':
        return '巴士';
      case 'subway':
        return '地鐵';
      default:
        return '其他';
    }
  };

  // 獲取狀態標籤顏色
  const getStatusColor = (status: TransportationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取狀態顯示文字
  const getStatusText = (status: TransportationStatus) => {
    switch (status) {
      case 'pending':
        return '待確認';
      case 'confirmed':
        return '已確認';
      case 'cancelled':
        return '已取消';
      case 'completed':
        return '已完成';
      default:
        return '未知';
    }
  };

  // 獲取旅程標題
  const getTripTitle = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    return trip ? trip.title : '未知旅程';
  };

  // 獲取行程日資訊
  const getItineraryDayInfo = (dayId: string | undefined) => {
    if (!dayId) return null;
    
    const day = itineraryDays.find(d => d.id === dayId);
    return day ? `第 ${day.dayNumber} 天: ${day.title}` : null;
  };

  // 格式化日期時間
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
          title="交通管理"
          isAdmin={isAdmin}
          onToggleAdmin={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {/* 過濾和搜尋 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">過濾和搜尋</h2>
              
              <button
                onClick={handleCreateTransportation}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center self-start md:self-auto"
              >
                <i className="fas fa-plus mr-2"></i>
                新增交通
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">旅程</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                >
                  <option value="all">所有旅程</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">交通類型</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">所有類型</option>
                  <option value="flight">機票</option>
                  <option value="train">高鐵/火車</option>
                  <option value="rental_car">租車</option>
                  <option value="taxi">計程車</option>
                  <option value="charter">包車</option>
                  <option value="ferry">渡輪</option>
                  <option value="bus">巴士</option>
                  <option value="subway">地鐵</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">狀態</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">所有狀態</option>
                  <option value="pending">待確認</option>
                  <option value="confirmed">已確認</option>
                  <option value="cancelled">已取消</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">搜尋</label>
                <input
                  type="text"
                  placeholder="搜尋標題、地點..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* 交通列表 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">交通記錄</h2>
              <span className="text-gray-500 text-sm">
                {filteredTransportations.length} 筆記錄
              </span>
            </div>
            
            {filteredTransportations.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-route text-gray-300 text-5xl mb-4"></i>
                <p className="text-gray-500">沒有找到符合條件的交通記錄</p>
                <button
                  onClick={handleCreateTransportation}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  添加第一筆交通記錄
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none" 
                          onClick={() => handleSort('title')}
                        >
                          標題
                          {sortField === 'title' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        類型
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none" 
                          onClick={() => handleSort('departureDateTime')}
                        >
                          出發時間
                          {sortField === 'departureDateTime' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        行程路線
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none" 
                          onClick={() => handleSort('price')}
                        >
                          價格
                          {sortField === 'price' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        旅程
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransportations.map((transportation) => (
                      <tr key={transportation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transportation.title}</div>
                          {transportation.itineraryDayId && (
                            <div className="text-xs text-gray-500">
                              {getItineraryDayInfo(transportation.itineraryDayId)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(transportation.type)}`}>
                            {getTypeText(transportation.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDateTime(transportation.departureDateTime)}</div>
                          <div className="text-xs text-gray-500">{formatDateTime(transportation.arrivalDateTime)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transportation.departureLocation}</div>
                          <div className="text-xs text-gray-500">→ {transportation.arrivalLocation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transportation.price.toLocaleString()} {transportation.currency}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transportation.status)}`}>
                            {getStatusText(transportation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getTripTitle(transportation.tripId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewTransportation(transportation.id)}
                            className="text-gray-600 hover:text-gray-900 mr-3"
                            title="查看"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            onClick={() => handleEditTransportation(transportation.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="編輯"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(transportation.id)}
                            className="text-red-600 hover:text-red-900"
                            title="刪除"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* 刪除確認對話框 */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">確認刪除</h2>
                <p className="text-gray-700 mb-6">確定要刪除這筆交通記錄嗎？此操作無法撤銷。</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
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

export default TransportationList; 