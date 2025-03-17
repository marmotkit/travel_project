import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Row, Col, Select, Tabs, Statistic, Empty, Divider, List, Tag 
} from 'antd';
import { 
  ClockCircleOutlined, TeamOutlined, CarOutlined, HomeOutlined, 
  CalendarOutlined, GlobalOutlined, UserOutlined 
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface TravelHabitsProps {
  trips: any[];
}

interface DurationStats {
  averageDuration: number;
  shortestTrip: number;
  longestTrip: number;
  mostCommonDuration: number;
  durationDistribution: { [key: string]: number };
}

interface SeasonStats {
  spring: number;
  summer: number;
  autumn: number;
  winter: number;
}

interface CompanionStats {
  solo: number;
  family: number;
  friends: number;
  partner: number;
  business: number;
  other: number;
  averageGroupSize: number;
}

interface TransportStats {
  [key: string]: number;
}

interface AccommodationStats {
  [key: string]: number;
}

interface HabitStats {
  averageStayDuration: number;
  transportPreference: Record<string, number>;
  accommodationPreference: Record<string, number>;
  travelTypePreference: Record<string, number>;
  seasonPreference: Record<string, number>;
  companionStats: {
    solo: number;
    group: number;
    averageGroupSize: number;
    family?: number;
    friends?: number;
    partner?: number;
    business?: number;
    other?: number;
  };
}

// 分析旅行時長
const analyzeDuration = (trips: any[]): DurationStats => {
  if (trips.length === 0) {
    return {
      averageDuration: 0,
      shortestTrip: 0,
      longestTrip: 0,
      mostCommonDuration: 0,
      durationDistribution: {}
    };
  }

  // 計算每個旅行的持續時間
  const durations = trips.map(trip => {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
  });

  // 計算平均持續時間
  const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

  // 找出最短和最長旅行
  const shortestTrip = Math.min(...durations);
  const longestTrip = Math.max(...durations);

  // 持續時間分佈
  const durationDistribution: { [key: string]: number } = {};
  durations.forEach(duration => {
    let category;
    if (duration <= 3) category = '1-3天';
    else if (duration <= 7) category = '4-7天';
    else if (duration <= 14) category = '8-14天';
    else category = '15+天';

    durationDistribution[category] = (durationDistribution[category] || 0) + 1;
  });

  // 找出最常見的持續時間
  let mostCommonDuration = 0;
  let maxCount = 0;
  Object.entries(durationDistribution).forEach(([duration, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonDuration = parseInt(duration);
    }
  });

  return {
    averageDuration,
    shortestTrip,
    longestTrip,
    mostCommonDuration,
    durationDistribution
  };
};

// 分析季節偏好
const analyzeSeasons = (trips: any[]): SeasonStats => {
  const seasons: SeasonStats = {
    spring: 0, // 3-5
    summer: 0, // 6-8
    autumn: 0, // 9-11
    winter: 0  // 12-2
  };

  trips.forEach(trip => {
    const month = new Date(trip.startDate).getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) seasons.spring += 1;
    else if (month >= 6 && month <= 8) seasons.summer += 1;
    else if (month >= 9 && month <= 11) seasons.autumn += 1;
    else seasons.winter += 1;
  });

  return seasons;
};

// 分析同伴類型
const analyzeCompanions = (trips: any[]): CompanionStats => {
  const stats: CompanionStats = {
    solo: 0,
    family: 0,
    friends: 0,
    partner: 0,
    business: 0,
    other: 0,
    averageGroupSize: 0
  };

  let totalMembers = 0;

  trips.forEach(trip => {
    if (trip.companionType) {
      switch (trip.companionType.toLowerCase()) {
        case 'solo':
        case '個人':
          stats.solo += 1;
          break;
        case 'family':
        case '家庭':
          stats.family += 1;
          break;
        case 'friends':
        case '朋友':
          stats.friends += 1;
          break;
        case 'partner':
        case '伴侶':
          stats.partner += 1;
          break;
        case 'business':
        case '商務':
          stats.business += 1;
          break;
        default:
          stats.other += 1;
      }
    } else {
      stats.other += 1;
    }

    if (trip.members && Array.isArray(trip.members)) {
      totalMembers += trip.members.length;
    } else if (trip.memberCount) {
      totalMembers += trip.memberCount;
    } else {
      totalMembers += 1; // 假設至少有一人（用戶本人）
    }
  });

  stats.averageGroupSize = trips.length > 0 ? totalMembers / trips.length : 0;

  return stats;
};

// 分析交通方式
const analyzeTransport = (trips: any[]): TransportStats => {
  const stats: TransportStats = {};

  trips.forEach(trip => {
    if (trip.transport) {
      const transport = trip.transport;
      stats[transport] = (stats[transport] || 0) + 1;
    }
  });

  return stats;
};

// 分析住宿類型
const analyzeAccommodation = (trips: any[]): AccommodationStats => {
  const stats: AccommodationStats = {};

  trips.forEach(trip => {
    if (trip.accommodation) {
      const accommodation = trip.accommodation;
      stats[accommodation] = (stats[accommodation] || 0) + 1;
    }
  });

  return stats;
};

// 生成圖表所需的數據格式
const generateChartData = (data: { [key: string]: number }): { name: string; value: number }[] => {
  return Object.entries(data).map(([name, value]) => ({ name, value }));
};

// 定義圖表顏色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B66FF'];

const calculateHabitStats = (trips: any[]): HabitStats => {
  // 計算平均停留時間
  let totalDays = 0;
  trips.forEach(trip => {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalDays += days;
  });
  const averageStayDuration = trips.length > 0 ? totalDays / trips.length : 0;
  
  // 交通偏好統計
  const transportPreference: Record<string, number> = {};
  trips.forEach(trip => {
    const transport = trip.transport || '未指定';
    transportPreference[transport] = (transportPreference[transport] || 0) + 1;
  });
  
  // 住宿偏好統計
  const accommodationPreference: Record<string, number> = {};
  trips.forEach(trip => {
    const accommodation = trip.accommodation || '未指定';
    accommodationPreference[accommodation] = (accommodationPreference[accommodation] || 0) + 1;
  });
  
  // 旅行類型偏好
  const travelTypePreference: Record<string, number> = {};
  trips.forEach(trip => {
    const type = trip.type || '未分類';
    travelTypePreference[type] = (travelTypePreference[type] || 0) + 1;
  });
  
  // 季節偏好
  const seasonPreference: Record<string, number> = {
    '春季': 0,
    '夏季': 0,
    '秋季': 0,
    '冬季': 0
  };
  trips.forEach(trip => {
    const startDate = new Date(trip.startDate);
    const month = startDate.getMonth();
    
    // 按北半球季節劃分
    if (month >= 2 && month <= 4) {
      seasonPreference['春季'] += 1;
    } else if (month >= 5 && month <= 7) {
      seasonPreference['夏季'] += 1;
    } else if (month >= 8 && month <= 10) {
      seasonPreference['秋季'] += 1;
    } else {
      seasonPreference['冬季'] += 1;
    }
  });
  
  // 同伴統計
  let soloTrips = 0;
  let groupTrips = 0;
  let totalMembers = 0;
  
  trips.forEach(trip => {
    const memberCount = trip.memberCount || (trip.members ? trip.members.length : 1);
    
    if (memberCount <= 1) {
      soloTrips += 1;
    } else {
      groupTrips += 1;
      totalMembers += memberCount;
    }
  });
  
  return {
    averageStayDuration,
    transportPreference,
    accommodationPreference,
    travelTypePreference,
    seasonPreference,
    companionStats: {
      solo: soloTrips,
      group: groupTrips,
      averageGroupSize: groupTrips > 0 ? totalMembers / groupTrips : 0
    }
  };
};

// 輔助函數：計算百分比
const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};

// 輔助函數：獲取前 N 個偏好項目
const getTopPreferences = (preferences: Record<string, number>, limit: number = 3): Array<{name: string, count: number, percentage: number}> => {
  const total = Object.values(preferences).reduce((sum, count) => sum + count, 0);
  
  return Object.entries(preferences)
    .map(([name, count]) => ({
      name,
      count,
      percentage: calculatePercentage(count, total)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

const TravelHabits: React.FC<TravelHabitsProps> = ({ trips }) => {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  
  const [durationStats, setDurationStats] = useState<DurationStats | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [companionStats, setCompanionStats] = useState<CompanionStats | null>(null);
  const [transportStats, setTransportStats] = useState<TransportStats | null>(null);
  const [accommodationStats, setAccommodationStats] = useState<AccommodationStats | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats | null>(null);

  // 初始化數據
  useEffect(() => {
    // 收集所有年份
    const uniqueYears = new Set<number>();
    trips.forEach(trip => {
      const year = new Date(trip.startDate).getFullYear();
      uniqueYears.add(year);
    });
    setYears(Array.from(uniqueYears).sort((a, b) => b - a));

    // 設置初始年份
    if (uniqueYears.size > 0) {
      const currentYear = new Date().getFullYear();
      if (uniqueYears.has(currentYear)) {
        setSelectedYear(currentYear);
      } else {
        setSelectedYear(Math.max(...Array.from(uniqueYears)));
      }
    }
  }, [trips]);

  // 過濾旅行數據並計算統計信息
  useEffect(() => {
    let filtered = trips;
    
    if (selectedYear !== 'all') {
      filtered = trips.filter(trip => {
        const tripYear = new Date(trip.startDate).getFullYear();
        return tripYear === selectedYear;
      });
    }
    
    setFilteredTrips(filtered);
    
    if (filtered.length > 0) {
      setDurationStats(analyzeDuration(filtered));
      setSeasonStats(analyzeSeasons(filtered));
      setCompanionStats(analyzeCompanions(filtered));
      setTransportStats(analyzeTransport(filtered));
      setAccommodationStats(analyzeAccommodation(filtered));
      setHabitStats(calculateHabitStats(filtered));
    } else {
      setDurationStats(null);
      setSeasonStats(null);
      setCompanionStats(null);
      setTransportStats(null);
      setAccommodationStats(null);
      setHabitStats(null);
    }
  }, [trips, selectedYear]);

  const handleYearChange = (value: number | 'all') => {
    setSelectedYear(value);
  };

  // 準備季節數據圖表
  const seasonChartData = seasonStats ? [
    { name: '春季', value: seasonStats.spring },
    { name: '夏季', value: seasonStats.summer },
    { name: '秋季', value: seasonStats.autumn },
    { name: '冬季', value: seasonStats.winter }
  ] : [];

  // 準備同伴類型圖表
  const companionChartData = companionStats ? [
    { name: '個人', value: companionStats.solo },
    { name: '家庭', value: companionStats.family },
    { name: '朋友', value: companionStats.friends },
    { name: '伴侶', value: companionStats.partner },
    { name: '商務', value: companionStats.business },
    { name: '其他', value: companionStats.other }
  ].filter(item => item.value > 0) : [];

  // 準備持續時間分佈圖表
  const durationChartData = durationStats ? Object.entries(durationStats.durationDistribution)
    .map(([name, value]) => ({ name, value })) : [];

  // 準備交通方式圖表
  const transportChartData = transportStats ? generateChartData(transportStats) : [];

  // 準備住宿類型圖表
  const accommodationChartData = accommodationStats ? generateChartData(accommodationStats) : [];

  if (!habitStats || trips.length === 0) {
    return (
      <Empty 
        description="沒有足夠的旅行數據進行習慣分析" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    );
  }
  
  // 計算總旅行次數
  const totalTrips = trips.length;
  
  // 同伴偏好百分比
  const soloPercentage = calculatePercentage(habitStats.companionStats.solo, totalTrips);
  const groupPercentage = calculatePercentage(habitStats.companionStats.group, totalTrips);
  
  // 獲取交通偏好
  const topTransport = getTopPreferences(habitStats.transportPreference);
  
  // 獲取住宿偏好
  const topAccommodation = getTopPreferences(habitStats.accommodationPreference);
  
  // 獲取旅行類型偏好
  const topTypes = getTopPreferences(habitStats.travelTypePreference);
  
  // 獲取季節偏好
  const seasonPreferences = Object.entries(habitStats.seasonPreference)
    .map(([season, count]) => ({
      season,
      count,
      percentage: calculatePercentage(count, totalTrips)
    }))
    .sort((a, b) => b.count - a.count);
  
  return (
    <div className="travel-habits">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>旅遊習慣分析</Title>
        <Select
          value={selectedYear}
          style={{ width: 120 }}
          onChange={handleYearChange}
        >
          <Option value="all">所有年份</Option>
          {years.map(year => (
            <Option key={year} value={year}>{year}年</Option>
          ))}
        </Select>
      </div>

      {filteredTrips.length === 0 ? (
        <Empty description="沒有可分析的旅行數據" />
      ) : (
        <Tabs defaultActiveKey="1">
          <TabPane tab="時間習慣" key="1">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title="平均旅行時長"
                    value={durationStats?.averageDuration.toFixed(1) || 0}
                    suffix="天"
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title="最短旅行"
                    value={durationStats?.shortestTrip || 0}
                    suffix="天"
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title="最長旅行"
                    value={durationStats?.longestTrip || 0}
                    suffix="天"
                    prefix={<GlobalOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="旅行時長分佈" className="mt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={durationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="旅行次數" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="季節旅行偏好" className="mt-6">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={seasonChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {seasonChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>
                <Col xs={24} md={12}>
                  <div className="p-4">
                    <Title level={5}>季節偏好分析</Title>
                    <Divider />
                    <List
                      itemLayout="horizontal"
                      dataSource={[
                        { season: '春季 (3-5月)', count: seasonStats?.spring || 0 },
                        { season: '夏季 (6-8月)', count: seasonStats?.summer || 0 },
                        { season: '秋季 (9-11月)', count: seasonStats?.autumn || 0 },
                        { season: '冬季 (12-2月)', count: seasonStats?.winter || 0 }
                      ]}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            title={item.season}
                            description={`${item.count} 次旅行`}
                          />
                          <Tag color={item.count === Math.max(seasonStats?.spring || 0, seasonStats?.summer || 0, seasonStats?.autumn || 0, seasonStats?.winter || 0) ? 'green' : 'default'}>
                            {item.count === Math.max(seasonStats?.spring || 0, seasonStats?.summer || 0, seasonStats?.autumn || 0, seasonStats?.winter || 0) ? '最喜歡' : ''}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab="同伴分析" key="2">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card>
                  <Statistic
                    title="平均團體大小"
                    value={habitStats.companionStats.averageGroupSize.toFixed(1) || 0}
                    suffix="人"
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card>
                  <Statistic
                    title="單獨旅行比例"
                    value={soloPercentage.toFixed(0)}
                    suffix="%"
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="旅行同伴類型" className="mt-6">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={companionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {companionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>
                <Col xs={24} md={12}>
                  <div className="p-4">
                    <Title level={5}>同伴類型分析</Title>
                    <Divider />
                    <List
                      itemLayout="horizontal"
                      dataSource={[
                        { type: '個人旅行', count: habitStats.companionStats.solo },
                        { type: '家庭旅行', count: habitStats.companionStats.family || 0 },
                        { type: '與朋友同行', count: habitStats.companionStats.friends || 0 },
                        { type: '與伴侶同行', count: habitStats.companionStats.partner || 0 },
                        { type: '商務旅行', count: habitStats.companionStats.business || 0 },
                        { type: '其他', count: habitStats.companionStats.other || 0 }
                      ].filter(item => item.count > 0)}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            title={item.type}
                            description={`${item.count} 次旅行`}
                          />
                          <Tag color={
                            item.count === Math.max(
                              habitStats.companionStats.solo, 
                              habitStats.companionStats.family || 0,
                              habitStats.companionStats.friends || 0,
                              habitStats.companionStats.partner || 0,
                              habitStats.companionStats.business || 0,
                              habitStats.companionStats.other || 0
                            ) ? 'blue' : 'default'
                          }>
                            {item.count === Math.max(
                              habitStats.companionStats.solo, 
                              habitStats.companionStats.family || 0,
                              habitStats.companionStats.friends || 0,
                              habitStats.companionStats.partner || 0,
                              habitStats.companionStats.business || 0,
                              habitStats.companionStats.other || 0
                            ) ? '最常見' : ''}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab="交通與住宿" key="3">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="常用交通方式">
                  {transportChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={transportChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {transportChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty description="無交通方式數據" />
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="偏好住宿類型">
                  {accommodationChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={accommodationChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {accommodationChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty description="無住宿類型數據" />
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="交通與住宿偏好總結" className="mt-6">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <div className="p-4">
                    <Title level={5}>交通方式分析</Title>
                    <Divider />
                    {transportStats && Object.keys(transportStats).length > 0 ? (
                      <List
                        itemLayout="horizontal"
                        dataSource={Object.entries(transportStats)
                          .map(([type, count]) => ({ type, count }))
                          .sort((a, b) => b.count - a.count)}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<CarOutlined />}
                              title={item.type}
                              description={`${item.count} 次旅行`}
                            />
                            {item === Object.entries(transportStats)
                              .map(([type, count]) => ({ type, count }))
                              .sort((a, b) => b.count - a.count)[0] && (
                              <Tag color="blue">最常用</Tag>
                            )}
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="無交通方式數據" />
                    )}
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="p-4">
                    <Title level={5}>住宿類型分析</Title>
                    <Divider />
                    {accommodationStats && Object.keys(accommodationStats).length > 0 ? (
                      <List
                        itemLayout="horizontal"
                        dataSource={Object.entries(accommodationStats)
                          .map(([type, count]) => ({ type, count }))
                          .sort((a, b) => b.count - a.count)}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<HomeOutlined />}
                              title={item.type}
                              description={`${item.count} 次旅行`}
                            />
                            {item === Object.entries(accommodationStats)
                              .map(([type, count]) => ({ type, count }))
                              .sort((a, b) => b.count - a.count)[0] && (
                              <Tag color="green">最喜愛</Tag>
                            )}
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="無住宿類型數據" />
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      )}

      <Card title="旅行習慣綜合分析" className="mt-6">
        <Paragraph>
          根據您的{totalTrips}次旅行數據分析，您的旅行習慣如下：
        </Paragraph>
        
        <ul className="list-disc pl-6 text-gray-600">
          <li>
            <Text>您的平均旅行時間為 <Text strong>{habitStats.averageStayDuration.toFixed(1)}</Text> 天，屬於
              {habitStats.averageStayDuration <= 3 
                ? '短途旅行' 
                : habitStats.averageStayDuration <= 7 
                  ? '中程旅行' 
                  : '長途旅行'
              }愛好者。
            </Text>
          </li>
          
          <li>
            <Text>您最常在
              <Text strong> {seasonPreferences[0].season} </Text>
              出行，佔所有旅行的 <Text strong>{seasonPreferences[0].percentage.toFixed(1)}%</Text>。
            </Text>
          </li>
          
          {topTransport.length > 0 && (
            <li>
              <Text>您最常使用的交通方式是
                <Text strong> {topTransport[0].name} </Text>
                ({topTransport[0].percentage.toFixed(1)}%)。
              </Text>
            </li>
          )}
          
          {topAccommodation.length > 0 && (
            <li>
              <Text>您最常選擇的住宿類型是
                <Text strong> {topAccommodation[0].name} </Text>
                ({topAccommodation[0].percentage.toFixed(1)}%)。
              </Text>
            </li>
          )}
          
          {topTypes.length > 0 && (
            <li>
              <Text>您最喜歡的旅行類型是
                <Text strong> {topTypes[0].name} </Text>
                ({topTypes[0].percentage.toFixed(1)}%)。
              </Text>
            </li>
          )}
          
          <li>
            <Text>您 <Text strong>{soloPercentage > groupPercentage ? '更喜歡獨自旅行' : '更喜歡結伴同行'}</Text>，
              {soloPercentage > groupPercentage 
                ? `有 ${soloPercentage.toFixed(1)}% 的旅行是獨自完成的。` 
                : `群體旅行佔 ${groupPercentage.toFixed(1)}%，平均每次有 ${habitStats.companionStats.averageGroupSize.toFixed(1)} 人同行。`
              }
            </Text>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default TravelHabits; 