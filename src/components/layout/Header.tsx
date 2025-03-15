import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, isAdmin, onToggleAdmin }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username?: string; fullName?: string; name?: string; email: string; isAdmin: boolean } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUserData = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('Header: 用戶資料已載入', userData);
          setUser(userData);
        } catch (err) {
          console.error('解析用戶資料時出錯:', err);
        }
      }
    };

    loadUserData();

    // 定期檢查用戶資料變化
    const intervalId = setInterval(loadUserData, 2000);

    // 點擊其他位置關閉下拉菜單
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleAdminMode = () => {
    onToggleAdmin();
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.fullName ? user.fullName.charAt(0) : user?.name ? user.name.charAt(0) : user?.username ? user.username.charAt(0) : 'U'}
          </div>
          <span className="hidden md:inline-block text-gray-700">{user?.fullName || user?.name || user?.username || '用戶'}</span>
          <i className="fas fa-chevron-down text-gray-500 text-xs"></i>
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10">
            <div className="p-3 border-b border-gray-100">
              <p className="font-medium text-gray-800">{user?.fullName || user?.name || user?.username || '用戶'}</p>
              <p className="text-sm text-gray-500">{user?.email || '未知郵箱'}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/profile');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <i className="fas fa-user-circle mr-2"></i> 個人資料
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/admin/users');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <i className="fas fa-users-cog mr-2"></i> 用戶管理
                </button>
              )}
              <button
                onClick={toggleAdminMode}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <i className={`fas ${isAdmin ? 'fa-user' : 'fa-user-shield'} mr-2`}></i>
                {isAdmin ? '切換到一般模式' : '切換到管理員模式'}
              </button>
            </div>
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <i className="fas fa-sign-out-alt mr-2"></i> 登出
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 