import React, { useEffect } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ProjectOutlined,
  EnvironmentOutlined,
  CarOutlined,
  HomeOutlined,
  CoffeeOutlined,
  IdcardOutlined,
  WalletOutlined,
  PictureOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useSettings } from '../../contexts/SettingsContext';

interface SideMenuProps {
  isAdmin: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const SideMenu: React.FC<SideMenuProps> = ({ isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, setSidebarCollapsed } = useSettings();
  // 直接使用設置值初始化狀態，確保第一次渲染時就能應用設置
  const [collapsed, setCollapsed] = React.useState(settings.theme.sidebarCollapsed);

  // 當設定變更時更新摺疊狀態
  useEffect(() => {
    setCollapsed(settings.theme.sidebarCollapsed);
    // 當組件掛載時，將當前摺疊狀態輸出到控制台以便調試
    console.log('SideMenu - 側邊欄狀態更新:', settings.theme.sidebarCollapsed);
  }, [settings.theme.sidebarCollapsed]);

  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '儀表板',
    },
    {
      key: '/trips',
      icon: <ProjectOutlined />,
      label: '旅遊專案',
    },
    {
      key: '/itinerary',
      icon: <EnvironmentOutlined />,
      label: '行程管理',
    },
    {
      key: '/transportation',
      icon: <CarOutlined />,
      label: '交通管理',
    },
    {
      key: '/accommodation',
      icon: <HomeOutlined />,
      label: '住宿管理',
    },
    {
      key: '/meals',
      icon: <CoffeeOutlined />,
      label: '餐飲管理',
    },
    {
      key: '/documents',
      icon: <IdcardOutlined />,
      label: '證件管理',
    },
    {
      key: '/budgets',
      icon: <WalletOutlined />,
      label: '預算管理',
    },
    {
      key: '/moments',
      icon: <PictureOutlined />,
      label: '旅遊花絮',
    },
    {
      key: '/notes',
      icon: <ExclamationCircleOutlined />,
      label: '注意事項',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系統設定',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '報表分析',
    },
  ];

  const adminItems: MenuItem[] = [
    { type: 'divider' },
    {
      key: 'admin',
      label: '管理者功能',
      type: 'group',
      children: [
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: '用戶管理',
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: '系統設定',
        },
      ],
    },
  ];

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    
    // 使用新的方法直接更新側邊欄摺疊狀態
    setSidebarCollapsed(newCollapsed);
    console.log('SideMenu - 切換側邊欄狀態:', newCollapsed);
  };

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-[#001529] flex-shrink-0 transition-all duration-300`}>
      {/* 系統標題 */}
      <div className={`p-4 ${collapsed ? 'text-center' : ''}`}>
        <h1 className={`app-title text-white font-bold ${collapsed ? 'text-sm' : 'text-xl'} transition-all duration-300`}>
          {collapsed ? '旅程' : '旅行計劃管理系統'}
        </h1>
      </div>
      
      <div className="flex justify-end p-2">
        <button 
          onClick={toggleCollapsed} 
          className="text-white hover:text-blue-400 transition-colors"
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>
      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['admin']}
        style={{ 
          height: 'calc(100% - 104px)', // 調整高度，為標題騰出空間
          borderRight: 0
        }}
        theme="dark"
        items={[...menuItems, ...(isAdmin ? adminItems : [])]}
        onClick={({ key }) => navigate(key)}
      />
    </div>
  );
};

export default SideMenu;