import React, { useState, useEffect } from 'react';
import { Typography, List, Avatar, Badge, Tag, Empty, Space, Card } from 'antd';
import { 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { TravelNote } from '../../pages/TravelNotes';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// 虛擬的最近活動數據類型
interface Activity {
  id: string;
  type: 'trip_created' | 'trip_updated' | 'document_added' | 'itinerary_updated' | 'note_reminder';
  message: string;
  user: {
    name: string;
    avatar: string;
  };
  entity?: {
    id: string;
    name: string;
    type: string;
  };
  timestamp: string;
  read: boolean;
}

// 擴展TravelNote類型，添加tripTitle屬性
interface TravelNoteWithTrip extends TravelNote {
  tripTitle: string;
}

const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<TravelNoteWithTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 從LocalStorage加載活動數據和提醒
    const loadData = () => {
      try {
        // 載入活動
        const activitiesStr = localStorage.getItem('activities');
        if (activitiesStr) {
          setActivities(JSON.parse(activitiesStr));
        } else {
          // 生成一些模擬活動數據
          const mockActivities: Activity[] = [
            {
              id: '1',
              type: 'trip_created',
              message: '創建了新的旅遊專案',
              user: {
                name: '測試用戶',
                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
              },
              entity: {
                id: '1',
                name: '東京五日遊',
                type: 'trip',
              },
              timestamp: new Date().toISOString(),
              read: false,
            },
            {
              id: '2',
              type: 'document_added',
              message: '上傳了新的證件',
              user: {
                name: '測試用戶',
                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
              },
              entity: {
                id: '1',
                name: '護照',
                type: 'document',
              },
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              read: true,
            },
            {
              id: '3',
              type: 'itinerary_updated',
              message: '更新了行程安排',
              user: {
                name: '測試用戶',
                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
              },
              entity: {
                id: '1',
                name: '東京五日遊',
                type: 'itinerary',
              },
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              read: true,
            },
          ];
          setActivities(mockActivities);
          localStorage.setItem('activities', JSON.stringify(mockActivities));
        }

        // 載入注意事項提醒
        const notesStr = localStorage.getItem('travelNotes');
        const tripsStr = localStorage.getItem('trips');
        
        if (notesStr && tripsStr) {
          const notes: TravelNote[] = JSON.parse(notesStr);
          const trips = JSON.parse(tripsStr);
          
          // 獲取有提醒日期的注意事項，並篩選出未來7天內的提醒
          const today = dayjs();
          const oneWeekLater = dayjs().add(7, 'day');
          
          const reminders = notes
            .filter(note => note.reminderDate)
            .filter(note => {
              const reminderDate = dayjs(note.reminderDate);
              return reminderDate.isAfter(today) && reminderDate.isBefore(oneWeekLater);
            })
            .map(note => {
              // 添加關聯的旅行標題
              const trip = trips.find((t: any) => t.id === note.tripId);
              return {
                ...note,
                tripTitle: trip ? trip.title : '未知旅行'
              } as TravelNoteWithTrip;
            })
            .sort((a, b) => dayjs(a.reminderDate).diff(dayjs(b.reminderDate)));
          
          setUpcomingReminders(reminders);
        }

        setLoading(false);
      } catch (error) {
        console.error('加載活動數據失敗:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 獲取優先級樣式
  const getPriorityStyle = (priority: string) => {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Title level={4}>最近活動</Title>
      
      {/* 提醒區塊 */}
      {upcomingReminders.length > 0 && (
        <div className="mb-6">
          <Title level={5} className="mb-3">
            <Space>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              即將到來的提醒
            </Space>
          </Title>
          <Card className="mb-4" size="small">
            <List
              itemLayout="horizontal"
              dataSource={upcomingReminders.slice(0, 3)} // 只顯示最多3個即將到來的提醒
              renderItem={note => {
                const priorityStyle = getPriorityStyle(note.priority);
                return (
                  <List.Item actions={[<Link to={`/notes/${note.id}`}>查看詳情</Link>]}>
                    <List.Item.Meta
                      avatar={
                        <Badge dot={dayjs(note.reminderDate).diff(dayjs(), 'day') <= 2} color="red">
                          {priorityStyle.icon}
                        </Badge>
                      }
                      title={
                        <Space>
                          <Link to={`/notes/${note.id}`}>{note.title}</Link>
                          <Tag color={priorityStyle.color}>{priorityStyle.text}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">{note.tripTitle}</Text>
                          <Text type="secondary">
                            提醒日期: {dayjs(note.reminderDate).format('YYYY/MM/DD')}
                            {dayjs(note.reminderDate).diff(dayjs(), 'day') <= 0 
                              ? ' (今天)' 
                              : ` (還有 ${dayjs(note.reminderDate).diff(dayjs(), 'day')} 天)`}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
            {upcomingReminders.length > 3 && (
              <div className="text-right mt-2">
                <Link to="/notes">查看全部 ({upcomingReminders.length}) 個提醒</Link>
              </div>
            )}
          </Card>
        </div>
      )}
      
      {/* 活動列表 */}
      <List
        itemLayout="horizontal"
        dataSource={activities}
        locale={{ emptyText: <Empty description="沒有最近活動" /> }}
        renderItem={activity => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={activity.user.avatar} />}
              title={activity.user.name}
              description={
                <Space direction="vertical" size={0}>
                  <Text>
                    {activity.message}
                    {activity.entity && (
                      <span>
                        {' '}
                        <Link 
                          to={`/${activity.entity.type === 'trip' 
                            ? 'trips' : activity.entity.type === 'document' 
                            ? 'documents' : 'itinerary'}/${activity.entity.id}`}
                        >
                          {activity.entity.name}
                        </Link>
                      </span>
                    )}
                  </Text>
                  <Text type="secondary">
                    {dayjs(activity.timestamp).format('YYYY/MM/DD HH:mm')}
                  </Text>
                </Space>
              }
            />
            {!activity.read && (
              <Badge color="blue" />
            )}
          </List.Item>
        )}
      />
    </div>
  );
};

export default RecentActivities; 