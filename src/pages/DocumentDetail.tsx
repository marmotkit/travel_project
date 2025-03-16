import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { PersonalDocument, TravelVisa, Companion } from './Document';

// 照片解密函數
const decryptImage = (encryptedImage: string): string => {
  try {
    // 檢查是否為加密的照片
    if (encryptedImage && encryptedImage.startsWith('encrypted:')) {
      // 去除前綴並使用 atob 進行解碼
      return atob(encryptedImage.substring(10));
    }
    return encryptedImage;
  } catch (error) {
    console.error('解密照片失敗:', error);
    return ''; // 解密失敗時返回空字符串
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

const DocumentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: string }>();
  const isPersonal = type === 'personal';
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [personalDocument, setPersonalDocument] = useState<PersonalDocument | null>(null);
  const [travelVisa, setTravelVisa] = useState<TravelVisa | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
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
  
  // 獲取簽證入境次數中文名稱
  const getVisaEntriesName = (entries: TravelVisa['entries']): string => {
    const entriesNames: Record<TravelVisa['entries'], string> = {
      single: '單次入境',
      double: '兩次入境',
      multiple: '多次入境'
    };
    
    return entriesNames[entries] || entries;
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
    if (!expiryDate) return null;
    
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
      
      // 加載同行人員數據
      const companionsStr = localStorage.getItem('companions');
      if (companionsStr) {
        try {
          const parsedCompanions = JSON.parse(companionsStr);
          setCompanions(parsedCompanions);
        } catch (error) {
          console.error('解析同行人員數據出錯:', error);
        }
      }
      
      if (id) {
        if (isPersonal) {
          // 加載個人證件
          const personalDocumentsStr = localStorage.getItem('personalDocuments');
          if (personalDocumentsStr) {
            try {
              const parsedDocuments = JSON.parse(personalDocumentsStr);
              const targetDocument = parsedDocuments.find((doc: PersonalDocument) => doc.id === id);
              
              if (targetDocument) {
                setPersonalDocument(targetDocument);
                
                // 如果是同行人員的證件，找到對應的同行人員
                if (targetDocument.ownerType === 'companion' && targetDocument.ownerId) {
                  const companionsStr = localStorage.getItem('companions');
                  if (companionsStr) {
                    const parsedCompanions = JSON.parse(companionsStr);
                    const relatedCompanion = parsedCompanions.find(
                      (c: Companion) => c.id === targetDocument.ownerId
                    );
                    if (relatedCompanion) {
                      setCompanion(relatedCompanion);
                    }
                  }
                }
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
                setTravelVisa(targetVisa);
                
                // 加載關聯的旅程
                const tripsStr = localStorage.getItem('trips');
                if (tripsStr) {
                  const parsedTrips = JSON.parse(tripsStr);
                  const relatedTrip = parsedTrips.find((item: Trip) => item.id === targetVisa.tripId);
                  if (relatedTrip) {
                    setTrip(relatedTrip);
                  }
                }
              } else {
                navigate('/documents');
              }
            } catch (error) {
              console.error('解析旅遊簽證數據出錯:', error);
              navigate('/documents');
            }
          }
        }
      } else {
        navigate('/documents');
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [id, isPersonal, navigate]);
  
  // 處理刪除個人證件
  const handleDeletePersonalDocument = () => {
    if (!id || !personalDocument) return;
    
    const personalDocumentsStr = localStorage.getItem('personalDocuments');
    if (personalDocumentsStr) {
      try {
        const parsedDocuments = JSON.parse(personalDocumentsStr);
        const updatedDocuments = parsedDocuments.filter(
          (doc: PersonalDocument) => doc.id !== id
        );
        
        localStorage.setItem('personalDocuments', JSON.stringify(updatedDocuments));
        setShowDeleteModal(false);
        navigate('/documents');
      } catch (error) {
        console.error('處理個人證件數據時出錯:', error);
      }
    }
  };
  
  // 處理刪除旅遊簽證
  const handleDeleteTravelVisa = () => {
    if (!id || !travelVisa) return;
    
    const travelVisasStr = localStorage.getItem('travelVisas');
    if (travelVisasStr) {
      try {
        const parsedVisas = JSON.parse(travelVisasStr);
        const updatedVisas = parsedVisas.filter(
          (visa: TravelVisa) => visa.id !== id
        );
        
        localStorage.setItem('travelVisas', JSON.stringify(updatedVisas));
        setShowDeleteModal(false);
        navigate('/documents');
      } catch (error) {
        console.error('處理旅遊簽證數據時出錯:', error);
      }
    }
  };
  
  // 處理確認刪除
  const handleConfirmDelete = () => {
    setShowDeleteModal(true);
  };
  
  // 處理取消刪除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };
  
  // 渲染確認刪除模態框
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900">確認刪除</h3>
          <p className="mt-4 text-gray-600">
            您確定要刪除{isPersonal ? '個人證件' : '旅遊簽證'}嗎？此操作無法撤銷。
          </p>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={isPersonal ? handleDeletePersonalDocument : handleDeleteTravelVisa}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染照片模態窗
  const renderImageModal = () => {
    if (!showImageModal) return null;
    
    let imageUrl = '';
    
    if (isPersonal && personalDocument && personalDocument.documentImage) {
      imageUrl = decryptImage(personalDocument.documentImage);
    } else if (!isPersonal && travelVisa && travelVisa.documentImage) {
      imageUrl = decryptImage(travelVisa.documentImage);
    }
    
    if (!imageUrl) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="relative bg-white p-2 rounded-lg max-w-3xl max-h-3xl w-full h-full flex flex-col">
          <div className="flex justify-between items-center p-2">
            <h3 className="text-lg font-semibold text-gray-900">安全解密查看照片</h3>
            <button 
              onClick={() => setShowImageModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={isPersonal ? "證件照片" : "簽證照片"}
              className="max-w-full max-h-full object-contain"
            />
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
            title={isPersonal ? '個人證件詳情' : '旅遊簽證詳情'} 
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
          title={isPersonal ? '個人證件詳情' : '旅遊簽證詳情'} 
          isAdmin={isAdmin} 
          onToggleAdmin={() => setIsAdmin(!isAdmin)} 
        />
        <main className="p-6">
          {/* 頂部導航和操作按鈕 */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4 sm:mb-0"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              返回證件列表
            </button>
            
            <div className="flex space-x-2">
              <Link
                to={`/documents/${type}/${id}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
              >
                <i className="fas fa-edit mr-2"></i>
                編輯
              </Link>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                刪除
              </button>
            </div>
          </div>
          
          {/* 個人證件詳情 */}
          {isPersonal && personalDocument && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6 bg-blue-50 border-b border-gray-200">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center">
                      <h1 className="text-2xl font-bold text-gray-800">
                        {getDocumentTypeName(personalDocument.type)}
                      </h1>
                      {isExpiringBadge(personalDocument.expiryDate)}
                    </div>
                    {personalDocument.ownerType === 'companion' && companion && (
                      <div className="mt-1 flex items-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2">
                          同行人員證件
                        </span>
                        <span className="text-gray-600">{companion.name}</span>
                      </div>
                    )}
                    <p className="text-gray-600 mt-1">{personalDocument.number}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      簽發日期: {formatDate(personalDocument.issueDate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      到期日期: {formatDate(personalDocument.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">基本信息</h3>
                    <div className="space-y-3">
                      <div className="flex">
                        <span className="w-32 text-gray-500">姓名:</span>
                        <span className="text-gray-900">{personalDocument.name}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">簽發國家:</span>
                        <span className="text-gray-900">{personalDocument.issuingCountry}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">擁有者:</span>
                        <span className="text-gray-900">
                          {personalDocument.ownerType === 'primary' ? '我的證件' : 
                            companion ? `${companion.name}（${
                              companion.relationship === 'family' ? '家人' : 
                              companion.relationship === 'friend' ? '朋友' : 
                              companion.relationship === 'colleague' ? '同事' : '其他'
                            }）` : '同行人員'
                          }
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">創建時間:</span>
                        <span className="text-gray-900">{formatDate(personalDocument.createdAt)}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">最後更新:</span>
                        <span className="text-gray-900">{formatDate(personalDocument.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {personalDocument.documentImage && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">證件照片</h3>
                      <div className="border border-gray-200 rounded-md p-4">
                        <div className="text-center">
                          <div className="bg-gray-100 p-6 rounded mb-3">
                            <i className="fas fa-lock text-gray-500 text-5xl"></i>
                          </div>
                          <p className="text-gray-500 mb-3">此照片已加密保護。點擊下方按鈕安全查看。</p>
                          <button
                            onClick={() => setShowImageModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                          >
                            <i className="fas fa-eye mr-2"></i>
                            安全查看照片
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {companion && personalDocument.ownerType === 'companion' && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">同行人員資訊</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex">
                          <span className="w-32 text-gray-500">姓名:</span>
                          <span className="text-gray-900">{companion.name}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-gray-500">關係:</span>
                          <span className="text-gray-900">
                            {companion.relationship === 'family' ? '家人' : 
                             companion.relationship === 'friend' ? '朋友' : 
                             companion.relationship === 'colleague' ? '同事' : '其他'}
                          </span>
                        </div>
                        {companion.email && (
                          <div className="flex">
                            <span className="w-32 text-gray-500">電子郵件:</span>
                            <span className="text-gray-900">{companion.email}</span>
                          </div>
                        )}
                        {companion.phone && (
                          <div className="flex">
                            <span className="w-32 text-gray-500">電話:</span>
                            <span className="text-gray-900">{companion.phone}</span>
                          </div>
                        )}
                      </div>
                      {companion.notes && (
                        <div className="mt-3">
                          <span className="block text-gray-500 mb-1">備註:</span>
                          <span className="text-gray-900 block pl-2 border-l-2 border-gray-300">{companion.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {personalDocument.notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">備註</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-700 whitespace-pre-wrap">{personalDocument.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 旅遊簽證詳情 */}
          {!isPersonal && travelVisa && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6 bg-blue-50 border-b border-gray-200">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center">
                      <h1 className="text-2xl font-bold text-gray-800 mr-3">
                        {travelVisa.country} {getVisaTypeName(travelVisa.visaType)}
                      </h1>
                      <span className={`px-2 py-1 rounded-full text-sm ${getVisaStatusColor(travelVisa.status)}`}>
                        {getVisaStatusName(travelVisa.status)}
                      </span>
                      {isExpiringBadge(travelVisa.expiryDate)}
                    </div>
                    <p className="text-gray-600 mt-1">簽證號碼: {travelVisa.number}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      簽發日期: {formatDate(travelVisa.issueDate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      到期日期: {formatDate(travelVisa.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* 關聯旅程信息 */}
                {trip && (
                  <div className="mb-8 p-4 bg-blue-50 rounded-md">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">關聯旅程</h3>
                    <div className="space-y-1">
                      <p className="text-gray-700 font-medium">{trip.title}</p>
                      <p className="text-gray-600">目的地: {trip.destination}</p>
                      <p className="text-gray-600">日期: {formatDate(trip.startDate)} 至 {formatDate(trip.endDate)}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">簽證信息</h3>
                    <div className="space-y-3">
                      <div className="flex">
                        <span className="w-32 text-gray-500">簽證類型:</span>
                        <span className="text-gray-900">{getVisaTypeName(travelVisa.visaType)}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">入境次數:</span>
                        <span className="text-gray-900">{getVisaEntriesName(travelVisa.entries)}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">停留天數:</span>
                        <span className="text-gray-900">{travelVisa.duration} 天</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">簽證狀態:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getVisaStatusColor(travelVisa.status)}`}>
                          {getVisaStatusName(travelVisa.status)}
                        </span>
                      </div>
                      {travelVisa.applicationDate && (
                        <div className="flex">
                          <span className="w-32 text-gray-500">申請日期:</span>
                          <span className="text-gray-900">{formatDate(travelVisa.applicationDate)}</span>
                        </div>
                      )}
                      {travelVisa.approvalDate && (
                        <div className="flex">
                          <span className="w-32 text-gray-500">批准日期:</span>
                          <span className="text-gray-900">{formatDate(travelVisa.approvalDate)}</span>
                        </div>
                      )}
                      <div className="flex">
                        <span className="w-32 text-gray-500">創建時間:</span>
                        <span className="text-gray-900">{formatDate(travelVisa.createdAt)}</span>
                      </div>
                      <div className="flex">
                        <span className="w-32 text-gray-500">最後更新:</span>
                        <span className="text-gray-900">{formatDate(travelVisa.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {travelVisa.documentImage && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">簽證照片</h3>
                      <div className="border border-gray-200 rounded-md p-4">
                        <div className="text-center">
                          <div className="bg-gray-100 p-6 rounded mb-3">
                            <i className="fas fa-lock text-gray-500 text-5xl"></i>
                          </div>
                          <p className="text-gray-500 mb-3">此照片已加密保護。點擊下方按鈕安全查看。</p>
                          <button
                            onClick={() => setShowImageModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                          >
                            <i className="fas fa-eye mr-2"></i>
                            安全查看照片
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {travelVisa.notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">備註</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-700 whitespace-pre-wrap">{travelVisa.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {renderDeleteModal()}
          {renderImageModal()}
        </main>
      </div>
    </div>
  );
};

export default DocumentDetail; 