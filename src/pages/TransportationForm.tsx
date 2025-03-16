// src/pages/TransportationForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { Transportation, TransportationType, TransportationStatus } from './Transportation';

// 旅程接口 (簡化版本)
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

// 行程日接口 (簡化版本)
interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  title: string;
}

const TransportationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tripIdParam = searchParams.get('tripId');
  const itineraryDayIdParam = searchParams.get('itineraryDayId');
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filteredItineraryDays, setFilteredItineraryDays] = useState<ItineraryDay[]>([]);
  const [continueToAdd, setContinueToAdd] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 基本表單數據
  const [formData, setFormData] = useState<Partial<Transportation>>({
    tripId: tripIdParam || '',
    itineraryDayId: itineraryDayIdParam || '',
    type: 'flight',
    title: '',
    description: '',
    departureDateTime: '',
    arrivalDateTime: '',
    departureLocation: '',
    arrivalLocation: '',
    status: 'pending',
    price: 0,
    currency: 'TWD',
    bookingReference: '',
    notes: '',
  });
  
  // 表單驗證錯誤
  const [formErrors, setFormErrors] = useState<{
    [key: string]: string;
  }>({});
  
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
      
      setIsLoading(false);
    };
    
    // 如果是編輯模式，加載交通項目數據
    const loadTransportation = (transportationId: string) => {
      try {
        const transportationsStr = localStorage.getItem('transportations');
        if (!transportationsStr) {
          setError('找不到交通數據');
          return;
        }
        
        const transportations: Transportation[] = JSON.parse(transportationsStr);
        const transportation = transportations.find(item => item.id === transportationId);
        
        if (!transportation) {
          setError('找不到指定的交通項目');
          return;
        }
        
        // 設置表單數據
        setFormData(transportation);
        
        // 過濾行程日數據
        if (transportation.tripId) {
          filterItineraryDays(transportation.tripId);
        }
      } catch (err) {
        console.error('加載交通項目數據時出錯:', err);
        setError('交通項目數據加載失敗');
      }
    };
    
    const isAuth = checkAuth();
    if (!isAuth) return;
    
    // 檢查是否為編輯模式
    if (id) {
      setIsEditMode(true);
    }
    
    loadData();
    
    if (isEditMode && id) {
      loadTransportation(id);
    } else if (tripIdParam) {
      filterItineraryDays(tripIdParam);
    }
  }, [id, isEditMode, navigate, tripIdParam]);
  
  // 根據旅程ID過濾行程日
  const filterItineraryDays = (tripId: string) => {
    const filtered = itineraryDays.filter(day => day.tripId === tripId)
      .sort((a, b) => a.dayNumber - b.dayNumber); // 按天數排序
    setFilteredItineraryDays(filtered);
  };
  
  // 處理旅程選擇變更
  const handleTripChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTripId = e.target.value;
    setFormData(prev => ({ ...prev, tripId: newTripId, itineraryDayId: undefined }));
    filterItineraryDays(newTripId);
  };
  
  // 處理交通類型變更
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as TransportationType;
    setFormData(prev => ({ ...prev, type: newType }));
  };
  
  // 處理狀態變更
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TransportationStatus;
    setFormData(prev => ({ ...prev, status: newStatus }));
  };
  
  // 處理表單輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 對於數字類型字段，轉換為數字
    if (name === 'price' || name === 'passengerCapacity') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // 清除相關錯誤
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // 表單驗證
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    // 必填字段驗證
    if (!formData.tripId) errors.tripId = '請選擇旅程';
    if (!formData.type) errors.type = '請選擇交通類型';
    if (!formData.title || formData.title.trim() === '') errors.title = '請輸入標題';
    if (!formData.departureDateTime) errors.departureDateTime = '請選擇出發時間';
    if (!formData.arrivalDateTime) errors.arrivalDateTime = '請選擇到達時間';
    if (!formData.departureLocation || formData.departureLocation.trim() === '') errors.departureLocation = '請輸入出發地點';
    if (!formData.arrivalLocation || formData.arrivalLocation.trim() === '') errors.arrivalLocation = '請輸入到達地點';
    if (formData.price === undefined || formData.price < 0) errors.price = '請輸入有效的價格';
    if (!formData.currency || formData.currency.trim() === '') errors.currency = '請輸入貨幣代碼';
    
    // 時間驗證
    if (formData.departureDateTime && formData.arrivalDateTime) {
      const departureTime = new Date(formData.departureDateTime).getTime();
      const arrivalTime = new Date(formData.arrivalDateTime).getTime();
      
      if (arrivalTime < departureTime) {
        errors.arrivalDateTime = '到達時間不能早於出發時間';
      }
    }
    
    // 類型特定字段驗證
    if (formData.type === 'flight') {
      if (!formData.airline || formData.airline.trim() === '') errors.airline = '請輸入航空公司';
      if (!formData.flightNumber || formData.flightNumber.trim() === '') errors.flightNumber = '請輸入航班號';
    }
    
    if (formData.type === 'train') {
      if (!formData.trainNumber || formData.trainNumber.trim() === '') errors.trainNumber = '請輸入車次號';
    }
    
    if (formData.type === 'rental') {
      if (!formData.rentalCompany || formData.rentalCompany.trim() === '') errors.rentalCompany = '請輸入租車公司';
      if (!formData.pickupDateTime) errors.pickupDateTime = '請選擇取車時間';
      if (!formData.returnDateTime) errors.returnDateTime = '請選擇還車時間';
    }
    
    if (formData.type === 'charter') {
      if (!formData.driverName || formData.driverName.trim() === '') errors.driverName = '請輸入司機姓名';
      if (!formData.vehicleType || formData.vehicleType.trim() === '') errors.vehicleType = '請輸入車輛類型';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 提交表單
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // 從 localStorage 獲取現有交通數據
      const transportationsStr = localStorage.getItem('transportations');
      const transportations: Transportation[] = transportationsStr 
        ? JSON.parse(transportationsStr) 
        : [];
      
      // 創建或更新交通項目
      const now = new Date().toISOString();
      let transportationItem: Transportation = {
        ...formData as Transportation,
        createdAt: isEditMode ? (formData.createdAt || now) : now,
        updatedAt: now
      };
      
      // 設置ID
      if (isEditMode && id) {
        transportationItem.id = id;
      } else {
        transportationItem.id = uuidv4();
      }
      
      let updatedTransportations: Transportation[];
      
      if (isEditMode && id) {
        // 編輯模式：更新現有項目
        updatedTransportations = transportations.map(item => 
          item.id === id ? transportationItem : item
        );
      } else {
        // 創建模式：添加新項目
        updatedTransportations = [...transportations, transportationItem];
      }
      
      // 保存到 localStorage
      localStorage.setItem('transportations', JSON.stringify(updatedTransportations));
      
      // 返回交通管理頁面或繼續添加下一段交通
      if (continueToAdd) {
        // 清除部分表單數據，保留旅程和行程日等關聯信息
        const departureDateTime = new Date(formData.arrivalDateTime || '');
        // 增加10分鐘作為默認間隔
        departureDateTime.setMinutes(departureDateTime.getMinutes() + 10);
        
        setFormData({
          tripId: formData.tripId,
          itineraryDayId: formData.itineraryDayId,
          type: 'taxi', // 默認設置為計程車，因為多段交通常見的接駁方式
          title: '',
          description: '',
          departureDateTime: departureDateTime.toISOString().slice(0, 16),
          arrivalDateTime: '',
          departureLocation: formData.arrivalLocation, // 使用上一段的到達地點作為出發地點
          arrivalLocation: '',
          status: 'pending',
          price: 0,
          currency: formData.currency,
          bookingReference: '',
          notes: '',
        });
        
        // 顯示成功消息
        setSuccessMessage('已保存交通項目，現在可以添加下一段交通');
        
        // 滾動到頁面頂部
        window.scrollTo(0, 0);
        
        // 自動清除成功消息
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
        
        setContinueToAdd(false);
      } else {
        // 返回交通管理頁面
        navigate('/transportation');
      }
    } catch (err) {
      console.error('保存交通項目時出錯:', err);
      setError('保存失敗，請重試');
    }
  };
  
  // 添加下一段交通
  const handleAddNextSegment = () => {
    setContinueToAdd(true);
    // 直接調用 handleSubmit 並傳遞一個合適的模擬事件對象
    handleSubmit({
      preventDefault: () => {},
    } as React.FormEvent);
  };
  
  // 取消操作
  const handleCancel = () => {
    navigate('/transportation');
  };
  
  // 動態生成特定類型的表單字段
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'flight':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">機票詳情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">
                  航空公司 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="airline"
                  value={formData.airline || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.airline ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.airline && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.airline}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  航班號 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="flightNumber"
                  value={formData.flightNumber || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.flightNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.flightNumber && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.flightNumber}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">艙等</label>
                <select
                  name="cabinClass"
                  value={formData.cabinClass || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- 選擇艙等 --</option>
                  <option value="economy">經濟艙</option>
                  <option value="business">商務艙</option>
                  <option value="first">頭等艙</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">座位號</label>
                <input
                  type="text"
                  name="seatNumber"
                  value={formData.seatNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">訂票平台</label>
                <input
                  type="text"
                  name="bookingPlatform"
                  value={formData.bookingPlatform || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">行李額度</label>
                <input
                  type="text"
                  name="baggageAllowance"
                  value={formData.baggageAllowance || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 23kg x 2"
                />
              </div>
            </div>
          </div>
        );
        
      case 'train':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">高鐵詳情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">
                  車次號 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainNumber"
                  value={formData.trainNumber || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.trainNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.trainNumber && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.trainNumber}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">車廂號</label>
                <input
                  type="text"
                  name="carNumber"
                  value={formData.carNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">票種</label>
                <input
                  type="text"
                  name="ticketType"
                  value={formData.ticketType || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 一般票、優惠票"
                />
              </div>
            </div>
          </div>
        );
        
      case 'rental':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">租車詳情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">
                  租車公司 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="rentalCompany"
                  value={formData.rentalCompany || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.rentalCompany ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.rentalCompany && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.rentalCompany}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">車型</label>
                <input
                  type="text"
                  name="carModel"
                  value={formData.carModel || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  取車時間 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="pickupDateTime"
                  value={formData.pickupDateTime || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.pickupDateTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.pickupDateTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.pickupDateTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  還車時間 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="returnDateTime"
                  value={formData.returnDateTime || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.returnDateTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.returnDateTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.returnDateTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">取車地點</label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">還車地點</label>
                <input
                  type="text"
                  name="returnLocation"
                  value={formData.returnLocation || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">保險詳情</label>
                <textarea
                  name="insuranceDetails"
                  value={formData.insuranceDetails || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>
          </div>
        );
        
      case 'taxi':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">計程車詳情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">計程車公司</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">司機聯繫方式</label>
                <input
                  type="text"
                  name="driverContact"
                  value={formData.driverContact || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">預計行程時間</label>
                <input
                  type="text"
                  name="estimatedDuration"
                  value={formData.estimatedDuration || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 45分鐘"
                />
              </div>
            </div>
          </div>
        );
        
      case 'charter':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">包車詳情</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">
                  司機姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.driverName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.driverName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.driverName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  車輛類型 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vehicleType"
                  value={formData.vehicleType || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border ${formErrors.vehicleType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.vehicleType && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.vehicleType}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">司機聯繫方式</label>
                <input
                  type="text"
                  name="driverContact"
                  value={formData.driverContact || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">乘客容量</label>
                <input
                  type="number"
                  name="passengerCapacity"
                  value={formData.passengerCapacity || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">行程安排</label>
                <textarea
                  name="itinerary"
                  value={formData.itinerary || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="詳細的行程安排，包括停靠點等"
                ></textarea>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }
  
  // 獲取當前選中旅程的信息
  const selectedTrip = trips.find(trip => trip.id === formData.tripId);
  
  // 獲取當前選中行程日的信息
  const selectedItineraryDay = formData.itineraryDayId 
    ? itineraryDays.find(day => day.id === formData.itineraryDayId)
    : undefined;
  
  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={isEditMode ? '編輯交通項目' : '添加交通項目'}
          isAdmin={isAdmin}
          onToggleAdmin={() => {}}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-5xl mx-auto">
            {/* 頁面標題和導航 */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <button
                  onClick={handleCancel}
                  className="mr-4 text-gray-600 hover:text-gray-800"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">
                  {isEditMode ? '編輯交通項目' : '添加新交通項目'}
                </h1>
              </div>
            </div>
            
            {/* 成功信息 */}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <div className="flex">
                  <div className="py-1">
                    <i className="fas fa-check-circle mr-2"></i>
                  </div>
                  <div>
                    <p>{successMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 錯誤信息 */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            )}
            
            {/* 交通段提示 */}
            {!isEditMode && successMessage && (
              <div className="bg-yellow-50 p-4 rounded-md mb-6">
                <div className="flex items-center">
                  <i className="fas fa-info-circle text-yellow-500 mr-2"></i>
                  <h3 className="font-medium text-yellow-700">正在添加連續的交通項目</h3>
                </div>
                <p className="mt-2 text-yellow-600">
                  您可以繼續添加下一段交通，或點擊"完成"返回交通管理頁面。
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* 移除基本信息區塊，直接從時間和地點開始 */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">時間和地點</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 將旅程選擇移到這裡 */}
                  <div>
                    <label className="block text-gray-700 mb-2">
                      旅程 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tripId"
                      value={formData.tripId || ''}
                      onChange={handleTripChange}
                      className={`w-full px-4 py-2 border ${formErrors.tripId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled={isEditMode || !!itineraryDayIdParam} // 編輯模式或有預設行程日時禁用
                    >
                      <option value="" disabled>-- 選擇旅程 --</option>
                      {trips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title} ({trip.destination})
                        </option>
                      ))}
                    </select>
                    {formErrors.tripId && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.tripId}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      交通類型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type || ''}
                      onChange={handleTypeChange}
                      className={`w-full px-4 py-2 border ${formErrors.type ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="flight">機票</option>
                      <option value="train">高鐵</option>
                      <option value="rental">租車</option>
                      <option value="taxi">計程車</option>
                      <option value="charter">包車</option>
                    </select>
                    {formErrors.type && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      標題 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="例如: 台北到東京的機票"
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      狀態 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status || ''}
                      onChange={handleStatusChange}
                      className={`w-full px-4 py-2 border ${formErrors.status ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="pending">待確認</option>
                      <option value="confirmed">已確認</option>
                      <option value="cancelled">已取消</option>
                    </select>
                    {formErrors.status && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.status}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      出發時間 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="departureDateTime"
                      value={formData.departureDateTime || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.departureDateTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.departureDateTime && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.departureDateTime}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      到達時間 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="arrivalDateTime"
                      value={formData.arrivalDateTime || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.arrivalDateTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {formErrors.arrivalDateTime && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.arrivalDateTime}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      出發地點 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="departureLocation"
                      value={formData.departureLocation || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.departureLocation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="例如: 台北桃園機場"
                    />
                    {formErrors.departureLocation && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.departureLocation}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      到達地點 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="arrivalLocation"
                      value={formData.arrivalLocation || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.arrivalLocation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="例如: 東京成田機場"
                    />
                    {formErrors.arrivalLocation && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.arrivalLocation}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">行程日</label>
                    <select
                      name="itineraryDayId"
                      value={formData.itineraryDayId || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isEditMode || !!itineraryDayIdParam} // 編輯模式或有預設行程日時禁用
                    >
                      <option value="">-- 選擇行程日 --</option>
                      {filteredItineraryDays.map(day => (
                        <option key={day.id} value={day.id}>
                          第{day.dayNumber}天: {day.title} ({new Date(day.date).toLocaleDateString('zh-TW')})
                        </option>
                      ))}
                    </select>
                    <p className="text-gray-500 text-xs mt-1">
                      {isEditMode || !!itineraryDayIdParam ? '編輯模式下無法更改行程日關聯' : '選擇關聯的行程日，或留空'}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">描述</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="交通項目的詳細描述..."
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* 費用信息 */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">費用信息</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      價格 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      step="0.01"
                      min="0"
                    />
                    {formErrors.price && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">
                      貨幣 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="currency"
                      value={formData.currency || ''}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border ${formErrors.currency ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="TWD">新台幣 (TWD)</option>
                      <option value="USD">美元 (USD)</option>
                      <option value="EUR">歐元 (EUR)</option>
                      <option value="JPY">日元 (JPY)</option>
                      <option value="CNY">人民幣 (CNY)</option>
                      <option value="HKD">港幣 (HKD)</option>
                      <option value="GBP">英鎊 (GBP)</option>
                    </select>
                    {formErrors.currency && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.currency}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">預訂參考號</label>
                    <input
                      type="text"
                      name="bookingReference"
                      value={formData.bookingReference || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="預訂確認編號"
                    />
                  </div>
                </div>
              </div>
              
              {/* 特定類型的字段 */}
              {renderTypeSpecificFields()}
              
              {/* 附加信息 */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">附加信息</h2>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">備註</label>
                    <textarea
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="任何其他相關信息..."
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* 表單操作按鈕 */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  取消
                </button>
                
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={handleAddNextSegment}
                    className="px-6 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    保存並添加下一段交通
                  </button>
                )}
                
                <button
                  type="submit"
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isEditMode ? '更新交通項目' : (successMessage ? '完成' : '新增交通項目')}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransportationForm;