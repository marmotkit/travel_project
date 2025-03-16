import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { Card, Row, Col, Statistic, Progress, Button, Empty, Tabs, Divider } from 'antd';
import { ArrowLeftOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { BudgetCategoryType, CurrencyType } from './Budget';
import { ExpenseType } from './ExpenseForm';
import dayjs from 'dayjs';
import { findMinDate, findMaxDate } from '../utils/dayjs-utils';

// 在實際項目中，這裡會導入圖表庫，如 Recharts 或 Chart.js
// 這裡使用簡化的展示方法

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
  paymentMethod: string;
  location: string;
  notes: string;
  receipt: any[];
  createdAt: string;
  updatedAt: string;
}

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

const BudgetAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { budgetId } = useParams<{ budgetId: string }>();
  
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tabActiveKey, setTabActiveKey] = useState<string>('overview');
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
              setExpenses(budgetExpenses);
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
  
  // 返回預算頁面
  const handleBack = () => {
    navigate(`/budgets`);
  };
  
  // 計算總預算使用率
  const calculateTotalUsagePercentage = (): number => {
    if (!budget) return 0;
    
    const totalBudget = budget.totalAmount + budget.extraBudget;
    if (totalBudget === 0) return 0;
    
    const totalSpent = expenses
      .filter(e => e.type === ExpenseType.ACTUAL)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    return Math.min(Math.round((totalSpent / totalBudget) * 100), 100);
  };
  
  // 計算各類別預算使用率
  const calculateCategoryUsagePercentage = (category: BudgetCategory): number => {
    if (category.amount === 0) return 0;
    return Math.min(Math.round((category.spentAmount / category.amount) * 100), 100);
  };
  
  // 計算日均支出
  const calculateDailyAverage = (): number => {
    if (!budget || expenses.length === 0) return 0;
    
    const actualExpenses = expenses.filter(e => e.type === ExpenseType.ACTUAL);
    if (actualExpenses.length === 0) return 0;
    
    // 獲取最早和最晚支出日期
    const dates = actualExpenses.map(e => dayjs(e.expenseDate));
    const minDate = findMinDate(dates) || dayjs();
    const maxDate = findMaxDate(dates) || dayjs();
    
    // 計算天數差異，至少為1天
    const daysDiff = Math.max(1, maxDate.diff(minDate, 'day') + 1);
    
    // 計算平均每日支出
    const totalSpent = actualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return Math.round(totalSpent / daysDiff);
  };
  
  // 計算預算進度
  const getBudgetProgress = (): number => {
    if (!budget) return 0;
    
    const actualExpenses = expenses.filter(e => e.type === ExpenseType.ACTUAL);
    const totalSpent = actualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalBudget = budget.totalAmount + budget.extraBudget;
    
    return Math.min(Math.round((totalSpent / totalBudget) * 100), 100);
  };
  
  // 獲取進度條顏色
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return '#f5222d'; // 紅色
    if (percentage >= 80) return '#fa8c16'; // 橙色
    return '#52c41a'; // 綠色
  };
  
  // 計算剩餘預算
  const getRemainingBudget = (): number => {
    if (!budget) return 0;
    
    const actualExpenses = expenses.filter(e => e.type === ExpenseType.ACTUAL);
    const totalSpent = actualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return Math.max(0, (budget.totalAmount + budget.extraBudget) - totalSpent);
  };
  
  // 計算已使用預算
  const getUsedBudget = (): number => {
    if (!budget) return 0;
    
    const actualExpenses = expenses.filter(e => e.type === ExpenseType.ACTUAL);
    return actualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };
  
  // 計算計劃支出總額
  const getPlannedExpensesTotal = (): number => {
    return expenses
      .filter(e => e.type === ExpenseType.PLANNED)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };
  
  // 計算總預算
  const getTotalBudget = (): number => {
    if (!budget) return 0;
    return budget.totalAmount + budget.extraBudget;
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
  
  // 按日期分組的日支出趨勢數據
  const getDailyExpenseData = () => {
    if (!expenses || expenses.length === 0) {
      return [];
    }
    
    // 只考慮實際支出
    const actualExpenses = expenses.filter(e => e.type === ExpenseType.ACTUAL);
    if (actualExpenses.length === 0) {
      return [];
    }
    
    // 獲取最早和最晚支出日期
    const dates = actualExpenses.map(e => dayjs(e.expenseDate));
    const minDate = findMinDate(dates) || dayjs();
    const maxDate = findMaxDate(dates) || dayjs();
    
    // 計算天數差異，至少為1天
    const daysDiff = Math.max(1, maxDate.diff(minDate, 'day') + 1);
    
    // 生成所有日期的資料
    const result = [];
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = minDate.add(i, 'day');
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayExpenses = actualExpenses.filter(e => dayjs(e.expenseDate).format('YYYY-MM-DD') === dateStr);
      const totalAmount = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      result.push({
        date: dateStr,
        amount: totalAmount,
        count: dayExpenses.length
      });
    }
    
    return result;
  };
  
  // 獲取類別支出數據
  const getCategoryExpenseData = () => {
    if (!budget) return [];
    
    const result: { category: string; amount: number; budget: number; percentage: number }[] = [];
    
    budget.categories.forEach(category => {
      const spentAmount = category.spentAmount;
      const percentage = calculateCategoryUsagePercentage(category);
      
      result.push({
        category: getBudgetCategoryName(category.type),
        amount: spentAmount,
        budget: category.amount,
        percentage
      });
    });
    
    return result.sort((a, b) => b.amount - a.amount);
  };
  
  // 日支出趨勢展示組件（簡化版，實際應使用圖表庫）
  const DailyExpenseTrend: React.FC = () => {
    const data = getDailyExpenseData();
    
    if (data.length === 0) {
      return <Empty description="暫無支出數據" />;
    }
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">每日支出趨勢</h3>
        <div className="border rounded-md overflow-hidden">
          {data.map((item, index) => {
            const maxAmount = Math.max(...data.map(d => d.amount));
            const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
            
            return (
              <div key={index} className="flex items-center p-2 border-b last:border-0">
                <div className="w-24">{dayjs(item.date).format('MM-DD')}</div>
                <div className="flex-1 mx-2">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  {item.amount.toLocaleString()} {budget?.currency}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 類別支出比例展示組件（簡化版，實際應使用圖表庫）
  const CategoryExpenseChart: React.FC = () => {
    const data = getCategoryExpenseData();
    
    if (data.length === 0) {
      return <Empty description="暫無分類支出數據" />;
    }
    
    const colors = [
      '#1890ff', '#52c41a', '#faad14', '#f5222d', 
      '#722ed1', '#13c2c2', '#eb2f96', '#fadb14'
    ];
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">支出類別分佈</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="border rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{item.category}</span>
                <span className="text-gray-500">
                  {item.amount.toLocaleString()} / {item.budget.toLocaleString()} {budget?.currency}
                </span>
              </div>
              <Progress 
                percent={item.percentage} 
                strokeColor={colors[index % colors.length]} 
                status={item.percentage >= 100 ? 'exception' : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`預算分析 - ${budget?.title || ''}`} isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
            >
              返回預算列表
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">載入中...</div>
          ) : (
            budget ? (
              <div>
                <Tabs 
                  activeKey={tabActiveKey} 
                  onChange={setTabActiveKey}
                  className="bg-white rounded-lg shadow"
                >
                  <Tabs.TabPane tab="預算概覽" key="overview">
                    <div className="p-4">
                      <Row gutter={16}>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="總預算"
                              value={getTotalBudget()}
                              precision={0}
                              valueStyle={{ color: '#3f8600' }}
                              suffix={budget.currency}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="已使用"
                              value={getUsedBudget()}
                              precision={0}
                              valueStyle={{ color: '#cf1322' }}
                              suffix={budget.currency}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="剩餘預算"
                              value={getRemainingBudget()}
                              precision={0}
                              valueStyle={{ color: '#1890ff' }}
                              suffix={budget.currency}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="計劃支出"
                              value={getPlannedExpensesTotal()}
                              precision={0}
                              valueStyle={{ color: '#722ed1' }}
                              suffix={budget.currency}
                            />
                          </Card>
                        </Col>
                      </Row>
                      
                      <div className="mt-6 bg-white p-4 rounded-lg border">
                        <h3 className="text-lg font-medium mb-2">預算使用進度</h3>
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span>
                              {getUsedBudget().toLocaleString()} / {getTotalBudget().toLocaleString()} {budget.currency}
                            </span>
                            <span>{getBudgetProgress()}%</span>
                          </div>
                          <Progress 
                            percent={getBudgetProgress()} 
                            strokeColor={getProgressColor(getBudgetProgress())}
                            status={getBudgetProgress() >= 100 ? 'exception' : undefined}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <Card className="bg-gray-50">
                            <Statistic
                              title="日均支出"
                              value={calculateDailyAverage()}
                              precision={0}
                              valueStyle={{ color: '#1890ff' }}
                              suffix={budget.currency}
                            />
                          </Card>
                          <Card className="bg-gray-50">
                            <Statistic
                              title="預算使用率"
                              value={calculateTotalUsagePercentage()}
                              precision={0}
                              valueStyle={{ 
                                color: getProgressColor(calculateTotalUsagePercentage()) 
                              }}
                              suffix="%"
                              prefix={
                                calculateTotalUsagePercentage() > 100 ? 
                                <ArrowUpOutlined /> : <ArrowDownOutlined />
                              }
                            />
                          </Card>
                          <Card className="bg-gray-50">
                            <Statistic
                              title="記錄支出筆數"
                              value={expenses.filter(e => e.type === ExpenseType.ACTUAL).length}
                              precision={0}
                            />
                          </Card>
                          <Card className="bg-gray-50">
                            <Statistic
                              title="類別數量"
                              value={budget.categories.length}
                              precision={0}
                            />
                          </Card>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <CategoryExpenseChart />
                      </div>
                      
                      <div className="mt-6">
                        <DailyExpenseTrend />
                      </div>
                    </div>
                  </Tabs.TabPane>
                  
                  <Tabs.TabPane tab="分類分析" key="category">
                    <div className="p-4">
                      <h2 className="text-xl font-semibold mb-4">預算分類分析</h2>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {budget.categories.map((category, index) => {
                          const percentage = calculateCategoryUsagePercentage(category);
                          const color = getProgressColor(percentage);
                          
                          // 找出該類別的所有支出
                          const categoryExpenses = expenses.filter(e => e.categoryId === category.id);
                          const actualExpenses = categoryExpenses.filter(e => e.type === ExpenseType.ACTUAL);
                          const plannedExpenses = categoryExpenses.filter(e => e.type === ExpenseType.PLANNED);
                          
                          return (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">
                                  {getBudgetCategoryName(category.type)}
                                </h3>
                                <div>
                                  <span className="text-gray-500 mr-2">
                                    預算: {category.amount.toLocaleString()} {budget.currency}
                                  </span>
                                  <span className={`font-medium ${percentage >= 100 ? 'text-red-500' : 'text-green-500'}`}>
                                    使用率: {percentage}%
                                  </span>
                                </div>
                              </div>
                              
                              <Progress 
                                percent={percentage} 
                                strokeColor={color}
                                status={percentage >= 100 ? 'exception' : undefined}
                              />
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <Card size="small">
                                  <Statistic
                                    title="已使用"
                                    value={category.spentAmount}
                                    precision={0}
                                    valueStyle={{ color: '#cf1322' }}
                                    suffix={budget.currency}
                                  />
                                </Card>
                                <Card size="small">
                                  <Statistic
                                    title="剩餘"
                                    value={Math.max(0, category.amount - category.spentAmount)}
                                    precision={0}
                                    valueStyle={{ color: '#3f8600' }}
                                    suffix={budget.currency}
                                  />
                                </Card>
                                <Card size="small">
                                  <Statistic
                                    title="支出筆數"
                                    value={actualExpenses.length}
                                    precision={0}
                                  />
                                </Card>
                              </div>
                              
                              {categoryExpenses.length > 0 && (
                                <div className="mt-4">
                                  <Divider orientation="left">支出明細</Divider>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {actualExpenses.slice(0, 5).map((expense, idx) => (
                                      <li key={idx}>
                                        <span className="mr-2">{dayjs(expense.expenseDate).format('MM-DD')}</span>
                                        <span className="mr-2">{expense.title}</span>
                                        <span className="font-medium">
                                          {expense.amount.toLocaleString()} {expense.currency}
                                        </span>
                                      </li>
                                    ))}
                                    {actualExpenses.length > 5 && (
                                      <li className="text-gray-500">
                                        ...還有 {actualExpenses.length - 5} 筆支出
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              
                              {plannedExpenses.length > 0 && (
                                <div className="mt-4">
                                  <Divider orientation="left">計劃支出</Divider>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {plannedExpenses.slice(0, 3).map((expense, idx) => (
                                      <li key={idx}>
                                        <span className="mr-2">{dayjs(expense.expenseDate).format('MM-DD')}</span>
                                        <span className="mr-2">{expense.title}</span>
                                        <span className="font-medium">
                                          {expense.amount.toLocaleString()} {expense.currency}
                                        </span>
                                      </li>
                                    ))}
                                    {plannedExpenses.length > 3 && (
                                      <li className="text-gray-500">
                                        ...還有 {plannedExpenses.length - 3} 筆計劃支出
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-8">
                <Empty description="找不到預算資料" />
                <Button 
                  type="primary" 
                  onClick={handleBack}
                  className="mt-4"
                >
                  返回預算列表
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalysis; 