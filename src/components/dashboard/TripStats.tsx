import React from 'react';

interface TripStatsProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const TripStats: React.FC<TripStatsProps> = ({
  title,
  value,
  icon,
  color
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-2">
        <div className={`${color} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
          <i className={`fas fa-${icon} text-white`}></i>
        </div>
        <h3 className="text-gray-800 font-bold">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

export default TripStats; 