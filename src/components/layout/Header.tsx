import React from 'react';

interface HeaderProps {
  title: string;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  isAdmin = false, 
  onToggleAdmin, 
  userName 
}) => {
  return (
    <header className="bg-white shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        
        <div className="flex items-center space-x-4">
          {onToggleAdmin && (
            <button
              onClick={onToggleAdmin}
              className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
            >
              {isAdmin ? '切換到一般模式' : '切換到管理員模式'}
            </button>
          )}
          
          {userName && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2">
                {userName.charAt(0)}
              </div>
              <span className="text-gray-700">{userName}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 