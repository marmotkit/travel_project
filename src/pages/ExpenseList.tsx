import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { Table, Button, Tag, Space, Popconfirm, Select, Input, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BudgetCategoryType, CurrencyType } from './Budget';
import { ExpenseType, PaymentMethod } from './ExpenseForm';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

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

// 定義支出顯示資料介面，包含額外的展示資訊
interface ExpenseDisplay extends Expense {
  categoryName: string;
  categoryType: BudgetCategoryType;
  expenseDateObj: dayjs.Dayjs;
}

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const { budgetId } = useParams<{ budgetId: string }>();
  
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<ExpenseDisplay[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseDisplay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 過濾狀態
  const [searchText, setSearchText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ExpenseType | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
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
  
  // 載入預算和支出資料
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // 載入預算資料
        const budgetsData = localStorage.getItem('budgets');
        if (budgetsData) {
          const budgets: Budget[] = JSON.parse(budgetsData);
          const currentBudget = budgets.find((b) => b.id === budgetId);
          
          if (currentBudget) {
            setBudget(currentBudget);
            
            // 載入支出資料
            const expensesData = localStorage.getItem('expenses');
            if (expensesData) {
              const allExpenses: Expense[] = JSON.parse(expensesData);
              const budgetExpenses = allExpenses.filter((expense) => expense.budgetId === budgetId);
              
              // 處理展示資料
              const displayExpenses: ExpenseDisplay[] = budgetExpenses.map((expense) => {
                const category = currentBudget.categories.find((cat) => cat.id === expense.categoryId);
                
                return {
                  ...expense,
                  categoryName: category ? getBudgetCategoryName(category.type) : '未知類別',
                  categoryType: category ? category.type : BudgetCategoryType.MISCELLANEOUS,
                  expenseDateObj: dayjs(expense.expenseDate)
                };
              });
              
              setExpenses(displayExpenses);
              setFilteredExpenses(displayExpenses);
            }
          } else {
            // 找不到預算，返回預算列表
            navigate('/budgets');
          }
        }
      } catch (error) {
        console.error('載入資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (budgetId) {
      loadData();
    }
  }, [budgetId, navigate]);
  
  // 應用過濾器
  useEffect(() => {
    let result = [...expenses];
    
    // 應用文字搜尋過濾
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      result = result.filter((expense) => 
        expense.title.toLowerCase().includes(lowerSearchText) ||
        expense.location.toLowerCase().includes(lowerSearchText) ||
        expense.notes.toLowerCase().includes(lowerSearchText)
      );
    }
    
    // 應用類別過濾
    if (categoryFilter) {
      result = result.filter((expense) => expense.categoryType === categoryFilter);
    }
    
    // 應用類型過濾
    if (typeFilter) {
      result = result.filter((expense) => expense.type === typeFilter);
    }
    
    // 應用日期過濾
    if (dateRange && dateRange[0] && dateRange[1]) {
      result = result.filter((expense) => {
        const expenseDate = expense.expenseDateObj;
        return expenseDate.isAfter(dateRange[0], 'day') && expenseDate.isBefore(dateRange[1], 'day') || 
               expenseDate.isSame(dateRange[0], 'day') || expenseDate.isSame(dateRange[1], 'day');
      });
    }
    
    setFilteredExpenses(result);
  }, [expenses, searchText, categoryFilter, typeFilter, dateRange]);
  
  // 添加新支出
  const handleAddExpense = () => {
    navigate(`/expenses/new?budgetId=${budgetId}`);
  };
  
  // 編輯支出
  const handleEditExpense = (expenseId: string) => {
    navigate(`/expenses/${expenseId}/edit`);
  };
  
  // 刪除支出
  const handleDeleteExpense = async (expense: ExpenseDisplay) => {
    try {
      // 從本地儲存讀取現有支出
      const expensesData = localStorage.getItem('expenses');
      if (!expensesData) return;
      
      let expenses: Expense[] = JSON.parse(expensesData);
      
      // 從支出列表刪除
      expenses = expenses.filter((e) => e.id !== expense.id);
      
      // 更新預算中的已使用金額
      const budgetsData = localStorage.getItem('budgets');
      if (!budgetsData) return;
      
      let budgets: Budget[] = JSON.parse(budgetsData);
      const budgetIndex = budgets.findIndex((b) => b.id === expense.budgetId);
      
      if (budgetIndex !== -1) {
        const categoryIndex = budgets[budgetIndex].categories.findIndex((c) => c.id === expense.categoryId);
        
        if (categoryIndex !== -1) {
          // 從類別已使用金額中減去支出金額
          budgets[budgetIndex].categories[categoryIndex].spentAmount -= expense.amount;
        }
      }
      
      // 儲存更新後的資料
      localStorage.setItem('expenses', JSON.stringify(expenses));
      localStorage.setItem('budgets', JSON.stringify(budgets));
      
      // 刷新頁面資料
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    } catch (error) {
      console.error('刪除支出失敗:', error);
    }
  };
  
  // 返回預算頁面
  const handleBack = () => {
    navigate('/budgets');
  };
  
  // 匯出為 CSV
  const handleExport = () => {
    if (filteredExpenses.length === 0) return;
    
    const headers = ['支出標題', '金額', '貨幣', '類別', '支出日期', '支出類型', '支付方式', '地點', '備註'];
    const csvContent = filteredExpenses.map((expense) => {
      return [
        expense.title,
        expense.amount.toString(),
        expense.currency,
        expense.categoryName,
        expense.expenseDate,
        getExpenseTypeName(expense.type),
        getPaymentMethodName(expense.paymentMethod),
        expense.location,
        expense.notes
      ].join(',');
    });
    
    const csv = [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `支出記錄_${budget?.title || 'export'}_${dayjs().format('YYYYMMDD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 清除過濾器
  const handleClearFilters = () => {
    setSearchText('');
    setCategoryFilter(null);
    setTypeFilter(null);
    setDateRange(null);
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
  
  const columns = [
    {
      title: '支出日期',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      sorter: (a: ExpenseDisplay, b: ExpenseDisplay) => 
        dayjs(a.expenseDate).unix() - dayjs(b.expenseDate).unix(),
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '支出標題',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '類別',
      dataIndex: 'categoryName',
      key: 'categoryName',
      filters: budget?.categories.map((category) => ({
        text: getBudgetCategoryName(category.type),
        value: category.type
      })) || [],
      onFilter: (value: boolean | React.Key, record: ExpenseDisplay) => record.categoryType === value as string,
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: ExpenseDisplay, b: ExpenseDisplay) => a.amount - b.amount,
      render: (amount: number, record: ExpenseDisplay) => 
        `${amount.toLocaleString()} ${record.currency}`
    },
    {
      title: '支出類型',
      dataIndex: 'type',
      key: 'type',
      render: (type: ExpenseType) => {
        let color = type === ExpenseType.ACTUAL ? 'green' : 'blue';
        return (
          <Tag color={color}>
            {getExpenseTypeName(type)}
          </Tag>
        );
      },
      filters: [
        { text: '實際支出', value: ExpenseType.ACTUAL },
        { text: '計劃支出', value: ExpenseType.PLANNED }
      ],
      onFilter: (value: boolean | React.Key, record: ExpenseDisplay) => record.type === value as string,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: PaymentMethod) => getPaymentMethodName(method),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ExpenseDisplay) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditExpense(record.id)}
          />
          <Popconfirm
            title="確定要刪除此支出記錄嗎？"
            onConfirm={() => handleDeleteExpense(record)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`支出記錄 - ${budget?.title || ''}`} isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
            >
              返回預算列表
            </Button>
            
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddExpense}
              >
                新增支出
              </Button>
              <Button 
                icon={<FileExcelOutlined />} 
                onClick={handleExport}
                disabled={filteredExpenses.length === 0}
              >
                匯出 CSV
              </Button>
            </Space>
          </div>
          
          {budget && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-500">總預算：</span>
                  <span className="font-medium">
                    {budget.totalAmount.toLocaleString()} {budget.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">額外預算：</span>
                  <span className="font-medium">
                    {budget.extraBudget.toLocaleString()} {budget.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">實際支出：</span>
                  <span className="font-medium">
                    {expenses
                      .filter(e => e.type === ExpenseType.ACTUAL)
                      .reduce((sum, expense) => sum + expense.amount, 0)
                      .toLocaleString()} {budget.currency}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">計劃支出：</span>
                  <span className="font-medium">
                    {expenses
                      .filter(e => e.type === ExpenseType.PLANNED)
                      .reduce((sum, expense) => sum + expense.amount, 0)
                      .toLocaleString()} {budget.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Search
                  placeholder="搜尋支出標題、地點或備註"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                
                <Select
                  placeholder="選擇支出類別"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {Object.values(BudgetCategoryType).map((type) => (
                    <Option key={type} value={type}>
                      {getBudgetCategoryName(type)}
                    </Option>
                  ))}
                </Select>
                
                <Select
                  placeholder="選擇支出類型"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {Object.values(ExpenseType).map((type) => (
                    <Option key={type} value={type}>
                      {getExpenseTypeName(type)}
                    </Option>
                  ))}
                </Select>
                
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div className="mt-2 flex justify-end">
                <Button onClick={handleClearFilters}>清除過濾器</Button>
              </div>
            </div>
            
            <Table
              columns={columns}
              dataSource={filteredExpenses}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 筆支出記錄`
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div className="p-2">
                    <p><strong>地點：</strong> {record.location || '未指定'}</p>
                    <p><strong>備註：</strong> {record.notes || '無'}</p>
                    {record.receipt && record.receipt.length > 0 && (
                      <div className="mt-2">
                        <p><strong>收據：</strong></p>
                        <div className="flex mt-1">
                          {record.receipt.map((item: any, index: number) => (
                            <div key={index} className="mr-2">
                              {/* 實際項目中應處理收據照片的顯示 */}
                              <span>收據 {index + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseList; 