import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { Tag, Modal, Progress, Select, Button, message } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, EditOutlined, DeleteOutlined, LineChartOutlined } from '@ant-design/icons';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { v4 as uuidv4 } from 'uuid';

// 定義錯誤邊界組件
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('預算管理頁面發生錯誤:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold mb-2">應用程式發生錯誤</h3>
            <p>{this.state.error?.message || '未知錯誤'}</p>
            <button 
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mt-4"
              onClick={() => window.location.reload()}
            >
              重新載入頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 定義預算分類類型
export enum BudgetCategoryType {
  TRANSPORTATION = 'TRANSPORTATION',
  ACCOMMODATION = 'ACCOMMODATION',
  FOOD = 'FOOD',
  ATTRACTIONS = 'ATTRACTIONS',
  SHOPPING = 'SHOPPING',
  INSURANCE = 'INSURANCE',
  MISCELLANEOUS = 'MISCELLANEOUS',
  EXTRA = 'EXTRA'
}

// 定義貨幣類型
export enum CurrencyType {
  TWD = 'TWD',
  USD = 'USD',
  JPY = 'JPY',
  EUR = 'EUR',
  GBP = 'GBP',
  AUD = 'AUD',
  CAD = 'CAD',
  CNY = 'CNY',
  HKD = 'HKD',
  KRW = 'KRW',
  SGD = 'SGD',
  THB = 'THB',
  MYR = 'MYR',
  VND = 'VND'
}

// 取得預算分類中文名稱
const getBudgetCategoryName = (type: BudgetCategoryType): string => {
  const categoryNames: Record<BudgetCategoryType, string> = {
    [BudgetCategoryType.TRANSPORTATION]: '交通',
    [BudgetCategoryType.ACCOMMODATION]: '住宿',
    [BudgetCategoryType.FOOD]: '餐飲',
    [BudgetCategoryType.ATTRACTIONS]: '景點門票',
    [BudgetCategoryType.SHOPPING]: '購物',
    [BudgetCategoryType.INSURANCE]: '保險',
    [BudgetCategoryType.MISCELLANEOUS]: '其他',
    [BudgetCategoryType.EXTRA]: '額外預算'
  };
  return categoryNames[type] || '未知類別';
};

// 定義預算分類項目介面
interface BudgetCategory {
  id: string;
  type: BudgetCategoryType;
  amount: number;
  spentAmount: number;
  note: string;
}

// 定義預算介面
interface Budget {
  id: string;
  tripId: string;
  title: string;
  totalAmount: number;
  currency: CurrencyType;
  extraBudget: number;
  categories: BudgetCategory[];
  createdAt: string;
  updatedAt: string;
}

// 定義旅程介面
interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
const Budget: React.FC = () => {
  const navigate = useNavigate();
  console.log('Budget 組件開始渲染');
  
  // 狀態管理
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 顯示本地儲存的資料用於除錯
  useEffect(() => {
    try {
      const tripsData = localStorage.getItem('trips');
      const budgetsData = localStorage.getItem('budgets');
      const user = localStorage.getItem('user');
      
      console.log('-------------------- DEBUG INFO --------------------');
      console.log('localStorage 內容:');
      console.log('trips:', tripsData ? JSON.parse(tripsData) : 'null');
      console.log('budgets:', budgetsData ? JSON.parse(budgetsData) : 'null');
      console.log('user:', user ? JSON.parse(user) : 'null');
      console.log('isAuthenticated:', localStorage.getItem('isAuthenticated'));
      console.log('----------------------------------------------------');
    } catch (error) {
      console.error('除錯資訊讀取失敗:', error);
    }
  }, []);
  
  // 確認使用者是否已登入
  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log('檢查用戶認證狀態');
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const userStr = localStorage.getItem('user');
        
        // 修改認證邏輯：如果 user 資料存在，即使 isAuthenticated 為 null 也允許訪問
        if (!isAuthenticated && !userStr) {
          console.log('用戶未認證且沒有用戶資料，導向登入頁面');
          navigate('/login');
          return;
        }

        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            console.log('用戶資料:', user);
            
            // 設定認證標記，防止再次跳轉
            if (!isAuthenticated) {
              console.log('用戶資料存在但 isAuthenticated 為 null，設置為 true');
              localStorage.setItem('isAuthenticated', 'true');
            }
            
            setIsAdmin(user.isAdmin || false);
          } catch (e) {
            console.error('解析用戶資料時出錯:', e);
            setError('無法解析用戶資料');
            navigate('/login');
          }
        } else {
          console.log('找不到用戶資料，導向登入頁面');
          navigate('/login');
        }
      } catch (error) {
        console.error('認證檢查時出錯:', error);
        setError('認證檢查失敗');
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // 載入旅程資料
  useEffect(() => {
    const loadTrips = () => {
      console.log('載入旅程資料開始');
      setError(null);
      try {
        const tripsData = localStorage.getItem('trips');
        console.log('旅程原始資料:', tripsData);
        
        if (tripsData) {
          try {
            const parsedTrips = JSON.parse(tripsData);
            console.log('解析後的旅程資料:', parsedTrips);
            
            if (Array.isArray(parsedTrips)) {
              // 驗證每個旅程對象
              const validTrips = parsedTrips.filter(trip => {
                if (!trip || typeof trip !== 'object') {
                  console.error('旅程資料不是有效對象:', trip);
                  return false;
                }
                if (!trip.id || !trip.title) {
                  console.error('旅程缺少必要屬性:', trip);
                  return false;
                }
                return true;
              });
              
              console.log('有效旅程數量:', validTrips.length);
              setTrips(validTrips);
            } else {
              console.error('旅程資料格式不正確，應為陣列:', parsedTrips);
              setTrips([]);
              setError('旅程資料格式不正確');
            }
          } catch (parseError) {
            console.error('解析旅程資料失敗:', parseError);
            setTrips([]);
            setError('旅程資料解析失敗');
          }
        } else {
          // 如果沒有旅程資料，設置為空陣列
          console.log('找不到旅程資料，設置為空陣列');
          setTrips([]);
        }
      } catch (error) {
        console.error('載入旅程資料失敗:', error);
        setTrips([]);
        setError('載入旅程資料時發生錯誤');
      }
      console.log('載入旅程資料完成');
    };
    
    loadTrips();
  }, []);
  
  // 載入預算資料
  useEffect(() => {
    const loadBudgets = () => {
      console.log('載入預算資料開始');
      setIsLoading(true);
      setError(null);
      
      try {
        const budgetsData = localStorage.getItem('budgets');
        console.log('預算原始資料:', budgetsData);
        
        if (budgetsData) {
          try {
            const parsedBudgets = JSON.parse(budgetsData);
            console.log('解析後的預算資料:', parsedBudgets);
            
            if (Array.isArray(parsedBudgets)) {
              // 驗證每個預算對象
              const validBudgets = parsedBudgets.filter(budget => {
                if (!budget || typeof budget !== 'object') {
                  console.error('預算資料不是有效對象:', budget);
                  return false;
                }
                if (!budget.id || !budget.tripId || !budget.title) {
                  console.error('預算缺少必要屬性:', budget);
                  return false;
                }
                
                // 確保 categories 是陣列
                if (!Array.isArray(budget.categories)) {
                  console.error('預算類別不是陣列:', budget);
                  budget.categories = [];
                }
                
                // 驗證每個類別
                budget.categories = budget.categories.filter((category: any) => {
                  if (!category || typeof category !== 'object') {
                    console.error('類別不是有效對象:', category);
                    return false;
                  }
                  if (!category.id || !category.type) {
                    console.error('類別缺少必要屬性:', category);
                    return false;
                  }
                  
                  // 確保數值型屬性有效
                  category.amount = typeof category.amount === 'number' ? category.amount : 0;
                  category.spentAmount = typeof category.spentAmount === 'number' ? category.spentAmount : 0;
                  
                  return true;
                });
                
                return true;
              });
              
              console.log('有效預算數量:', validBudgets.length);
              setBudgets(validBudgets);
            } else {
              console.error('預算資料格式不正確，應為陣列:', parsedBudgets);
              setBudgets([]);
              setError('預算資料格式不正確');
            }
          } catch (parseError) {
            console.error('解析預算資料失敗:', parseError);
            setBudgets([]);
            setError('預算資料解析失敗');
          }
        } else {
          // 如果沒有預算資料，設置為空陣列並初始化本地存儲
          console.log('找不到預算資料，設置為空陣列');
          setBudgets([]);
          localStorage.setItem('budgets', JSON.stringify([]));
        }
      } catch (error) {
        console.error('載入預算資料失敗:', error);
        setBudgets([]);
        setError('載入預算資料時發生錯誤');
      } finally {
        console.log('載入預算資料完成');
        setIsLoading(false);
      }
    };
    
    loadBudgets();
  }, []);
  
  // 監聽選擇的旅程變更
  useEffect(() => {
    console.log('旅程選擇變更:', selectedTripId);
    console.log('預算列表:', budgets);
    
    try {
      if (selectedTripId && budgets && budgets.length > 0) {
        const tripBudget = budgets.find(budget => budget.tripId === selectedTripId);
        console.log('找到對應預算:', tripBudget);
        
        if (tripBudget) {
          setSelectedBudget(tripBudget);
        } else {
          console.log('此旅程沒有對應預算');
          setSelectedBudget(null);
        }
      } else {
        console.log('沒有選擇旅程或預算列表為空');
        setSelectedBudget(null);
      }
    } catch (error) {
      console.error('選擇旅程變更處理錯誤:', error);
      setSelectedBudget(null);
      setError('處理旅程選擇時發生錯誤');
    }
  }, [selectedTripId, budgets]);
  
  // 處理旅程選擇變更
  const handleTripChange = (value: string) => {
    setSelectedTripId(value);
  };
  
  // 建立新預算
  const handleCreateBudget = () => {
    if (!selectedTripId) {
      message.error('請先選擇旅程');
      return;
    }
    
    const selectedTrip = trips.find(trip => trip.id === selectedTripId);
    if (!selectedTrip) {
      message.error('找不到選擇的旅程');
      return;
    }
    
    navigate(`/budgets/new?tripId=${selectedTripId}`);
  };
  
  // 編輯預算
  const handleEditBudget = () => {
    if (!selectedBudget) {
      message.error('請先選擇預算');
      return;
    }
    
    navigate(`/budgets/${selectedBudget.id}/edit`);
  };
  
  // 新增支出
  const handleAddExpense = () => {
    if (!selectedBudget) {
      message.error('請先選擇預算');
      return;
    }
    
    navigate(`/expenses/new?budgetId=${selectedBudget.id}`);
  };
  
  // 查看支出細節
  const handleViewExpenses = () => {
    if (!selectedBudget) {
      message.error('請先選擇預算');
      return;
    }
    
    navigate(`/budgets/${selectedBudget.id}/expenses`);
  };
  
  // 計算預算使用百分比
  const calculatePercentage = (category: BudgetCategory): number => {
    try {
      if (!category || category.amount === 0) return 0;
      return Math.min(Math.round((category.spentAmount / category.amount) * 100), 100);
    } catch (error) {
      console.error('計算百分比時出錯:', error);
      return 0;
    }
  };
  
  // 獲取進度條顏色
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return '#f5222d'; // 紅色
    if (percentage >= 80) return '#fa8c16'; // 橙色
    return '#52c41a'; // 綠色
  };
  
  // 刪除預算分類
  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setShowDeleteModal(true);
  };
  
  // 確認刪除預算分類
  const confirmDeleteCategory = () => {
    if (!selectedBudget || !categoryToDelete) return;
    
    const updatedCategories = selectedBudget.categories.filter(
      category => category.id !== categoryToDelete
    );
    
    const updatedBudget = {
      ...selectedBudget,
      categories: updatedCategories,
      updatedAt: new Date().toISOString()
    };
    
    const updatedBudgets = budgets.map(budget => 
      budget.id === selectedBudget.id ? updatedBudget : budget
    );
    
    setBudgets(updatedBudgets);
    setSelectedBudget(updatedBudget);
    localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
    
    setShowDeleteModal(false);
    setCategoryToDelete(null);
    message.success('預算分類已刪除');
  };
  
  // 取消刪除預算分類
  const cancelDeleteCategory = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };
  
  // 查看預算分析
  const handleViewAnalysis = () => {
    if (!selectedBudget) {
      message.error('請先選擇預算');
      return;
    }
    
    navigate(`/budgets/${selectedBudget.id}/analysis`);
  };
  
  // 處理管理員模式切換
  const handleToggleAdmin = () => {
    const newAdminState = !isAdmin;
    setIsAdmin(newAdminState);
    
    // 更新用戶資訊
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        userData.isAdmin = newAdminState;
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.error('更新用戶資料時出錯:', e);
      }
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <ErrorBoundary>
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="預算管理" isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
          
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-4 py-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <p><strong>錯誤：</strong> {error}</p>
                  <p className="text-sm">請重新整理頁面或聯繫管理員。</p>
                  <button 
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mt-2"
                    onClick={() => window.location.reload()}
                  >
                    重新載入
                  </button>
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">旅程預算管理</h2>
                  <div className="flex gap-3">
                    <Select
                      placeholder="選擇旅程"
                      style={{ 
                        width: 220,
                        height: '40px',
                        fontSize: '16px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      onChange={handleTripChange}
                      value={selectedTripId || undefined}
                      className="border border-gray-400"
                      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    >
                      {Array.isArray(trips) && trips.length > 0 ? (
                        trips.map(trip => (
                          <Select.Option key={trip.id} value={trip.id}>
                            {trip.title}
                          </Select.Option>
                        ))
                      ) : (
                        <Select.Option disabled value="">無可用旅程</Select.Option>
                      )}
                    </Select>
                    
                    <div className="flex gap-2">
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={handleEditBudget}
                        style={{
                          border: '1px solid #d9d9d9',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 2px 0 rgba(0,0,0,0.015)',
                          fontWeight: '500'
                        }}
                      >
                        編輯預算
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={handleAddExpense}
                        style={{
                          backgroundColor: '#52c41a',
                          borderColor: '#52c41a',
                          color: '#ffffff',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 0 rgba(0,0,0,0.045)'
                        }}
                      >
                        新增支出
                      </Button>
                      <Button 
                        icon={<LineChartOutlined />} 
                        onClick={handleViewAnalysis}
                        style={{
                          border: '1px solid #d9d9d9',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 2px 0 rgba(0,0,0,0.015)',
                          fontWeight: '500'
                        }}
                      >
                        預算分析
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 預算內容 */}
                {selectedTripId ? (
                  <>
                    {selectedBudget ? (
                      <div>
                        {/* 預算摘要 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">總預算</h3>
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedBudget.totalAmount.toLocaleString()} {selectedBudget.currency}
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">已使用預算</h3>
                            <p className="text-2xl font-bold text-green-600">
                              {selectedBudget.categories.reduce((sum, category) => sum + category.spentAmount, 0).toLocaleString()} {selectedBudget.currency}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">剩餘預算</h3>
                            <p className="text-2xl font-bold text-yellow-600">
                              {(selectedBudget.totalAmount - selectedBudget.categories.reduce((sum, category) => sum + category.spentAmount, 0)).toLocaleString()} {selectedBudget.currency}
                            </p>
                          </div>
                        </div>

                        {/* 預算分類列表 */}
                        <div className="space-y-4">
                          {selectedBudget.categories.map((category, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <Tag color="blue">{getBudgetCategoryName(category.type)}</Tag>
                                  {category.note && (
                                    <span className="ml-2 text-gray-500 text-sm">{category.note}</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">
                                    已使用：{category.spentAmount.toLocaleString()} / {category.amount.toLocaleString()} {selectedBudget.currency}
                                  </span>
                                  <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-red-500 hover:text-red-700"
                                  />
                                </div>
                              </div>
                              <Progress
                                percent={calculatePercentage(category)}
                                status={calculatePercentage(category) > 100 ? 'exception' : 'normal'}
                                strokeColor={calculatePercentage(category) > 100 ? '#ff4d4f' : '#1890ff'}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p>請選擇一個旅程來管理預算</p>
                        {trips.length === 0 && (
                          <p className="mt-4 text-gray-500">尚未建立任何旅程，請先建立旅程</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">請選擇一個旅程以查看和管理預算</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">預算管理提示</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>您可以為每個旅程創建一個預算計劃</li>
                  <li>將總預算分配到不同的類別（交通、住宿、餐飲等）</li>
                  <li>隨時記錄支出，系統會自動計算已使用的預算</li>
                  <li>當預算使用接近或超出限制時，系統會提供視覺警示</li>
                  <li>您可以隨時調整預算分配或增加額外預算</li>
                  <li>使用預算分析功能查看詳細的支出統計和圖表</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* 刪除預算分類確認對話框 */}
        <Modal
          title="確認刪除"
          open={showDeleteModal}
          onOk={confirmDeleteCategory}
          onCancel={cancelDeleteCategory}
          okText="確認刪除"
          cancelText="取消"
        >
          <div className="flex items-center">
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '22px', marginRight: '12px' }} />
            <span>確定要刪除這個預算分類嗎？相關的支出記錄將會保留，但不再與此分類關聯。</span>
          </div>
        </Modal>
      </ErrorBoundary>
    </div>
  );
};

export default Budget; 