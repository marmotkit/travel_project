import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Calendar, Badge, Select, Tag, Typography, Divider, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  CompassOutlined, TeamOutlined, GlobalOutlined, 
  CalendarOutlined, TrophyOutlined, FireOutlined,
  ClockCircleOutlined, CarOutlined, HomeFilled
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';

// 註冊 Chart.js 組件
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, ChartTooltip, ChartLegend);

const { Title, Text } = Typography;
const { Option } = Select;

interface YearlyDashboardProps {
  trips: any[];
}

interface YearStats {
  tripCount: number;
  totalDays: number;
  totalCountries: number;
  totalCities: number;
  totalMembers: number;
  tripTypes: Record<string, number>;
  monthlyTripData: number[];
}

const calculateYearlyStats = (trips: any[], year: string): YearStats => {
  // 過濾指定年份的旅行
  const yearTrips = trips.filter(trip => {
    const startDate = new Date(trip.startDate);
    return startDate.getFullYear().toString() === year;
  });

  // 計算不同的國家和城市
  const countries = new Set<string>();
  const cities = new Set<string>();
  yearTrips.forEach(trip => {
    const [city, country] = trip.destination.split(', ');
    if (country) countries.add(country);
    if (city) cities.add(city);
  });

  // 計算旅行天數
  const totalDays = yearTrips.reduce((total, trip) => {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return total + days;
  }, 0);

  // 計算旅行類型分佈
  const tripTypes: Record<string, number> = {};
  yearTrips.forEach(trip => {
    const type = trip.type || '未分類';
    tripTypes[type] = (tripTypes[type] || 0) + 1;
  });

  // 計算每月旅行次數
  const monthlyTripData = Array(12).fill(0);
  yearTrips.forEach(trip => {
    const startDate = new Date(trip.startDate);
    const month = startDate.getMonth(); // 0-11
    monthlyTripData[month] += 1;
  });

  // 計算參與的總人數
  const members = new Set<string>();
  yearTrips.forEach(trip => {
    if (Array.isArray(trip.members)) {
      trip.members.forEach((memberId: string) => members.add(memberId));
    }
  });

  return {
    tripCount: yearTrips.length,
    totalDays,
    totalCountries: countries.size,
    totalCities: cities.size,
    totalMembers: members.size,
    tripTypes,
    monthlyTripData,
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B66FF'];

const YearlyDashboard: React.FC<YearlyDashboardProps> = ({ trips }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [yearStats, setYearStats] = useState<YearStats | null>(null);

  // 產生年份選項
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
    if (trips.length > 0) {
      const stats = calculateYearlyStats(trips, selectedYear);
      setYearStats(stats);
    }
  }, [trips, selectedYear]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const monthlyChartData = {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    datasets: [
      {
        label: '旅行次數',
        data: yearStats?.monthlyTripData || Array(12).fill(0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const typeChartData = {
    labels: yearStats ? Object.keys(yearStats.tripTypes) : [],
    datasets: [
      {
        label: '旅行次數',
        data: yearStats ? Object.values(yearStats.tripTypes) : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
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

  if (!yearStats) {
    return <div>載入中...</div>;
  }

  return (
    <div className="yearly-dashboard">
      <div className="flex justify-between items-center mb-6">
        <Title level={4}>年度旅遊統計 - {selectedYear}年</Title>
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

      {/* 統計卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="總旅行次數" 
              value={yearStats?.tripCount || 0} 
              prefix={<CalendarOutlined />} 
              suffix="次"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="總旅行天數" 
              value={yearStats?.totalDays || 0} 
              prefix={<ClockCircleOutlined />}
              suffix="天"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="造訪國家/地區" 
              value={yearStats?.totalCountries || 0} 
              prefix={<GlobalOutlined />}
              suffix="個"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="造訪城市" 
              value={yearStats?.totalCities || 0} 
              prefix={<HomeFilled />}
              suffix="個"
            />
          </Card>
        </Col>
      </Row>

      {/* 圖表區域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="月度旅行分佈" className="mb-6">
            <Bar data={monthlyChartData} options={chartOptions} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="旅行類型分佈" className="mb-6">
            <Bar data={typeChartData} options={chartOptions} />
          </Card>
        </Col>
      </Row>

      {/* 日曆視圖 - 簡單展示哪些日期有旅行 */}
      <Card title="年度旅行日曆" className="mb-6">
        <Calendar 
          fullscreen={false}
          headerRender={({ value, onChange }) => {
            // 僅顯示月份，年份已在頁面頂部選擇
            const month = value.month() + 1;
            return (
              <div style={{ padding: 8 }}>
                <Select
                  value={month}
                  onChange={(newMonth: number) => {
                    const newValue = value.clone();
                    newValue.month(newMonth - 1);
                    onChange(newValue);
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(item => (
                    <Option key={item} value={item}>{item}月</Option>
                  ))}
                </Select>
              </div>
            );
          }}
          dateCellRender={(date) => {
            // 標記有旅行的日期
            const dateStr = date.format('YYYY-MM-DD');
            const hasTrip = trips.some(trip => {
              const startDate = trip.startDate;
              const endDate = trip.endDate;
              return dateStr >= startDate && dateStr <= endDate;
            });

            return hasTrip ? (
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mx-auto">
                {date.date()}
              </div>
            ) : date.date();
          }}
        />
      </Card>
    </div>
  );
};

export default YearlyDashboard; 