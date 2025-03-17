import React, { useState, useEffect } from 'react';
import { Tabs, Spin, Alert } from 'antd';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import YearlyDashboard from '../components/analytics/YearlyDashboard';
import YearlyExpenses from '../components/analytics/YearlyExpenses';
import TravelMap from '../components/analytics/TravelMap';
import TravelHabits from '../components/analytics/TravelHabits';
import { Typography } from 'antd';

const { Title } = Typography;

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(true);
  
  // 切換管理員模式
  const handleToggleAdmin = () => {
    setIsAdmin(!isAdmin);
  };

  // 載入數據
  useEffect(() => {
    try {
      // 從 localStorage 加載旅遊數據
      const tripsData = localStorage.getItem('trips');
      const parsedTrips = tripsData ? JSON.parse(tripsData) : [];
      setTrips(parsedTrips);

      // 從 localStorage 加載預算/開支數據
      const expensesData = localStorage.getItem('expenses');
      const budgetsData = localStorage.getItem('budgets');
      
      const parsedExpenses = expensesData ? JSON.parse(expensesData) : [];
      const parsedBudgets = budgetsData ? JSON.parse(budgetsData) : [];
      
      // 合併預算和開支數據
      const combinedFinancialData = [...parsedExpenses];
      if (parsedBudgets.length > 0) {
        parsedBudgets.forEach((budget: any) => {
          if (budget.expenses && budget.expenses.length > 0) {
            combinedFinancialData.push(...budget.expenses);
          }
        });
      }
      
      setExpenses(combinedFinancialData);
      setLoading(false);
    } catch (err) {
      console.error('加載報表數據時發生錯誤:', err);
      setError('無法加載報表數據。請稍後再試。');
      setLoading(false);
    }
  }, []);

  // 標籤頁切換事件
  const handleTabChange = (key: string) => {
    console.log('切換到標籤頁:', key);
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="報表分析" isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
          <div className="p-6 overflow-y-auto bg-gray-50 flex justify-center items-center">
            <Spin size="large" tip="載入報表數據中..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="報表分析" isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
          <div className="p-6 overflow-y-auto bg-gray-50">
            <Alert
              message="錯誤"
              description={error}
              type="error"
              showIcon
            />
          </div>
        </div>
      </div>
    );
  }

  // 如果沒有旅行數據，顯示提示
  if (trips.length === 0) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SideMenu isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="報表分析" isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
          <div className="p-6 overflow-y-auto bg-gray-50">
            <Alert
              message="無數據"
              description="目前沒有旅行數據可供分析。請先創建一些旅行計劃。"
              type="info"
              showIcon
            />
          </div>
        </div>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'dashboard',
      label: '年度旅遊看板',
      children: <YearlyDashboard trips={trips} />,
    },
    {
      key: 'expenses',
      label: '年度旅遊開支',
      children: <YearlyExpenses trips={trips} expenses={expenses} />,
    },
    {
      key: 'map',
      label: '世界地圖',
      children: <TravelMap trips={trips} />,
    },
    {
      key: 'habits',
      label: '旅遊習慣分析',
      children: <TravelHabits trips={trips} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="報表分析" isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
        <div className="p-6 overflow-y-auto bg-gray-50">
          <div className="container mx-auto">
            <Title level={2}>旅行數據分析</Title>
            <p className="text-gray-500 mb-6">
              查看您的旅行統計數據、開支分析和地理分佈。這些分析可幫助您更好地了解您的旅行習慣和模式。
            </p>
            <Tabs defaultActiveKey="dashboard" items={tabItems} onChange={handleTabChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 