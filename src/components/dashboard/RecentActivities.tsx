import React from 'react';

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'completed' | 'booked';
  subject: string;
  timestamp: string;
  tripId: string;
}

const RecentActivities: React.FC = () => {
  // 模擬活動數據
  const activities: Activity[] = [
    {
      id: '1',
      type: 'booked',
      subject: '東京商務出差的機票',
      timestamp: '2023-10-15T14:30:00',
      tripId: '1',
    },
    {
      id: '2',
      type: 'created',
      subject: '峇里島度假行程',
      timestamp: '2023-10-12T09:15:00',
      tripId: '2',
    },
    {
      id: '3',
      type: 'updated',
      subject: '東京商務出差的住宿安排',
      timestamp: '2023-10-10T16:45:00',
      tripId: '1',
    },
  ];

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: Activity['type']): string => {
    switch (type) {
      case 'created':
        return 'fas fa-plus-circle text-green-500';
      case 'updated':
        return 'fas fa-edit text-blue-500';
      case 'completed':
        return 'fas fa-check-circle text-purple-500';
      case 'booked':
        return 'fas fa-bookmark text-yellow-500';
      default:
        return 'fas fa-info-circle text-gray-500';
    }
  };

  const getActivityText = (type: Activity['type']): string => {
    switch (type) {
      case 'created':
        return '建立了';
      case 'updated':
        return '更新了';
      case 'completed':
        return '完成了';
      case 'booked':
        return '預訂了';
      default:
        return '操作了';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-800 mb-4">最近活動</h3>
      
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className="mr-3 mt-1">
                <i className={getActivityIcon(activity.type)}></i>
              </div>
              <div className="flex-1">
                <p className="text-gray-700">
                  您 {getActivityText(activity.type)}
                  <span className="font-medium">{activity.subject}</span>
                </p>
                <p className="text-gray-500 text-sm">{formatTime(activity.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-4">
          <p className="text-gray-500">沒有最近的活動記錄</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivities; 