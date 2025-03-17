import React, { useState, useEffect } from 'react';
import { Card, Select, Typography, Empty, Tooltip, Button, Badge } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;

interface TravelMapProps {
  trips: any[];
}

const TravelMap: React.FC<TravelMapProps> = ({ trips }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [filteredTrips, setFilteredTrips] = useState(trips);
  
  // 產生年份選項
  const generateYearOptions = () => {
    const years = new Set<string>();
    trips.forEach(trip => {
      const startDate = new Date(trip.startDate);
      years.add(startDate.getFullYear().toString());
    });
    
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };
  
  useEffect(() => {
    if (selectedYear === 'all') {
      setFilteredTrips(trips);
    } else {
      const filtered = trips.filter(trip => {
        const startDate = new Date(trip.startDate);
        return startDate.getFullYear().toString() === selectedYear;
      });
      setFilteredTrips(filtered);
    }
  }, [trips, selectedYear]);
  
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };
  
  // 從旅行數據中提取唯一的地點
  const getUniqueDestinations = () => {
    const destinations = new Map();
    
    filteredTrips.forEach(trip => {
      if (trip.coordinates && trip.coordinates.length === 2) {
        const key = `${trip.coordinates[0]},${trip.coordinates[1]}`;
        
        if (!destinations.has(key)) {
          destinations.set(key, {
            name: trip.destination,
            coordinates: trip.coordinates,
            trips: [trip]
          });
        } else {
          const dest = destinations.get(key);
          dest.trips.push(trip);
          destinations.set(key, dest);
        }
      }
    });
    
    return Array.from(destinations.values());
  };
  
  const uniqueDestinations = getUniqueDestinations();
  
  // 計算熱門地區
  const getPopularRegions = () => {
    const regions = new Map();
    
    filteredTrips.forEach(trip => {
      const [city, country] = (trip.destination || '').split(', ');
      if (country) {
        if (!regions.has(country)) {
          regions.set(country, { name: country, count: 1, trips: [trip] });
        } else {
          const region = regions.get(country);
          region.count += 1;
          region.trips.push(trip);
          regions.set(country, region);
        }
      }
    });
    
    return Array.from(regions.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };
  
  const popularRegions = getPopularRegions();
  
  // 實際地圖渲染，需要使用一個地圖庫，這裡只做簡易展示
  // 在實際項目中，您可以使用 React Simple Maps 或 Mapbox 來實現
  return (
    <div className="travel-map">
      <div className="flex justify-between items-center mb-6">
        <Title level={4}>旅行目的地分布</Title>
        <Select 
          style={{ width: 120 }} 
          value={selectedYear} 
          onChange={handleYearChange}
        >
          <Option key="all" value="all">所有年份</Option>
          {generateYearOptions().map(year => (
            <Option key={year} value={year}>{year}年</Option>
          ))}
        </Select>
      </div>
      
      {filteredTrips.length === 0 ? (
        <Empty description="沒有符合條件的旅行數據" />
      ) : (
        <>
          {/* 世界地圖佔位元素 - 實際項目中請替換為真正的地圖組件 */}
          <Card className="mb-6">
            <div className="bg-gray-100 h-96 rounded flex items-center justify-center">
              <div className="text-center">
                <GlobalOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                <p className="mt-2 text-gray-500">此處將顯示互動式世界地圖</p>
                <p className="text-xs text-gray-400">
                  建議使用 React Simple Maps 或 Mapbox 來實現
                </p>
              </div>
            </div>
            
            {/* 旅行點位標記預覽 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {uniqueDestinations.map((dest, index) => (
                <Tooltip key={index} title={`緯度: ${dest.coordinates[1]}, 經度: ${dest.coordinates[0]}`}>
                  <div className="bg-white p-3 border rounded shadow-sm">
                    <div className="flex items-center">
                      <Badge count={dest.trips.length} style={{ backgroundColor: '#108ee9' }} />
                      <Text strong className="ml-2">{dest.name}</Text>
                    </div>
                  </div>
                </Tooltip>
              ))}
            </div>
          </Card>
          
          {/* 旅行統計與熱門地區 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="旅行統計" className="mb-6">
              <div className="px-4 py-2 bg-gray-50 rounded mb-3">
                <div className="flex justify-between items-center">
                  <div>造訪國家/地區</div>
                  <div className="font-semibold">{getPopularRegions().length}</div>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded mb-3">
                <div className="flex justify-between items-center">
                  <div>造訪城市</div>
                  <div className="font-semibold">{uniqueDestinations.length}</div>
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <div>總旅行次數</div>
                  <div className="font-semibold">{filteredTrips.length}</div>
                </div>
              </div>
            </Card>
            
            <Card title="熱門地區" className="mb-6">
              {popularRegions.length > 0 ? (
                <div>
                  {popularRegions.map((region, index) => (
                    <div key={index} className="px-4 py-2 bg-gray-50 rounded mb-3 last:mb-0">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{region.name}</div>
                        <div>
                          <Badge count={region.count} style={{ backgroundColor: '#108ee9' }} />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {region.trips.slice(0, 3).map((trip: any, i: number) => (
                          <span key={i} className="mr-2">
                            {trip.title}{i < Math.min(region.trips.length, 3) - 1 ? ',' : ''}
                          </span>
                        ))}
                        {region.trips.length > 3 && <span>等 {region.trips.length} 個旅行</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="沒有熱門地區數據" />
              )}
            </Card>
          </div>
          
          {/* 旅行列表 */}
          <Card title="時間軸" className="mb-6">
            <div className="space-y-6">
              {filteredTrips
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                .map((trip, index) => (
                  <div key={index} className="relative pl-8 pb-6 border-l-2 border-blue-200 last:border-0">
                    <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-blue-500"></div>
                    <div className="mb-1 font-semibold text-lg">{trip.title}</div>
                    <div className="text-gray-500 text-sm mb-1">{trip.destination}</div>
                    <div className="text-gray-400 text-sm mb-2">
                      {new Date(trip.startDate).toLocaleDateString()} 至 {new Date(trip.endDate).toLocaleDateString()}
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-sm">
                      {trip.description || '無描述'}
                    </div>
                  </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default TravelMap; 