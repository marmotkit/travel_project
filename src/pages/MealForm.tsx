import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
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

const MealForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tripIdFromQuery = queryParams.get('tripId');
  const dayIdFromQuery = queryParams.get('dayId');
  
  // 是否為編輯模式
  const isEditMode = !!id;
  
  // 狀態定義
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  
  // 表單狀態
  const [formData, setFormData] = useState<{
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
    recommendedDishes: string[];
    notes?: string;
    googleMapsUrl?: string;
    rating?: number;
  }>({
    tripId: tripIdFromQuery || '',
    itineraryDayId: dayIdFromQuery || undefined,
    type: 'lunch',
    restaurantName: '',
    category: 'local',
    address: '',
    reservationTime: `${new Date().toISOString().slice(0, 10)}T12:00:00`,
    latestArrivalTime: '',
    status: 'pending',
    reservationNumber: '',
    numberOfPeople: 2,
    estimatedCost: undefined,
    currency: 'TWD',
    contactPhone: '',
    contactEmail: '',
    websiteUrl: '',
    dietaryOptions: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      nutFree: false,
      dairyFree: false,
      other: ''
    },
    specialRequests: '',
    recommendedDishes: [],
    notes: '',
    googleMapsUrl: '',
    rating: undefined
  });
  
  // 推薦菜品輸入狀態
  const [newDish, setNewDish] = useState('');
  
  // 檢查使用者權限
  const checkAuth = useCallback(() => {
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
  }, [navigate]);

  // 載入數據
  const loadData = useCallback(() => {
    setIsLoading(true);
    
    // 載入旅程數據
    const tripsStr = localStorage.getItem('trips');
    if (tripsStr) {
      try {
        const trips = JSON.parse(tripsStr);
        setTrips(trips);
      } catch (error) {
        console.error('解析旅程數據時出錯:', error);
      }
    }
    
    // 載入行程日數據
    const itineraryDaysStr = localStorage.getItem('itineraryDays');
    if (itineraryDaysStr) {
      try {
        const days = JSON.parse(itineraryDaysStr);
        setItineraryDays(days);
      } catch (error) {
        console.error('解析行程日數據時出錯:', error);
      }
    }
    
    // 載入餐飲數據
    const mealsStr = localStorage.getItem('meals');
    if (mealsStr) {
      try {
        const meals = JSON.parse(mealsStr);
        const existingMeal = id ? meals.find((meal: any) => meal.id === id) : null;
        
        if (existingMeal) {
          setFormData({
            ...existingMeal,
            dietary: {
              vegetarian: existingMeal.vegetarian || false,
              vegan: existingMeal.vegan || false,
              glutenFree: existingMeal.glutenFree || false,
              nutFree: existingMeal.nutFree || false,
              dairyFree: existingMeal.dairyFree || false,
              other: existingMeal.other || ''
            }
          });
          setPhotoUrls(existingMeal.photoUrls || []);
        }
      } catch (error) {
        console.error('解析餐飲數據時出錯:', error);
      }
    }
    
    setIsLoading(false);
  }, [id, isEditMode]);

  // 初始化頁面
  useEffect(() => {
    checkAuth();
    loadData();
  }, [checkAuth, loadData]);
  
  // 處理表單變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // 處理餐飲選項變更
  const handleDietaryOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, value, type } = e.target;
    
    setFormData({
      ...formData,
      dietaryOptions: {
        ...formData.dietaryOptions,
        [name.replace('dietaryOptions.', '')]: type === 'checkbox' ? checked : value
      }
    });
  };
  
  // 新增推薦菜品
  const handleAddDish = () => {
    if (newDish.trim() !== '') {
      setFormData({
        ...formData,
        recommendedDishes: [...formData.recommendedDishes, newDish.trim()]
      });
      setNewDish('');
    }
  };
  
  // 刪除推薦菜品
  const handleRemoveDish = (index: number) => {
    setFormData({
      ...formData,
      recommendedDishes: formData.recommendedDishes.filter((_, i) => i !== index)
    });
  };
  
  // 提交表單
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tripId) {
      setErrorMessage('請選擇旅程');
      return;
    }
    
    if (!formData.restaurantName) {
      setErrorMessage('請輸入餐廳名稱');
      return;
    }
    
    if (!formData.address) {
      setErrorMessage('請輸入餐廳地址');
      return;
    }
    
    if (!formData.reservationTime) {
      setErrorMessage('請選擇預訂時間');
      return;
    }
    
    // 獲取現有餐飲數據
    const mealsStr = localStorage.getItem('meals');
    let existingMeals: Meal[] = [];
    
    if (mealsStr) {
      try {
        existingMeals = JSON.parse(mealsStr);
      } catch (error) {
        console.error('解析餐飲數據時出錯:', error);
      }
    }
    
    const now = new Date().toISOString();
    
    if (isEditMode && id) {
      // 更新現有餐飲
      const updatedMeals = existingMeals.map(meal => {
        if (meal.id === id) {
          return {
            ...meal,
            ...formData,
            updatedAt: now
          };
        }
        return meal;
      });
      
      localStorage.setItem('meals', JSON.stringify(updatedMeals));
    } else {
      // 創建新餐飲
      const newMeal: Meal = {
        id: uuidv4(),
        ...formData,
        photoUrls: [],
        createdAt: now,
        updatedAt: now
      };
      
      existingMeals.push(newMeal);
      localStorage.setItem('meals', JSON.stringify(existingMeals));
    }
    
    // 返回餐飲列表頁面
    navigate('/meals');
  };
  
  // 取消操作
  const handleCancel = () => {
    navigate('/meals');
  };
  
  // 過濾特定旅程的行程日
  const getFilteredItineraryDays = (): ItineraryDay[] => {
    if (!formData.tripId) return [];
    
    return itineraryDays
      .filter(day => day.tripId === formData.tripId)
      .sort((a, b) => a.dayNumber - b.dayNumber);
  };
  
  // 獲取特定旅程的名稱
  const getTripTitle = (tripId: string): string => {
    const trip = trips.find(t => t.id === tripId);
    return trip ? trip.title : '未知旅程';
  };
  
  // 獲取特定行程日的描述
  const getItineraryDayDescription = (dayId: string): string => {
    const day = itineraryDays.find(d => d.id === dayId);
    if (!day) return '未知行程日';
    
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    return `第 ${day.dayNumber} 天: ${day.title} (${formattedDate})`;
  };
  
  // 餐飲類型選項
  const mealTypeOptions: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: '早餐' },
    { value: 'lunch', label: '午餐' },
    { value: 'dinner', label: '晚餐' },
    { value: 'brunch', label: '早午餐' },
    { value: 'teabreak', label: '下午茶' },
    { value: 'snack', label: '小吃' }
  ];
  
  // 餐廳類別選項
  const restaurantCategoryOptions: { value: RestaurantCategory; label: string }[] = [
    { value: 'local', label: '當地美食' },
    { value: 'international', label: '國際料理' },
    { value: 'chinese', label: '中式料理' },
    { value: 'japanese', label: '日式料理' },
    { value: 'korean', label: '韓式料理' },
    { value: 'italian', label: '義式料理' },
    { value: 'french', label: '法式料理' },
    { value: 'thai', label: '泰式料理' },
    { value: 'seafood', label: '海鮮' },
    { value: 'vegetarian', label: '素食' },
    { value: 'vegan', label: '全素' },
    { value: 'fastfood', label: '速食' },
    { value: 'cafe', label: '咖啡廳' },
    { value: 'dessert', label: '甜點' },
    { value: 'buffet', label: '自助餐' },
    { value: 'finedining', label: '高級餐廳' },
    { value: 'streetfood', label: '街頭小吃' },
    { value: 'other', label: '其他' }
  ];
  
  // 狀態選項
  const statusOptions: { value: MealStatus; label: string }[] = [
    { value: 'confirmed', label: '已確認' },
    { value: 'pending', label: '待確認' },
    { value: 'cancelled', label: '已取消' }
  ];
  
  // 貨幣選項
  const currencyOptions = [
    { value: 'TWD', label: '新台幣 (TWD)' },
    { value: 'USD', label: '美元 (USD)' },
    { value: 'JPY', label: '日圓 (JPY)' },
    { value: 'EUR', label: '歐元 (EUR)' },
    { value: 'GBP', label: '英鎊 (GBP)' },
    { value: 'CNY', label: '人民幣 (CNY)' },
    { value: 'KRW', label: '韓元 (KRW)' },
    { value: 'HKD', label: '港幣 (HKD)' },
    { value: 'SGD', label: '新加坡幣 (SGD)' },
    { value: 'THB', label: '泰銖 (THB)' }
  ];
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1">
        <Header
          title={isEditMode ? '編輯餐飲' : '添加餐飲'}
          isAdmin={isAdmin}
          onToggleAdmin={() => setIsAdmin(!isAdmin)}
        />
        <main className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6">
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* 基本信息區塊 */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    基本信息
                  </h2>
                  
                  {/* 旅程選擇 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tripId">
                      所屬旅程 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="tripId"
                      name="tripId"
                      value={formData.tripId}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      disabled={isEditMode} // 編輯模式下不允許變更所屬旅程
                      required
                    >
                      <option value="">請選擇旅程</option>
                      {trips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title} ({trip.destination})
                        </option>
                      ))}
                    </select>
                    {formData.tripId && (
                      <p className="mt-1 text-sm text-gray-600">
                        選擇的旅程: {getTripTitle(formData.tripId)}
                      </p>
                    )}
                  </div>
                  
                  {/* 行程日選擇 */}
                  {formData.tripId && (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="itineraryDayId">
                        所屬行程日
                      </label>
                      <select
                        id="itineraryDayId"
                        name="itineraryDayId"
                        value={formData.itineraryDayId || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      >
                        <option value="">不分配到特定行程日</option>
                        {getFilteredItineraryDays().map(day => (
                          <option key={day.id} value={day.id}>
                            第 {day.dayNumber} 天: {day.title} ({new Date(day.date).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      {formData.itineraryDayId && (
                        <p className="mt-1 text-sm text-gray-600">
                          選擇的行程日: {getItineraryDayDescription(formData.itineraryDayId)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* 餐飲類型 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                      餐飲類型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    >
                      {mealTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 餐廳名稱 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="restaurantName">
                      餐廳名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="restaurantName"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：鼎泰豐"
                      required
                    />
                  </div>
                  
                  {/* 餐廳類別 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                      餐廳類別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    >
                      {restaurantCategoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 餐廳地址 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                      餐廳地址 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：台北市信義區松高路12號"
                      required
                    />
                  </div>
                  
                  {/* Google Maps 連結 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="googleMapsUrl">
                      Google Maps 連結
                    </label>
                    <input
                      type="url"
                      id="googleMapsUrl"
                      name="googleMapsUrl"
                      value={formData.googleMapsUrl}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：https://goo.gl/maps/..."
                    />
                  </div>
                </div>
                
                {/* 預訂信息區塊 */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    預訂信息
                  </h2>
                  
                  {/* 預訂時間 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reservationTime">
                      預訂時間 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="reservationTime"
                      name="reservationTime"
                      value={formData.reservationTime ? formData.reservationTime.slice(0, 16) : ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  {/* 最晚到達時間 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latestArrivalTime">
                      最晚到達時間
                    </label>
                    <input
                      type="time"
                      id="latestArrivalTime"
                      name="latestArrivalTime"
                      value={formData.latestArrivalTime || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：19:30"
                    />
                    <p className="mt-1 text-sm text-gray-600">
                      超過此時間可能無法保留位置
                    </p>
                  </div>
                  
                  {/* 狀態 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                      預訂狀態 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 預訂編號 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reservationNumber">
                      預訂編號
                    </label>
                    <input
                      type="text"
                      id="reservationNumber"
                      name="reservationNumber"
                      value={formData.reservationNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：R12345"
                    />
                  </div>
                  
                  {/* 人數 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numberOfPeople">
                      用餐人數 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="numberOfPeople"
                      name="numberOfPeople"
                      value={formData.numberOfPeople}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                {/* 費用區塊 */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    費用信息
                  </h2>
                  
                  <div className="flex flex-wrap -mx-2">
                    {/* 預估費用 */}
                    <div className="px-2 w-full md:w-1/2 mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="estimatedCost">
                        預估費用
                      </label>
                      <input
                        type="number"
                        id="estimatedCost"
                        name="estimatedCost"
                        value={formData.estimatedCost === undefined ? '' : formData.estimatedCost}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className="w-full p-3 border border-gray-300 rounded-md"
                        placeholder="例如：1500"
                      />
                    </div>
                    
                    {/* 貨幣 */}
                    <div className="px-2 w-full md:w-1/2 mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currency">
                        貨幣
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      >
                        {currencyOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* 聯絡方式區塊 */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    聯絡方式
                  </h2>
                  
                  <div className="flex flex-wrap -mx-2">
                    {/* 聯絡電話 */}
                    <div className="px-2 w-full md:w-1/2 mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactPhone">
                        聯絡電話
                      </label>
                      <input
                        type="tel"
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        placeholder="例如：02-12345678"
                      />
                    </div>
                    
                    {/* 聯絡信箱 */}
                    <div className="px-2 w-full md:w-1/2 mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactEmail">
                        聯絡信箱
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        placeholder="例如：restaurant@example.com"
                      />
                    </div>
                  </div>
                  
                  {/* 網站 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="websiteUrl">
                      餐廳網站
                    </label>
                    <input
                      type="url"
                      id="websiteUrl"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：https://www.restaurant.com"
                    />
                  </div>
                </div>
                
                {/* 飲食選項區塊 */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    飲食選項
                  </h2>
                  
                  <div className="mb-4">
                    <p className="block text-gray-700 text-sm font-bold mb-3">
                      可用的飲食選項（可複選）
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="dietaryOptions.vegetarian"
                          name="dietaryOptions.vegetarian"
                          checked={formData.dietaryOptions.vegetarian}
                          onChange={handleDietaryOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="dietaryOptions.vegetarian">素食選項</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="dietaryOptions.vegan"
                          name="dietaryOptions.vegan"
                          checked={formData.dietaryOptions.vegan}
                          onChange={handleDietaryOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="dietaryOptions.vegan">全素選項</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="dietaryOptions.glutenFree"
                          name="dietaryOptions.glutenFree"
                          checked={formData.dietaryOptions.glutenFree}
                          onChange={handleDietaryOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="dietaryOptions.glutenFree">無麩質選項</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="dietaryOptions.nutFree"
                          name="dietaryOptions.nutFree"
                          checked={formData.dietaryOptions.nutFree}
                          onChange={handleDietaryOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="dietaryOptions.nutFree">無堅果選項</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="dietaryOptions.dairyFree"
                          name="dietaryOptions.dairyFree"
                          checked={formData.dietaryOptions.dairyFree}
                          onChange={handleDietaryOptionChange}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="dietaryOptions.dairyFree">無乳製品選項</label>
                      </div>
                    </div>
                  </div>
                  
                  {/* 其他飲食選項 */}
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="dietaryOptions.other"
                    >
                      其他飲食選項
                    </label>
                    <input
                      type="text"
                      id="dietaryOptions.other"
                      name="dietaryOptions.other"
                      value={formData.dietaryOptions.other || ''}
                      onChange={handleDietaryOptionChange}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：低碳水、無辣等"
                    />
                  </div>
                  
                  {/* 特殊需求 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specialRequests">
                      特殊需求/備註
                    </label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md min-h-[80px]"
                      placeholder="其他想記錄的信息"
                    />
                  </div>
                </div>
                
                {/* 推薦菜品區塊 */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    推薦菜品
                  </h2>
                  
                  <div className="mb-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newDish}
                        onChange={(e) => setNewDish(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-md"
                        placeholder="輸入推薦菜品名稱"
                      />
                      <button
                        type="button"
                        onClick={handleAddDish}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                  
                  {formData.recommendedDishes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-gray-700 text-sm font-bold mb-2">
                        已添加的推薦菜品:
                      </p>
                      <ul className="bg-gray-50 p-3 rounded-md">
                        {formData.recommendedDishes.map((dish, index) => (
                          <li key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <span>{dish}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDish(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* 評分區塊 */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    評分與備註
                  </h2>
                  
                  {/* 評分 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rating">
                      評分 (1-5)
                    </label>
                    <input
                      type="number"
                      id="rating"
                      name="rating"
                      value={formData.rating === undefined ? '' : formData.rating}
                      onChange={handleInputChange}
                      min="1"
                      max="5"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-md"
                      placeholder="例如：4.5"
                    />
                  </div>
                  
                  {/* 備註 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                      備註
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                      placeholder="其他想記錄的信息"
                    />
                  </div>
                </div>
                
                {/* 提交按鈕 */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    {isEditMode ? '更新' : '創建'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MealForm;
