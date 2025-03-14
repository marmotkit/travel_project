import React from 'react';
import { Link } from 'react-router-dom';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface TripItemProps {
  trip: Trip;
  onDelete: (id: string) => void;
}

const TripItem: React.FC<TripItemProps> = ({ trip, onDelete }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusText = (status: Trip['status']): string => {
    switch (status) {
      case 'upcoming':
        return '即將到來';
      case 'ongoing':
        return '進行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '';
    }
  };

  const getStatusColor = (status: Trip['status']): string => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800">{trip.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
            {getStatusText(trip.status)}
          </span>
        </div>
        
        <p className="text-gray-600 mb-3">
          <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
          {trip.destination}
        </p>
        
        <p className="text-gray-600 mb-4">
          <i className="far fa-calendar-alt text-blue-500 mr-2"></i>
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </p>
        
        <div className="flex justify-between items-center mt-4">
          <Link 
            to={`/trips/${trip.id}`}
            className="text-blue-500 hover:text-blue-700 font-medium flex items-center"
          >
            <span>查看詳情</span>
            <i className="fas fa-chevron-right ml-1 text-sm"></i>
          </Link>
          
          <div className="flex space-x-2">
            <Link 
              to={`/trips/${trip.id}/edit`}
              className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50"
              aria-label="編輯"
              title="編輯"
            >
              <i className="fas fa-edit"></i>
            </Link>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (window.confirm('確定要刪除這個旅程嗎？此操作無法復原。')) {
                  onDelete(trip.id);
                }
              }}
              className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50"
              aria-label="刪除"
              title="刪除"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripItem; 