import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { v4 as uuidv4 } from 'uuid';

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

const ItineraryDayForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tripId = searchParams.get('tripId');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 可用旅程列表
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  // 行程日表單數據
  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    dayNumber: number;
    description: string;
    accommodationId?: string;
    transportationIds: string[];
    mealIds: string[];
  }>({
    title: '',
    date: '',
    dayNumber: 1,
    description: '',
    accommodationId: '',
    transportationIds: [],
    mealIds: []
  });
  
  // 活動列表
  const [activities, setActivities] = useState<ItineraryActivity[]>([]);
  
  // 可用數據列表
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [transportations, setTransportations] = useState<Transportation[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  
  // 表單驗證
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    date?: string;
    dayNumber?: string;
    activities?: string;
  }>({});
  
  const isFormValid = () => {
    const errors: {
      title?: string;
      date?: string;
      dayNumber?: string;
      activities?: string;
    } = {};
    
    if (!formData.title.trim()) {
      errors.title = '請輸入行程日標題';
    }
    
    if (!formData.date) {
      errors.date = '請選擇日期';
    }
    
    if (formData.dayNumber <= 0) {
      errors.dayNumber = '天數必須大於 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 添加新的空白活動
  const addNewActivity = () => {
    const newActivity: ItineraryActivity = {
      id: uuidv4(),
      startTime: '09:00',
      endTime: '10:00',
      title: '',
      description: '',
      location: '',
      category: 'activity'
    };
    
    setActivities([...activities, newActivity]);
  };
  
  // 更新活動
  const updateActivity = (index: number, field: keyof ItineraryActivity, value: any) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = {
      ...updatedActivities[index],
      [field]: value
    };
    setActivities(updatedActivities);
  };
  
  // 刪除活動
  const removeActivity = (index: number) => {
    const updatedActivities = [...activities];
    updatedActivities.splice(index, 1);
    setActivities(updatedActivities);
  };
  
  // 處理表單輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 處理選擇旅程變更
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTripId = e.target.value;
    setSelectedTripId(newTripId);
    
    // 查找選中的旅程
    const trip = trips.find(t => t.id === newTripId);
    setSelectedTrip(trip || null);
    
    // 更新表單數據中的 tripId
    setFormData({
      ...formData,
      dayNumber: 1,  // 重置天數
    });
  };
  
  // 處理多選變更 (交通、餐飲)
  const handleMultiSelectChange = (fieldName: 'transportationIds' | 'mealIds', id: string) => {
    const currentIds = formData[fieldName];
    let newIds: string[];
    
    if (currentIds.includes(id)) {
      // 移除 ID
      newIds = currentIds.filter(currentId => currentId !== id);
    } else {
      // 添加 ID
      newIds = [...currentIds, id];
    }
    
    setFormData({
      ...formData,
      [fieldName]: newIds
    });
  };
  
  // 初始化數據和檢查身份
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
      try {
        // 從 localStorage 加載旅程數據
        const tripsStr = localStorage.getItem('trips');
        if (tripsStr) {
          const loadedTrips = JSON.parse(tripsStr);
          setTrips(loadedTrips);
          
          // 如果 URL 帶有 tripId 參數，優先使用它
          const initialTripId = tripId || (loadedTrips.length > 0 ? loadedTrips[0].id : null);
          
          if (initialTripId) {
            setSelectedTripId(initialTripId);
            const selectedTrip = loadedTrips.find((t: Trip) => t.id === initialTripId);
            if (selectedTrip) {
              setSelectedTrip(selectedTrip);
              // 設置日期為旅程的開始日期（如果是新建模式）
              if (!isEditMode) {
                setFormData(prev => ({
                  ...prev,
                  date: selectedTrip.startDate
                }));
              }
            }
          }
        }
        
        // 加載住宿數據
        const accommodationsStr = localStorage.getItem('accommodations');
        if (accommodationsStr) {
          setAccommodations(JSON.parse(accommodationsStr));
        }
        
        // 加載交通數據
        const transportationsStr = localStorage.getItem('transportations');
        if (transportationsStr) {
          setTransportations(JSON.parse(transportationsStr));
        }
        
        // 加載餐飲數據
        const mealsStr = localStorage.getItem('meals');
        if (mealsStr) {
          setMeals(JSON.parse(mealsStr));
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('加載數據失敗:', err);
        setError('數據加載失敗');
        setIsLoading(false);
      }
    };
    
    // 如果是編輯模式，加載現有行程日數據
    const loadItineraryDay = () => {
      try {
        if (!id) return;
        
        const itineraryStr = localStorage.getItem('itinerary');
        if (!itineraryStr) {
          setError('找不到行程數據');
          return;
        }
        
        const itineraryDays: ItineraryDay[] = JSON.parse(itineraryStr);
        const day = itineraryDays.find(day => day.id === id);
        
        if (!day) {
          setError('找不到指定的行程日');
          return;
        }
        
        // 設置表單數據
        setFormData({
          title: day.title,
          date: day.date,
          dayNumber: day.dayNumber,
          description: day.description,
          accommodationId: day.accommodationId,
          transportationIds: day.transportationIds || [],
          mealIds: day.mealIds || []
        });
        
        // 設置活動
        setActivities(day.activities);
        
        // 設置選中的旅程
        setSelectedTripId(day.tripId);
      } catch (err) {
        console.error('加載行程日數據時出錯:', err);
        setError('行程日數據加載失敗');
      }
    };
    
    const isAuth = checkAuth();
    if (!isAuth) return;
    
    // 檢查是否為編輯模式
    if (id) {
      setIsEditMode(true);
    }
    
    loadTrips();
    
    if (isEditMode) {
      loadItineraryDay();
    }
  }, [id, isEditMode, navigate, tripId]);
  
  // 保存表單
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    if (!selectedTripId) {
      setError('請選擇旅程');
      return;
    }
    
    try {
      // 創建或更新行程日對象
      const itineraryDay: ItineraryDay = {
        id: isEditMode ? id! : uuidv4(),
        tripId: selectedTripId,
        title: formData.title,
        date: formData.date,
        dayNumber: formData.dayNumber,
        description: formData.description,
        activities: activities,
        accommodationId: formData.accommodationId,
        transportationIds: formData.transportationIds,
        mealIds: formData.mealIds,
        createdAt: isEditMode ? new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 從 localStorage 獲取現有行程日
      const itineraryStr = localStorage.getItem('itinerary');
      const itineraryDays: ItineraryDay[] = itineraryStr ? JSON.parse(itineraryStr) : [];
      
      let updatedItineraryDays: ItineraryDay[];
      
      if (isEditMode) {
        // 編輯模式：更新現有行程日
        updatedItineraryDays = itineraryDays.map(day => 
          day.id === id ? itineraryDay : day
        );
      } else {
        // 創建模式：添加新行程日
        updatedItineraryDays = [...itineraryDays, itineraryDay];
      }
      
      // 保存回 localStorage
      localStorage.setItem('itinerary', JSON.stringify(updatedItineraryDays));
      
      // 返回行程管理頁面
      navigate('/itinerary');
    } catch (err) {
      console.error('保存行程日時出錯:', err);
      setError('保存失敗，請重試');
    }
  };
  
  // 取消操作
  const handleCancel = () => {
    navigate('/itinerary');
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={id ? '編輯行程日' : '創建行程日'}
          isAdmin={isAdmin}
          onToggleAdmin={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-5xl mx-auto">
            {/* 頁面標題和操作按鈕 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <button
                  onClick={handleCancel}
                  className="mr-4 text-gray-600 hover:text-gray-800"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">
                  {isEditMode ? '編輯行程日' : '創建新行程日'}
                </h1>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* 旅程選擇區 */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">選擇旅程</h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">旅程</label>
                  <select
                    name="tripId"
                    value={selectedTripId || ''}
                    onChange={handleTripChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isEditMode} // 編輯模式不允許更改旅程
                  >
                    <option value="" disabled>-- 選擇旅程 --</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title} ({trip.destination}: {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {selectedTrip && (
                    <div className="mt-2 text-sm text-gray-600">
                      旅程日期範圍: {new Date(selectedTrip.startDate).toLocaleDateString()} 至 {new Date(selectedTrip.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 行程日基本信息 */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">行程日信息</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      行程日標題 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="例如：東京第一天 - 淺草寺和晴空塔"
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.date ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.date && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      天數 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="dayNumber"
                      value={formData.dayNumber}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full px-4 py-2 border ${formErrors.dayNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.dayNumber && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.dayNumber}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">描述</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="描述這一天的計劃和亮點..."
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* 住宿信息 */}
              {accommodations.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">住宿安排</h2>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">選擇住宿</label>
                    <select
                      name="accommodationId"
                      value={formData.accommodationId || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- 無住宿安排 --</option>
                      {accommodations.map(accommodation => (
                        <option key={accommodation.id} value={accommodation.id}>
                          {accommodation.name} ({accommodation.address})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {/* 活動清單 */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">行程活動</h2>
                  <button
                    type="button"
                    onClick={addNewActivity}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    添加活動
                  </button>
                </div>
                
                {activities.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <i className="fas fa-calendar-day text-gray-300 text-5xl mb-3"></i>
                    <p className="text-gray-500">尚未添加任何活動</p>
                    <button
                      type="button"
                      onClick={addNewActivity}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      添加第一個活動
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-medium text-lg">活動 #{index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeActivity(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">活動名稱</label>
                            <input
                              type="text"
                              value={activity.title}
                              onChange={(e) => updateActivity(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="例如：參觀淺草寺"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">活動類別</label>
                            <select
                              value={activity.category}
                              onChange={(e) => updateActivity(index, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="sightseeing">觀光景點</option>
                              <option value="activity">活動</option>
                              <option value="transportation">交通</option>
                              <option value="accommodation">住宿</option>
                              <option value="meal">餐飲</option>
                              <option value="other">其他</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">開始時間</label>
                            <input
                              type="time"
                              value={activity.startTime}
                              onChange={(e) => updateActivity(index, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">結束時間</label>
                            <input
                              type="time"
                              value={activity.endTime}
                              onChange={(e) => updateActivity(index, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">地點</label>
                            <input
                              type="text"
                              value={activity.location}
                              onChange={(e) => updateActivity(index, 'location', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="例如：淺草寺"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">地址</label>
                            <input
                              type="text"
                              value={activity.address || ''}
                              onChange={(e) => updateActivity(index, 'address', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="例如：東京都台東區淺草2-3-1"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">費用</label>
                            <input
                              type="number"
                              value={activity.cost || ''}
                              onChange={(e) => updateActivity(index, 'cost', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-gray-700 mb-1 text-sm">貨幣</label>
                            <input
                              type="text"
                              value={activity.currency || ''}
                              onChange={(e) => updateActivity(index, 'currency', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="TWD"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-gray-700 mb-1 text-sm">描述</label>
                            <textarea
                              value={activity.description}
                              onChange={(e) => updateActivity(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="活動的簡要描述..."
                            ></textarea>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-gray-700 mb-1 text-sm">備註</label>
                            <textarea
                              value={activity.notes || ''}
                              onChange={(e) => updateActivity(index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="其他需要註意的事項..."
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 表單操作按鈕 */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {isEditMode ? '更新行程日' : '創建行程日'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ItineraryDayForm; 