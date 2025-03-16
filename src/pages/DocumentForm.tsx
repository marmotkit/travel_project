import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { PersonalDocument, TravelVisa, Companion } from './Document';

// 照片加密函數（與 Document.tsx 中相同）
const encryptImage = (imageBase64: string): string => {
  try {
    // 簡單的加密方法：使用 btoa 進行 Base64 編碼，然後加上前綴表示這是加密的照片
    return `encrypted:${btoa(imageBase64)}`;
  } catch (error) {
    console.error('加密照片失敗:', error);
    return imageBase64;
  }
};

// 旅程介面
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

const DocumentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: string }>();
  const location = useLocation();
  const isEdit = Boolean(id);
  const isPersonal = type === 'personal';
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  
  // 個人證件表單狀態
  const [personalForm, setPersonalForm] = useState<{
    id: string;
    type: PersonalDocument['type'];
    number: string;
    name: string;
    issueDate: string;
    expiryDate: string;
    issuingCountry: string;
    notes: string;
    documentImage?: string;
    ownerType: 'primary' | 'companion';
    ownerId: string;
  }>({
    id: uuidv4(),
    type: 'passport',
    number: '',
    name: '',
    issueDate: '',
    expiryDate: '',
    issuingCountry: '',
    notes: '',
    documentImage: '',
    ownerType: 'primary',
    ownerId: ''
  });
  
  // 旅遊簽證表單狀態
  const [visaForm, setVisaForm] = useState<{
    id: string;
    tripId: string;
    country: string;
    visaType: TravelVisa['visaType'];
    number: string;
    issueDate: string;
    expiryDate: string;
    duration: number;
    entries: TravelVisa['entries'];
    status: TravelVisa['status'];
    applicationDate?: string;
    approvalDate?: string;
    documentImage?: string;
    notes: string;
  }>({
    id: uuidv4(),
    tripId: '',
    country: '',
    visaType: 'tourist',
    number: '',
    issueDate: '',
    expiryDate: '',
    duration: 30,
    entries: 'single',
    status: 'preparing',
    applicationDate: '',
    approvalDate: '',
    documentImage: '',
    notes: ''
  });
  
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
      
      // 從 localStorage 加載旅程
      const tripsStr = localStorage.getItem('trips');
      if (tripsStr) {
        try {
          const parsedTrips = JSON.parse(tripsStr);
          setTrips(parsedTrips);
          
          // 如果是新建旅遊簽證並且有旅程，默認選擇第一個旅程
          if (!isEdit && !isPersonal && parsedTrips.length > 0) {
            setVisaForm(prev => ({ ...prev, tripId: parsedTrips[0].id }));
          }
        } catch (error) {
          console.error('解析旅程數據出錯:', error);
          setTrips([]);
        }
      }
      
      // 從 localStorage 加載同行人員
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
      
      // 如果是編輯模式，加載對應的證件數據
      if (isEdit && id) {
        if (isPersonal) {
          // 加載個人證件
          const personalDocumentsStr = localStorage.getItem('personalDocuments');
          if (personalDocumentsStr) {
            try {
              const parsedDocuments = JSON.parse(personalDocumentsStr);
              const targetDocument = parsedDocuments.find((doc: PersonalDocument) => doc.id === id);
              
              if (targetDocument) {
                setPersonalForm({
                  id: targetDocument.id,
                  type: targetDocument.type,
                  number: targetDocument.number,
                  name: targetDocument.name,
                  issueDate: targetDocument.issueDate,
                  expiryDate: targetDocument.expiryDate,
                  issuingCountry: targetDocument.issuingCountry,
                  notes: targetDocument.notes,
                  documentImage: targetDocument.documentImage || '',
                  ownerType: targetDocument.ownerType || 'primary',
                  ownerId: targetDocument.ownerId || ''
                });
              } else {
                navigate('/documents');
              }
            } catch (error) {
              console.error('解析個人證件數據出錯:', error);
              navigate('/documents');
            }
          }
        } else {
          // 加載旅遊簽證
          const travelVisasStr = localStorage.getItem('travelVisas');
          if (travelVisasStr) {
            try {
              const parsedVisas = JSON.parse(travelVisasStr);
              const targetVisa = parsedVisas.find((visa: TravelVisa) => visa.id === id);
              
              if (targetVisa) {
                setVisaForm({
                  id: targetVisa.id,
                  tripId: targetVisa.tripId,
                  country: targetVisa.country,
                  visaType: targetVisa.visaType,
                  number: targetVisa.number,
                  issueDate: targetVisa.issueDate,
                  expiryDate: targetVisa.expiryDate,
                  duration: targetVisa.duration,
                  entries: targetVisa.entries,
                  status: targetVisa.status,
                  applicationDate: targetVisa.applicationDate || '',
                  approvalDate: targetVisa.approvalDate || '',
                  documentImage: targetVisa.documentImage || '',
                  notes: targetVisa.notes
                });
              } else {
                navigate('/documents');
              }
            } catch (error) {
              console.error('解析旅遊簽證數據出錯:', error);
              navigate('/documents');
            }
          }
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [id, isEdit, isPersonal, navigate]);
  
  // 處理個人證件表單變更
  const handlePersonalFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalForm(prev => ({ ...prev, [name]: value }));
  };
  
  // 處理旅遊簽證表單變更
  const handleVisaFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVisaForm(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) : value
    }));
  };
  
  // 處理圖片上傳
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isPersonalDoc: boolean) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // 加密照片數據
        const imageData = reader.result as string;
        const encryptedImage = encryptImage(imageData);
        
        if (isPersonalDoc) {
          setPersonalForm(prev => ({ ...prev, documentImage: encryptedImage }));
        } else {
          setVisaForm(prev => ({ ...prev, documentImage: encryptedImage }));
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // 提交個人證件表單
  const handlePersonalFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personalForm.number || !personalForm.name || !personalForm.issueDate || !personalForm.expiryDate || !personalForm.issuingCountry) {
      alert('請填寫所有必填欄位！');
      return;
    }
    
    // 如果是同行人員證件，確認已選擇同行人員
    if (personalForm.ownerType === 'companion' && !personalForm.ownerId) {
      alert('請選擇同行人員！');
      return;
    }
    
    const now = new Date().toISOString();
    const newDocument: PersonalDocument = {
      ...personalForm,
      createdAt: isEdit ? now : now,
      updatedAt: now
    };
    
    // 保存到 localStorage
    const personalDocumentsStr = localStorage.getItem('personalDocuments');
    const personalDocuments = personalDocumentsStr ? JSON.parse(personalDocumentsStr) : [];
    
    if (isEdit) {
      // 更新現有證件
      const updatedDocuments = personalDocuments.map((doc: PersonalDocument) =>
        doc.id === newDocument.id ? newDocument : doc
      );
      localStorage.setItem('personalDocuments', JSON.stringify(updatedDocuments));
    } else {
      // 添加新證件
      localStorage.setItem('personalDocuments', JSON.stringify([...personalDocuments, newDocument]));
    }
    
    navigate('/documents');
  };
  
  // 提交旅遊簽證表單
  const handleVisaFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visaForm.tripId || !visaForm.country || !visaForm.number || !visaForm.issueDate || !visaForm.expiryDate) {
      alert('請填寫所有必填欄位！');
      return;
    }
    
    const now = new Date().toISOString();
    const newVisa: TravelVisa = {
      ...visaForm,
      createdAt: isEdit ? now : now,
      updatedAt: now
    };
    
    // 保存到 localStorage
    const travelVisasStr = localStorage.getItem('travelVisas');
    const travelVisas = travelVisasStr ? JSON.parse(travelVisasStr) : [];
    
    if (isEdit) {
      // 更新現有簽證
      const updatedVisas = travelVisas.map((visa: TravelVisa) =>
        visa.id === newVisa.id ? newVisa : visa
      );
      localStorage.setItem('travelVisas', JSON.stringify(updatedVisas));
    } else {
      // 添加新簽證
      localStorage.setItem('travelVisas', JSON.stringify([...travelVisas, newVisa]));
    }
    
    navigate('/documents');
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1">
          <Header 
            title={isPersonal 
              ? isEdit ? '編輯個人證件' : '添加個人證件'
              : isEdit ? '編輯旅遊簽證' : '添加旅遊簽證'
            } 
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
          title={isPersonal 
            ? isEdit ? '編輯個人證件' : '添加個人證件'
            : isEdit ? '編輯旅遊簽證' : '添加旅遊簽證'
          } 
          isAdmin={isAdmin} 
          onToggleAdmin={() => setIsAdmin(!isAdmin)} 
        />
        <main className="p-6">
          <div className="mb-6">
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              返回證件管理
            </button>
          </div>
          
          {/* 個人證件表單 */}
          {isPersonal && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handlePersonalFormSubmit}>
                <div className="mb-6 border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">擁有者資訊</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 擁有者類型 */}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        證件擁有者 <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="ownerType"
                        value={personalForm.ownerType}
                        onChange={(e) => {
                          const value = e.target.value as 'primary' | 'companion';
                          setPersonalForm(prev => ({
                            ...prev,
                            ownerType: value,
                            // 如果切換到主用戶，清空 ownerId
                            ownerId: value === 'primary' ? '' : prev.ownerId
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="primary">我的證件</option>
                        <option value="companion">同行人員證件</option>
                      </select>
                    </div>

                    {/* 如果選擇同行人員，顯示同行人員選擇器 */}
                    {personalForm.ownerType === 'companion' && (
                      <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">
                          選擇同行人員 <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="ownerId"
                          value={personalForm.ownerId}
                          onChange={(e) => setPersonalForm(prev => ({ ...prev, ownerId: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">-- 選擇同行人員 --</option>
                          {companions.map(companion => (
                            <option key={companion.id} value={companion.id}>
                              {companion.name} ({companion.relationship === 'family' ? '家人' : 
                                            companion.relationship === 'friend' ? '朋友' : 
                                            companion.relationship === 'colleague' ? '同事' : '其他'})
                            </option>
                          ))}
                        </select>
                        {companions.length === 0 && (
                          <p className="text-sm text-orange-500 mt-1">
                            您還沒有添加任何同行人員。請先在證件管理頁面添加同行人員。
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 證件類型 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      證件類型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={personalForm.type}
                      onChange={handlePersonalFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="passport">護照</option>
                      <option value="id_card">身份證</option>
                      <option value="driver_license">駕照</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  
                  {/* 證件號碼 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      證件號碼 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={personalForm.number}
                      onChange={handlePersonalFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 姓名 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={personalForm.name}
                      onChange={handlePersonalFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 簽發國家 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      簽發國家 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="issuingCountry"
                      value={personalForm.issuingCountry}
                      onChange={handlePersonalFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 簽發日期 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      簽發日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      value={personalForm.issueDate}
                      onChange={handlePersonalFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 到期日期 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      到期日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={personalForm.expiryDate}
                      onChange={handlePersonalFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                {/* 上傳圖片 */}
                <div className="mb-6 mt-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    證件照片
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {personalForm.documentImage && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">
                        照片已加密並安全儲存。
                      </p>
                      <div className="bg-gray-100 p-2 rounded border border-gray-200 text-center">
                        <i className="fas fa-lock text-gray-500 text-4xl"></i>
                        <p className="text-sm text-gray-500 mt-1">加密照片</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 備註 */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    備註
                  </label>
                  <textarea
                    name="notes"
                    value={personalForm.notes}
                    onChange={handlePersonalFormChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                
                {/* 提交按鈕 */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/documents')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {isEdit ? '保存變更' : '創建證件'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* 旅遊簽證表單 */}
          {!isPersonal && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleVisaFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 關聯旅程 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      關聯旅程 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tripId"
                      value={visaForm.tripId}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- 選擇旅程 --</option>
                      {trips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title} ({trip.destination})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 簽證國家 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      簽證國家 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={visaForm.country}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 簽證類型 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      簽證類型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="visaType"
                      value={visaForm.visaType}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="tourist">旅遊簽證</option>
                      <option value="business">商務簽證</option>
                      <option value="student">學生簽證</option>
                      <option value="work">工作簽證</option>
                      <option value="transit">過境簽證</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  
                  {/* 簽證號碼 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      簽證號碼 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={visaForm.number}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 簽發日期 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      簽發日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      value={visaForm.issueDate}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 到期日期 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      到期日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={visaForm.expiryDate}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 停留天數 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      停留天數
                    </label>
                    <input
                      type="number"
                      name="duration"
                      min="1"
                      value={visaForm.duration}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* 入境次數 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      入境次數
                    </label>
                    <select
                      name="entries"
                      value={visaForm.entries}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="single">單次入境</option>
                      <option value="double">兩次入境</option>
                      <option value="multiple">多次入境</option>
                    </select>
                  </div>
                  
                  {/* 簽證狀態 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      簽證狀態
                    </label>
                    <select
                      name="status"
                      value={visaForm.status}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="preparing">準備中</option>
                      <option value="submitted">已提交</option>
                      <option value="approved">已批准</option>
                      <option value="denied">已拒絕</option>
                      <option value="expired">已過期</option>
                    </select>
                  </div>
                  
                  {/* 申請日期 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      申請日期
                    </label>
                    <input
                      type="date"
                      name="applicationDate"
                      value={visaForm.applicationDate}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* 批准日期 */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      批准日期
                    </label>
                    <input
                      type="date"
                      name="approvalDate"
                      value={visaForm.approvalDate}
                      onChange={handleVisaFormChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* 上傳圖片 */}
                <div className="mb-6 mt-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    簽證照片
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {visaForm.documentImage && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">
                        照片已加密並安全儲存。
                      </p>
                      <div className="bg-gray-100 p-2 rounded border border-gray-200 text-center">
                        <i className="fas fa-lock text-gray-500 text-4xl"></i>
                        <p className="text-sm text-gray-500 mt-1">加密照片</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 備註 */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    備註
                  </label>
                  <textarea
                    name="notes"
                    value={visaForm.notes}
                    onChange={handleVisaFormChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                
                {/* 提交按鈕 */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/documents')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {isEdit ? '保存變更' : '創建簽證'}
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

export default DocumentForm; 