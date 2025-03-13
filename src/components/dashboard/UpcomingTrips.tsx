import React from 'react';
import { Link } from 'react-router-dom';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

const UpcomingTrips: React.FC = () => {
  // 模擬從 localStorage 獲取的數據
  const upcomingTrips: Trip[] = [
    {
      id: '1',
      title: '東京商務出差',
      destination: '日本，東京',
      startDate: '2023-11-10',
      endDate: '2023-11-15',
    },
    {
      id: '2',
      title: '峇里島度假',
      destination: '印尼，峇里島',
      startDate: '2023-12-20',
      endDate: '2023-12-31',
    },
  ];

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">即將到來的旅程</h3>
        <Link to="/trips" className="text-blue-500 hover:text-blue-700 text-sm">
          查看全部
        </Link>
      </div>
      
      {upcomingTrips.length > 0 ? (
        <div className="space-y-4">
          {upcomingTrips.map((trip) => (
            <div key={trip.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <Link to={`/trips/${trip.id}`} className="block hover:bg-gray-50 rounded-md p-2 -mx-2">
                <h4 className="font-semibold text-gray-800 mb-1">{trip.title}</h4>
                <p className="text-gray-600 text-sm mb-1">{trip.destination}</p>
                <p className="text-gray-500 text-sm">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-4">
          <p className="text-gray-500 mb-2">沒有即將到來的旅程</p>
          <Link
            to="/trips/new"
            className="inline-block text-blue-500 hover:text-blue-700 text-sm"
          >
            建立新旅程
          </Link>
        </div>
      )}
    </div>
  );
};

export default UpcomingTrips; 