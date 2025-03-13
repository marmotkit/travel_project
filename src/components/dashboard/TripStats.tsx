import React from 'react';

interface TripStatsProps {
  upcomingTrips: number;
  totalTrips: number;
  photos: number;
  expenses: string;
}

const TripStats: React.FC<TripStatsProps> = ({
  upcomingTrips,
  totalTrips,
  photos,
  expenses,
}) => {
  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-2">
          <i className="fas fa-suitcase-rolling text-blue-500 text-xl mr-2"></i>
          <h3 className="text-gray-800 font-bold">即將到來</h3>
        </div>
        <p className="text-3xl font-bold text-gray-800">{upcomingTrips}</p>
        <p className="text-gray-500 text-sm">個旅程</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-2">
          <i className="fas fa-route text-green-500 text-xl mr-2"></i>
          <h3 className="text-gray-800 font-bold">總旅程</h3>
        </div>
        <p className="text-3xl font-bold text-gray-800">{totalTrips}</p>
        <p className="text-gray-500 text-sm">次旅行</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-2">
          <i className="fas fa-calculator text-red-500 text-xl mr-2"></i>
          <h3 className="text-gray-800 font-bold">總支出</h3>
        </div>
        <p className="text-3xl font-bold text-gray-800">{expenses}</p>
        <p className="text-gray-500 text-sm">旅遊花費</p>
      </div>
    </>
  );
};

export default TripStats; 