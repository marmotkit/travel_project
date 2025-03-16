import React from 'react';
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
  BarChartOutlined
} from '@ant-design/icons';

interface SideMenuProps {
  isAdmin: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const SideMenu: React.FC<SideMenuProps> = ({ isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    }
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
        {
          key: '/analytics',
          icon: <BarChartOutlined />,
          label: '報表分析',
        },
      ],
    },
  ];

  return (
    <div className="w-64 h-screen bg-[#001529] flex-shrink-0">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['admin']}
        style={{ 
          height: '100%',
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