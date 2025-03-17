import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    developerName: string; // 開發者名稱
    contactEmail: string; // 聯絡信箱
    websiteUrl: string; // 官方網站
    description: string; // 系統描述
    copyright: string; // 版權信息
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
    version: '1.4.5',
    lastUpdated: new Date().toISOString(),
    developerName: '旅行計劃管理系統開發團隊',
    contactEmail: 'contact@travelplan.example.com',
    websiteUrl: 'https://travelplan.example.com',
    description: '一個全面的旅行管理應用程式，幫助您規劃、組織和管理您的旅行體驗。',
    copyright: '\u00A9 2025 旅行計劃管理系統 版權所有'
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
  applyTheme: (theme: SystemSettings['theme']) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

// 創建上下文
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 設定提供者組件
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  // 單獨跟踪側邊欄狀態，用於UI更新
  const [, setSidebarCollapsedState] = useState<boolean>(defaultSettings.theme.sidebarCollapsed);

  // 應用主題設定到DOM
  const applyTheme = useCallback((theme: SystemSettings['theme']) => {
    console.log('正在應用主題設定:', theme);
    
    try {
      // 設置主題模式 - 明確指定 body 的 className，確保在所有頁面生效
      document.body.className = theme.mode === 'dark' ? 'dark-theme' : 'light-theme';
      console.log('設置主題模式:', theme.mode, document.body.className);
      
      // 設置主題顏色 - 使用 CSS 變數，確保在所有元素上生效
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
      document.documentElement.style.setProperty('--primary-color-hover', adjustColor(theme.primaryColor, 20));
      document.documentElement.style.setProperty('--primary-color-active', adjustColor(theme.primaryColor, -20));
      document.documentElement.style.setProperty('--primary-color-light', adjustColor(theme.primaryColor, 80, true));
      
      // 設置字體大小
      const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
      document.documentElement.style.setProperty('--font-size-base', fontSizeMap[theme.fontSize]);
      document.documentElement.style.setProperty('--font-size-sm', theme.fontSize === 'small' ? '12px' : theme.fontSize === 'medium' ? '14px' : '16px');
      document.documentElement.style.setProperty('--font-size-lg', theme.fontSize === 'small' ? '16px' : theme.fontSize === 'medium' ? '18px' : '20px');
      document.documentElement.style.setProperty('--font-size-xl', theme.fontSize === 'small' ? '18px' : theme.fontSize === 'medium' ? '20px' : '24px');
      
      // 強制應用主題顏色到主要元素
      const primaryColorElements = document.querySelectorAll('.ant-btn-primary, .ant-checkbox-checked, .ant-switch-checked, .ant-radio-checked');
      primaryColorElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.backgroundColor = theme.primaryColor;
          element.style.borderColor = theme.primaryColor;
        }
      });
      
      console.log('主題應用完成');
    } catch (error) {
      console.error('應用主題時發生錯誤:', error);
    }
  }, []);

  // 專門用於設置側邊欄摺疊狀態
  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    setSettings(prevSettings => ({
      ...prevSettings,
      theme: {
        ...prevSettings.theme,
        sidebarCollapsed: collapsed
      }
    }));

    // 立即保存到localStorage，確保重新載入頁面後設定仍然生效
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as SystemSettings;
        const updatedSettings = {
          ...parsedSettings,
          theme: {
            ...parsedSettings.theme,
            sidebarCollapsed: collapsed
          }
        };
        localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('保存側邊欄設定失敗:', error);
      }
    } else {
      // 如果還沒有保存過設定，則保存一個新的
      const newSettings = {
        ...defaultSettings,
        theme: {
          ...defaultSettings.theme,
          sidebarCollapsed: collapsed
        }
      };
      localStorage.setItem('systemSettings', JSON.stringify(newSettings));
    }
  };

  // 輔助函數：調整顏色亮度
  const adjustColor = (hex: any, amount: number, lightness = false): string => {
    try {
      // 如果是 ColorPicker 返回的對象格式，轉換為十六進制字符串
      if (typeof hex === 'object' && hex !== null && hex.toHexString) {
        hex = hex.toHexString();
      }

      // 如果不是以 # 開頭的十六進制顏色，加上 #
      if (typeof hex === 'string' && !hex.startsWith('#')) {
        hex = '#' + hex;
      }

      // 檢查是否是有效的十六進制顏色格式
      if (typeof hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        console.error('調整顏色失敗：無效的顏色格式', hex);
        return '#1890ff'; // 返回默認藍色
      }

      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);

      if (lightness) {
        // 轉為更淺色
        r = Math.min(255, r + amount);
        g = Math.min(255, g + amount);
        b = Math.min(255, b + amount);
      } else {
        // 調整亮度
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
      }

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.error('調整顏色過程中發生錯誤:', error);
      return '#1890ff'; // 返回默認藍色
    }
  };

  // 初始加載設定
  useEffect(() => {
    const storedSettings = localStorage.getItem('systemSettings');
    
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setSettings(parsedSettings);
      applyTheme(parsedSettings.theme);
      setSidebarCollapsedState(parsedSettings.theme.sidebarCollapsed);
    } else {
      // 首次使用，應用默認主題
      applyTheme(defaultSettings.theme);
      setSidebarCollapsedState(defaultSettings.theme.sidebarCollapsed);
    }
  }, [applyTheme]);

  // 保存設定到本地存儲
  useEffect(() => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    console.log('保存設定到localStorage:', settings);
  }, [settings]);

  // 更新整體設定
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      
      // 如果主題變更，應用新的主題設定
      if (newSettings.theme) {
        applyTheme(updatedSettings.theme);
      }
      
      return updatedSettings;
    });
  };

  // 更新主題設定
  const updateTheme = (theme: Partial<SystemSettings['theme']>) => {
    setSettings((prevSettings) => {
      const updatedTheme = { ...prevSettings.theme, ...theme };
      
      // 應用新的主題設定
      applyTheme(updatedTheme);
      
      // 如果包含側邊欄設定，單獨更新狀態
      if (theme.sidebarCollapsed !== undefined) {
        setSidebarCollapsedState(theme.sidebarCollapsed);
      }
      
      return { ...prevSettings, theme: updatedTheme };
    });
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

  // 重置所有設定
  const resetSettings = () => {
    setSettings(defaultSettings);
    // 重置時應用默認主題
    applyTheme(defaultSettings.theme);
  };
  
  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      updateTheme, 
      updateLocalization, 
      updateNotifications, 
      updateDataManagement, 
      resetSettings,
      applyTheme,
      setSidebarCollapsed
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 自定義hook用於獲取設定
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};