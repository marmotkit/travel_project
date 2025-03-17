import React, { useState, useEffect } from 'react';
import { Typography, List, Avatar, Badge, Tag, Empty, Space, Card, Button, Popconfirm, message } from 'antd';
import { 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined,
  CheckOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { TravelNote } from '../../pages/TravelNotes';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-tw';
import { Activity, getActivities, markActivityAsRead, markAllActivitiesAsRead, deleteActivity } from '../../services/ActivityService';

// 設置dayjs插件
dayjs.extend(relativeTime);
dayjs.locale('zh-tw');

const { Title, Text } = Typography;

// 擴展TravelNote類型，添加tripTitle屬性
interface TravelNoteWithTrip extends TravelNote {
  tripTitle: string;
}

const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<TravelNoteWithTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 從ActivityService和LocalStorage加載活動數據和提醒
    const loadData = () => {
      try {
        // 載入活動
        const recentActivities = getActivities(10); // 只獲取最近10條活動
        setActivities(recentActivities);

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

  // 處理將活動標記為已讀
  const handleMarkAsRead = (activityId: string) => {
    markActivityAsRead(activityId);
    // 更新狀態
    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === activityId ? { ...activity, read: true } : activity
      )
    );
  };

  // 處理標記所有活動為已讀
  const handleMarkAllAsRead = () => {
    markAllActivitiesAsRead();
    // 更新狀態
    setActivities(prevActivities => 
      prevActivities.map(activity => ({ ...activity, read: true }))
    );
  };

  // 處理刪除活動
  const handleDeleteActivity = (activityId: string) => {
    deleteActivity(activityId);
    // 更新狀態，移除被刪除的活動
    setActivities(prevActivities => 
      prevActivities.filter(activity => activity.id !== activityId)
    );
    message.success('已刪除活動記錄');
  };

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

  // 格式化活動時間
  const formatActivityTime = (timestamp: string) => {
    const activityTime = dayjs(timestamp);
    const now = dayjs();
    
    if (now.diff(activityTime, 'day') < 1) {
      return activityTime.fromNow(); // 今天內顯示"幾小時前"、"幾分鐘前"
    } else if (now.diff(activityTime, 'day') < 7) {
      return activityTime.format('dddd HH:mm'); // 一週內顯示"星期幾 時間"
    } else {
      return activityTime.format('YYYY/MM/DD HH:mm'); // 一週前顯示完整日期時間
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="mb-0">最近活動</Title>
        {activities.some(activity => !activity.read) && (
          <Button 
            type="text" 
            icon={<CheckOutlined />} 
            onClick={handleMarkAllAsRead}
          >
            全部標記為已讀
          </Button>
        )}
      </div>
      
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
          <List.Item
            actions={[
              !activity.read && (
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => handleMarkAsRead(activity.id)}
                >
                  標記為已讀
                </Button>
              ),
              <Popconfirm
                title="確定要刪除此活動記錄嗎？"
                onConfirm={() => handleDeleteActivity(activity.id)}
                okText="確定"
                cancelText="取消"
                okButtonProps={{ className: 'bg-blue-600 hover:bg-blue-700' }}
                cancelButtonProps={{ style: { marginRight: '10px' } }}
              >
                <Button 
                  type="text" 
                  danger
                  size="small" 
                  icon={<DeleteOutlined />}
                >
                  刪除
                </Button>
              </Popconfirm>
            ]}
          >
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
                    {formatActivityTime(activity.timestamp)}
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
      
      {activities.length === 0 && !loading && (
        <Empty description="尚無活動記錄" />
      )}
    </div>
  );
};

export default RecentActivities;