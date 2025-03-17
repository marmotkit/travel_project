import React, { useState, useEffect } from 'react';
import { Empty, Spin } from 'antd';
import { TravelNote } from '../../pages/TravelNotes';

interface TravelNoteRemindersProps {
  limit?: number;
}

const TravelNoteReminders: React.FC<TravelNoteRemindersProps> = ({ limit = 3 }) => {
  const [notes, setNotes] = useState<TravelNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);

  // 獲取旅行資料，用於顯示旅行標題
  const getTripTitle = (tripId: string) => {
    const trip = trips.find(trip => trip.id === tripId);
    return trip ? trip.title : '未知旅行';
  };

  // 獲取距離提醒日期的剩餘天數或狀態文字
  const getReminderStatus = (reminderDate: string | undefined) => {
    if (!reminderDate) return '無截止日期';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminder = new Date(reminderDate);
    reminder.setHours(0, 0, 0, 0);
    
    const diffTime = reminder.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '已過期';
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    return `${diffDays} 天後`;
  };

  // 根據類別獲取 CSS 類名
  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'safety':
        return 'bg-red-50 border-red-400';
      case 'health':
        return 'bg-pink-50 border-pink-400';
      case 'culture':
        return 'bg-purple-50 border-purple-400';
      case 'transportation':
        return 'bg-blue-50 border-blue-400';
      case 'weather':
        return 'bg-cyan-50 border-cyan-400';
      case 'documents':
        return 'bg-green-50 border-green-400';
      case 'luggage':
        return 'bg-yellow-50 border-yellow-400';
      case 'budget':
        return 'bg-orange-50 border-orange-400';
      default:
        return 'bg-gray-50 border-gray-400';
    }
  };

  // 載入注意事項資料
  useEffect(() => {
    const loadData = () => {
      try {
        // 載入旅行數據
        const tripsData = localStorage.getItem('trips');
        if (tripsData) {
          setTrips(JSON.parse(tripsData));
        }
        
        // 載入注意事項
        const notesData = localStorage.getItem('travelNotes');
        if (notesData) {
          const allNotes: TravelNote[] = JSON.parse(notesData);
          
          // 過濾和排序注意事項：
          // 1. 優先按提醒日期排序（有日期的在前，日期近的優先）
          // 2. 然後按優先級排序（高優先級在前）
          const sortedNotes = allNotes
            .filter(note => note.reminderDate || note.priority === 'high')
            .sort((a, b) => {
              // 如果兩者都有提醒日期，按日期排序
              if (a.reminderDate && b.reminderDate) {
                return new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime();
              }
              // 有提醒日期的優先
              if (a.reminderDate) return -1;
              if (b.reminderDate) return 1;
              
              // 按優先級排序
              const priorityOrder = { high: 1, medium: 2, low: 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .slice(0, limit); // 只取前幾個
            
          setNotes(sortedNotes);
        }
      } catch (error) {
        console.error('載入注意事項失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [limit]);

  if (loading) {
    return <Spin tip="載入中..." />;
  }

  if (notes.length === 0) {
    return <Empty description="暫無注意事項提醒" />;
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className={`p-4 border-l-4 rounded ${getCategoryClass(note.category)}`}
        >
          <h4 className="font-medium">{getTripTitle(note.tripId)}</h4>
          <p className="text-sm text-gray-600 mb-1">{note.title}</p>
          <p className="text-xs text-gray-500">
            截止日期: {note.reminderDate 
              ? `${new Date(note.reminderDate).toLocaleDateString()} (${getReminderStatus(note.reminderDate)})`
              : '無截止日期'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default TravelNoteReminders;
