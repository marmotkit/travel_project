import React, { useState, useEffect, useRef } from 'react';
import { Card, Select, Empty, Tooltip, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

interface TravelMapProps {
  trips: any[];
  selectedYear?: number | string | null;
  showCoordinateSystem?: boolean;
}

const TravelMap: React.FC<TravelMapProps> = ({ trips, selectedYear = 'all', showCoordinateSystem = true }) => {
  const [selectedYearState, setSelectedYear] = useState<string>(selectedYear ? selectedYear.toString() : 'all');
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
    if (selectedYearState === 'all') {
      setFilteredTrips(trips);
    } else {
      const filtered = trips.filter(trip => {
        const startDate = new Date(trip.startDate);
        return startDate.getFullYear().toString() === selectedYearState;
      });
      setFilteredTrips(filtered);
    }
  }, [trips, selectedYearState]);
  
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };
  
  // 從旅行數據中提取唯一的地點
  const getUniqueDestinations = () => {
    const destinations = new Map();
    
    // 調試信息
    console.log('原始旅行數據:', filteredTrips);
    
    filteredTrips.forEach(trip => {
      // 確保每個目的地都有座標數據，如果沒有，則使用默認座標
      let coords = trip.coordinates;
      
      // 調試座標信息
      console.log(`行程 "${trip.title}" 的座標:`, coords);
      
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        // 根據國家/城市指定一個默認座標
        const defaultCoords: Record<string, [number, number]> = {
          '台灣': [121.5654, 25.0330],
          '日本': [139.6917, 35.6895],
          '韓國': [126.9780, 37.5665],
          '香港': [114.1694, 22.3193],
          '泰國': [100.5018, 13.7563],
          '新加坡': [103.8198, 1.3521],
          '中國': [116.4074, 39.9042],
          '美國': [-95.7129, 37.0902],
          '英國': [-0.1278, 51.5074],
          // 添加更多國家預設座標...
        };
        
        // 嘗試使用國家默認座標
        if (trip.country && defaultCoords[trip.country]) {
          coords = defaultCoords[trip.country];
          console.log(`為 "${trip.title}" 使用國家 "${trip.country}" 的默認座標:`, coords);
        } else if (trip.destination) {
          // 嘗試從目的地解析國家
          for (const [country, defaultCoord] of Object.entries(defaultCoords)) {
            if (trip.destination.includes(country)) {
              coords = defaultCoord;
              console.log(`為 "${trip.title}" 從目的地名稱找到國家 "${country}" 的默認座標:`, coords);
              break;
            }
          }
          
          // 如果仍然沒有座標，使用一個通用默認座標（東京）
          if (!coords) {
            coords = [139.6917, 35.6895];
            console.log(`為 "${trip.title}" 使用通用默認座標(東京):`, coords);
          }
        } else {
          // 使用一個通用默認座標（東京）
          coords = [139.6917, 35.6895];
          console.log(`為 "${trip.title}" 使用通用默認座標(東京):`, coords);
        }
      }
      
      // 使用目的地作為 key
      const key = trip.destination || trip.title || `Trip-${trip.id}`;
      
      if (!destinations.has(key)) {
        destinations.set(key, {
          name: trip.destination || trip.title || `Trip-${trip.id}`,
          country: trip.country || '',
          coordinates: coords,
          trips: [trip]
        });
      } else {
        const dest = destinations.get(key);
        dest.trips.push(trip);
        destinations.set(key, dest);
      }
    });
    
    const result = Array.from(destinations.values());
    console.log('處理後的目的地數據:', result);
    return result;
  };
  
  const uniqueDestinations = getUniqueDestinations();
  
  // 儲存拖動後的座標映射
  const [adjustedCoordinates, setAdjustedCoordinates] = useState<Record<string, [number, number]>>(() => {
    // 從localStorage載入已調整的座標
    const saved = localStorage.getItem('adjustedMapCoordinates');
    return saved ? JSON.parse(saved) : {};
  });

  // 標記拖動相關狀態
  const [draggingMarker, setDraggingMarker] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // 將座標轉換為位置百分比
  const coordsToPercent = (lng: number, lat: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };
  
  // 將位置百分比轉換為座標
  const percentToCoords = (percentX: number, percentY: number) => {
    const lng = (percentX / 100 * 360) - 180;
    const lat = 90 - (percentY / 100 * 180);
    return [lng, lat] as [number, number];
  };
  
  // 處理標記拖動
  const handleMarkerMouseDown = (e: React.MouseEvent, destKey: string) => {
    // 阻止默認行為和冒泡
    e.preventDefault();
    e.stopPropagation();
    
    // 記錄正在拖動的標記
    setDraggingMarker(destKey);
    
    if (!mapContainerRef.current) return;
    
    // 當前地圖容器的位置和大小
    const mapRect = mapContainerRef.current.getBoundingClientRect();
    
    // 內部鼠標移動處理函數
    function onMouseMove(moveEvent: MouseEvent) {
      moveEvent.preventDefault();
      
      // 計算鼠標在地圖上的相對位置
      const relX = (moveEvent.clientX - mapRect.left) / mapRect.width * 100;
      const relY = (moveEvent.clientY - mapRect.top) / mapRect.height * 100;
      
      // 確保值在0-100範圍內
      const clampedX = Math.max(0, Math.min(100, relX));
      const clampedY = Math.max(0, Math.min(100, relY));
      
      // 轉換為座標
      const [newLng, newLat] = percentToCoords(clampedX, clampedY);
      
      // 更新座標
      setAdjustedCoordinates(prev => {
        const newCoords: Record<string, [number, number]> = {
          ...prev,
          [destKey]: [newLng, newLat] as [number, number]
        };
        return newCoords;
      });
    }
    
    // 內部鼠標釋放處理函數
    function onMouseUp() {
      // 移除事件監聽器
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // 保存調整後的座標到localStorage
      setTimeout(() => {
        localStorage.setItem('adjustedMapCoordinates', JSON.stringify(adjustedCoordinates));
      }, 10);
      
      // 重置拖動狀態
      setDraggingMarker(null);
    }
    
    // 添加事件監聽器
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 在組件卸載時清理可能存在的事件監聽器
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseup', () => {});
    };
  }, []);
  
  // 清除所有調整的座標
  const resetAllAdjustments = () => {
    setAdjustedCoordinates({});
    localStorage.removeItem('adjustedMapCoordinates');
  };
  
  // 獲取熱門地區
  const getPopularRegions = () => {
    const regions = new Map();
    
    filteredTrips.forEach(trip => {
      // 使用專門的 country 欄位 (如果存在)，否則嘗試從 destination 分割
      const country = trip.country || ((trip.destination || '').split(', ')[1] || '');
      
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
  
  // 獲取熱門城市
  const getPopularCities = () => {
    const cities = new Map();
    
    filteredTrips.forEach(trip => {
      // 嘗試從目的地提取城市名稱
      let city = '';
      
      if (trip.destination) {
        // 假設目的地格式是 "城市, 國家" 或 "城市"
        const parts = trip.destination.split(', ');
        city = parts[0] || trip.destination;
      }
      
      if (city) {
        if (!cities.has(city)) {
          cities.set(city, { 
            name: city, 
            country: trip.country || '',
            count: 1, 
            trips: [trip] 
          });
        } else {
          const cityData = cities.get(city);
          cityData.count += 1;
          cityData.trips.push(trip);
          cities.set(city, cityData);
        }
      }
    });
    
    return Array.from(cities.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };
  
  const popularRegions = getPopularRegions();
  const popularCities = getPopularCities();
  
  // 簡易地圖渲染函數 - 使用 CSS 網格創建一個簡單的世界地圖視覺效果
  const renderSimpleMap = () => {
    // 確保有數據可以顯示
    if (uniqueDestinations.length === 0) {
      return (
        <div className="h-64 bg-gray-100 flex items-center justify-center">
          <Empty description="沒有目的地數據可顯示" />
        </div>
      );
    }
    
    // 調試信息
    console.log('渲染地圖，目的地數量:', uniqueDestinations.length);
    
    return (
      <div 
        ref={mapContainerRef}
        className="world-map-container" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '400px', 
          backgroundColor: '#e6f7ff', 
          borderRadius: '8px', 
          overflow: 'hidden',
          border: '1px solid #ccc'
        }}
      >
        {/* 簡易世界地圖背景 */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          opacity: 0.7, 
          backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}></div>
        
        {/* 座標重置按鈕 */}
        {Object.keys(adjustedCoordinates).length > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            zIndex: 1000 
          }}>
            <button
              onClick={resetAllAdjustments}
              style={{
                padding: '4px 8px',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              重置所有標記位置
            </button>
          </div>
        )}
        
        {/* 拖動提示 */}
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          left: '10px', 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          color: 'white', 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '12px',
          zIndex: 1000
        }}>
          提示: 點擊並拖動標記可調整位置
        </div>
        
        {showCoordinateSystem && (
          <>
            {/* 測試點位與輔助線 (省略，原有代碼不變) */}
            <div style={{ 
              position: 'absolute', 
              left: '25%', 
              top: '25%', 
              width: '8px', 
              height: '8px', 
              backgroundColor: 'green', 
              borderRadius: '50%', 
              border: '1px solid white' 
            }} title="測試點 - 左上 (25%,25%)"></div>
            
            <div style={{ 
              position: 'absolute', 
              left: '75%', 
              top: '25%', 
              width: '8px', 
              height: '8px', 
              backgroundColor: 'green', 
              borderRadius: '50%', 
              border: '1px solid white' 
            }} title="測試點 - 右上 (75%,25%)"></div>
            
            <div style={{ 
              position: 'absolute', 
              left: '25%', 
              top: '75%', 
              width: '8px', 
              height: '8px', 
              backgroundColor: 'green', 
              borderRadius: '50%', 
              border: '1px solid white' 
            }} title="測試點 - 左下 (25%,75%)"></div>
            
            <div style={{ 
              position: 'absolute', 
              left: '75%', 
              top: '75%', 
              width: '8px', 
              height: '8px', 
              backgroundColor: 'green', 
              borderRadius: '50%', 
              border: '1px solid white' 
            }} title="測試點 - 右下 (75%,75%)"></div>
          </>
        )}
        
        {/* 添加輔助線 - 經度 */}
        {showCoordinateSystem && (
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(0,0,0,0.3)' }}></div>
        )}
        {/* 添加輔助線 - 緯度 */}
        {showCoordinateSystem && (
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(0,0,0,0.3)' }}></div>
        )}
        
        {/* 目的地標記 */}
        {uniqueDestinations.map((dest, index) => {
          // 確保有座標數據
          if (!dest.coordinates || !Array.isArray(dest.coordinates) || dest.coordinates.length !== 2) {
            console.error(`目的地 "${dest.name}" 缺少有效座標`);
            return null;
          }
          
          // 使用調整後的座標（如果存在），否則使用原始座標
          const coordinates = adjustedCoordinates[dest.name] || dest.coordinates;
          const lng = coordinates[0];
          const lat = coordinates[1];
          
          // 確保座標在合理範圍內
          if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            console.warn(`無效座標: [${lng}, ${lat}] 用於目的地: ${dest.name}`);
            return null; // 跳過無效座標
          }
          
          // 經度（x軸）範圍從-180到180，轉換為0-100%
          // 緯度（y軸）範圍從90到-90，轉換為0-100%
          const x = ((lng + 180) / 360) * 100;
          const y = ((90 - lat) / 180) * 100;
          
          // 顯示標記大小基於旅行次數，但有最小和最大限制
          const size = Math.max(24, Math.min(40, dest.trips.length * 6));
          
          // 是否正在拖動此標記
          const isDragging = draggingMarker === dest.name;
          
          return (
            <Tooltip key={index} title={
              <div>
                <div><strong>{dest.name}</strong></div>
                <div>緯度: {lat.toFixed(4)}, 經度: {lng.toFixed(4)}</div>
                <div>旅行次數: {dest.trips.length}</div>
                <div>位置: x={x.toFixed(2)}%, y={y.toFixed(2)}%</div>
                {adjustedCoordinates[dest.name] && <div><strong>位置已手動調整</strong></div>}
              </div>
            }>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: `${x}%`, 
                  top: `${y}%`, 
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: adjustedCoordinates[dest.name] ? '#1890ff' : '#ff4d4f',
                  borderRadius: '50%',
                  width: `${size}px`,
                  height: `${size}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '3px solid white',
                  boxShadow: isDragging ? '0 3px 15px rgba(0,0,0,0.8)' : '0 3px 8px rgba(0,0,0,0.5)',
                  zIndex: isDragging ? 1000 : 100,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  opacity: isDragging ? 0.7 : 1,
                  transition: isDragging ? 'none' : 'all 0.2s ease'
                }}
                onMouseDown={(e) => handleMarkerMouseDown(e, dest.name)}
              >
                {index + 1}
              </div>
            </Tooltip>
          );
        })}
        
        {/* 添加調試信息 */}
        <div style={{ position: 'absolute', bottom: '5px', right: '5px', fontSize: '10px', color: '#666', backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 5px', borderRadius: '3px' }}>
          目的地數: {uniqueDestinations.length}
        </div>
      </div>
    );
  };
  
  // 實際地圖渲染，需要使用一個地圖庫，這裡只做簡易展示
  // 在實際項目中，您可以使用 React Simple Maps 或 Mapbox 來實現
  return (
    <div className="travel-map">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-medium">旅行目的地分布</div>
        <Select 
          style={{ width: 120 }} 
          value={selectedYearState} 
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
          {/* 渲染簡易世界地圖 */}
          <Card className="mb-6">
            {renderSimpleMap()}
            
            {/* 旅行點位標記預覽 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {uniqueDestinations.map((dest, index) => (
                <Tooltip key={index} title={
                  <div>
                    <div><strong>{dest.name}</strong></div>
                    <div>緯度: {dest.coordinates[1]}, 經度: {dest.coordinates[0]}</div>
                    <div>旅行次數: {dest.trips.length}</div>
                  </div>
                }>
                  <div className="bg-white p-3 border rounded shadow-sm">
                    <div className="flex items-center">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-full mr-2">{index + 1}</span>
                      <span className="font-medium">{dest.name}</span>
                      <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">{dest.trips.length} 次旅行</span>
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
                    <div key={index} className="bg-white rounded border p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{region.name}</div>
                        <div>
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full">{region.count}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {region.trips.slice(0, 2).map((trip: any, i: number) => (
                          <div key={i}>{trip.title || trip.destination}</div>
                        ))}
                        {region.trips.length > 2 && <div>...還有 {region.trips.length - 2} 個行程</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="沒有熱門地區數據" />
              )}
            </Card>
            
            <Card title="熱門城市" className="mb-6">
              {popularCities.length > 0 ? (
                <div>
                  {popularCities.map((city, index) => (
                    <div key={index} className="bg-white rounded border p-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{city.name}</div>
                        <div>
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full">{city.count}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {city.trips.slice(0, 2).map((trip: any, i: number) => (
                          <div key={i}>{trip.title || trip.destination}</div>
                        ))}
                        {city.trips.length > 2 && <div>...還有 {city.trips.length - 2} 個行程</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="沒有熱門城市數據" />
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