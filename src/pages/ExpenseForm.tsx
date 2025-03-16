import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { Form, Input, Button, Select, InputNumber, DatePicker, Upload, message, Space, Divider } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { BudgetCategoryType, CurrencyType } from './Budget';
import { formatCurrency, parseCurrency } from '../utils/dayjs-utils';

const { Option } = Select;
const { TextArea } = Input;

// 定義支出類型
export enum ExpenseType {
  ACTUAL = 'ACTUAL',
  PLANNED = 'PLANNED'
}

// 支付方式
export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER'
}

// 獲取支出類型中文名稱
const getExpenseTypeName = (type: ExpenseType): string => {
  const typeNames: Record<ExpenseType, string> = {
    [ExpenseType.ACTUAL]: '實際支出',
    [ExpenseType.PLANNED]: '計劃支出'
  };
  return typeNames[type] || '未知類型';
};

// 獲取支付方式中文名稱
const getPaymentMethodName = (method: PaymentMethod): string => {
  const methodNames: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: '現金',
    [PaymentMethod.CREDIT_CARD]: '信用卡',
    [PaymentMethod.DEBIT_CARD]: '金融卡',
    [PaymentMethod.MOBILE_PAYMENT]: '行動支付',
    [PaymentMethod.BANK_TRANSFER]: '銀行轉帳',
    [PaymentMethod.OTHER]: '其他'
  };
  return methodNames[method] || '未知方式';
};

// 獲取預算分類中文名稱
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

// 定義表單數據介面
interface ExpenseFormData {
  title: string;
  budgetId: string;
  categoryId: string;
  amount: number;
  currency: CurrencyType;
  expenseDate: dayjs.Dayjs;
  type: ExpenseType;
  paymentMethod: PaymentMethod;
  location: string;
  notes: string;
  receipt: any[]; // 簡化處理，實際上應該處理文件上傳
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

// 定義預算分類項目介面
interface BudgetCategory {
  id: string;
  type: BudgetCategoryType;
  amount: number;
  spentAmount: number;
  note: string;
}

// 定義旅程介面
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  status: string;
}

// 定義支出介面
interface Expense {
  id: string;
  budgetId: string;
  categoryId: string;
  title: string;
  amount: number;
  currency: CurrencyType;
  expenseDate: string;
  type: ExpenseType;
  paymentMethod: PaymentMethod;
  location: string;
  notes: string;
  receipt: any[];
  createdAt: string;
  updatedAt: string;
}

const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryParams = new URLSearchParams(location.search);
  const budgetIdFromQuery = queryParams.get('budgetId');
  
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditMode, setIsEditMode] = useState<boolean>(!!id);
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
  
  // 載入預算資料
  useEffect(() => {
    const loadBudgets = () => {
      try {
        const budgetsData = localStorage.getItem('budgets');
        if (budgetsData) {
          const parsedBudgets: Budget[] = JSON.parse(budgetsData);
          setBudgets(parsedBudgets);
          
          if (budgetIdFromQuery) {
            const budget = parsedBudgets.find((b) => b.id === budgetIdFromQuery);
            if (budget) {
              setSelectedBudget(budget);
              setCategories(budget.categories);
              form.setFieldsValue({ budgetId: budget.id });
            }
          }
        }
      } catch (error) {
        console.error('載入預算資料失敗:', error);
      }
    };
    
    loadBudgets();
  }, [budgetIdFromQuery, form]);
  
  // 如果是編輯模式，載入支出資料
  useEffect(() => {
    const loadExpenseData = () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      try {
        const expensesData = localStorage.getItem('expenses');
        if (!expensesData) {
          setIsLoading(false);
          return;
        }
        
        const expenses: Expense[] = JSON.parse(expensesData);
        const expenseToEdit = expenses.find((expense) => expense.id === id);
        
        if (expenseToEdit) {
          // 找到關聯的預算
          const relatedBudget = budgets.find((budget) => budget.id === expenseToEdit.budgetId);
          if (relatedBudget) {
            setSelectedBudget(relatedBudget);
            setCategories(relatedBudget.categories);
          }
          
          // 設置表單數據
          form.setFieldsValue({
            title: expenseToEdit.title,
            budgetId: expenseToEdit.budgetId,
            categoryId: expenseToEdit.categoryId,
            amount: expenseToEdit.amount,
            currency: expenseToEdit.currency,
            expenseDate: dayjs(expenseToEdit.expenseDate),
            type: expenseToEdit.type,
            paymentMethod: expenseToEdit.paymentMethod,
            location: expenseToEdit.location,
            notes: expenseToEdit.notes,
            receipt: expenseToEdit.receipt
          });
        } else {
          message.error('找不到要編輯的支出記錄');
          navigate('/budgets');
        }
      } catch (error) {
        console.error('載入支出資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (budgets.length > 0) {
      loadExpenseData();
    }
  }, [isEditMode, id, budgets, form, navigate]);
  
  // 當預算選擇變更時更新類別
  const handleBudgetChange = (value: string) => {
    const budget = budgets.find((b) => b.id === value);
    if (budget) {
      setSelectedBudget(budget);
      setCategories(budget.categories);
      form.setFieldsValue({ categoryId: undefined });
    } else {
      setSelectedBudget(null);
      setCategories([]);
    }
  };
  
  // 表單提交處理
  const handleSubmit = async (values: ExpenseFormData) => {
    setIsSubmitting(true);
    
    try {
      if (!selectedBudget) {
        message.error('請選擇有效的預算');
        setIsSubmitting(false);
        return;
      }
      
      // 構建支出物件
      const expenseData: Expense = {
        id: isEditMode ? id! : uuidv4(),
        budgetId: values.budgetId,
        categoryId: values.categoryId,
        title: values.title,
        amount: values.amount,
        currency: values.currency,
        expenseDate: values.expenseDate.format('YYYY-MM-DD'),
        type: values.type,
        paymentMethod: values.paymentMethod,
        location: values.location || '',
        notes: values.notes || '',
        receipt: values.receipt || [],
        createdAt: isEditMode ? undefined as any : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 從本地儲存讀取現有支出
      const expensesData = localStorage.getItem('expenses');
      let expenses: Expense[] = expensesData ? JSON.parse(expensesData) : [];
      
      // 更新預算中的已使用金額
      const budgetsData = localStorage.getItem('budgets');
      let budgetsList: Budget[] = budgetsData ? JSON.parse(budgetsData) : [];
      
      // 找到選定的預算和類別
      const budgetIndex = budgetsList.findIndex((b) => b.id === values.budgetId);
      if (budgetIndex === -1) {
        message.error('找不到選定的預算');
        setIsSubmitting(false);
        return;
      }
      
      const categoryIndex = budgetsList[budgetIndex].categories.findIndex((c) => c.id === values.categoryId);
      if (categoryIndex === -1) {
        message.error('找不到選定的預算類別');
        setIsSubmitting(false);
        return;
      }
      
      // 如果是編輯模式，先還原原來的支出金額
      if (isEditMode) {
        const oldExpense = expenses.find((e) => e.id === id);
        if (oldExpense && oldExpense.budgetId === values.budgetId && oldExpense.categoryId === values.categoryId) {
          // 同一預算類別，減去原金額
          budgetsList[budgetIndex].categories[categoryIndex].spentAmount -= oldExpense.amount;
        } else if (oldExpense) {
          // 不同預算或類別，還原原預算類別的金額
          const oldBudgetIndex = budgetsList.findIndex((b) => b.id === oldExpense.budgetId);
          if (oldBudgetIndex !== -1) {
            const oldCategoryIndex = budgetsList[oldBudgetIndex].categories.findIndex((c) => c.id === oldExpense.categoryId);
            if (oldCategoryIndex !== -1) {
              budgetsList[oldBudgetIndex].categories[oldCategoryIndex].spentAmount -= oldExpense.amount;
            }
          }
        }
        
        // 更新支出列表
        expenses = expenses.map((expense) => 
          expense.id === id ? expenseData : expense
        );
        message.success('支出更新成功');
      } else {
        // 添加新支出
        expenses.push(expenseData);
        message.success('支出記錄成功');
      }
      
      // 更新類別已使用金額
      budgetsList[budgetIndex].categories[categoryIndex].spentAmount += values.amount;
      
      // 儲存更新後的支出和預算
      localStorage.setItem('expenses', JSON.stringify(expenses));
      localStorage.setItem('budgets', JSON.stringify(budgetsList));
      
      // 導航回預算頁面
      navigate(`/budgets/${values.budgetId}/expenses`);
    } catch (error) {
      console.error('儲存支出失敗:', error);
      message.error('儲存支出時發生錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 返回上一頁
  const handleBack = () => {
    if (selectedBudget) {
      navigate(`/budgets/${selectedBudget.id}/expenses`);
    } else {
      navigate('/budgets');
    }
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
        <Header title={isEditMode ? '編輯支出' : '新增支出'} isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
        
        <div className="flex-1 overflow-y-auto p-6">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="mb-4"
            style={{
              backgroundColor: '#f0f9ff',
              borderColor: '#93c5fd',
              color: '#2563eb',
              fontWeight: '500',
              fontSize: '14px',
              height: '36px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '0 15px'
            }}
          >
            返回支出列表
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
                  budgetId: budgetIdFromQuery || undefined,
                  currency: selectedBudget ? selectedBudget.currency : CurrencyType.TWD,
                  type: ExpenseType.ACTUAL,
                  paymentMethod: PaymentMethod.CASH,
                  expenseDate: dayjs()
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">基本資訊</h3>
                    
                    <Form.Item
                      name="budgetId"
                      label="關聯預算"
                      rules={[{ required: true, message: '請選擇關聯的預算' }]}
                    >
                      <Select
                        placeholder="選擇預算"
                        onChange={handleBudgetChange}
                        disabled={isEditMode || !!budgetIdFromQuery}
                      >
                        {budgets.map((budget) => (
                          <Option key={budget.id} value={budget.id}>
                            {budget.title}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="categoryId"
                      label="支出類別"
                      rules={[{ required: true, message: '請選擇支出類別' }]}
                    >
                      <Select
                        placeholder="選擇支出類別"
                        disabled={!selectedBudget}
                      >
                        {categories.map((category) => (
                          <Option key={category.id} value={category.id}>
                            {getBudgetCategoryName(category.type)}
                            {category.note && ` - ${category.note}`}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="title"
                      label="支出標題"
                      rules={[{ required: true, message: '請輸入支出標題' }]}
                    >
                      <Input placeholder="例如：晚餐、計程車費用、門票" />
                    </Form.Item>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="amount"
                        label="金額"
                        rules={[{ required: true, message: '請輸入金額' }]}
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
                          {Object.values(CurrencyType).map((currency) => (
                            <Option key={currency} value={currency}>
                              {currency}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">詳細資訊</h3>
                    
                    <Form.Item
                      name="expenseDate"
                      label="支出日期"
                      rules={[{ required: true, message: '請選擇支出日期' }]}
                    >
                      <DatePicker 
                        style={{ width: '100%' }} 
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="type"
                        label="支出類型"
                        rules={[{ required: true, message: '請選擇支出類型' }]}
                      >
                        <Select placeholder="選擇支出類型">
                          {Object.values(ExpenseType).map((type) => (
                            <Option key={type} value={type}>
                              {getExpenseTypeName(type)}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item
                        name="paymentMethod"
                        label="支付方式"
                        rules={[{ required: true, message: '請選擇支付方式' }]}
                      >
                        <Select placeholder="選擇支付方式">
                          {Object.values(PaymentMethod).map((method) => (
                            <Option key={method} value={method}>
                              {getPaymentMethodName(method)}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                    
                    <Form.Item
                      name="location"
                      label="地點"
                    >
                      <Input placeholder="輸入消費地點（選填）" />
                    </Form.Item>
                    
                    <Form.Item
                      name="notes"
                      label="備註"
                    >
                      <TextArea rows={3} placeholder="輸入備註說明（選填）" />
                    </Form.Item>
                    
                    <Form.Item
                      name="receipt"
                      label="收據照片"
                      valuePropName="fileList"
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) {
                          return e;
                        }
                        return e?.fileList;
                      }}
                    >
                      <Upload
                        name="receipt"
                        listType="picture"
                        beforeUpload={() => false}
                        maxCount={3}
                      >
                        <Button 
                          icon={<UploadOutlined />}
                          style={{
                            backgroundColor: '#f0f9ff',
                            borderColor: '#93c5fd',
                            color: '#2563eb',
                            fontWeight: '500',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          上傳收據照片（選填）
                        </Button>
                      </Upload>
                    </Form.Item>
                  </div>
                </div>
                
                <Divider />
                
                <Form.Item className="mb-0">
                  <Space size="middle">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={isSubmitting}
                      disabled={!selectedBudget}
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
                      {isEditMode ? '更新支出' : '記錄支出'}
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

export default ExpenseForm; 