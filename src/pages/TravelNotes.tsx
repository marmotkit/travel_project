import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Select, 
  Input, 
  Table, 
  Tag, 
  Space, 
  Tooltip, 
  Empty, 
  Spin, 
  Typography,
  Badge,
  Row,
  Col,
  Card,
  Tabs 
} from 'antd';
import { 
  PlusOutlined, 
  SafetyOutlined, 
  MedicineBoxOutlined, 
  GlobalOutlined, 
  CarOutlined,
  CloudOutlined,
  IdcardOutlined,
  ShoppingOutlined,
  WalletOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 注意事項類型定義
export interface TravelNote {
  id: string;
  tripId: string;
  title: string;
  content: string;
  category: 'safety' | 'health' | 'culture' | 'transportation' | 'weather' | 'documents' | 'luggage' | 'budget' | 'others';
  priority: 'high' | 'medium' | 'low';
  stage: 'before-departure' | 'during-trip' | 'before-return';
  reminderDate?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
}

const TravelNotes: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [travelNotes, setTravelNotes] = useState<TravelNote[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // 載入用戶資料和旅行資料
  useEffect(() => {
    const loadData = () => {
      try {
        // 載入用戶資料，設定管理員狀態
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setIsAdmin(user.isAdmin || false);
        }

        // 載入旅行資料
        const tripsStr = localStorage.getItem('trips');
        if (tripsStr) {
          const loadedTrips = JSON.parse(tripsStr);
          setTrips(loadedTrips);
          
          // 預設選擇第一個旅行
          if (loadedTrips.length > 0 && !selectedTripId) {
            setSelectedTripId(loadedTrips[0].id);
          }
        }
        
        // 載入注意事項資料
        const notesStr = localStorage.getItem('travelNotes');
        if (notesStr) {
          setTravelNotes(JSON.parse(notesStr));
        } else {
          // 如果沒有資料，初始化空數組
          localStorage.setItem('travelNotes', JSON.stringify([]));
          setTravelNotes([]);
        }
      } catch (error) {
        console.error('載入數據失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedTripId]);

  // 處理新增注意事項
  const handleAddNote = () => {
    navigate(`/notes/new${selectedTripId ? `?tripId=${selectedTripId}` : ''}`);
  };

  // 處理編輯注意事項
  const handleEditNote = (noteId: string) => {
    navigate(`/notes/${noteId}/edit`);
  };

  // 處理刪除注意事項
  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = travelNotes.filter(note => note.id !== noteId);
    setTravelNotes(updatedNotes);
    localStorage.setItem('travelNotes', JSON.stringify(updatedNotes));
  };

  // 處理查看注意事項詳情
  const handleViewNote = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  // 過濾注意事項
  const filteredNotes = travelNotes.filter(note => {
    // 按旅行過濾
    if (selectedTripId && note.tripId !== selectedTripId) {
      return false;
    }
    
    // 按類別過濾
    if (selectedCategory && note.category !== selectedCategory) {
      return false;
    }
    
    // 按優先級過濾
    if (selectedPriority && note.priority !== selectedPriority) {
      return false;
    }
    
    // 按旅行階段過濾
    if (selectedStage && note.stage !== selectedStage) {
      return false;
    }
    
    // 按文字搜尋
    if (searchText && !note.title.toLowerCase().includes(searchText.toLowerCase()) && 
        !note.content.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // 獲取類別圖標和顏色
  const getCategoryIconAndColor = (category: string) => {
    switch (category) {
      case 'safety':
        return { icon: <SafetyOutlined />, color: 'red', text: '安全' };
      case 'health':
        return { icon: <MedicineBoxOutlined />, color: 'pink', text: '健康' };
      case 'culture':
        return { icon: <GlobalOutlined />, color: 'purple', text: '文化禮儀' };
      case 'transportation':
        return { icon: <CarOutlined />, color: 'blue', text: '交通' };
      case 'weather':
        return { icon: <CloudOutlined />, color: 'cyan', text: '天氣' };
      case 'documents':
        return { icon: <IdcardOutlined />, color: 'green', text: '證件' };
      case 'luggage':
        return { icon: <ShoppingOutlined />, color: 'gold', text: '行李' };
      case 'budget':
        return { icon: <WalletOutlined />, color: 'orange', text: '預算' };
      default:
        return { icon: <MoreOutlined />, color: 'default', text: '其他' };
    }
  };

  // 獲取優先級圖標和顏色
  const getPriorityIconAndColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { icon: <ExclamationCircleOutlined />, color: 'red', text: '高' };
      case 'medium':
        return { icon: <InfoCircleOutlined />, color: 'orange', text: '中' };
      case 'low':
        return { icon: <CheckCircleOutlined />, color: 'green', text: '低' };
      default:
        return { icon: <InfoCircleOutlined />, color: 'blue', text: '一般' };
    }
  };

  // 獲取階段文字
  const getStageText = (stage: string) => {
    switch (stage) {
      case 'before-departure':
        return '出發前';
      case 'during-trip':
        return '旅途中';
      case 'before-return':
        return '返程前';
      default:
        return '未分類';
    }
  };

  // 表格列定義
  const columns = [
    {
      title: '標題',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: TravelNote) => (
        <a onClick={() => handleViewNote(record.id)}>{text}</a>
      ),
    },
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const { icon, color, text } = getCategoryIconAndColor(category);
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: '優先級',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const { icon, color, text } = getPriorityIconAndColor(priority);
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: '階段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => (
        <Badge status={
          stage === 'before-departure' ? 'processing' : 
          stage === 'during-trip' ? 'success' : 
          'warning'
        } text={getStageText(stage)} />
      ),
    },
    {
      title: '旅行',
      dataIndex: 'tripId',
      key: 'tripId',
      render: (tripId: string) => {
        const trip = trips.find(t => t.id === tripId);
        return trip ? trip.title : '未關聯旅行';
      },
    },
    {
      title: '提醒日期',
      dataIndex: 'reminderDate',
      key: 'reminderDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TravelNote) => (
        <Space size="middle">
          <Tooltip title="編輯">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditNote(record.id)} 
            />
          </Tooltip>
          <Tooltip title="刪除">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteNote(record.id)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 按旅行階段分組顯示
  const notesByStage = {
    'before-departure': filteredNotes.filter(note => note.stage === 'before-departure'),
    'during-trip': filteredNotes.filter(note => note.stage === 'during-trip'),
    'before-return': filteredNotes.filter(note => note.stage === 'before-return'),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="注意事項" 
          isAdmin={isAdmin}
          onToggleAdmin={() => {
            setIsAdmin(!isAdmin);
            
            // 更新 localStorage 中的用戶管理員狀態
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                user.isAdmin = !isAdmin;
                localStorage.setItem('user', JSON.stringify(user));
              } catch (err) {
                console.error('更新用戶管理員狀態出錯:', err);
              }
            }
          }}
        />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow p-6">
              {/* 頂部工具列 */}
              <div className="flex flex-wrap justify-between items-center mb-6">
                <div className="flex-1 min-w-0 mr-4">
                  <Title level={4}>注意事項管理</Title>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddNote}
                    className="bg-blue-500"
                  >
                    新增注意事項
                  </Button>
                </div>
              </div>

              {/* 篩選區 */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div>
                  <Select
                    placeholder="選擇旅行"
                    style={{ width: '100%' }}
                    allowClear
                    value={selectedTripId}
                    onChange={setSelectedTripId}
                  >
                    {trips.map(trip => (
                      <Option key={trip.id} value={trip.id}>{trip.title}</Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Select
                    placeholder="選擇類別"
                    style={{ width: '100%' }}
                    allowClear
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                  >
                    <Option value="safety">安全</Option>
                    <Option value="health">健康</Option>
                    <Option value="culture">文化禮儀</Option>
                    <Option value="transportation">交通</Option>
                    <Option value="weather">天氣</Option>
                    <Option value="documents">證件</Option>
                    <Option value="luggage">行李</Option>
                    <Option value="budget">預算</Option>
                    <Option value="others">其他</Option>
                  </Select>
                </div>
                <div>
                  <Select
                    placeholder="選擇優先級"
                    style={{ width: '100%' }}
                    allowClear
                    value={selectedPriority}
                    onChange={setSelectedPriority}
                  >
                    <Option value="high">高</Option>
                    <Option value="medium">中</Option>
                    <Option value="low">低</Option>
                  </Select>
                </div>
                <div>
                  <Select
                    placeholder="選擇階段"
                    style={{ width: '100%' }}
                    allowClear
                    value={selectedStage}
                    onChange={setSelectedStage}
                  >
                    <Option value="before-departure">出發前</Option>
                    <Option value="during-trip">旅途中</Option>
                    <Option value="before-return">返程前</Option>
                  </Select>
                </div>
                <div>
                  <Search
                    placeholder="搜尋注意事項"
                    allowClear
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                  />
                </div>
              </div>

              {/* 主要內容區 */}
              <Tabs defaultActiveKey="table" className="w-full">
                <TabPane tab="表格視圖" key="table">
                  {loading ? (
                    <div className="w-full flex justify-center py-8">
                      <Spin size="large" />
                    </div>
                  ) : filteredNotes.length > 0 ? (
                    <Table 
                      columns={columns}
                      dataSource={filteredNotes.map(note => ({ ...note, key: note.id }))}
                      pagination={{ pageSize: 10 }}
                    />
                  ) : (
                    <Empty 
                      description="沒有符合條件的注意事項" 
                      className="py-8"
                    />
                  )}
                </TabPane>
                <TabPane tab="階段視圖" key="stage">
                  {loading ? (
                    <div className="w-full flex justify-center py-8">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 出發前 */}
                      <div>
                        <div className="bg-blue-50 p-3 rounded-t-lg flex items-center">
                          <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                            <Text className="text-white font-bold">{notesByStage['before-departure'].length}</Text>
                          </div>
                          <Text strong>出發前</Text>
                        </div>
                        <div className="border border-gray-200 rounded-b-lg p-4">
                          {notesByStage['before-departure'].length > 0 ? (
                            <div className="space-y-3">
                              {notesByStage['before-departure'].map(note => (
                                <Card 
                                  key={note.id}
                                  size="small"
                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => handleViewNote(note.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{note.title}</div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <Tag color={getCategoryIconAndColor(note.category).color}>
                                          {getCategoryIconAndColor(note.category).text}
                                        </Tag>
                                        <Tag color={getPriorityIconAndColor(note.priority).color}>
                                          {getPriorityIconAndColor(note.priority).text}
                                        </Tag>
                                      </div>
                                    </div>
                                    <Space>
                                      <Button 
                                        type="text" 
                                        icon={<EditOutlined />} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditNote(note.id);
                                        }} 
                                      />
                                      <Button 
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteNote(note.id);
                                        }} 
                                      />
                                    </Space>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Empty description="沒有出發前的注意事項" />
                          )}
                        </div>
                      </div>
                      
                      {/* 旅途中 */}
                      <div>
                        <div className="bg-green-50 p-3 rounded-t-lg flex items-center">
                          <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                            <Text className="text-white font-bold">{notesByStage['during-trip'].length}</Text>
                          </div>
                          <Text strong>旅途中</Text>
                        </div>
                        <div className="border border-gray-200 rounded-b-lg p-4">
                          {notesByStage['during-trip'].length > 0 ? (
                            <div className="space-y-3">
                              {notesByStage['during-trip'].map(note => (
                                <Card 
                                  key={note.id}
                                  size="small"
                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => handleViewNote(note.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{note.title}</div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <Tag color={getCategoryIconAndColor(note.category).color}>
                                          {getCategoryIconAndColor(note.category).text}
                                        </Tag>
                                        <Tag color={getPriorityIconAndColor(note.priority).color}>
                                          {getPriorityIconAndColor(note.priority).text}
                                        </Tag>
                                      </div>
                                    </div>
                                    <Space>
                                      <Button 
                                        type="text" 
                                        icon={<EditOutlined />} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditNote(note.id);
                                        }} 
                                      />
                                      <Button 
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteNote(note.id);
                                        }} 
                                      />
                                    </Space>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Empty description="沒有旅途中的注意事項" />
                          )}
                        </div>
                      </div>
                      
                      {/* 返程前 */}
                      <div>
                        <div className="bg-orange-50 p-3 rounded-t-lg flex items-center">
                          <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                            <Text className="text-white font-bold">{notesByStage['before-return'].length}</Text>
                          </div>
                          <Text strong>返程前</Text>
                        </div>
                        <div className="border border-gray-200 rounded-b-lg p-4">
                          {notesByStage['before-return'].length > 0 ? (
                            <div className="space-y-3">
                              {notesByStage['before-return'].map(note => (
                                <Card 
                                  key={note.id}
                                  size="small"
                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => handleViewNote(note.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{note.title}</div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <Tag color={getCategoryIconAndColor(note.category).color}>
                                          {getCategoryIconAndColor(note.category).text}
                                        </Tag>
                                        <Tag color={getPriorityIconAndColor(note.priority).color}>
                                          {getPriorityIconAndColor(note.priority).text}
                                        </Tag>
                                      </div>
                                    </div>
                                    <Space>
                                      <Button 
                                        type="text" 
                                        icon={<EditOutlined />} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditNote(note.id);
                                        }} 
                                      />
                                      <Button 
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteNote(note.id);
                                        }} 
                                      />
                                    </Space>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Empty description="沒有返程前的注意事項" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabPane>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelNotes; 