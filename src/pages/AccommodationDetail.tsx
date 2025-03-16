import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { Accommodation, AccommodationType, AccommodationStatus } from './Accommodation';

// 旅程介面
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

// 行程日介面
interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  title: string;
}

const AccommodationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraryDay, setItineraryDay] = useState<ItineraryDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // 加載數據
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // 檢查用戶身份
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user.isAdmin || false);
      } catch (err) {
        navigate('/login');
        return;
      }
      
      // 加載住宿數據
      if (id) {
        const accommodationsStr = localStorage.getItem('accommodations');
        if (accommodationsStr) {
          try {
            const parsedAccommodations = JSON.parse(accommodationsStr);
            const targetAccommodation = parsedAccommodations.find((item: Accommodation) => item.id === id);
            
            if (targetAccommodation) {
              setAccommodation(targetAccommodation);
              
              // 加載關聯的旅程信息
              const tripsStr = localStorage.getItem('trips');
              if (tripsStr) {
                const parsedTrips = JSON.parse(tripsStr);
                const relatedTrip = parsedTrips.find((item: Trip) => item.id === targetAccommodation.tripId);
                if (relatedTrip) {
                  setTrip(relatedTrip);
                }
              }
              
              // 加載關聯的行程日信息（如果有）
              if (targetAccommodation.itineraryDayId) {
                const itineraryStr = localStorage.getItem('itinerary');
                if (itineraryStr) {
                  const parsedItinerary = JSON.parse(itineraryStr);
                  const relatedDay = parsedItinerary.find(
                    (item: ItineraryDay) => item.id === targetAccommodation.itineraryDayId
                  );
                  if (relatedDay) {
                    setItineraryDay(relatedDay);
                  }
                }
              }
            } else {
              // 找不到指定的住宿，返回列表頁
              navigate('/accommodation');
            }
          } catch (error) {
            console.error('解析住宿數據時出錯:', error);
            navigate('/accommodation');
          }
        } else {
          navigate('/accommodation');
        }
      } else {
        navigate('/accommodation');
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [id, navigate]);
  
  // 返回住宿列表
  const handleBack = () => {
    navigate('/accommodation');
  };
  
  // 編輯住宿
  const handleEdit = () => {
    navigate(`/accommodation/${id}/edit`);
  };
  
  // 確認刪除
  const handleConfirmDelete = () => {
    setShowDeleteModal(true);
  };
  
  // 刪除住宿
  const handleDelete = () => {
    if (!id) return;
    
    const accommodationsStr = localStorage.getItem('accommodations');
    if (accommodationsStr) {
      try {
        const parsedAccommodations = JSON.parse(accommodationsStr);
        const updatedAccommodations = parsedAccommodations.filter(
          (item: Accommodation) => item.id !== id
        );
        
        localStorage.setItem('accommodations', JSON.stringify(updatedAccommodations));
        navigate('/accommodation');
      } catch (error) {
        console.error('處理住宿數據時出錯:', error);
      }
    }
  };
  
  // 取消刪除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
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
  
  // 渲染確認刪除模態框
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    
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
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染住宿設施列表
  const renderAmenities = () => {
    if (!accommodation?.amenities || accommodation.amenities.length === 0) {
      return <p className="text-gray-500 italic">無設施信息</p>;
    }
    
    const amenityLabels: Record<string, string> = {
      wifi: '免費Wi-Fi',
      parking: '停車場',
      pool: '游泳池',
      gym: '健身房',
      restaurant: '餐廳',
      spa: 'SPA服務',
      roomService: '客房服務',
      airConditioning: '空調',
      tv: '電視',
      hairDryer: '吹風機',
      minibar: '迷你吧',
      safetyBox: '保險箱',
      elevator: '電梯',
      laundry: '洗衣服務',
      babyFriendly: '嬰兒友善設施',
      petFriendly: '寵物友善',
      nonSmoking: '無菸房',
      freeBreakfast: '免費早餐',
      shuttleService: '接駁服務',
      businessCenter: '商務中心'
    };
    
    return (
      <div className="grid grid-cols-2 gap-2 mt-2">
        {accommodation.amenities.map(amenity => (
          <div key={amenity} className="flex items-center">
            <i className="fas fa-check text-green-500 mr-2"></i>
            <span>{amenityLabels[amenity] || amenity}</span>
          </div>
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1">
          <Header title="住宿詳情" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
          <main className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!accommodation) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1">
          <Header title="住宿詳情" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
          <main className="p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <p className="text-center text-gray-500">找不到住宿信息</p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  返回住宿列表
                </button>
              </div>
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
        <Header title="住宿詳情" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
        <main className="p-6">
          {/* 頂部導航和操作按鈕 */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-0"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              返回住宿列表
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
              >
                <i className="fas fa-edit mr-2"></i>
                編輯
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                刪除
              </button>
            </div>
          </div>
          
          {/* 住宿詳情卡片 */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* 標題區塊 */}
            <div className="p-6 bg-blue-50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{accommodation.name}</h1>
                  <p className="text-gray-600 mt-1">{accommodation.address}</p>
                  
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(accommodation.status)}`}>
                      {getAccommodationStatusName(accommodation.status)}
                    </span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-gray-600">
                      {getAccommodationTypeName(accommodation.type)}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-800">
                    {accommodation.totalPrice} {accommodation.currency}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {accommodation.pricePerNight} {accommodation.currency} / 晚
                  </p>
                </div>
              </div>
            </div>
            
            {/* 住宿詳情內容 */}
            <div className="p-6">
              {/* 關聯旅程信息 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-lg font-medium text-gray-800 mb-2">旅程信息</h3>
                {trip ? (
                  <div>
                    <p className="text-gray-700">{trip.title}</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {trip.destination} · {formatDate(trip.startDate)} 至 {formatDate(trip.endDate)}
                    </p>
                    
                    {itineraryDay && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-gray-700">
                          第 {itineraryDay.dayNumber} 天: {itineraryDay.title}
                        </p>
                        <p className="text-gray-600 text-sm">{formatDate(itineraryDay.date)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">找不到關聯的旅程信息</p>
                )}
              </div>
              
              {/* 基本信息和描述 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">基本信息</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {accommodation.description || '無描述信息'}
                </p>
              </div>
              
              {/* 入住和退房信息 */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-md font-medium text-gray-800 mb-2">入住</h3>
                  <div className="flex items-center">
                    <i className="fas fa-calendar-check text-blue-500 mr-2"></i>
                    <span className="text-gray-700">{formatDate(accommodation.checkInDate)}</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-clock text-blue-500 mr-2"></i>
                    <span className="text-gray-700">{accommodation.checkInTime}</span>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-md font-medium text-gray-800 mb-2">退房</h3>
                  <div className="flex items-center">
                    <i className="fas fa-calendar-times text-blue-500 mr-2"></i>
                    <span className="text-gray-700">{formatDate(accommodation.checkOutDate)}</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <i className="fas fa-clock text-blue-500 mr-2"></i>
                    <span className="text-gray-700">{accommodation.checkOutTime}</span>
                  </div>
                </div>
              </div>
              
              {/* 房間信息 */}
              <div className="mb-6 p-4 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium text-gray-800 mb-3">房間信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">房型</p>
                    <p className="text-gray-700 font-medium">{accommodation.roomType || '未指定'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">房間數量</p>
                    <p className="text-gray-700 font-medium">{accommodation.numberOfRooms || 1}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">入住人數</p>
                    <p className="text-gray-700 font-medium">{accommodation.numberOfGuests || 1}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <i className={`fas fa-coffee mr-2 ${accommodation.includesBreakfast ? 'text-green-500' : 'text-gray-400'}`}></i>
                    <p className="text-gray-700">
                      {accommodation.includesBreakfast ? '含早餐' : '不含早餐'}
                    </p>
                  </div>
                  
                  {accommodation.includesBreakfast && accommodation.breakfastDetails && (
                    <p className="mt-2 text-gray-600 text-sm ml-6">{accommodation.breakfastDetails}</p>
                  )}
                </div>
              </div>
              
              {/* 訂房信息 */}
              <div className="mb-6 p-4 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium text-gray-800 mb-3">訂房信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">訂房平台</p>
                    <p className="text-gray-700 font-medium">{accommodation.bookingPlatform || '未指定'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">訂房編號</p>
                    <p className="text-gray-700 font-medium">{accommodation.bookingReference || '未指定'}</p>
                  </div>
                </div>
              </div>
              
              {/* 住宿設施 */}
              <div className="mb-6 p-4 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium text-gray-800 mb-3">設施</h3>
                {renderAmenities()}
              </div>
              
              {/* 位置信息 */}
              <div className="mb-6 p-4 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium text-gray-800 mb-3">位置</h3>
                <p className="text-gray-700 mb-2">{accommodation.address}</p>
                
                {accommodation.googleMapsUrl && (
                  <a
                    href={accommodation.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline"
                  >
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    在 Google Maps 上查看
                  </a>
                )}
              </div>
              
              {/* 聯絡信息 */}
              <div className="mb-6 p-4 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium text-gray-800 mb-3">聯絡方式</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <i className="fas fa-phone text-blue-500 mr-2"></i>
                    <span className="text-gray-700">{accommodation.contactPhone || '未提供電話'}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-envelope text-blue-500 mr-2"></i>
                    <span className="text-gray-700">{accommodation.contactEmail || '未提供電子郵件'}</span>
                  </div>
                </div>
              </div>
              
              {/* 備註 */}
              {accommodation.notes && (
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">備註</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{accommodation.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          {renderDeleteModal()}
        </main>
      </div>
    </div>
  );
};

export default AccommodationDetail; 