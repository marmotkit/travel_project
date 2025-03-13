import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import TripItem from '../components/trips/TripItem';
import { v4 as uuidv4 } from 'uuid';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

const Trips: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // 從localStorage獲取旅程數據，若無則使用默認數據
    const storedTrips = localStorage.getItem('trips');
    if (storedTrips) {
      setTrips(JSON.parse(storedTrips));
    } else {
      // 示例數據
      const demoTrips: Trip[] = [
        {
          id: uuidv4(),
          title: '東京商務出差',
          destination: '日本，東京',
          startDate: '2023-11-10',
          endDate: '2023-11-15',
          status: 'upcoming',
        },
        {
          id: uuidv4(),
          title: '峇里島度假',
          destination: '印尼，峇里島',
          startDate: '2023-12-20',
          endDate: '2023-12-31',
          status: 'upcoming',
        },
        {
          id: uuidv4(),
          title: '舊金山科技大會',
          destination: '美國，舊金山',
          startDate: '2023-09-05',
          endDate: '2023-09-12',
          status: 'completed',
        },
      ];
      
      setTrips(demoTrips);
      localStorage.setItem('trips', JSON.stringify(demoTrips));
    }
  }, []);

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
  };

  const filteredTrips = filter === 'all' 
    ? trips 
    : trips.filter(trip => trip.status === filter);

  const handleDeleteTrip = (id: string) => {
    const updatedTrips = trips.filter(trip => trip.id !== id);
    setTrips(updatedTrips);
    localStorage.setItem('trips', JSON.stringify(updatedTrips));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 overflow-auto">
        <Header 
          title="旅遊專案" 
          isAdmin={isAdmin} 
          onToggleAdmin={toggleAdminMode} 
        />
        
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">我的旅程</h2>
              <p className="text-gray-600">管理你的旅遊專案</p>
            </div>
            
            <Link
              to="/trips/new"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md inline-flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              建立新旅程
            </Link>
          </div>
          
          <div className="mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                所有旅程
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                即將到來
              </button>
              <button
                onClick={() => setFilter('ongoing')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'ongoing' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                進行中
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                已完成
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.length > 0 ? (
              filteredTrips.map(trip => (
                <TripItem 
                  key={trip.id} 
                  trip={trip} 
                  onDelete={handleDeleteTrip} 
                />
              ))
            ) : (
              <div className="col-span-3 p-8 text-center bg-white rounded-lg shadow">
                <i className="fas fa-suitcase-rolling text-gray-400 text-5xl mb-4"></i>
                <h3 className="text-xl font-bold text-gray-800 mb-2">沒有符合條件的旅程</h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'all' 
                    ? '你還沒有建立任何旅程' 
                    : `目前沒有${filter === 'upcoming' ? '即將到來' : filter === 'ongoing' ? '進行中' : '已完成'}的旅程`}
                </p>
                {filter === 'all' && (
                  <Link
                    to="/trips/new"
                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    建立第一個旅程
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Trips; 