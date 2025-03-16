import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Tag, 
  Typography, 
  Space, 
  Card, 
  Divider, 
  Image, 
  Empty, 
  Popconfirm,
  message, 
  Descriptions, 
  Badge,
  Alert
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileOutlined,
  SafetyOutlined, 
  MedicineBoxOutlined, 
  GlobalOutlined, 
  CarOutlined,
  CloudOutlined,
  IdcardOutlined,
  ShoppingOutlined,
  WalletOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TravelNote } from './TravelNotes';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';

const { Title, Text, Paragraph } = Typography;

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
}

const TravelNoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<TravelNote | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isReminderActive, setIsReminderActive] = useState(false);

  // 載入資料
  useEffect(() => {
    const loadData = () => {
      try {
        // 載入用戶資料，設定管理員狀態
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setIsAdmin(user.isAdmin || false);
        }

        // 載入注意事項資料
        const notesStr = localStorage.getItem('travelNotes');
        if (notesStr) {
          const notes = JSON.parse(notesStr);
          const foundNote = notes.find((n: TravelNote) => n.id === id);
          
          if (foundNote) {
            setNote(foundNote);
            
            // 檢查提醒是否啟用
            if (foundNote.reminderDate) {
              const reminderDate = dayjs(foundNote.reminderDate);
              const today = dayjs();
              setIsReminderActive(reminderDate.isAfter(today) || reminderDate.isSame(today, 'day'));
            }
            
            // 載入相關旅行資料
            const tripsStr = localStorage.getItem('trips');
            if (tripsStr) {
              const trips = JSON.parse(tripsStr);
              const relatedTrip = trips.find((t: Trip) => t.id === foundNote.tripId);
              
              if (relatedTrip) {
                setTrip(relatedTrip);
              }
            }
          } else {
            message.error('找不到該注意事項');
            navigate('/notes');
          }
        } else {
          message.error('沒有任何注意事項資料');
          navigate('/notes');
        }
      } catch (error) {
        console.error('載入數據失敗:', error);
        message.error('載入數據失敗');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // 處理刪除注意事項
  const handleDelete = () => {
    try {
      const notesStr = localStorage.getItem('travelNotes');
      if (notesStr) {
        const notes = JSON.parse(notesStr);
        const updatedNotes = notes.filter((n: TravelNote) => n.id !== id);
        localStorage.setItem('travelNotes', JSON.stringify(updatedNotes));
        message.success('注意事項已刪除');
        navigate('/notes');
      }
    } catch (error) {
      console.error('刪除注意事項失敗:', error);
      message.error('刪除注意事項失敗');
    }
  };

  // 處理編輯注意事項
  const handleEdit = () => {
    navigate(`/notes/${id}/edit`);
  };

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

  // 獲取階段狀態
  const getStageStatus = (stage: string) => {
    switch (stage) {
      case 'before-departure':
        return 'processing';
      case 'during-trip':
        return 'success';
      case 'before-return':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="注意事項詳情" 
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
              {loading ? (
                <div className="text-center py-12">載入中...</div>
              ) : note ? (
                <div>
                  {/* 頂部導航和操作 */}
                  <div className="flex justify-between items-center mb-6">
                    <Button 
                      type="link" 
                      icon={<ArrowLeftOutlined />}
                      onClick={() => navigate('/notes')}
                    >
                      返回注意事項列表
                    </Button>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={handleEdit}
                        className="bg-blue-500"
                      >
                        編輯
                      </Button>
                      <Popconfirm
                        title="確定要刪除這個注意事項嗎？"
                        description="此操作無法撤銷。"
                        onConfirm={handleDelete}
                        okText="確定"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          刪除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>

                  {/* 提醒橫幅 */}
                  {isReminderActive && note.reminderDate && (
                    <Alert
                      message="提醒"
                      description={`這個注意事項設定了提醒，提醒日期：${dayjs(note.reminderDate).format('YYYY年MM月DD日')}`}
                      type="info"
                      showIcon
                      className="mb-6"
                    />
                  )}

                  {/* 標題區 */}
                  <div className="mb-6">
                    <Title level={3}>{note.title}</Title>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Tag color={getCategoryIconAndColor(note.category).color} icon={getCategoryIconAndColor(note.category).icon}>
                        {getCategoryIconAndColor(note.category).text}
                      </Tag>
                      <Tag color={getPriorityIconAndColor(note.priority).color} icon={getPriorityIconAndColor(note.priority).icon}>
                        {getPriorityIconAndColor(note.priority).text}
                      </Tag>
                      <Badge
                        status={getStageStatus(note.stage) as any}
                        text={getStageText(note.stage)}
                        className="mr-2"
                      />
                    </div>
                  </div>

                  {/* 概覽資訊 */}
                  <Card className="mb-6" size="small">
                    <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
                      <Descriptions.Item label="關聯旅行">
                        {trip ? trip.title : '無關聯旅行'}
                      </Descriptions.Item>
                      {trip && (
                        <Descriptions.Item label="目的地">
                          {trip.destination}
                        </Descriptions.Item>
                      )}
                      {trip && (
                        <Descriptions.Item label="旅行日期">
                          {dayjs(trip.startDate).format('YYYY/MM/DD')} - {dayjs(trip.endDate).format('YYYY/MM/DD')}
                        </Descriptions.Item>
                      )}
                      {note.reminderDate && (
                        <Descriptions.Item label="提醒日期">
                          <CalendarOutlined className="mr-1" />
                          {dayjs(note.reminderDate).format('YYYY年MM月DD日')}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="創建時間">
                        <ClockCircleOutlined className="mr-1" />
                        {dayjs(note.createdAt).format('YYYY/MM/DD HH:mm')}
                      </Descriptions.Item>
                      <Descriptions.Item label="更新時間">
                        <ClockCircleOutlined className="mr-1" />
                        {dayjs(note.updatedAt).format('YYYY/MM/DD HH:mm')}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* 內容區 */}
                  <div className="mb-6">
                    <Title level={4}>內容</Title>
                    <Card>
                      <Paragraph className="whitespace-pre-line">{note.content}</Paragraph>
                    </Card>
                  </div>

                  {/* 附件區 */}
                  {note.attachments && note.attachments.length > 0 && (
                    <div>
                      <Divider orientation="left">
                        <Space>
                          <FileOutlined />
                          附件 ({note.attachments.length})
                        </Space>
                      </Divider>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {note.attachments.map((url, index) => (
                          <div key={index} className="border rounded p-2">
                            {url.startsWith('data:image') ? (
                              <Image
                                src={url}
                                alt={`附件 ${index + 1}`}
                                className="w-full h-32 object-cover mb-2"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-32 bg-gray-100 mb-2">
                                <FileOutlined style={{ fontSize: 40 }} />
                              </div>
                            )}
                            <div className="text-center text-sm truncate">
                              附件 {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Empty
                  description="找不到注意事項"
                  className="py-12"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelNoteDetail; 