import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { TransportationRecord, TransportationType } from '../types/transportation';

interface Trip {
  id: string;
  title: string;
  destination: string;
}

interface ItineraryDay {
  id: string;
  title: string;
  date: string;
  dayNumber: number;
}

const TransportationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transportation, setTransportation] = useState<TransportationRecord | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraryDay, setItineraryDay] = useState<ItineraryDay | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      if (!id) {
        navigate('/transportation');
        return;
      }
      
      // 加載交通數據
      const transportationsStr = localStorage.getItem('transportations');
      if (!transportationsStr) {
        navigate('/transportation');
        return;
      }
      
      const transportations: TransportationRecord[] = JSON.parse(transportationsStr);
      const foundTransportation = transportations.find(item => item.id === id);
      
      if (!foundTransportation) {
        navigate('/transportation');
        return;
      }
      
      setTransportation(foundTransportation);
      
      // 加載關聯的旅程
      const tripsStr = localStorage.getItem('trips');
      if (tripsStr) {
        const trips = JSON.parse(tripsStr);
        const foundTrip = trips.find((t: Trip) => t.id === foundTransportation.tripId);
        if (foundTrip) {
          setTrip(foundTrip);
        }
      }
      
      // 加載關聯的行程日
      if (foundTransportation.itineraryDayId) {
        const itineraryStr = localStorage.getItem('itinerary');
        if (itineraryStr) {
          const itineraryDays = JSON.parse(itineraryStr);
          const foundDay = itineraryDays.find((d: ItineraryDay) => d.id === foundTransportation.itineraryDayId);
          if (foundDay) {
            setItineraryDay(foundDay);
          }
        }
      }
      
      setIsLoading(false);
    };

    const isAuth = checkAuth();
    if (isAuth) {
      loadData();
    }
  }, [id, navigate]);

  // 編輯交通記錄
  const handleEdit = () => {
    navigate(`/transportation/${id}/edit`);
  };

  // 刪除確認
  const handleConfirmDelete = () => {
    setShowDeleteModal(true);
  };

  // 執行刪除
  const handleDelete = () => {
    if (!id) return;
    
    try {
      const transportationsStr = localStorage.getItem('transportations');
      if (!transportationsStr) return;
      
      const transportations: TransportationRecord[] = JSON.parse(transportationsStr);
      const updatedTransportations = transportations.filter(item => item.id !== id);
      
      localStorage.setItem('transportations', JSON.stringify(updatedTransportations));
      navigate('/transportation');
    } catch (err) {
      console.error('刪除交通記錄時出錯:', err);
    }
  };

  // 返回列表頁
  const handleBack = () => {
    navigate('/transportation');
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

  // 獲取狀態顯示文字
  const getStatusText = (status: string) => {
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

  // 獲取艙等顯示文字
  const getCabinClassText = (cabin: string) => {
    switch (cabin) {
      case 'economy':
        return '經濟艙';
      case 'premium_economy':
        return '豪華經濟艙';
      case 'business':
        return '商務艙';
      case 'first':
        return '頭等艙';
      default:
        return '未知';
    }
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

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (isLoading || !transportation) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="交通詳情"
          isAdmin={isAdmin}
          onToggleAdmin={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {/* 標題和操作按鈕 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">{transportation.title}</h1>
              <span className={`ml-3 px-3 py-1 text-xs rounded-full ${
                transportation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                transportation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                transportation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                transportation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getStatusText(transportation.status)}
              </span>
            </div>
            
            <div className="flex mt-4 md:mt-0">
              <button
                onClick={handleEdit}
                className="px-4 py-2 mr-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <i className="fas fa-edit mr-2"></i>
                編輯
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                刪除
              </button>
            </div>
          </div>
          
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">交通類型</p>
                <p className="font-medium">{getTypeText(transportation.type)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">出發時間</p>
                <p className="font-medium">{formatDateTime(transportation.departureDateTime)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">到達時間</p>
                <p className="font-medium">{formatDateTime(transportation.arrivalDateTime)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">出發地點</p>
                <p className="font-medium">{transportation.departureLocation}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">到達地點</p>
                <p className="font-medium">{transportation.arrivalLocation}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">價格</p>
                <p className="font-medium">{transportation.price.toLocaleString()} {transportation.currency}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">相關旅程</p>
                <p className="font-medium">{trip?.title || '未知旅程'}</p>
              </div>
              
              {itineraryDay && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">相關行程日</p>
                  <p className="font-medium">第 {itineraryDay.dayNumber} 天: {itineraryDay.title} ({formatDate(itineraryDay.date)})</p>
                </div>
              )}
              
              {transportation.bookingReference && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">預訂編號</p>
                  <p className="font-medium">{transportation.bookingReference}</p>
                </div>
              )}
              
              {transportation.confirmationNumber && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">確認號</p>
                  <p className="font-medium">{transportation.confirmationNumber}</p>
                </div>
              )}
              
              {transportation.bookingWebsite && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">預訂網站</p>
                  <p className="font-medium">
                    <a 
                      href={transportation.bookingWebsite.startsWith('http') ? transportation.bookingWebsite : `https://${transportation.bookingWebsite}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {transportation.bookingWebsite}
                    </a>
                  </p>
                </div>
              )}
            </div>
            
            {transportation.notes && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-1">備註</p>
                <p className="bg-gray-50 p-3 rounded">{transportation.notes}</p>
              </div>
            )}
          </div>
          
          {/* 機票詳細信息 */}
          {transportation.type === 'flight' && transportation.flightDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">機票詳細信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">航空公司</p>
                  <p className="font-medium">{transportation.flightDetails.airline}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">航班號</p>
                  <p className="font-medium">{transportation.flightDetails.flightNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">艙等</p>
                  <p className="font-medium">{getCabinClassText(transportation.flightDetails.cabin)}</p>
                </div>
                
                {transportation.flightDetails.departureTerminal && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">出發航站樓</p>
                    <p className="font-medium">{transportation.flightDetails.departureTerminal}</p>
                  </div>
                )}
                
                {transportation.flightDetails.arrivalTerminal && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">到達航站樓</p>
                    <p className="font-medium">{transportation.flightDetails.arrivalTerminal}</p>
                  </div>
                )}
                
                {transportation.flightDetails.seatNumber && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">座位號</p>
                    <p className="font-medium">{transportation.flightDetails.seatNumber}</p>
                  </div>
                )}
                
                {transportation.flightDetails.baggageAllowance && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">行李額度</p>
                    <p className="font-medium">{transportation.flightDetails.baggageAllowance}</p>
                  </div>
                )}
              </div>
              
              {transportation.flightDetails.layovers && transportation.flightDetails.layovers.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-3">中轉信息</p>
                  
                  {transportation.flightDetails.layovers.map((layover, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{layover.airport}</p>
                          <p className="text-sm text-gray-600">
                            停留時間: {Math.floor(layover.duration / 60)}小時{layover.duration % 60}分鐘
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">到達: {formatDateTime(layover.arrivalTime)}</p>
                          <p className="text-sm">出發: {formatDateTime(layover.departureTime)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {transportation.flightDetails.mileagePoints && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-3">里程信息</p>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium">{transportation.flightDetails.mileagePoints.program}</p>
                    <p className="text-sm">會員號碼: {transportation.flightDetails.mileagePoints.number}</p>
                    {transportation.flightDetails.mileagePoints.pointsEarned && (
                      <p className="text-sm">預計獲得里程: {transportation.flightDetails.mileagePoints.pointsEarned}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 高鐵/火車詳細信息 */}
          {transportation.type === 'train' && transportation.trainDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">高鐵/火車詳細信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">車次號</p>
                  <p className="font-medium">{transportation.trainDetails.trainNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">出發站</p>
                  <p className="font-medium">{transportation.trainDetails.departureStation}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">到達站</p>
                  <p className="font-medium">{transportation.trainDetails.arrivalStation}</p>
                </div>
                
                {transportation.trainDetails.trainType && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">車種</p>
                    <p className="font-medium">{transportation.trainDetails.trainType}</p>
                  </div>
                )}
                
                {transportation.trainDetails.carNumber && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">車廂號</p>
                    <p className="font-medium">{transportation.trainDetails.carNumber}</p>
                  </div>
                )}
                
                {transportation.trainDetails.seatNumber && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">座位號</p>
                    <p className="font-medium">{transportation.trainDetails.seatNumber}</p>
                  </div>
                )}
                
                {transportation.trainDetails.seatClass && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">座位等級</p>
                    <p className="font-medium">{transportation.trainDetails.seatClass}</p>
                  </div>
                )}
                
                {transportation.trainDetails.platform && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">月台</p>
                    <p className="font-medium">{transportation.trainDetails.platform}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 租車詳細信息 */}
          {transportation.type === 'rental_car' && transportation.rentalCarDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">租車詳細信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">租車公司</p>
                  <p className="font-medium">{transportation.rentalCarDetails.company}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">車輛類型</p>
                  <p className="font-medium">{transportation.rentalCarDetails.vehicleType}</p>
                </div>
                
                {transportation.rentalCarDetails.model && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">車型</p>
                    <p className="font-medium">{transportation.rentalCarDetails.model}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">取車地點</p>
                  <p className="font-medium">{transportation.rentalCarDetails.pickupLocation}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">還車地點</p>
                  <p className="font-medium">{transportation.rentalCarDetails.dropoffLocation}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">取車時間</p>
                  <p className="font-medium">{formatDateTime(transportation.rentalCarDetails.pickupDateTime)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">還車時間</p>
                  <p className="font-medium">{formatDateTime(transportation.rentalCarDetails.dropoffDateTime)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">租用天數</p>
                  <p className="font-medium">{transportation.rentalCarDetails.rentalDays} 天</p>
                </div>
                
                {transportation.rentalCarDetails.driverName && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">駕駛人</p>
                    <p className="font-medium">{transportation.rentalCarDetails.driverName}</p>
                  </div>
                )}
                
                {transportation.rentalCarDetails.licensePlate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">車牌號碼</p>
                    <p className="font-medium">{transportation.rentalCarDetails.licensePlate}</p>
                  </div>
                )}
                
                {transportation.rentalCarDetails.insuranceDetails && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">保險詳情</p>
                    <p className="font-medium">{transportation.rentalCarDetails.insuranceDetails}</p>
                  </div>
                )}
                
                {transportation.rentalCarDetails.fuelPolicy && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">燃油政策</p>
                    <p className="font-medium">{transportation.rentalCarDetails.fuelPolicy}</p>
                  </div>
                )}
                
                {transportation.rentalCarDetails.mileageLimit && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">里程限制</p>
                    <p className="font-medium">{transportation.rentalCarDetails.mileageLimit}</p>
                  </div>
                )}
              </div>
              
              {transportation.rentalCarDetails.additionalOptions && transportation.rentalCarDetails.additionalOptions.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-3">額外選項</p>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <ul className="space-y-2">
                      {transportation.rentalCarDetails.additionalOptions.map((option, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{option.name}</span>
                          <span>{option.price} {option.currency}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 計程車詳細信息 */}
          {transportation.type === 'taxi' && transportation.taxiDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">計程車詳細信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transportation.taxiDetails.company && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">計程車公司</p>
                    <p className="font-medium">{transportation.taxiDetails.company}</p>
                  </div>
                )}
                
                {transportation.taxiDetails.driverName && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">司機姓名</p>
                    <p className="font-medium">{transportation.taxiDetails.driverName}</p>
                  </div>
                )}
                
                {transportation.taxiDetails.driverContact && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">司機聯絡方式</p>
                    <p className="font-medium">{transportation.taxiDetails.driverContact}</p>
                  </div>
                )}
                
                {transportation.taxiDetails.vehicleType && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">車輛類型</p>
                    <p className="font-medium">{transportation.taxiDetails.vehicleType}</p>
                  </div>
                )}
                
                {transportation.taxiDetails.licensePlate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">車牌號碼</p>
                    <p className="font-medium">{transportation.taxiDetails.licensePlate}</p>
                  </div>
                )}
                
                {transportation.taxiDetails.estimatedDistance && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">預計距離</p>
                    <p className="font-medium">
                      {transportation.taxiDetails.estimatedDistance} 
                      {transportation.taxiDetails.distanceUnit === 'km' ? ' 公里' : ' 英里'}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">預訂狀態</p>
                  <p className="font-medium">{transportation.taxiDetails.preBooked ? '已預訂' : '現場叫車'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 包車詳細信息 */}
          {transportation.type === 'charter' && transportation.charterDetails && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">包車詳細信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">包車公司</p>
                  <p className="font-medium">{transportation.charterDetails.company}</p>
                </div>
                
                {transportation.charterDetails.driverName && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">司機姓名</p>
                    <p className="font-medium">{transportation.charterDetails.driverName}</p>
                  </div>
                )}
                
                {transportation.charterDetails.driverContact && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">司機聯絡方式</p>
                    <p className="font-medium">{transportation.charterDetails.driverContact}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">車輛類型</p>
                  <p className="font-medium">{transportation.charterDetails.vehicleType}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">乘客容量</p>
                  <p className="font-medium">{transportation.charterDetails.passengerCapacity} 人</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">服務時長</p>
                  <p className="font-medium">{transportation.charterDetails.durationHours} 小時</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">服務類型</p>
                  <p className="font-medium">{transportation.charterDetails.isFullDay ? '全日包車' : '半日包車'}</p>
                </div>
                
                {transportation.charterDetails.contractNumber && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">合約號碼</p>
                    <p className="font-medium">{transportation.charterDetails.contractNumber}</p>
                  </div>
                )}
              </div>
              
              {transportation.charterDetails.routeDetails && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-1">行程路線詳情</p>
                  <p className="bg-gray-50 p-3 rounded">{transportation.charterDetails.routeDetails}</p>
                </div>
              )}
              
              {transportation.charterDetails.includedServices && transportation.charterDetails.includedServices.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">包含服務</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <ul className="list-disc pl-5 space-y-1">
                      {transportation.charterDetails.includedServices.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 其他類型交通的詳細信息 */}
          {/* ... 這裡可以根據需要添加其他類型的交通詳情 ... */}
          
          {/* 創建和更新時間信息 */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              創建於 {formatDateTime(transportation.createdAt)}
              {transportation.createdAt !== transportation.updatedAt && (
                <span> · 最後更新於 {formatDateTime(transportation.updatedAt)}</span>
              )}
            </p>
          </div>
        </main>
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
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportationDetail; 