import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '../services/ActivityService';

interface Trip {
  id: string;
  title: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
  budget?: number;
  currency?: string;
  categories?: string[];
  participants?: { id: string; name: string; email?: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const TripForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 表單字段
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState(''); // 添加國家欄位
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<Trip['status']>('upcoming');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [currency, setCurrency] = useState('TWD');
  const [categories, setCategories] = useState<string[]>([]);
  const [participants, setParticipants] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [notes, setNotes] = useState('');
  
  // 新參與者輸入字段
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');

  // 當目的地變更時嘗試自動判斷國家
  useEffect(() => {
    if (destination && !country) {
      // 從目的地字串中嘗試提取國家信息
      const parts = destination.split(', ');
      if (parts.length >= 2) {
        // 假設最後一部分是國家
        setCountry(parts[parts.length - 1]);
      }
    }
  }, [destination, country]);

  // 常見城市與國家的映射，用於自動判斷功能
  const cityCountryMap: Record<string, string> = {
    '台北': '台灣',
    '高雄': '台灣',
    '台中': '台灣',
    '東京': '日本',
    '大阪': '日本',
    '京都': '日本',
    '首爾': '韓國',
    '香港': '香港',
    '曼谷': '泰國',
    '新加坡': '新加坡',
    '倫敦': '英國',
    '紐約': '美國',
    '洛杉磯': '美國',
    '巴黎': '法國',
    '悉尼': '澳洲',
    '上海': '中國',
    '北京': '中國'
  };

  // 檢查目的地並建議國家
  const suggestCountry = (city: string) => {
    // 檢查是否為已知城市
    for (const [knownCity, country] of Object.entries(cityCountryMap)) {
      if (city.includes(knownCity)) {
        return country;
      }
    }
    return '';
  };

  // 當目的地變更時嘗試建議國家
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDestination = e.target.value;
    setDestination(newDestination);
    
    // 如果國家欄位為空或用戶正在編輯目的地，嘗試自動判斷
    if (!country || country.trim() === '') {
      const suggestedCountry = suggestCountry(newDestination);
      if (suggestedCountry) {
        setCountry(suggestedCountry);
      }
    }
  };

  // 可用類別選項
  const categoryOptions = [
    { id: 'leisure', label: '休閒旅遊' },
    { id: 'business', label: '商務旅行' },
    { id: 'family', label: '家庭旅遊' },
    { id: 'adventure', label: '冒險旅行' },
    { id: 'cultural', label: '文化體驗' },
    { id: 'food', label: '美食之旅' },
    { id: 'shopping', label: '購物休閒' },
    { id: 'education', label: '教育旅行' }
  ];

  // 檢查用戶身份並加載旅程數據（如果是編輯）
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

    const loadTrip = () => {
      if (!id) return; // 如果沒有ID，則為新增模式

      try {
        const tripsStr = localStorage.getItem('trips');
        if (!tripsStr) {
          setError('找不到旅程數據');
          return;
        }

        const trips: Trip[] = JSON.parse(tripsStr);
        const trip = trips.find(t => t.id === id);

        if (!trip) {
          setError('找不到指定的旅程');
          return;
        }

        // 填充表單數據
        setTitle(trip.title);
        setDestination(trip.destination);
        setCountry(trip.country); // 添加國家欄位
        setStartDate(trip.startDate);
        setEndDate(trip.endDate);
        setStatus(trip.status);
        setDescription(trip.description || '');
        setBudget(trip.budget);
        setCurrency(trip.currency || 'TWD');
        setCategories(trip.categories || []);
        setParticipants(trip.participants || []);
        setNotes(trip.notes || '');
      } catch (err) {
        setError('加載旅程數據時出錯');
        console.error(err);
      }
    };

    const isAuth = checkAuth();
    if (isAuth) {
      loadTrip();
    }
    
    setIsLoading(false);
  }, [id, navigate]);

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tripsStr = localStorage.getItem('trips');
      const trips: Trip[] = tripsStr ? JSON.parse(tripsStr) : [];
      
      const now = new Date().toISOString();
      
      if (id) {
        // 編輯現有旅程
        const updatedTrips = trips.map(trip => {
          if (trip.id === id) {
            return {
              ...trip,
              title,
              destination,
              country, // 添加國家欄位
              startDate,
              endDate,
              status,
              description,
              budget: budget !== undefined ? budget : undefined,
              currency,
              categories,
              participants,
              notes,
              updatedAt: now
            };
          }
          return trip;
        });
        
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
        
        // 記錄更新旅程的活動
        logActivity(
          'trip_updated',
          '更新了行程計劃',
          {
            id,
            name: title,
            type: 'trip'
          }
        );
      } else {
        // 創建新旅程
        const newTrip: Trip = {
          id: uuidv4(),
          title,
          destination,
          country, // 添加國家欄位
          startDate,
          endDate,
          status,
          description,
          budget: budget !== undefined ? budget : undefined,
          currency,
          categories,
          participants,
          notes,
          createdAt: now,
          updatedAt: now
        };
        
        trips.push(newTrip);
        localStorage.setItem('trips', JSON.stringify(trips));
        
        // 記錄創建新旅程的活動
        logActivity(
          'trip_created',
          '創建了新的旅遊專案',
          {
            id: newTrip.id,
            name: title,
            type: 'trip'
          }
        );
      }
      
      // 重定向到旅程列表頁面
      navigate('/trips');
    } catch (err) {
      setError('保存旅程時出錯');
      console.error(err);
    }
  };

  // 處理類別選擇
  const handleCategoryToggle = (categoryId: string) => {
    if (categories.includes(categoryId)) {
      setCategories(categories.filter(id => id !== categoryId));
    } else {
      setCategories([...categories, categoryId]);
    }
  };

  // 添加參與者
  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) return;
    
    const newParticipant = {
      id: uuidv4(),
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim() || undefined
    };
    
    setParticipants([...participants, newParticipant]);
    setNewParticipantName('');
    setNewParticipantEmail('');
  };

  // 移除參與者
  const handleRemoveParticipant = (participantId: string) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  if (isLoading) {
    return <div>加載中...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 text-xl">{error}</div>
        <button 
          onClick={() => navigate('/trips')}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
        >
          返回旅程列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={id ? '編輯旅程' : '建立新旅程'} 
          isAdmin={isAdmin} 
          onToggleAdmin={() => {}} 
        />
        
        <main className="flex-1 overflow-auto p-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 標題 */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  旅程標題 *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：台北週末之旅"
                />
              </div>

              {/* 目的地 */}
              <div className="md:col-span-2">
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                  目的地 *
                </label>
                <input
                  type="text"
                  id="destination"
                  value={destination}
                  onChange={handleDestinationChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：台北市、日本東京"
                />
              </div>

              {/* 國家 */}
              <div className="md:col-span-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  國家 *
                </label>
                <input
                  type="text"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：台灣、日本"
                />
              </div>

              {/* 開始日期 */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  開始日期 *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 結束日期 */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  結束日期 *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 狀態 */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  狀態 *
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Trip['status'])}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="upcoming">即將到來</option>
                  <option value="ongoing">進行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>

              {/* 預算 */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                    預算
                  </label>
                  <input
                    type="number"
                    id="budget"
                    value={budget === undefined ? '' : budget}
                    onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：10000"
                  />
                </div>
                <div className="w-1/3">
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    貨幣
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TWD">台幣 (TWD)</option>
                    <option value="USD">美元 (USD)</option>
                    <option value="JPY">日元 (JPY)</option>
                    <option value="EUR">歐元 (EUR)</option>
                    <option value="CNY">人民幣 (CNY)</option>
                  </select>
                </div>
              </div>

              {/* 描述 */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  旅程描述
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="描述這次旅行的目的和計劃..."
                ></textarea>
              </div>

              {/* 類別 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  旅程類別
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map(category => (
                    <label 
                      key={category.id} 
                      className={`inline-flex items-center px-3 py-2 rounded-md cursor-pointer ${
                        categories.includes(category.id) 
                          ? 'bg-blue-100 text-blue-700 border-blue-300' 
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      } border hover:bg-blue-50`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                      <span>{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 參與者 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  參與者
                </label>
                
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      placeholder="參與者姓名"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newParticipantEmail}
                      onChange={(e) => setNewParticipantEmail(e.target.value)}
                      placeholder="電子郵件（選填）"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    添加
                  </button>
                </div>

                {participants.length > 0 ? (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {participants.map(participant => (
                        <li key={participant.id} className="py-2 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{participant.name}</span>
                            {participant.email && (
                              <span className="text-gray-500 text-sm ml-2">({participant.email})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(participant.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    尚未添加參與者
                  </p>
                )}
              </div>

              {/* 備註 */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="任何額外資訊或注意事項..."
                ></textarea>
              </div>
            </div>

            {/* 表單操作按鈕 */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={() => navigate('/trips')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {id ? '保存更改' : '建立旅程'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default TripForm; 