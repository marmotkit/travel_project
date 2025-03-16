import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SideMenuProps {
  isAdmin: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({ isAdmin }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: 'fa-tachometer-alt', label: '儀表板' },
    { path: '/trips', icon: 'fa-suitcase', label: '旅遊專案' },
    { path: '/itinerary', icon: 'fa-map-marked-alt', label: '行程管理' },
    { path: '/transport', icon: 'fa-plane', label: '交通管理' },
    { path: '/accommodation', icon: 'fa-bed', label: '住宿管理' },
    { path: '/meals', icon: 'fa-utensils', label: '餐飲管理' },
    { path: '/documents', icon: 'fa-passport', label: '證件管理' },
    { path: '/budget', icon: 'fa-calculator', label: '預算管理' },
    { path: '/photos', icon: 'fa-images', label: '旅遊照片' },
    { path: '/notes', icon: 'fa-sticky-note', label: '注意事項' },
  ];
  
  const adminMenuItems = [
    { path: '/admin/users', icon: 'fa-users', label: '用戶管理' },
    { path: '/admin/reports', icon: 'fa-chart-bar', label: '報表分析' },
    { path: '/admin/settings', icon: 'fa-cogs', label: '系統設定' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen overflow-y-auto hidden md:block">
      <div className="p-6">
        <h1 className="text-xl font-bold">旅遊管理系統</h1>
      </div>
      
      <nav className="mt-6">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="px-6 py-3">
              <Link
                to={item.path}
                className={`flex items-center ${
                  location.pathname === item.path ? 'text-blue-400' : 'text-gray-300'
                } hover:text-white transition-colors duration-200`}
              >
                <i className={`fas ${item.icon} w-5 text-center mr-3`}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          
          {isAdmin && (
            <>
              <li className="px-6 py-3 mt-4 border-t border-gray-700">
                <span className="text-gray-500 text-sm">管理員功能</span>
              </li>
              {adminMenuItems.map((item) => (
                <li key={item.path} className="px-6 py-3">
                  <Link
                    to={item.path}
                    className={`flex items-center ${
                      location.pathname === item.path ? 'text-blue-400' : 'text-gray-300'
                    } hover:text-white transition-colors duration-200`}
                  >
                    <i className={`fas ${item.icon} w-5 text-center mr-3`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default SideMenu; 