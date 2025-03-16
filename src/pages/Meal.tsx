import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';

// 餐飲類型定義
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'teabreak' | 'snack';

// 餐廳類別定義
export type RestaurantCategory = 
  'local' | 'international' | 'chinese' | 'japanese' | 'korean' | 
  'italian' | 'french' | 'thai' | 'seafood' | 'vegetarian' | 'vegan' | 
  'fastfood' | 'cafe' | 'dessert' | 'buffet' | 'finedining' | 'streetfood' | 'other';

// 餐飲狀態定義
export type MealStatus = 'confirmed' | 'pending' | 'cancelled';

// 餐飲預訂資料介面
export interface Meal {
  id: string;
  tripId: string;
  itineraryDayId?: string;
  type: MealType;
  restaurantName: string;
  category: RestaurantCategory;
  address: string;
  reservationTime: string;
  latestArrivalTime?: string;
  status: MealStatus;
  reservationNumber?: string;
  numberOfPeople: number;
  estimatedCost?: number;
  currency?: string;
  contactPhone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  dietaryOptions: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    nutFree: boolean;
    dairyFree: boolean;
    other?: string;
  };
  specialRequests?: string;
  recommendedDishes?: string[];
  notes?: string;
  googleMapsUrl?: string;
  rating?: number;
  photoUrls?: string[];
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

// 行程日介面
interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  title: string;
}

// 行程日與餐飲的關聯介面
interface ItineraryDayWithMeals {
  day: ItineraryDay;
  meals: Meal[];
}

const Meal: React.FC = () => {
  const navigate = useNavigate();
  
  // 狀態定義
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);

  // 初始化頁面
  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  // 檢查使用者權限
  const checkAuth = () => {
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
    }
  };

  // 載入數據
  const loadData = () => {
    setIsLoading(true);
    
    // 載入旅程數據
    const tripsStr = localStorage.getItem('trips');
    if (tripsStr) {
      try {
        const parsedTrips = JSON.parse(tripsStr);
        setTrips(parsedTrips);
        
        // 如果有旅程且尚未選擇，預設選擇第一個
        if (parsedTrips.length > 0 && !selectedTripId) {
          setSelectedTripId(parsedTrips[0].id);
        }
      } catch (error) {
        console.error('解析旅程數據時出錯:', error);
      }
    }
    
    // 載入行程日數據
    const itineraryStr = localStorage.getItem('itinerary');
    if (itineraryStr) {
      try {
        const parsedItinerary = JSON.parse(itineraryStr);
        setItineraryDays(parsedItinerary);
      } catch (error) {
        console.error('解析行程數據時出錯:', error);
      }
    }
    
    // 載入餐飲數據
    const mealsStr = localStorage.getItem('meals');
    if (mealsStr) {
      try {
        const parsedMeals = JSON.parse(mealsStr);
        setMeals(parsedMeals);
      } catch (error) {
        console.error('解析餐飲數據時出錯:', error);
      }
    } else {
      // 如果沒有餐飲數據，初始化空數組
      setMeals([]);
    }
    
    setIsLoading(false);
  };

  // 根據行程日取得餐飲數據
  const getMealsByDay = (): ItineraryDayWithMeals[] => {
    if (!selectedTripId) return [];
    
    // 過濾當前選擇旅程的行程日
    const filteredDays = itineraryDays.filter(day => day.tripId === selectedTripId);
    
    // 排序行程日（按照天數）
    const sortedDays = [...filteredDays].sort((a, b) => a.dayNumber - b.dayNumber);
    
    // 為每個行程日關聯相應的餐飲
    return sortedDays.map(day => {
      const dayMeals = meals.filter(meal => meal.itineraryDayId === day.id);
      
      // 根據用餐時間排序餐飲
      const sortedMeals = [...dayMeals].sort((a, b) => {
        return new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime();
      });
      
      return {
        day,
        meals: sortedMeals
      };
    });
  };

  // 獲取指定旅程但未分配到特定行程日的餐飲
  const getUnassignedMeals = (): Meal[] => {
    if (!selectedTripId) return [];
    
    const unassignedMeals = meals.filter(
      meal => meal.tripId === selectedTripId && !meal.itineraryDayId
    );
    
    return unassignedMeals;
  };

  // 處理旅程選擇變更
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTripId(e.target.value);
  };

  // 創建新餐飲項目
  const handleCreateMeal = (itineraryDayId?: string) => {
    // 默認創建未分配的餐飲，如果提供了行程日ID則創建關聯的餐飲
    if (itineraryDayId) {
      navigate(`/meals/new?dayId=${itineraryDayId}&tripId=${selectedTripId}`);
    } else {
      navigate(`/meals/new?tripId=${selectedTripId}`);
    }
  };

  // 查看餐飲詳情
  const handleViewMeal = (id: string) => {
    navigate(`/meals/${id}`);
  };

  // 編輯餐飲
  const handleEditMeal = (id: string) => {
    navigate(`/meals/${id}/edit`);
  };

  // 確認刪除
  const handleConfirmDelete = (id: string) => {
    setMealToDelete(id);
    setShowDeleteModal(true);
  };

  // 刪除餐飲
  const handleDeleteMeal = () => {
    if (!mealToDelete) return;
    
    const updatedMeals = meals.filter(meal => meal.id !== mealToDelete);
    localStorage.setItem('meals', JSON.stringify(updatedMeals));
    setMeals(updatedMeals);
    setShowDeleteModal(false);
    setMealToDelete(null);
  };

  // 取消刪除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMealToDelete(null);
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
  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // 渲染添加未分配餐飲的按鈕
  const renderAddUnassignedButton = () => (
    <button
      onClick={() => handleCreateMeal()}
      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center transition-colors mb-6"
    >
      <i className="fas fa-plus mr-2"></i>
      添加未分配的餐飲
    </button>
  );

  // 渲染按行程日分組的餐飲
  const renderMealsByDay = () => {
    const dayWithMeals = getMealsByDay();
    
    if (dayWithMeals.length === 0) {
      return (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <p className="text-center text-gray-500">尚未為此旅程創建行程日</p>
        </div>
      );
    }
    
    return dayWithMeals.map(({ day, meals }) => (
      <div key={day.id} className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="bg-blue-50 p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                第 {day.dayNumber} 天：{day.title}
              </h3>
              <p className="text-gray-600">{formatDate(day.date)}</p>
            </div>
            <button
              onClick={() => handleCreateMeal(day.id)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              添加餐飲
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {meals.length === 0 ? (
            <p className="text-center text-gray-500 py-4">此行程日尚未添加餐飲</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meals.map(meal => (
                <div key={meal.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(meal.status)}`}>
                      {getMealStatusName(meal.status)}
                    </span>
                    <span className="font-semibold text-blue-600">{getMealTypeName(meal.type)}</span>
                  </div>
                  
                  <h4 className="text-lg font-medium text-gray-800 mb-1">{meal.restaurantName}</h4>
                  <p className="text-gray-600 text-sm mb-2">{getRestaurantCategoryName(meal.category)}</p>
                  <p className="text-gray-500 text-sm mb-1 flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                    {meal.address}
                  </p>
                  <p className="text-gray-500 text-sm mb-1 flex items-center">
                    <i className="fas fa-clock mr-2 text-gray-400"></i>
                    {formatTime(meal.reservationTime)}
                  </p>
                  <p className="text-gray-500 text-sm mb-3 flex items-center">
                    <i className="fas fa-users mr-2 text-gray-400"></i>
                    {meal.numberOfPeople} 人
                  </p>
                  
                  {/* 餐飲費用 */}
                  {meal.estimatedCost && (
                    <p className="text-gray-700 text-sm font-medium mb-3">
                      預估費用: {meal.estimatedCost} {meal.currency || 'TWD'}
                    </p>
                  )}
                  
                  {/* 飲食選項指示器 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {meal.dietaryOptions.vegetarian && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">素食</span>
                    )}
                    {meal.dietaryOptions.vegan && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">全素</span>
                    )}
                    {meal.dietaryOptions.glutenFree && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">無麩質</span>
                    )}
                    {meal.dietaryOptions.nutFree && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">無堅果</span>
                    )}
                    {meal.dietaryOptions.dairyFree && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">無乳製品</span>
                    )}
                  </div>
                  
                  {/* 按鈕組 */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleViewMeal(meal.id)}
                      className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      查看
                    </button>
                    <button
                      onClick={() => handleEditMeal(meal.id)}
                      className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(meal.id)}
                      className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ));
  };

  // 渲染未分配的餐飲
  const renderUnassignedMeals = () => {
    const unassignedMeals = getUnassignedMeals();
    
    if (unassignedMeals.length === 0) {
      return null; // 如果沒有未分配的餐飲，不顯示此區塊
    }
    
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">未分配到行程日的餐飲</h3>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedMeals.map(meal => (
              <div key={meal.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(meal.status)}`}>
                    {getMealStatusName(meal.status)}
                  </span>
                  <span className="font-semibold text-blue-600">{getMealTypeName(meal.type)}</span>
                </div>
                
                <h4 className="text-lg font-medium text-gray-800 mb-1">{meal.restaurantName}</h4>
                <p className="text-gray-600 text-sm mb-2">{getRestaurantCategoryName(meal.category)}</p>
                <p className="text-gray-500 text-sm mb-1 flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                  {meal.address}
                </p>
                <p className="text-gray-500 text-sm mb-1 flex items-center">
                  <i className="fas fa-clock mr-2 text-gray-400"></i>
                  {formatTime(meal.reservationTime)}
                </p>
                <p className="text-gray-500 text-sm mb-3 flex items-center">
                  <i className="fas fa-users mr-2 text-gray-400"></i>
                  {meal.numberOfPeople} 人
                </p>
                
                {/* 餐飲費用 */}
                {meal.estimatedCost && (
                  <p className="text-gray-700 text-sm font-medium mb-3">
                    預估費用: {meal.estimatedCost} {meal.currency || 'TWD'}
                  </p>
                )}
                
                {/* 飲食選項指示器 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {meal.dietaryOptions.vegetarian && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">素食</span>
                  )}
                  {meal.dietaryOptions.vegan && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">全素</span>
                  )}
                  {meal.dietaryOptions.glutenFree && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">無麩質</span>
                  )}
                  {meal.dietaryOptions.nutFree && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">無堅果</span>
                  )}
                  {meal.dietaryOptions.dairyFree && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">無乳製品</span>
                  )}
                </div>
                
                {/* 按鈕組 */}
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleViewMeal(meal.id)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    查看
                  </button>
                  <button
                    onClick={() => handleEditMeal(meal.id)}
                    className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleConfirmDelete(meal.id)}
                    className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染確認刪除模態框
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    
    const mealToDeleteData = meals.find(meal => meal.id === mealToDelete);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">確認刪除</h3>
          
          {mealToDeleteData && (
            <p className="text-gray-600">
              您確定要刪除「{getMealTypeName(mealToDeleteData.type)} - {mealToDeleteData.restaurantName}」嗎？此操作無法撤銷。
            </p>
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDeleteMeal}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1">
        <Header title="餐飲管理" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
        <main className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* 旅程選擇下拉框 */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">旅程</h2>
                <select
                  className="w-full p-3 border border-gray-300 rounded-md"
                  value={selectedTripId}
                  onChange={handleTripChange}
                >
                  {trips.length === 0 ? (
                    <option value="">暫無旅程</option>
                  ) : (
                    trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title} ({formatDate(trip.startDate)} - {formatDate(trip.endDate)})
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              {selectedTripId && (
                <>
                  {/* 未分配餐飲添加按鈕 */}
                  {renderAddUnassignedButton()}
                  
                  {/* 未分配的餐飲 */}
                  {renderUnassignedMeals()}
                  
                  {/* 按行程日分組的餐飲 */}
                  {renderMealsByDay()}
                </>
              )}
              
              {/* 刪除確認模態框 */}
              {renderDeleteModal()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Meal; 