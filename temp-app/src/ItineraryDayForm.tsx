import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const ItineraryDayForm: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return <div>加載中...</div>;
  }
  
  return (
    <div>
      <h1>行程日表單</h1>
      <div>
        <p>行程日表單將在這裡實現</p>
      </div>
    </div>
  );
};

export default ItineraryDayForm; 