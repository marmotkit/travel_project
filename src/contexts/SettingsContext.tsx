import React, { createContext, useContext, useState, useEffect } from 'react';

// 系統設定類型定義
export type SystemSettings = {
  theme: {
    mode: 'light' | 'dark'; // 主題模式
    primaryColor: string; // 主題顏色
    fontSize: 'small' | 'medium' | 'large'; // 字體大小
    sidebarCollapsed: boolean; // 側邊欄預設狀態
  };
  localization: {
    language: 'zh-TW' | 'en-US' | 'ja-JP'; // 系統語言
    dateFormat: 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY'; // 日期格式
    timeFormat: '12h' | '24h'; // 時間格式
    currency: 'TWD' | 'USD' | 'JPY' | 'EUR'; // 貨幣單位
  };
  notifications: {
    enableNotifications: boolean; // 是否啟用通知
    notificationSound: boolean; // 通知聲音
    tripCountdown: boolean; // 旅行倒數提醒
    reminderTime: string; // 提醒時間 (HH:MM)
  };
  dataManagement: {
    autoBackup: boolean; // 自動備份
    backupFrequency: 'daily' | 'weekly' | 'monthly'; // 備份頻率
    backupLocation: 'local' | 'cloud'; // 備份位置
  };
  about: {
    version: string; // 應用版本
    lastUpdated: string; // 最後更新日期
  };
};

// 預設設定
const defaultSettings: SystemSettings = {
  theme: {
    mode: 'light',
    primaryColor: '#1890ff',
    fontSize: 'medium',
    sidebarCollapsed: false,
  },
  localization: {
    language: 'zh-TW',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    currency: 'TWD',
  },
  notifications: {
    enableNotifications: true,
    notificationSound: true,
    tripCountdown: true,
    reminderTime: '09:00',
  },
  dataManagement: {
    autoBackup: false,
    backupFrequency: 'weekly',
    backupLocation: 'local',
  },
  about: {
    version: '1.3.1',
    lastUpdated: new Date().toISOString(),
  },
};

// 設定上下文類型
type SettingsContextType = {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  updateTheme: (theme: Partial<SystemSettings['theme']>) => void;
  updateLocalization: (localization: Partial<SystemSettings['localization']>) => void;
  updateNotifications: (notifications: Partial<SystemSettings['notifications']>) => void;
  updateDataManagement: (dataManagement: Partial<SystemSettings['dataManagement']>) => void;
  resetSettings: () => void;
};

// 創建上下文
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 設定提供者組件
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // 初始加載設定
  useEffect(() => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as SystemSettings;
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse settings from localStorage:', error);
        // 如果解析失敗，使用默認設定
        setSettings(defaultSettings);
      }
    }
  }, []);

  // 保存設定到本地存儲
  useEffect(() => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    
    // 應用主題模式
    document.documentElement.setAttribute('data-theme', settings.theme.mode);
    
    // 應用主題顏色
    document.documentElement.style.setProperty('--primary-color', settings.theme.primaryColor);
    
    // 應用字體大小
    const fontSizeClasses = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
    
    // 移除所有字體大小類
    document.body.classList.remove('text-sm', 'text-base', 'text-lg');
    
    // 添加當前字體大小類
    document.body.classList.add(fontSizeClasses[settings.theme.fontSize]);
    
  }, [settings]);

  // 更新整個設定
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // 更新主題設定
  const updateTheme = (theme: Partial<SystemSettings['theme']>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      theme: {
        ...prevSettings.theme,
        ...theme,
      },
    }));
  };

  // 更新本地化設定
  const updateLocalization = (localization: Partial<SystemSettings['localization']>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      localization: {
        ...prevSettings.localization,
        ...localization,
      },
    }));
  };

  // 更新通知設定
  const updateNotifications = (notifications: Partial<SystemSettings['notifications']>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      notifications: {
        ...prevSettings.notifications,
        ...notifications,
      },
    }));
  };

  // 更新數據管理設定
  const updateDataManagement = (dataManagement: Partial<SystemSettings['dataManagement']>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      dataManagement: {
        ...prevSettings.dataManagement,
        ...dataManagement,
      },
    }));
  };

  // 重置設定
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateTheme,
        updateLocalization,
        updateNotifications,
        updateDataManagement,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// 自定義hook用於獲取設定
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 