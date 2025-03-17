import dayjs from 'dayjs';

// 活動類型定義
export interface Activity {
  id: string;
  type: 'trip_created' | 'trip_updated' | 'document_added' | 'itinerary_updated' | 
         'note_created' | 'note_updated' | 'transportation_added' | 'accommodation_added' | 
         'expense_added' | 'moment_added';
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

// 獲取當前登入用戶資訊
const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    return JSON.parse(userStr);
  }
  
  // 默認值
  return {
    name: '測試用戶',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  };
};

// 生成唯一ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 記錄新活動
export const logActivity = (
  type: Activity['type'],
  message: string,
  entity?: {
    id: string;
    name: string;
    type: string;
  }
): void => {
  try {
    // 獲取現有活動
    const activitiesStr = localStorage.getItem('activities');
    let activities: Activity[] = activitiesStr ? JSON.parse(activitiesStr) : [];
    
    // 創建新活動
    const newActivity: Activity = {
      id: generateId(),
      type,
      message,
      user: getCurrentUser(),
      entity,
      timestamp: dayjs().toISOString(),
      read: false,
    };
    
    // 添加到活動列表的開頭
    activities = [newActivity, ...activities];
    
    // 只保留最近50條活動記錄
    if (activities.length > 50) {
      activities = activities.slice(0, 50);
    }
    
    // 存儲到localStorage
    localStorage.setItem('activities', JSON.stringify(activities));
  } catch (error) {
    console.error('記錄活動失敗:', error);
  }
};

// 獲取活動列表
export const getActivities = (limit?: number): Activity[] => {
  try {
    const activitiesStr = localStorage.getItem('activities');
    if (!activitiesStr) return [];
    
    const activities: Activity[] = JSON.parse(activitiesStr);
    return limit ? activities.slice(0, limit) : activities;
  } catch (error) {
    console.error('獲取活動失敗:', error);
    return [];
  }
};

// 將活動標記為已讀
export const markActivityAsRead = (activityId: string): void => {
  try {
    const activitiesStr = localStorage.getItem('activities');
    if (!activitiesStr) return;
    
    const activities: Activity[] = JSON.parse(activitiesStr);
    const updatedActivities = activities.map(activity => {
      if (activity.id === activityId) {
        return { ...activity, read: true };
      }
      return activity;
    });
    
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
  } catch (error) {
    console.error('更新活動狀態失敗:', error);
  }
};

// 標記所有活動為已讀
export const markAllActivitiesAsRead = (): void => {
  try {
    const activitiesStr = localStorage.getItem('activities');
    if (!activitiesStr) return;
    
    const activities: Activity[] = JSON.parse(activitiesStr);
    const updatedActivities = activities.map(activity => ({
      ...activity,
      read: true
    }));
    
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
  } catch (error) {
    console.error('標記所有活動為已讀失敗:', error);
  }
};

// 刪除活動
export const deleteActivity = (activityId: string): void => {
  try {
    const activitiesStr = localStorage.getItem('activities');
    if (!activitiesStr) return;
    
    const activities: Activity[] = JSON.parse(activitiesStr);
    const updatedActivities = activities.filter(activity => activity.id !== activityId);
    
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
  } catch (error) {
    console.error('刪除活動失敗:', error);
  }
};
