import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Select, Empty, Table, Tag, Typography } from 'antd';
import { DollarOutlined, ShoppingOutlined, PercentageOutlined, WalletOutlined } from '@ant-design/icons';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// 註冊 Chart.js 組件
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const { Option } = Select;
const { Title: AntTitle } = Typography;

interface YearlyExpensesProps {
  trips: any[];
  expenses: any[];
}

interface YearExpenseStats {
  totalExpenses: number;
  byCategoryTotal: Record<string, number>;
  byTripTotal: Record<string, number>;
  tripNames: Record<string, string>;
  monthlyExpenses: number[];
  topExpenses: any[];
}

const calculateYearExpenseStats = (trips: any[], expenses: any[], year: string): YearExpenseStats => {
  // 過濾指定年份的旅行
  const yearTrips = trips.filter(trip => {
    const startDate = new Date(trip.startDate);
    return startDate.getFullYear().toString() === year;
  });
  
  // 獲取這些旅行的 ID
  const tripIds = yearTrips.map(trip => trip.id);
  
  // 獲取這些旅行相關的支出
  const yearExpenses = expenses.filter(expense => tripIds.includes(expense.tripId));

  // 計算總支出
  const totalExpenses = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // 按類別統計支出
  const byCategoryTotal: Record<string, number> = {};
  yearExpenses.forEach(expense => {
    const category = expense.category || '其他';
    byCategoryTotal[category] = (byCategoryTotal[category] || 0) + expense.amount;
  });
  
  // 按旅行統計支出
  const byTripTotal: Record<string, number> = {};
  const tripNames: Record<string, string> = {};
  yearExpenses.forEach(expense => {
    byTripTotal[expense.tripId] = (byTripTotal[expense.tripId] || 0) + expense.amount;
    
    // 獲取旅行名稱
    const trip = yearTrips.find(t => t.id === expense.tripId);
    if (trip) {
      tripNames[expense.tripId] = trip.title;
    }
  });
  
  // 按月份統計支出
  const monthlyExpenses = Array(12).fill(0);
  yearExpenses.forEach(expense => {
    const expenseDate = new Date(expense.date);
    const month = expenseDate.getMonth(); // 0-11
    monthlyExpenses[month] += expense.amount;
  });
  
  // 獲取前 10 筆最大支出
  const topExpenses = [...yearExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
  
  return {
    totalExpenses,
    byCategoryTotal,
    byTripTotal,
    tripNames,
    monthlyExpenses,
    topExpenses
  };
};

const YearlyExpenses: React.FC<YearlyExpensesProps> = ({ trips, expenses }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expenseStats, setExpenseStats] = useState<YearExpenseStats | null>(null);
  
  // 生成年份選項
  const generateYearOptions = () => {
    const years = new Set<string>();
    trips.forEach(trip => {
      const startDate = new Date(trip.startDate);
      years.add(startDate.getFullYear().toString());
    });
    
    // 確保至少有當前年份作為選項
    years.add(currentYear);
    
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };
  
  useEffect(() => {
    if (trips.length > 0 && expenses.length > 0) {
      const stats = calculateYearExpenseStats(trips, expenses, selectedYear);
      setExpenseStats(stats);
    }
  }, [trips, expenses, selectedYear]);
  
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };
  
  // 類別支出圖表數據
  const categoryChartData = {
    labels: expenseStats ? Object.keys(expenseStats.byCategoryTotal) : [],
    datasets: [
      {
        label: '支出金額',
        data: expenseStats ? Object.values(expenseStats.byCategoryTotal) : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(201, 203, 207, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(201, 203, 207, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // 月度支出圖表數據
  const monthlyChartData = {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    datasets: [
      {
        label: '支出金額',
        data: expenseStats?.monthlyExpenses || Array(12).fill(0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };
  
  // 頂部支出列表欄位
  const topExpenseColumns = [
    {
      title: '旅行',
      dataIndex: 'tripId',
      key: 'trip',
      render: (tripId: string) => expenseStats?.tripNames[tripId] || '未知旅行',
    },
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={
          category === '交通' ? 'blue' :
          category === '住宿' ? 'green' :
          category === '餐飲' ? 'orange' :
          category === '景點' ? 'purple' :
          category === '購物' ? 'red' :
          category === '活動' ? 'cyan' :
          'default'
        }>
          {category}
        </Tag>
      ),
    },
    {
      title: '項目',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as 'right',
      render: (amount: number) => `NT$ ${amount.toLocaleString()}`,
    },
  ];
  
  // 旅行支出對比數據
  const tripExpenseData = expenseStats 
    ? Object.entries(expenseStats.byTripTotal)
        .map(([tripId, amount]) => ({
          tripId,
          tripName: expenseStats.tripNames[tripId] || '未知旅行',
          amount
        }))
        .sort((a, b) => b.amount - a.amount)
    : [];
  
  if (!expenseStats) {
    return <div>載入中...</div>;
  }
  
  // 計算類別百分比
  const categoryPercentages = Object.entries(expenseStats.byCategoryTotal).map(([category, amount]) => ({
    category,
    amount,
    percentage: (amount / expenseStats.totalExpenses * 100).toFixed(1)
  })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  
  return (
    <div className="yearly-expenses">
      <div className="flex justify-between items-center mb-6">
        <AntTitle level={4}>年度旅遊開支分析 - {selectedYear}年</AntTitle>
        <Select 
          style={{ width: 120 }} 
          value={selectedYear} 
          onChange={handleYearChange}
        >
          {generateYearOptions().map(year => (
            <Option key={year} value={year}>{year}年</Option>
          ))}
        </Select>
      </div>
      
      {/* 總計統計資訊 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="總支出" 
              value={expenseStats.totalExpenses} 
              precision={0}
              prefix={<DollarOutlined />} 
              suffix="NT$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="最大類別支出" 
              value={categoryPercentages.length > 0 ? categoryPercentages[0].amount : 0} 
              precision={0}
              prefix={<ShoppingOutlined />}
              suffix="NT$"
            />
            <div className="text-xs text-gray-500 mt-1">
              {categoryPercentages.length > 0 ? categoryPercentages[0].category : '無數據'}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="平均每趟花費" 
              value={Object.keys(expenseStats.byTripTotal).length > 0 
                ? expenseStats.totalExpenses / Object.keys(expenseStats.byTripTotal).length 
                : 0
              } 
              precision={0}
              prefix={<PercentageOutlined />}
              suffix="NT$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="平均每月花費" 
              value={expenseStats.totalExpenses / 12} 
              precision={0}
              prefix={<WalletOutlined />}
              suffix="NT$"
            />
          </Card>
        </Col>
      </Row>
      
      {/* 圖表區域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="類別支出分布" className="mb-6">
            <Pie data={categoryChartData} options={chartOptions} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="月度支出趨勢" className="mb-6">
            <Bar data={monthlyChartData} options={chartOptions} />
          </Card>
        </Col>
      </Row>
      
      {/* 類別佔比 */}
      <Card title="支出類別分析" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryPercentages.map(item => (
            <div key={item.category} className="bg-gray-50 p-3 rounded">
              <div className="flex justify-between items-center">
                <div className="font-medium text-gray-800">{item.category}</div>
                <div className="text-gray-500 text-sm">{item.percentage}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <div className="text-right text-gray-700 mt-1">NT$ {item.amount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* 旅行支出對比 */}
      <Card title="旅行支出對比" className="mb-6">
        {tripExpenseData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">旅行</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支出</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">佔比</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tripExpenseData.map((trip, index) => (
                  <tr key={trip.tripId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trip.tripName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">NT$ {trip.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[200px]">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(trip.amount / expenseStats.totalExpenses * 100)}%` }}
                          ></div>
                        </div>
                        <span>{(trip.amount / expenseStats.totalExpenses * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty description="無旅行支出數據" />
        )}
      </Card>
      
      {/* 最大支出項目 */}
      <Card title="最大支出項目 Top 10" className="mb-6">
        {expenseStats.topExpenses.length > 0 ? (
          <Table 
            columns={topExpenseColumns} 
            dataSource={expenseStats.topExpenses.map(expense => ({ ...expense, key: expense.id }))} 
            pagination={false}
          />
        ) : (
          <Empty description="無支出數據" />
        )}
      </Card>
    </div>
  );
};

export default YearlyExpenses; 