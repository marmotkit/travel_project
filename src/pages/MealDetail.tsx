import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { MealType, RestaurantCategory, MealStatus, Meal } from './Meal';

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

const MealDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [meal, setMeal] = useState<Meal | null>(null);
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
      
      // 加載餐飲數據
      if (id) {
        const mealsStr = localStorage.getItem('meals');
        if (mealsStr) {
          try {
            const parsedMeals = JSON.parse(mealsStr);
            const targetMeal = parsedMeals.find((item: Meal) => item.id === id);
            
            if (targetMeal) {
              setMeal(targetMeal);
              
              // 加載關聯的旅程信息
              const tripsStr = localStorage.getItem('trips');
              if (tripsStr) {
                const parsedTrips = JSON.parse(tripsStr);
                const relatedTrip = parsedTrips.find((item: Trip) => item.id === targetMeal.tripId);
                if (relatedTrip) {
                  setTrip(relatedTrip);
                }
              }
              
              // 加載關聯的行程日信息（如果有）
              if (targetMeal.itineraryDayId) {
                const itineraryStr = localStorage.getItem('itinerary');
                if (itineraryStr) {
                  const parsedItinerary = JSON.parse(itineraryStr);
                  const relatedDay = parsedItinerary.find(
                    (item: ItineraryDay) => item.id === targetMeal.itineraryDayId
                  );
                  if (relatedDay) {
                    setItineraryDay(relatedDay);
                  }
                }
              }
            } else {
              // 找不到指定的餐飲，返回列表頁
              navigate('/meals');
            }
          } catch (error) {
            console.error('解析餐飲數據時出錯:', error);
            navigate('/meals');
          }
        } else {
          navigate('/meals');
        }
      } else {
        navigate('/meals');
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [id, navigate]);
  
  // 返回餐飲列表
  const handleBack = () => {
    navigate('/meals');
  };
  
  // 編輯餐飲
  const handleEdit = () => {
    navigate(`/meals/${id}/edit`);
  };
  
  // 確認刪除
  const handleConfirmDelete = () => {
    setShowDeleteModal(true);
  };
  
  // 刪除餐飲
  const handleDelete = () => {
    if (!id) return;
    
    const mealsStr = localStorage.getItem('meals');
    if (mealsStr) {
      try {
        const parsedMeals = JSON.parse(mealsStr);
        const updatedMeals = parsedMeals.filter(
          (item: Meal) => item.id !== id
        );
        
        localStorage.setItem('meals', JSON.stringify(updatedMeals));
        navigate('/meals');
      } catch (error) {
        console.error('處理餐飲數據時出錯:', error);
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

  // 格式化時間
  const formatTime = (dateTimeString: string) => {
    const time = new Date(dateTimeString);
    return time.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化日期和時間
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return `${formatDate(dateTimeString)} ${formatTime(dateTimeString)}`;
  };
  
  // 獲取餐飲類型的中文名稱
  const getMealTypeName = (type: MealType): string => {
    const typeNames: Record<MealType, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      brunch: '早午餐',
      teabreak: '下午茶',
      snack: '小吃'
    };
    
    return typeNames[type] || type;
  };
  
  // 獲取餐廳類別的中文名稱
  const getRestaurantCategoryName = (category: RestaurantCategory): string => {
    const categoryNames: Record<RestaurantCategory, string> = {
      local: '當地美食',
      international: '國際料理',
      chinese: '中式料理',
      japanese: '日式料理',
      korean: '韓式料理',
      italian: '義式料理',
      french: '法式料理',
      thai: '泰式料理',
      seafood: '海鮮',
      vegetarian: '素食',
      vegan: '全素',
      fastfood: '速食',
      cafe: '咖啡廳',
      dessert: '甜點',
      buffet: '自助餐',
      finedining: '高級餐廳',
      streetfood: '街頭小吃',
      other: '其他'
    };
    
    return categoryNames[category] || category;
  };
  
  // 獲取餐飲狀態的中文名稱
  const getMealStatusName = (status: MealStatus): string => {
    const statusNames: Record<MealStatus, string> = {
      confirmed: '已確認',
      pending: '待確認',
      cancelled: '已取消'
    };
    
    return statusNames[status] || status;
  };
  
  // 獲取狀態的顏色標籤
  const getStatusColor = (status: MealStatus): string => {
    const statusColors: Record<MealStatus, string> = {
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
            您確定要刪除餐飲「{meal?.restaurantName}」嗎？此操作無法撤銷。
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
  
  // 渲染飲食選項列表
  const renderDietaryOptions = () => {
    if (!meal?.dietaryOptions) return null;
    
    const options = [];
    
    if (meal.dietaryOptions.vegetarian) options.push('素食');
    if (meal.dietaryOptions.vegan) options.push('全素');
    if (meal.dietaryOptions.glutenFree) options.push('無麩質');
    if (meal.dietaryOptions.nutFree) options.push('無堅果');
    if (meal.dietaryOptions.dairyFree) options.push('無乳製品');
    if (meal.dietaryOptions.other) options.push(meal.dietaryOptions.other);
    
    if (options.length === 0) {
      return <p className="text-gray-500 italic">無特殊飲食選項</p>;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((option, index) => (
          <span 
            key={index} 
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {option}
          </span>
        ))}
      </div>
    );
  };
  
  // 渲染推薦菜品列表
  const renderRecommendedDishes = () => {
    if (!meal?.recommendedDishes || meal.recommendedDishes.length === 0) {
      return <p className="text-gray-500 italic">無推薦菜品</p>;
    }
    
    return (
      <ul className="list-disc ml-5 mt-2">
        {meal.recommendedDishes.map((dish, index) => (
          <li key={index} className="text-gray-700 mb-1">{dish}</li>
        ))}
      </ul>
    );
  };

  // 渲染評分星星
  const renderRating = () => {
    if (!meal?.rating) return null;
    
    const fullStars = Math.floor(meal.rating);
    const hasHalfStar = meal.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {Array(fullStars).fill(0).map((_, i) => (
          <i key={`full-${i}`} className="fas fa-star text-yellow-400"></i>
        ))}
        
        {hasHalfStar && (
          <i className="fas fa-star-half-alt text-yellow-400"></i>
        )}
        
        {Array(emptyStars).fill(0).map((_, i) => (
          <i key={`empty-${i}`} className="far fa-star text-yellow-400"></i>
        ))}
        
        <span className="ml-2 text-gray-600">{meal.rating.toFixed(1)}</span>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1">
          <Header title="餐飲詳情" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
          <main className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!meal) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1">
          <Header title="餐飲詳情" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
          <main className="p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <p className="text-center text-gray-500">找不到餐飲信息</p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  返回餐飲列表
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
        <Header title="餐飲詳情" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
        <main className="p-6">
          {/* 頂部導航和操作按鈕 */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-0"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              返回餐飲列表
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
          
          {/* 餐飲詳情卡片 */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* 標題區塊 */}
            <div className="p-6 bg-blue-50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-800 mr-3">{meal.restaurantName}</h1>
                    <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(meal.status)}`}>
                      {getMealStatusName(meal.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{meal.address}</p>
                  
                  <div className="flex items-center mt-2">
                    <span className="text-blue-600 font-medium">
                      {getMealTypeName(meal.type)}
                    </span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-gray-600">
                      {getRestaurantCategoryName(meal.category)}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  {meal.estimatedCost && (
                    <p className="text-xl font-semibold text-gray-800">
                      {meal.estimatedCost} {meal.currency}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    {meal.numberOfPeople} 人用餐
                  </p>
                </div>
              </div>
            </div>
            
            {/* 餐飲詳情內容 */}
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
              
              {/* 預訂信息 */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-md font-medium text-gray-800 mb-2">預訂信息</h3>
                  <div className="flex items-center">
                    <i className="fas fa-calendar-check text-blue-500 mr-2"></i>
                    <span className="text-gray-700">預訂時間: {formatDateTime(meal.reservationTime)}</span>
                  </div>
                  
                  {meal.latestArrivalTime && (
                    <div className="flex items-center mt-2">
                      <i className="fas fa-clock text-blue-500 mr-2"></i>
                      <span className="text-gray-700">最晚到達時間: {meal.latestArrivalTime}</span>
                    </div>
                  )}
                  
                  {meal.reservationNumber && (
                    <div className="flex items-center mt-2">
                      <i className="fas fa-ticket-alt text-blue-500 mr-2"></i>
                      <span className="text-gray-700">預訂編號: {meal.reservationNumber}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-md font-medium text-gray-800 mb-2">聯絡方式</h3>
                  {meal.contactPhone && (
                    <div className="flex items-center">
                      <i className="fas fa-phone text-blue-500 mr-2"></i>
                      <span className="text-gray-700">{meal.contactPhone}</span>
                    </div>
                  )}
                  
                  {meal.contactEmail && (
                    <div className="flex items-center mt-2">
                      <i className="fas fa-envelope text-blue-500 mr-2"></i>
                      <span className="text-gray-700">{meal.contactEmail}</span>
                    </div>
                  )}
                  
                  {meal.websiteUrl && (
                    <div className="flex items-center mt-2">
                      <i className="fas fa-globe text-blue-500 mr-2"></i>
                      <a
                        href={meal.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        餐廳網站
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 位置信息和飲食選項 */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">位置</h3>
                  <p className="text-gray-700 mb-2">{meal.address}</p>
                  
                  {meal.googleMapsUrl && (
                    <a
                      href={meal.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline"
                    >
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      在 Google Maps 上查看
                    </a>
                  )}
                </div>
                
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">飲食選項</h3>
                  {renderDietaryOptions()}
                </div>
              </div>
              
              {/* 推薦菜品和評分 */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">推薦菜品</h3>
                  {renderRecommendedDishes()}
                </div>
                
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">評分</h3>
                  {meal.rating ? renderRating() : <p className="text-gray-500 italic">尚未評分</p>}
                </div>
              </div>
              
              {/* 特殊需求 */}
              {meal.specialRequests && (
                <div className="mb-6 p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">特殊需求</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{meal.specialRequests}</p>
                </div>
              )}
              
              {/* 備註 */}
              {meal.notes && (
                <div className="p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">備註</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{meal.notes}</p>
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

export default MealDetail; 