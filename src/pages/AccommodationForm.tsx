import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { v4 as uuidv4 } from 'uuid';
import { AccommodationType, AccommodationStatus, Accommodation } from './Accommodation';

// 表單錯誤訊息介面
interface FormErrors {
  name?: string;
  address?: string;
  checkInDate?: string;
  checkOutDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  type?: string;
  status?: string;
  totalPrice?: string;
  currency?: string;
}

// 表單屬性介面
interface FormProps {
  isEdit: boolean;
}

// 幣別選項
const currencyOptions = [
  { value: 'TWD', label: '新台幣 (TWD)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '歐元 (EUR)' },
  { value: 'JPY', label: '日圓 (JPY)' },
  { value: 'CNY', label: '人民幣 (CNY)' },
  { value: 'KRW', label: '韓元 (KRW)' },
  { value: 'GBP', label: '英鎊 (GBP)' },
  { value: 'AUD', label: '澳元 (AUD)' },
  { value: 'CAD', label: '加拿大元 (CAD)' },
  { value: 'HKD', label: '港幣 (HKD)' },
  { value: 'SGD', label: '新加坡元 (SGD)' },
  { value: 'MYR', label: '馬來西亞令吉 (MYR)' },
  { value: 'THB', label: '泰銖 (THB)' },
  { value: 'VND', label: '越南盾 (VND)' },
  { value: 'IDR', label: '印尼盾 (IDR)' },
  { value: 'PHP', label: '菲律賓披索 (PHP)' }
];

// 設施選項
const amenityOptions = [
  { value: 'wifi', label: '免費Wi-Fi' },
  { value: 'parking', label: '停車場' },
  { value: 'pool', label: '游泳池' },
  { value: 'gym', label: '健身房' },
  { value: 'restaurant', label: '餐廳' },
  { value: 'spa', label: 'SPA服務' },
  { value: 'roomService', label: '客房服務' },
  { value: 'airConditioning', label: '空調' },
  { value: 'tv', label: '電視' },
  { value: 'hairDryer', label: '吹風機' },
  { value: 'minibar', label: '迷你吧' },
  { value: 'safetyBox', label: '保險箱' },
  { value: 'elevator', label: '電梯' },
  { value: 'laundry', label: '洗衣服務' },
  { value: 'babyFriendly', label: '嬰兒友善設施' },
  { value: 'petFriendly', label: '寵物友善' },
  { value: 'nonSmoking', label: '無菸房' },
  { value: 'freeBreakfast', label: '免費早餐' },
  { value: 'shuttleService', label: '接駁服務' },
  { value: 'businessCenter', label: '商務中心' }
];

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

const AccommodationForm: React.FC<FormProps> = ({ isEdit }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tripIdFromQuery = query.get('tripId');
  const itineraryDayIdFromQuery = query.get('itineraryDayId');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  
  // 住宿類型選項
  const accommodationTypes: { value: AccommodationType; label: string }[] = [
    { value: 'hotel', label: '飯店' },
    { value: 'hostel', label: '背包客棧' },
    { value: 'apartment', label: '公寓' },
    { value: 'resort', label: '度假村' },
    { value: 'guesthouse', label: '民宿' },
    { value: 'airbnb', label: 'Airbnb' }
  ];
  
  // 住宿狀態選項
  const accommodationStatuses: { value: AccommodationStatus; label: string }[] = [
    { value: 'confirmed', label: '已確認' },
    { value: 'pending', label: '待確認' },
    { value: 'cancelled', label: '已取消' }
  ];
  
  // 初始化表單數據
  const [formData, setFormData] = useState<Omit<Accommodation, 'id' | 'createdAt' | 'updatedAt'>>({
    tripId: tripIdFromQuery || '',
    itineraryDayId: itineraryDayIdFromQuery || '',
    type: 'hotel',
    name: '',
    address: '',
    description: '',
    checkInDate: '',
    checkOutDate: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    status: 'pending',
    pricePerNight: 0,
    totalPrice: 0,
    currency: 'TWD',
    bookingReference: '',
    bookingPlatform: '',
    roomType: '',
    numberOfRooms: 1,
    numberOfGuests: 2,
    includesBreakfast: false,
    breakfastDetails: '',
    amenities: [],
    googleMapsUrl: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    imageUrls: []
  });
  
  // 處理表單輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'pricePerNight' || name === 'totalPrice' || name === 'numberOfRooms' || name === 'numberOfGuests') {
      // 對於數字類型的欄位，將字符串轉換為數字
      const numValue = parseFloat(value) || 0;
      
      if (name === 'pricePerNight') {
        const nights = calculateNights(formData.checkInDate, formData.checkOutDate);
        
        if (nights > 0) {
          setFormData({
            ...formData,
            pricePerNight: numValue,
            totalPrice: numValue * nights
          });
        } else {
          setFormData({
            ...formData,
            [name]: numValue
          });
        }
      } else {
        setFormData({
          ...formData,
          [name]: numValue
        });
      }
    } else {
      // 對於其他類型的欄位，直接使用字符串值
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // 清除相關錯誤
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };
  
  // 處理複選框輸入變更
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  // 處理設施複選框變更
  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentAmenities = formData.amenities || [];
    
    if (checked) {
      setFormData({
        ...formData,
        amenities: [...currentAmenities, value]
      });
    } else {
      setFormData({
        ...formData,
        amenities: currentAmenities.filter(amenity => amenity !== value)
      });
    }
  };
  
  // 計算住宿天數
  const calculateNights = (checkInDate: string, checkOutDate: string): number => {
    if (!checkInDate || !checkOutDate) return 0;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // 計算毫秒差，然後轉換為天數
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // 當入住/退房日期改變時，更新總金額
  useEffect(() => {
    const nights = calculateNights(formData.checkInDate, formData.checkOutDate);
    if (nights > 0 && formData.pricePerNight) {
      setFormData(prev => ({
        ...prev,
        totalPrice: prev.pricePerNight * nights
      }));
    }
  }, [formData.checkInDate, formData.checkOutDate, formData.pricePerNight]);
  
  // 處理行程選擇變更，更新行程日選項
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTripId = e.target.value;
    
    setFormData({
      ...formData,
      tripId: selectedTripId,
      itineraryDayId: '' // 重置行程日選擇
    });
  };
  
  // 獲取行程日選項
  const getItineraryDaysForTrip = () => {
    if (!formData.tripId) return [];
    
    return itineraryDays
      .filter(day => day.tripId === formData.tripId)
      .sort((a, b) => a.dayNumber - b.dayNumber);
  };
  
  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '請輸入住宿名稱';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = '請輸入住宿地址';
    }
    
    if (!formData.checkInDate) {
      newErrors.checkInDate = '請選擇入住日期';
    }
    
    if (!formData.checkOutDate) {
      newErrors.checkOutDate = '請選擇退房日期';
    } else if (formData.checkInDate && new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      newErrors.checkOutDate = '退房日期必須晚於入住日期';
    }
    
    if (!formData.tripId) {
      newErrors.status = '請選擇關聯的旅行項目';
    }
    
    if (formData.totalPrice < 0) {
      newErrors.totalPrice = '總價不能為負數';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // 滾動到第一個錯誤
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // 從 localStorage 獲取現有住宿數據
    const existingAccommodationsStr = localStorage.getItem('accommodations');
    let existingAccommodations: Accommodation[] = [];
    
    if (existingAccommodationsStr) {
      try {
        existingAccommodations = JSON.parse(existingAccommodationsStr);
      } catch (error) {
        console.error('解析住宿數據時出錯:', error);
      }
    }
    
    const now = new Date().toISOString();
    
    if (isEdit && id) {
      // 更新現有住宿
      const updatedAccommodations = existingAccommodations.map(accommodation => {
        if (accommodation.id === id) {
          return {
            ...accommodation,
            ...formData,
            updatedAt: now
          };
        }
        return accommodation;
      });
      
      localStorage.setItem('accommodations', JSON.stringify(updatedAccommodations));
    } else {
      // 創建新住宿
      const newAccommodation: Accommodation = {
        id: uuidv4(),
        ...formData,
        createdAt: now,
        updatedAt: now
      };
      
      localStorage.setItem('accommodations', JSON.stringify([...existingAccommodations, newAccommodation]));
    }
    
    // 重定向到住宿列表頁面
    navigate('/accommodation');
  };
  
  // 取消表單
  const handleCancel = () => {
    setShowCancelModal(true);
  };
  
  // 確認取消
  const confirmCancel = () => {
    navigate('/accommodation');
  };
  
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
      
      // 加載旅程數據
      const tripsStr = localStorage.getItem('trips');
      if (tripsStr) {
        try {
          const parsedTrips = JSON.parse(tripsStr);
          setTrips(parsedTrips);
        } catch (error) {
          console.error('解析旅程數據時出錯:', error);
        }
      }
      
      // 加載行程日數據
      const itineraryStr = localStorage.getItem('itinerary');
      if (itineraryStr) {
        try {
          const parsedItinerary = JSON.parse(itineraryStr);
          setItineraryDays(parsedItinerary);
        } catch (error) {
          console.error('解析行程日數據時出錯:', error);
        }
      }
      
      // 如果是編輯模式，加載現有住宿數據
      if (isEdit && id) {
        const accommodationsStr = localStorage.getItem('accommodations');
        if (accommodationsStr) {
          try {
            const parsedAccommodations = JSON.parse(accommodationsStr);
            setAccommodations(parsedAccommodations);
            const targetAccommodation = parsedAccommodations.find((item: Accommodation) => item.id === id);
            
            if (targetAccommodation) {
              setFormData({
                tripId: targetAccommodation.tripId,
                itineraryDayId: targetAccommodation.itineraryDayId || '',
                type: targetAccommodation.type,
                name: targetAccommodation.name,
                address: targetAccommodation.address,
                description: targetAccommodation.description || '',
                checkInDate: targetAccommodation.checkInDate,
                checkOutDate: targetAccommodation.checkOutDate,
                checkInTime: targetAccommodation.checkInTime,
                checkOutTime: targetAccommodation.checkOutTime,
                status: targetAccommodation.status,
                pricePerNight: targetAccommodation.pricePerNight,
                totalPrice: targetAccommodation.totalPrice,
                currency: targetAccommodation.currency,
                bookingReference: targetAccommodation.bookingReference || '',
                bookingPlatform: targetAccommodation.bookingPlatform || '',
                roomType: targetAccommodation.roomType || '',
                numberOfRooms: targetAccommodation.numberOfRooms || 1,
                numberOfGuests: targetAccommodation.numberOfGuests || 1,
                includesBreakfast: targetAccommodation.includesBreakfast || false,
                breakfastDetails: targetAccommodation.breakfastDetails || '',
                amenities: targetAccommodation.amenities || [],
                googleMapsUrl: targetAccommodation.googleMapsUrl || '',
                contactPhone: targetAccommodation.contactPhone || '',
                contactEmail: targetAccommodation.contactEmail || '',
                notes: targetAccommodation.notes || '',
                imageUrls: targetAccommodation.imageUrls || []
              });
            } else {
              // 如果找不到住宿，返回列表頁面
              navigate('/accommodation');
            }
          } catch (error) {
            console.error('解析住宿數據時出錯:', error);
          }
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [id, isEdit, navigate]);
  
  // 渲染取消確認模態框
  const renderCancelModal = () => {
    if (!showCancelModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900">確認取消</h3>
          <p className="mt-4 text-gray-600">
            您確定要取消嗎？所有未保存的更改將會丟失。
          </p>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              繼續編輯
            </button>
            <button
              onClick={confirmCancel}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              確認取消
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
          <Header 
            title={isEdit ? "編輯住宿" : "新增住宿"} 
            isAdmin={isAdmin} 
            onToggleAdmin={() => setIsAdmin(!isAdmin)} 
          />
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
        <Header 
          title={isEdit ? "編輯住宿" : "新增住宿"} 
          isAdmin={isAdmin} 
          onToggleAdmin={() => setIsAdmin(!isAdmin)} 
        />
        <main className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => navigate('/accommodation')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              返回住宿管理
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
              {isEdit ? "編輯住宿詳情" : "添加新住宿"}
            </h2>
            
            {/* 基本信息區塊 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">基本信息</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 旅程 */}
                <div>
                  <label htmlFor="tripId" className="block text-sm font-medium text-gray-700 mb-1 required">
                    選擇旅程
                  </label>
                  <select
                    id="tripId"
                    name="tripId"
                    value={formData.tripId}
                    onChange={handleTripChange}
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isEdit} // 編輯模式下不允許變更旅程
                  >
                    <option value="">-- 請選擇旅程 --</option>
                    {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title} ({trip.destination}: {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {errors.status && <p className="mt-1 text-red-500 text-sm error-message">{errors.status}</p>}
                </div>
                
                {/* 行程日 */}
                <div>
                  <label htmlFor="itineraryDayId" className="block text-sm font-medium text-gray-700 mb-1">
                    關聯行程日 <span className="text-gray-500">(可選)</span>
                  </label>
                  <select
                    id="itineraryDayId"
                    name="itineraryDayId"
                    value={formData.itineraryDayId}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.tripId}
                  >
                    <option value="">-- 不關聯特定行程日 --</option>
                    {getItineraryDaysForTrip().map(day => (
                      <option key={day.id} value={day.id}>
                        第 {day.dayNumber} 天: {day.title} ({new Date(day.date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 住宿名稱 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 required">
                    住宿名稱
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="請輸入住宿名稱"
                  />
                  {errors.name && <p className="mt-1 text-red-500 text-sm error-message">{errors.name}</p>}
                </div>
                
                {/* 住宿類型 */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1 required">
                    住宿類型
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accommodationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 住宿地址 */}
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 required">
                  住宿地址
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="請輸入詳細地址"
                />
                {errors.address && <p className="mt-1 text-red-500 text-sm error-message">{errors.address}</p>}
              </div>
              
              {/* Google Maps網址 */}
              <div className="mb-4">
                <label htmlFor="googleMapsUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Maps網址 <span className="text-gray-500">(可選)</span>
                </label>
                <input
                  type="url"
                  id="googleMapsUrl"
                  name="googleMapsUrl"
                  value={formData.googleMapsUrl}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: https://goo.gl/maps/example"
                />
              </div>
              
              {/* 描述 */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  描述 <span className="text-gray-500">(可選)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="請輸入住宿的詳細描述"
                ></textarea>
              </div>
            </div>
            
            {/* 入住與退房區塊 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">入住與退房</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 入住日期 */}
                <div>
                  <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700 mb-1 required">
                    入住日期
                  </label>
                  <input
                    type="date"
                    id="checkInDate"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.checkInDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.checkInDate && <p className="mt-1 text-red-500 text-sm error-message">{errors.checkInDate}</p>}
                </div>
                
                {/* 退房日期 */}
                <div>
                  <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700 mb-1 required">
                    退房日期
                  </label>
                  <input
                    type="date"
                    id="checkOutDate"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.checkOutDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.checkOutDate && <p className="mt-1 text-red-500 text-sm error-message">{errors.checkOutDate}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 入住時間 */}
                <div>
                  <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700 mb-1 required">
                    入住時間
                  </label>
                  <input
                    type="time"
                    id="checkInTime"
                    name="checkInTime"
                    value={formData.checkInTime}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.checkInTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.checkInTime && <p className="mt-1 text-red-500 text-sm error-message">{errors.checkInTime}</p>}
                </div>
                
                {/* 退房時間 */}
                <div>
                  <label htmlFor="checkOutTime" className="block text-sm font-medium text-gray-700 mb-1 required">
                    退房時間
                  </label>
                  <input
                    type="time"
                    id="checkOutTime"
                    name="checkOutTime"
                    value={formData.checkOutTime}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.checkOutTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.checkOutTime && <p className="mt-1 text-red-500 text-sm error-message">{errors.checkOutTime}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 住宿狀態 */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1 required">
                    住宿狀態
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accommodationStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 訂房平台 */}
                <div>
                  <label htmlFor="bookingPlatform" className="block text-sm font-medium text-gray-700 mb-1">
                    訂房平台 <span className="text-gray-500">(可選)</span>
                  </label>
                  <input
                    type="text"
                    id="bookingPlatform"
                    name="bookingPlatform"
                    value={formData.bookingPlatform}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: Booking.com, Agoda, 官網"
                  />
                </div>
                
                {/* 訂房編號 */}
                <div>
                  <label htmlFor="bookingReference" className="block text-sm font-medium text-gray-700 mb-1">
                    訂房編號 <span className="text-gray-500">(可選)</span>
                  </label>
                  <input
                    type="text"
                    id="bookingReference"
                    name="bookingReference"
                    value={formData.bookingReference}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入訂房確認編號"
                  />
                </div>
              </div>
            </div>
            
            {/* 房間詳情區塊 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">房間詳情</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 房型 */}
                <div>
                  <label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1">
                    房型 <span className="text-gray-500">(可選)</span>
                  </label>
                  <input
                    type="text"
                    id="roomType"
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: 雙人房, 家庭套房"
                  />
                </div>
                
                {/* 房間數量 */}
                <div>
                  <label htmlFor="numberOfRooms" className="block text-sm font-medium text-gray-700 mb-1">
                    房間數量
                  </label>
                  <input
                    type="number"
                    id="numberOfRooms"
                    name="numberOfRooms"
                    value={formData.numberOfRooms}
                    min="1"
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* 入住人數 */}
              <div>
                <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700 mb-1">
                  入住人數
                </label>
                <input
                  type="number"
                  id="numberOfGuests"
                  name="numberOfGuests"
                  value={formData.numberOfGuests}
                  min="1"
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* 包含早餐 */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includesBreakfast"
                  name="includesBreakfast"
                  checked={formData.includesBreakfast}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includesBreakfast" className="ml-2 block text-sm text-gray-700">
                  含早餐
                </label>
              </div>
            </div>
            
            {/* 早餐詳情 */}
            {formData.includesBreakfast && (
              <div className="mb-4 ml-6">
                <label htmlFor="breakfastDetails" className="block text-sm font-medium text-gray-700 mb-1">
                  早餐詳情 <span className="text-gray-500">(可選)</span>
                </label>
                <textarea
                  id="breakfastDetails"
                  name="breakfastDetails"
                  value={formData.breakfastDetails}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="請輸入早餐的詳細信息，例如：供應時間、地點等"
                ></textarea>
              </div>
            )}
            
            {/* 設施 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住宿設施 <span className="text-gray-500">(可選)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {amenityOptions.map(option => (
                  <div key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`amenity-${option.value}`}
                      name="amenities"
                      value={option.value}
                      checked={formData.amenities?.includes(option.value)}
                      onChange={handleAmenityChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`amenity-${option.value}`} className="ml-2 block text-sm text-gray-700">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 價格和付款區塊 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">價格和付款</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 每晚價格 */}
                <div>
                  <label htmlFor="pricePerNight" className="block text-sm font-medium text-gray-700 mb-1 required">
                    每晚價格
                  </label>
                  <input
                    type="number"
                    id="pricePerNight"
                    name="pricePerNight"
                    value={formData.pricePerNight}
                    min="0"
                    step="0.01"
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* 總價 */}
                <div>
                  <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700 mb-1 required">
                    總價
                  </label>
                  <input
                    type="number"
                    id="totalPrice"
                    name="totalPrice"
                    value={formData.totalPrice}
                    min="0"
                    step="0.01"
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.totalPrice ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.totalPrice && <p className="mt-1 text-red-500 text-sm error-message">{errors.totalPrice}</p>}
                </div>
                
                {/* 幣別 */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1 required">
                    幣別
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 住宿天數計算（僅顯示） */}
              {formData.checkInDate && formData.checkOutDate && (
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <p className="text-blue-800">
                    預訂 <strong>{calculateNights(formData.checkInDate, formData.checkOutDate)}</strong> 晚，
                    每晚 <strong>{formData.pricePerNight} {formData.currency}</strong>
                  </p>
                </div>
              )}
            </div>
            
            {/* 聯絡資訊區塊 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">聯絡資訊</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 聯絡電話 */}
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    聯絡電話 <span className="text-gray-500">(可選)</span>
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入住宿聯絡電話"
                  />
                </div>
                
                {/* 聯絡電子郵件 */}
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    聯絡電子郵件 <span className="text-gray-500">(可選)</span>
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入聯絡電子郵件"
                  />
                </div>
              </div>
            </div>
            
            {/* 備註區塊 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">備註</h3>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  備註 <span className="text-gray-500">(可選)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="請輸入任何關於該住宿的附加信息或特別要求"
                ></textarea>
              </div>
            </div>
            
            {/* 表單按鈕 */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {isEdit ? "更新住宿" : "新增住宿"}
              </button>
            </div>
          </form>
          
          {renderCancelModal()}
        </main>
      </div>
    </div>
  );
};

const AccommodationFormWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return <AccommodationForm isEdit={!!id} />;
};

export default AccommodationFormWrapper;