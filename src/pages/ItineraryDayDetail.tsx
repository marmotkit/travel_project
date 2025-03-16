import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

interface Accommodation {
  id: string;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  price: number;
  currency: string;
  confirmationNumber?: string;
}

interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string;
  arrivalTime: string;
  referenceNumber?: string;
  price: number;
  currency: string;
}

interface Meal {
  id: string;
  name: string;
  location: string;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  reservationInfo?: string;
  price?: number;
  currency?: string;
}

const ItineraryDayDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [itineraryDay, setItineraryDay] = useState<ItineraryDay | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [transportations, setTransportations] = useState<Transportation[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);

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

    const loadItineraryDay = () => {
      try {
        // 從 localStorage 加載行程數據
        const itineraryStr = localStorage.getItem('itinerary');
        if (!itineraryStr) {
          setError('找不到行程數據');
          setIsLoading(false);
          return;
        }

        const itineraryDays: ItineraryDay[] = JSON.parse(itineraryStr);
        const day = itineraryDays.find(day => day.id === id);
        
        if (!day) {
          setError('找不到指定的行程日');
          setIsLoading(false);
          return;
        }
        
        setItineraryDay(day);
        
        // 加載關聯的旅程
        const tripsStr = localStorage.getItem('trips');
        if (tripsStr) {
          const trips: Trip[] = JSON.parse(tripsStr);
          const relatedTrip = trips.find(t => t.id === day.tripId);
          if (relatedTrip) {
            setTrip(relatedTrip);
          }
        }
        
        // 加載住宿信息
        if (day.accommodationId) {
          const accommodationsStr = localStorage.getItem('accommodations');
          if (accommodationsStr) {
            const accommodations: Accommodation[] = JSON.parse(accommodationsStr);
            const relatedAccommodation = accommodations.find(a => a.id === day.accommodationId);
            if (relatedAccommodation) {
              setAccommodation(relatedAccommodation);
            }
          }
        }
        
        // 加載交通信息
        if (day.transportationIds && day.transportationIds.length > 0) {
          const transportationsStr = localStorage.getItem('transportations');
          if (transportationsStr) {
            const allTransportations: Transportation[] = JSON.parse(transportationsStr);
            const relatedTransportations = allTransportations.filter(t => 
              day.transportationIds?.includes(t.id)
            );
            setTransportations(relatedTransportations);
          }
        }
        
        // 加載餐飲信息
        if (day.mealIds && day.mealIds.length > 0) {
          const mealsStr = localStorage.getItem('meals');
          if (mealsStr) {
            const allMeals: Meal[] = JSON.parse(mealsStr);
            const relatedMeals = allMeals.filter(m => 
              day.mealIds?.includes(m.id)
            );
            setMeals(relatedMeals);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('加載行程日數據時出錯:', err);
        setError('數據加載失敗');
        setIsLoading(false);
      }
    };

    const isAuth = checkAuth();
    if (isAuth && id) {
      loadItineraryDay();
    }
  }, [id, navigate]);

  // 排序活動按開始時間
  const sortedActivities = itineraryDay?.activities.slice().sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  }) || [];

  // 格式化日期顯示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    });
  };

  // 格式化時間顯示
  const formatTime = (timeString: string) => {
    // 假設時間格式是 HH:MM 或 HH:MM:SS
    return timeString.substr(0, 5);
  };

  // 獲取活動類別的顯示文本和顏色
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'sightseeing':
        return { text: '觀光景點', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'activity':
        return { text: '活動', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'transportation':
        return { text: '交通', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'accommodation':
        return { text: '住宿', bgColor: 'bg-purple-100', textColor: 'text-purple-800' };
      case 'meal':
        return { text: '餐飲', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      default:
        return { text: '其他', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  const handleEditItineraryDay = () => {
    navigate(`/itinerary/day/${id}/edit`);
  };

  const handleBackToItinerary = () => {
    navigate('/itinerary');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }

  if (error || !itineraryDay) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          <p className="font-bold">錯誤</p>
          <p>{error || '找不到行程日數據'}</p>
          <button 
            onClick={handleBackToItinerary}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            返回行程管理
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
          title="行程日詳情"
          isAdmin={isAdmin}
          onToggleAdmin={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-5xl mx-auto">
            {/* 頁面標題和操作 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <button
                  onClick={handleBackToItinerary}
                  className="mr-4 text-gray-600 hover:text-gray-800"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">
                  {itineraryDay.title}
                </h1>
              </div>
              
              <button
                onClick={handleEditItineraryDay}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <i className="fas fa-edit mr-2"></i>
                編輯行程
              </button>
            </div>
            
            {/* 行程日基本信息 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center mb-4">
                <div className="flex-shrink-0 text-center bg-blue-50 p-4 rounded-lg mb-4 md:mb-0 md:mr-6">
                  <div className="text-5xl font-bold text-blue-600">第 {itineraryDay.dayNumber} 天</div>
                  <div className="text-lg text-blue-500 mt-1">{formatDate(itineraryDay.date)}</div>
                </div>
                
                <div className="flex-grow">
                  {trip && (
                    <div className="mb-3">
                      <span className="text-gray-600">旅程:</span>
                      <span className="ml-2 font-medium">{trip.title}</span>
                      <span className="ml-2 text-gray-500">({trip.destination})</span>
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <h3 className="text-gray-600">描述:</h3>
                    <p className="mt-1">{itineraryDay.description || '無描述'}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-600">活動數:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {itineraryDay.activities.length} 個活動
                    </span>
                    
                    {accommodation && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        有住宿安排
                      </span>
                    )}
                    
                    {transportations.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {transportations.length} 筆交通
                      </span>
                    )}
                    
                    {meals.length > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        {meals.length} 餐飲安排
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 行程時間表 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">行程時間表</h2>
              
              {sortedActivities.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <i className="fas fa-calendar-day text-gray-300 text-5xl mb-3"></i>
                  <p className="text-gray-500">尚未添加任何活動</p>
                </div>
              ) : (
                <div className="relative">
                  {/* 時間軸 */}
                  <div className="absolute top-0 bottom-0 left-[15px] md:left-[20px] w-0.5 bg-blue-200"></div>
                  
                  <div className="space-y-6">
                    {sortedActivities.map((activity, index) => {
                      const categoryInfo = getCategoryInfo(activity.category);
                      
                      return (
                        <div key={activity.id} className="relative pl-8 md:pl-10">
                          {/* 時間點 */}
                          <div className="absolute left-0 top-1 w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-full bg-blue-500 shadow"></div>
                          
                          <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                              <div className="flex items-center mb-2 md:mb-0">
                                <span className="font-semibold text-lg text-gray-800">
                                  {activity.title}
                                </span>
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${categoryInfo.bgColor} ${categoryInfo.textColor}`}>
                                  {categoryInfo.text}
                                </span>
                              </div>
                              
                              <div className="text-sm bg-gray-100 px-3 py-1 rounded-md">
                                <i className="far fa-clock mr-1"></i>
                                {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                              </div>
                            </div>
                            
                            {activity.description && (
                              <p className="text-gray-600 mt-1 mb-2">{activity.description}</p>
                            )}
                            
                            <div className="mt-2 text-sm">
                              <div className="flex flex-wrap gap-y-1">
                                <div className="w-full md:w-1/2">
                                  <i className="fas fa-map-marker-alt text-red-500 mr-1"></i>
                                  <span className="text-gray-700">{activity.location}</span>
                                </div>
                                
                                {activity.address && (
                                  <div className="w-full md:w-1/2">
                                    <i className="fas fa-route text-blue-500 mr-1"></i>
                                    <span className="text-gray-700">{activity.address}</span>
                                  </div>
                                )}
                                
                                {activity.cost && (
                                  <div className="w-full md:w-1/2">
                                    <i className="fas fa-dollar-sign text-green-500 mr-1"></i>
                                    <span className="text-gray-700">
                                      {activity.cost} {activity.currency || 'TWD'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {activity.notes && (
                              <div className="mt-3 pt-3 border-t text-sm">
                                <i className="fas fa-sticky-note text-yellow-500 mr-1"></i>
                                <span className="text-gray-700">{activity.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* 住宿信息 */}
            {accommodation && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">住宿信息</h2>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <i className="fas fa-bed text-purple-600 text-xl mr-3"></i>
                    <h3 className="text-lg font-medium text-gray-800">{accommodation.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">地址:</div>
                      <div>{accommodation.address}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">價格:</div>
                      <div>{accommodation.price} {accommodation.currency}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">入住時間:</div>
                      <div>{formatTime(accommodation.checkIn)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">退房時間:</div>
                      <div>{formatTime(accommodation.checkOut)}</div>
                    </div>
                    
                    {accommodation.confirmationNumber && (
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-600">確認編號:</div>
                        <div>{accommodation.confirmationNumber}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* 交通信息 */}
            {transportations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">交通信息</h2>
                
                <div className="space-y-4">
                  {transportations.map(transport => (
                    <div key={transport.id} className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <i className={`fas ${
                          transport.type === 'flight' ? 'fa-plane' :
                          transport.type === 'train' ? 'fa-train' :
                          transport.type === 'bus' ? 'fa-bus' :
                          transport.type === 'car' ? 'fa-car' :
                          transport.type === 'ferry' ? 'fa-ship' :
                          'fa-shuttle-van'
                        } text-yellow-600 text-xl mr-3`}></i>
                        <h3 className="text-lg font-medium text-gray-800">
                          {transport.departureLocation} → {transport.arrivalLocation}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">出發時間:</div>
                          <div>{new Date(transport.departureTime).toLocaleString('zh-TW')}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">到達時間:</div>
                          <div>{new Date(transport.arrivalTime).toLocaleString('zh-TW')}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">價格:</div>
                          <div>{transport.price} {transport.currency}</div>
                        </div>
                        
                        {transport.referenceNumber && (
                          <div>
                            <div className="text-sm text-gray-600">參考編號:</div>
                            <div>{transport.referenceNumber}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 餐飲信息 */}
            {meals.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">餐飲安排</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meals.map(meal => (
                    <div key={meal.id} className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <i className={`fas ${
                          meal.type === 'breakfast' ? 'fa-coffee' :
                          meal.type === 'lunch' ? 'fa-hamburger' :
                          meal.type === 'dinner' ? 'fa-utensils' :
                          'fa-ice-cream'
                        } text-red-600 mr-2`}></i>
                        <span className="font-medium">{meal.name}</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white text-red-800">
                          {meal.type === 'breakfast' ? '早餐' :
                           meal.type === 'lunch' ? '午餐' :
                           meal.type === 'dinner' ? '晚餐' : '點心'}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <div className="mb-1">
                          <i className="fas fa-map-marker-alt mr-1 text-gray-500"></i>
                          <span>{meal.location}</span>
                        </div>
                        <div className="mb-1">
                          <i className="far fa-clock mr-1 text-gray-500"></i>
                          <span>{formatTime(meal.time)}</span>
                        </div>
                        
                        {meal.price && (
                          <div className="mb-1">
                            <i className="fas fa-dollar-sign mr-1 text-gray-500"></i>
                            <span>{meal.price} {meal.currency || 'TWD'}</span>
                          </div>
                        )}
                        
                        {meal.reservationInfo && (
                          <div>
                            <i className="fas fa-phone-alt mr-1 text-gray-500"></i>
                            <span>{meal.reservationInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ItineraryDayDetail; 