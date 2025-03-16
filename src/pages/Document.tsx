import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';

// 照片加密解密工具函數
const encryptImage = (imageBase64: string): string => {
  try {
    // 簡單的加密方法：使用 btoa 進行 Base64 編碼，然後加上前綴表示這是加密的照片
    return `encrypted:${btoa(imageBase64)}`;
  } catch (error) {
    console.error('加密照片失敗:', error);
    return imageBase64;
  }
};

const decryptImage = (encryptedImage: string): string => {
  try {
    // 檢查是否為加密的照片
    if (encryptedImage.startsWith('encrypted:')) {
      // 去除前綴並使用 atob 進行解碼
      return atob(encryptedImage.substring(10));
    }
    return encryptedImage;
  } catch (error) {
    console.error('解密照片失敗:', error);
    return ''; // 解密失敗時返回空字符串
  }
};

// 個人證件類型
export interface PersonalDocument {
  id: string;
  type: 'passport' | 'id_card' | 'driver_license' | 'other';
  number: string;
  name: string;
  issueDate: string;
  expiryDate: string;
  issuingCountry: string;
  notes: string;
  documentImage?: string; // 證件照片 URL 或 base64 字串
  ownerId: string; // 證件擁有者ID，可以是主用戶或同行人員
  ownerType: 'primary' | 'companion'; // 擁有者類型：主用戶或同行人員
  createdAt: string;
  updatedAt: string;
}

// 同行人員介面
export interface Companion {
  id: string;
  name: string;
  relationship: string; // 關係，如家人、朋友、同事等
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 旅遊簽證類型
export interface TravelVisa {
  id: string;
  tripId: string;
  country: string;
  visaType: 'tourist' | 'business' | 'student' | 'work' | 'transit' | 'other';
  number: string;
  issueDate: string;
  expiryDate: string;
  duration: number; // 停留天數
  entries: 'single' | 'double' | 'multiple'; // 入境次數
  status: 'preparing' | 'submitted' | 'approved' | 'denied' | 'expired';
  applicationDate?: string;
  approvalDate?: string;
  documentImage?: string; // 簽證照片 URL 或 base64 字串
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// 旅程介面
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

const Document: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'visa'>('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [personalDocuments, setPersonalDocuments] = useState<PersonalDocument[]>([]);
  const [travelVisas, setTravelVisas] = useState<TravelVisa[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [selectedOwnerType, setSelectedOwnerType] = useState<'all' | 'primary' | 'companion'>('all');
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>('');
  const [newCompanion, setNewCompanion] = useState<{
    name: string;
    relationship: string;
    email: string;
    phone: string;
    notes: string;
  }>({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // 獲取證件類型中文名稱
  const getDocumentTypeName = (type: PersonalDocument['type']): string => {
    const typeNames: Record<PersonalDocument['type'], string> = {
      passport: '護照',
      id_card: '身份證',
      driver_license: '駕照',
      other: '其他'
    };
    
    return typeNames[type] || type;
  };
  
  // 獲取簽證類型中文名稱
  const getVisaTypeName = (type: TravelVisa['visaType']): string => {
    const typeNames: Record<TravelVisa['visaType'], string> = {
      tourist: '旅遊簽證',
      business: '商務簽證',
      student: '學生簽證',
      work: '工作簽證',
      transit: '過境簽證',
      other: '其他'
    };
    
    return typeNames[type] || type;
  };
  
  // 獲取簽證狀態中文名稱
  const getVisaStatusName = (status: TravelVisa['status']): string => {
    const statusNames: Record<TravelVisa['status'], string> = {
      preparing: '準備中',
      submitted: '已提交',
      approved: '已批准',
      denied: '已拒絕',
      expired: '已過期'
    };
    
    return statusNames[status] || status;
  };
  
  // 獲取簽證入境次數中文名稱
  const getVisaEntriesName = (entries: TravelVisa['entries']): string => {
    const entriesNames: Record<TravelVisa['entries'], string> = {
      single: '單次入境',
      double: '兩次入境',
      multiple: '多次入境'
    };
    
    return entriesNames[entries] || entries;
  };
  
  // 獲取簽證狀態顏色
  const getVisaStatusColor = (status: TravelVisa['status']): string => {
    const statusColors: Record<TravelVisa['status'], string> = {
      preparing: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // 檢查證件是否即將過期（90天內）
  const isExpiringBadge = (expiryDate: string): React.ReactNode | null => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return (
        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          已過期
        </span>
      );
    } else if (daysUntilExpiry <= 90) {
      return (
        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          即將過期（{daysUntilExpiry} 天）
        </span>
      );
    }
    
    return null;
  };
  
  // 根據選擇過濾個人證件
  const filteredPersonalDocuments = personalDocuments.filter(doc => {
    if (selectedOwnerType === 'all') return true;
    if (selectedOwnerType === 'primary') return doc.ownerType === 'primary';
    if (selectedOwnerType === 'companion') {
      if (selectedCompanionId) {
        return doc.ownerType === 'companion' && doc.ownerId === selectedCompanionId;
      }
      return doc.ownerType === 'companion';
    }
    return true;
  });
  
  // 處理添加新同行人員
  const handleAddCompanion = () => {
    if (!newCompanion.name || !newCompanion.relationship) {
      alert('請至少填寫姓名和關係！');
      return;
    }
    
    const now = new Date().toISOString();
    const companion: Companion = {
      id: Math.random().toString(36).substring(2, 15), // 生成臨時ID
      ...newCompanion,
      createdAt: now,
      updatedAt: now
    };
    
    const updatedCompanions = [...companions, companion];
    setCompanions(updatedCompanions);
    localStorage.setItem('companions', JSON.stringify(updatedCompanions));
    
    // 重置表單並關閉模態窗
    setNewCompanion({
      name: '',
      relationship: '',
      email: '',
      phone: '',
      notes: ''
    });
    setShowCompanionModal(false);
  };
  
  // 處理同行人員輸入變更
  const handleCompanionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCompanion(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 加載同行人員數據
  useEffect(() => {
    const loadCompanions = () => {
      const companionsStr = localStorage.getItem('companions');
      if (companionsStr) {
        try {
          const parsedCompanions = JSON.parse(companionsStr);
          setCompanions(parsedCompanions);
        } catch (error) {
          console.error('解析同行人員數據出錯:', error);
          setCompanions([]);
        }
      }
    };
    
    loadCompanions();
  }, []);
  
  // 檢查用戶身份並加載數據
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
      
      // 從 localStorage 加載個人證件
      const personalDocumentsStr = localStorage.getItem('personalDocuments');
      if (personalDocumentsStr) {
        try {
          const parsedDocuments = JSON.parse(personalDocumentsStr);
          setPersonalDocuments(parsedDocuments);
        } catch (error) {
          console.error('解析個人證件數據出錯:', error);
          setPersonalDocuments([]);
        }
      }
      
      // 從 localStorage 加載旅遊簽證
      const travelVisasStr = localStorage.getItem('travelVisas');
      if (travelVisasStr) {
        try {
          const parsedVisas = JSON.parse(travelVisasStr);
          setTravelVisas(parsedVisas);
        } catch (error) {
          console.error('解析旅遊簽證數據出錯:', error);
          setTravelVisas([]);
        }
      }
      
      // 從 localStorage 加載旅程
      const tripsStr = localStorage.getItem('trips');
      if (tripsStr) {
        try {
          const parsedTrips = JSON.parse(tripsStr);
          setTrips(parsedTrips);
        } catch (error) {
          console.error('解析旅程數據出錯:', error);
          setTrips([]);
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [navigate]);
  
  // 根據旅程ID獲取旅程標題
  const getTripTitle = (tripId: string): string => {
    const trip = trips.find(trip => trip.id === tripId);
    return trip ? trip.title : '未知旅程';
  };
  
  // 處理刪除個人證件
  const handleDeletePersonalDocument = (id: string) => {
    const updatedDocuments = personalDocuments.filter(doc => doc.id !== id);
    setPersonalDocuments(updatedDocuments);
    localStorage.setItem('personalDocuments', JSON.stringify(updatedDocuments));
  };
  
  // 處理刪除旅遊簽證
  const handleDeleteTravelVisa = (id: string) => {
    const updatedVisas = travelVisas.filter(visa => visa.id !== id);
    setTravelVisas(updatedVisas);
    localStorage.setItem('travelVisas', JSON.stringify(updatedVisas));
  };
  
  // 渲染同行人員添加模態窗
  const renderCompanionModal = () => {
    if (!showCompanionModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">添加同行人員</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={newCompanion.name}
              onChange={handleCompanionInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              關係 <span className="text-red-500">*</span>
            </label>
            <select
              name="relationship"
              value={newCompanion.relationship}
              onChange={handleCompanionInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- 選擇關係 --</option>
              <option value="family">家人</option>
              <option value="friend">朋友</option>
              <option value="colleague">同事</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              電子郵件
            </label>
            <input
              type="email"
              name="email"
              value={newCompanion.email}
              onChange={handleCompanionInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              電話
            </label>
            <input
              type="tel"
              name="phone"
              value={newCompanion.phone}
              onChange={handleCompanionInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              備註
            </label>
            <textarea
              name="notes"
              value={newCompanion.notes}
              onChange={handleCompanionInputChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCompanionModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddCompanion}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              添加
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
          <Header title="證件管理" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
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
        <Header title="證件管理" isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
        <main className="p-6">
          {/* 標籤切換 */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'personal'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              <i className="fas fa-id-card mr-2"></i>
              個人證件
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'visa'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('visa')}
            >
              <i className="fas fa-passport mr-2"></i>
              旅遊簽證
            </button>
          </div>
          
          {/* 個人證件頁面 */}
          {activeTab === 'personal' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">個人證件管理</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCompanionModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    添加同行人員
                  </button>
                  <Link
                    to="/documents/personal/new"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    添加個人證件
                  </Link>
                </div>
              </div>
              
              {/* 證件過濾選項 */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">證件擁有者</label>
                    <select
                      value={selectedOwnerType}
                      onChange={(e) => setSelectedOwnerType(e.target.value as 'all' | 'primary' | 'companion')}
                      className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">全部證件</option>
                      <option value="primary">我的證件</option>
                      <option value="companion">同行人員證件</option>
                    </select>
                  </div>
                  
                  {selectedOwnerType === 'companion' && companions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">選擇同行人員</label>
                      <select
                        value={selectedCompanionId}
                        onChange={(e) => setSelectedCompanionId(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">全部同行人員</option>
                        {companions.map(companion => (
                          <option key={companion.id} value={companion.id}>
                            {companion.name} ({companion.relationship === 'family' ? '家人' : 
                                           companion.relationship === 'friend' ? '朋友' : 
                                           companion.relationship === 'colleague' ? '同事' : '其他'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {filteredPersonalDocuments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <i className="fas fa-id-card text-4xl mb-4"></i>
                    <p>您還沒有添加任何{selectedOwnerType === 'primary' ? '個人' : selectedOwnerType === 'companion' ? '同行人員' : ''}證件</p>
                    <Link
                      to="/documents/personal/new"
                      className="mt-4 inline-block text-blue-500 hover:text-blue-600"
                    >
                      立即添加
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            擁有者
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            證件類型
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            證件號碼
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            姓名
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            簽發國家
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            簽發日期
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            到期日期
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPersonalDocuments.map((document) => {
                          // 找到對應的同行人員（如果是同行人員的證件）
                          const companion = document.ownerType === 'companion' ? 
                            companions.find(c => c.id === document.ownerId) : null;
                            
                          return (
                            <tr key={document.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    document.ownerType === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {document.ownerType === 'primary' ? '我的證件' : companion?.name || '同行人員'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">
                                    {getDocumentTypeName(document.type)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{document.number}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{document.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{document.issuingCountry}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(document.issueDate)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  {formatDate(document.expiryDate)}
                                  {isExpiringBadge(document.expiryDate)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  to={`/documents/personal/${document.id}`}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  查看
                                </Link>
                                <Link
                                  to={`/documents/personal/${document.id}/edit`}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  編輯
                                </Link>
                                <button
                                  onClick={() => handleDeletePersonalDocument(document.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  刪除
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 旅遊簽證頁面 */}
          {activeTab === 'visa' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">旅遊簽證管理</h2>
                <Link
                  to="/documents/visa/new"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <i className="fas fa-plus mr-2"></i>
                  添加旅遊簽證
                </Link>
              </div>
              
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {travelVisas.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <i className="fas fa-passport text-4xl mb-4"></i>
                    <p>您還沒有添加任何旅遊簽證</p>
                    <Link
                      to="/documents/visa/new"
                      className="mt-4 inline-block text-blue-500 hover:text-blue-600"
                    >
                      立即添加
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            旅程
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            簽證國家
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            簽證類型
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            簽證號碼
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            到期日期
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            狀態
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {travelVisas.map((visa) => (
                          <tr key={visa.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{getTripTitle(visa.tripId)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{visa.country}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{getVisaTypeName(visa.visaType)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{visa.number}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                {formatDate(visa.expiryDate)}
                                {isExpiringBadge(visa.expiryDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getVisaStatusColor(visa.status)}`}>
                                {getVisaStatusName(visa.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                to={`/documents/visa/${visa.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                查看
                              </Link>
                              <Link
                                to={`/documents/visa/${visa.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                編輯
                              </Link>
                              <button
                                onClick={() => handleDeleteTravelVisa(visa.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                刪除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 渲染同行人員添加模態窗 */}
          {renderCompanionModal()}
        </main>
      </div>
    </div>
  );
};

export default Document; 