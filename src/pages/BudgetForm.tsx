import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { Form, Input, Button, Select, InputNumber, message, Space, Divider, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { BudgetCategoryType, CurrencyType } from './Budget';
import { formatCurrency, parseCurrency } from '../utils/dayjs-utils';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface BudgetFormData {
  title: string;
  tripId: string;
  totalAmount: number;
  currency: CurrencyType;
  extraBudget: number;
  categories: {
    id: string;
    type: BudgetCategoryType;
    amount: number;
    spentAmount: number;
    note: string;
  }[];
}

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  status: string;
}

const BudgetForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryParams = new URLSearchParams(location.search);
  const tripIdFromQuery = queryParams.get('tripId');
  
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [defaultTripId, setDefaultTripId] = useState<string | null>(tripIdFromQuery);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditMode, setIsEditMode] = useState<boolean>(!!id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // 確認使用者是否已登入
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      
      // 檢查是否為管理員
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsAdmin(user.isAdmin || false);
        } catch (e) {
          console.error('解析用戶資料時出錯:', e);
        }
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // 載入旅程資料
  useEffect(() => {
    const loadTrips = () => {
      try {
        const tripsData = localStorage.getItem('trips');
        if (tripsData) {
          const parsedTrips = JSON.parse(tripsData);
          setTrips(parsedTrips);
          
          if (defaultTripId) {
            const trip = parsedTrips.find((t: Trip) => t.id === defaultTripId);
            if (trip) {
              setSelectedTrip(trip);
            }
          }
        }
      } catch (error) {
        console.error('載入旅程資料失敗:', error);
      }
    };
    
    loadTrips();
  }, [defaultTripId]);
  
  // 如果是編輯模式，載入預算資料
  useEffect(() => {
    const loadBudgetData = () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      try {
        const budgetsData = localStorage.getItem('budgets');
        if (budgetsData) {
          const budgets = JSON.parse(budgetsData);
          const budgetToEdit = budgets.find((budget: any) => budget.id === id);
          
          if (budgetToEdit) {
            form.setFieldsValue({
              title: budgetToEdit.title,
              tripId: budgetToEdit.tripId,
              totalAmount: budgetToEdit.totalAmount,
              currency: budgetToEdit.currency,
              extraBudget: budgetToEdit.extraBudget,
              categories: budgetToEdit.categories,
            });
            
            setDefaultTripId(budgetToEdit.tripId);
            setTotalCategories(budgetToEdit.categories.length);
          } else {
            message.error('找不到要編輯的預算資料');
            navigate('/budgets');
          }
        }
      } catch (error) {
        console.error('載入預算資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBudgetData();
  }, [isEditMode, id, form, navigate]);
  
  // 當選擇旅程變更時更新
  const handleTripChange = (value: string) => {
    const trip = trips.find(t => t.id === value);
    setSelectedTrip(trip || null);
  };
  
  // 表單提交處理
  const handleSubmit = async (values: BudgetFormData) => {
    setIsSubmitting(true);
    
    try {
      // 確保每個類別都有一個唯一ID
      const categoriesWithIds = values.categories.map(category => ({
        ...category,
        id: category.id || uuidv4(),
        spentAmount: category.spentAmount || 0,
      }));
      
      // 構建預算物件
      const budgetData = {
        id: isEditMode ? id : uuidv4(),
        tripId: values.tripId,
        title: values.title,
        totalAmount: values.totalAmount,
        currency: values.currency,
        extraBudget: values.extraBudget || 0,
        categories: categoriesWithIds,
        createdAt: isEditMode ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // 從本地儲存讀取現有預算
      const budgetsData = localStorage.getItem('budgets');
      let budgets = budgetsData ? JSON.parse(budgetsData) : [];
      
      if (isEditMode) {
        // 更新現有預算
        budgets = budgets.map((budget: any) => 
          budget.id === id ? { ...budget, ...budgetData } : budget
        );
        message.success('預算更新成功');
      } else {
        // 添加新預算
        budgets.push(budgetData);
        message.success('預算建立成功');
      }
      
      // 儲存回本地儲存
      localStorage.setItem('budgets', JSON.stringify(budgets));
      
      // 導航回預算列表
      navigate('/budgets');
    } catch (error) {
      console.error('儲存預算失敗:', error);
      message.error('儲存預算時發生錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 計算總預算配置
  const calculateTotalBudget = () => {
    const values = form.getFieldsValue();
    if (!values.categories || !Array.isArray(values.categories)) {
      return 0;
    }
    
    return values.categories.reduce((sum: number, category: { amount: number }) => {
      return sum + (typeof category.amount === 'number' ? category.amount : 0);
    }, 0);
  };
  
  // 返回預算列表
  const handleBack = () => {
    navigate('/budgets');
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
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={isEditMode ? '編輯預算' : '新增預算'} isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
        
        <div className="flex-1 overflow-y-auto p-6">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="mb-4"
          >
            返回預算列表
          </Button>
          
          <div className="bg-white rounded-lg shadow p-6">
            {isLoading ? (
              <div className="text-center py-8">載入中...</div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                initialValues={{
                  tripId: defaultTripId || undefined,
                  currency: CurrencyType.TWD,
                  totalAmount: 0,
                  extraBudget: 0,
                  categories: [{ type: BudgetCategoryType.TRANSPORTATION, amount: 0, note: '' }],
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Title level={4}>基本資訊</Title>
                    
                    <Form.Item
                      name="tripId"
                      label="關聯旅程"
                      rules={[{ required: true, message: '請選擇關聯的旅程' }]}
                    >
                      <Select
                        placeholder="選擇旅程"
                        onChange={handleTripChange}
                        disabled={isEditMode}
                      >
                        {trips.map(trip => (
                          <Option key={trip.id} value={trip.id}>
                            {trip.title}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="title"
                      label="預算標題"
                      rules={[{ required: true, message: '請輸入預算標題' }]}
                    >
                      <Input placeholder="例如：東京五日遊預算" />
                    </Form.Item>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="totalAmount"
                        label="總預算金額"
                        rules={[{ required: true, message: '請輸入總預算金額' }]}
                      >
                        <InputNumber 
                          placeholder="輸入金額"
                          min={0}
                          style={{ width: '100%' }}
                          formatter={value => formatCurrency(value)}
                          parser={value => parseCurrency(value)}
                        />
                      </Form.Item>
                      
                      <Form.Item
                        name="currency"
                        label="貨幣"
                        rules={[{ required: true, message: '請選擇貨幣' }]}
                      >
                        <Select placeholder="選擇貨幣">
                          {Object.values(CurrencyType).map(currency => (
                            <Option key={currency} value={currency}>
                              {currency}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                    
                    <Form.Item
                      name="extraBudget"
                      label="額外預算"
                      tooltip="可用於應急或特別開支的額外預算"
                    >
                      <InputNumber 
                        placeholder="輸入額外預算金額"
                        min={0}
                        style={{ width: '100%' }}
                        formatter={value => formatCurrency(value)}
                        parser={value => parseCurrency(value)}
                      />
                    </Form.Item>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4}>預算分類</Title>
                      <div className="text-gray-500">
                        已配置：{calculateTotalBudget().toLocaleString()} / 
                        總預算：{form.getFieldValue('totalAmount')?.toLocaleString() || 0}
                      </div>
                    </div>
                    
                    <Form.List name="categories">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <div key={key} className="mb-4 p-4 border rounded-lg bg-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <Form.Item
                                  {...restField}
                                  name={[name, 'type']}
                                  className="mb-0 flex-1 mr-2"
                                  rules={[{ required: true, message: '請選擇類別' }]}
                                >
                                  <Select placeholder="選擇預算類別">
                                    {Object.values(BudgetCategoryType).map(categoryType => (
                                      <Option key={categoryType} value={categoryType}>
                                        {(() => {
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
                                          return categoryNames[categoryType] || '未知類別';
                                        })()}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                                <Button
                                  type="text"
                                  danger
                                  icon={<MinusCircleOutlined />}
                                  onClick={() => remove(name)}
                                  disabled={fields.length <= 1}
                                />
                              </div>
                              
                              <div className="mb-2">
                                <Form.Item
                                  {...restField}
                                  name={[name, 'amount']}
                                  label="預算金額"
                                  rules={[{ required: true, message: '請輸入預算金額' }]}
                                >
                                  <InputNumber 
                                    placeholder="輸入金額" 
                                    min={0} 
                                    style={{ width: '100%' }}
                                    formatter={value => formatCurrency(value)}
                                    parser={value => parseCurrency(value)}
                                  />
                                </Form.Item>
                              </div>
                              
                              <Form.Item
                                {...restField}
                                name={[name, 'note']}
                                label="備註"
                              >
                                <TextArea rows={2} placeholder="輸入備註說明（選填）" />
                              </Form.Item>
                              
                              <Form.Item
                                {...restField}
                                name={[name, 'id']}
                                hidden
                              >
                                <Input />
                              </Form.Item>
                              
                              <Form.Item
                                {...restField}
                                name={[name, 'spentAmount']}
                                hidden
                                initialValue={0}
                              >
                                <InputNumber />
                              </Form.Item>
                            </div>
                          ))}
                          
                          <Form.Item>
                            <Button
                              type="dashed"
                              onClick={() => add({ type: undefined, amount: 0, note: '', id: uuidv4() })}
                              block
                              icon={<PlusOutlined />}
                            >
                              新增預算分類
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  </div>
                </div>
                
                <Divider />
                
                <Form.Item className="mb-0">
                  <Space size="middle">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={isSubmitting}
                      style={{
                        backgroundColor: '#1e40af',
                        borderColor: '#1e40af',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        height: '32px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        border: '1px solid #1e40af'
                      }}
                    >
                      {isEditMode ? '更新預算' : '創建預算'}
                    </Button>
                    <Button 
                      onClick={handleBack}
                      style={{
                        backgroundColor: '#f5f5f5',
                        borderColor: '#d9d9d9',
                        color: '#333333',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        height: '32px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #d9d9d9'
                      }}
                    >
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetForm; 