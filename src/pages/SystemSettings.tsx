import React, { useState } from 'react';
import { Tabs, Card, Form, Switch, Radio, Select, Input, Button, Divider, Typography, Space, ColorPicker, notification } from 'antd';
import type { TabsProps } from 'antd';
import { useSettings } from '../contexts/SettingsContext';
import type { SystemSettings as SystemSettingsType } from '../contexts/SettingsContext';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { HomeOutlined, GlobalOutlined, BellOutlined, DatabaseOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const SystemSettings: React.FC = () => {
  const { settings, updateTheme, updateLocalization, updateNotifications, updateDataManagement, resetSettings } = useSettings();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  
  // 切換管理員模式
  const handleToggleAdmin = () => {
    setIsAdmin(!isAdmin);
  };

  // 主題設定表單提交
  const handleThemeSubmit = (values: SystemSettingsType['theme']) => {
    updateTheme(values);
    notification.success({
      message: '設定已更新',
      description: '主題設定已成功儲存',
    });
  };

  // 本地化設定表單提交
  const handleLocalizationSubmit = (values: SystemSettingsType['localization']) => {
    updateLocalization(values);
    notification.success({
      message: '設定已更新',
      description: '語言與地區設定已成功儲存',
    });
  };

  // 通知設定表單提交
  const handleNotificationsSubmit = (values: SystemSettingsType['notifications']) => {
    updateNotifications(values);
    notification.success({
      message: '設定已更新',
      description: '通知設定已成功儲存',
    });
  };

  // 數據管理設定表單提交
  const handleDataManagementSubmit = (values: SystemSettingsType['dataManagement']) => {
    updateDataManagement(values);
    notification.success({
      message: '設定已更新',
      description: '資料管理設定已成功儲存',
    });
  };

  // 重置所有設定
  const handleResetSettings = () => {
    if (resetConfirm) {
      resetSettings();
      notification.success({
        message: '設定已重置',
        description: '所有設定已恢復為預設值',
      });
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => {
        setResetConfirm(false);
      }, 3000);
    }
  };

  // 匯出設定
  const handleExportSettings = () => {
    const settingsStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_plan_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notification.success({
      message: '設定已匯出',
      description: '系統設定已成功匯出為JSON檔案',
    });
  };

  // 檔案選擇和匯入設定
  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (e) => {
        try {
          if (e.target && typeof e.target.result === 'string') {
            const importedSettings = JSON.parse(e.target.result) as SystemSettingsType;
            
            // 更新各項設定
            updateTheme(importedSettings.theme);
            updateLocalization(importedSettings.localization);
            updateNotifications(importedSettings.notifications);
            updateDataManagement(importedSettings.dataManagement);
            
            notification.success({
              message: '設定已匯入',
              description: '系統設定已成功從檔案匯入',
            });
          }
        } catch (error) {
          notification.error({
            message: '匯入失敗',
            description: '無法解析設定檔案，請確認檔案格式正確',
          });
        }
      };
      fileReader.onerror = () => {
        notification.error({
          message: '匯入失敗',
          description: '讀取檔案時發生錯誤',
        });
      };
    }
  };

  // 標籤頁設定
  const tabItems: TabsProps['items'] = [
    {
      key: 'theme',
      label: (
        <span>
          <HomeOutlined />
          介面與顯示
        </span>
      ),
      children: (
        <Card>
          <Form
            layout="vertical"
            initialValues={settings.theme}
            onFinish={handleThemeSubmit}
          >
            <Form.Item
              name="mode"
              label="主題模式"
              rules={[{ required: true, message: '請選擇主題模式' }]}
            >
              <Radio.Group>
                <Radio.Button value="light">淺色模式</Radio.Button>
                <Radio.Button value="dark">深色模式</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="primaryColor"
              label="主題顏色"
              rules={[{ required: true, message: '請選擇主題顏色' }]}
            >
              <ColorPicker />
            </Form.Item>

            <Form.Item
              name="fontSize"
              label="字體大小"
              rules={[{ required: true, message: '請選擇字體大小' }]}
            >
              <Radio.Group>
                <Radio.Button value="small">小</Radio.Button>
                <Radio.Button value="medium">中</Radio.Button>
                <Radio.Button value="large">大</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="sidebarCollapsed"
              label="側邊欄預設摺疊"
              valuePropName="checked"
            >
              <Switch checkedChildren="開" unCheckedChildren="關" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                儲存主題設定
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'localization',
      label: (
        <span>
          <GlobalOutlined />
          語言與地區
        </span>
      ),
      children: (
        <Card>
          <Form
            layout="vertical"
            initialValues={settings.localization}
            onFinish={handleLocalizationSubmit}
          >
            <Form.Item
              name="language"
              label="系統語言"
              rules={[{ required: true, message: '請選擇系統語言' }]}
            >
              <Select>
                <Option value="zh-TW">繁體中文</Option>
                <Option value="en-US">English (US)</Option>
                <Option value="ja-JP">日本語</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="dateFormat"
              label="日期格式"
              rules={[{ required: true, message: '請選擇日期格式' }]}
            >
              <Radio.Group>
                <Radio.Button value="YYYY/MM/DD">YYYY/MM/DD</Radio.Button>
                <Radio.Button value="MM/DD/YYYY">MM/DD/YYYY</Radio.Button>
                <Radio.Button value="DD/MM/YYYY">DD/MM/YYYY</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="timeFormat"
              label="時間格式"
              rules={[{ required: true, message: '請選擇時間格式' }]}
            >
              <Radio.Group>
                <Radio.Button value="12h">12小時制</Radio.Button>
                <Radio.Button value="24h">24小時制</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="currency"
              label="預設貨幣"
              rules={[{ required: true, message: '請選擇預設貨幣' }]}
            >
              <Select>
                <Option value="TWD">新台幣 (TWD)</Option>
                <Option value="USD">美元 (USD)</Option>
                <Option value="JPY">日圓 (JPY)</Option>
                <Option value="EUR">歐元 (EUR)</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                儲存語言與地區設定
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          通知與提醒
        </span>
      ),
      children: (
        <Card>
          <Form
            layout="vertical"
            initialValues={settings.notifications}
            onFinish={handleNotificationsSubmit}
          >
            <Form.Item
              name="enableNotifications"
              label="啟用通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="notificationSound"
              label="啟用通知聲音"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="tripCountdown"
              label="顯示旅行倒數提醒"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="reminderTime"
              label="每日提醒時間"
              rules={[{ required: true, message: '請設定提醒時間' }]}
            >
              <Input type="time" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                儲存通知與提醒設定
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'dataManagement',
      label: (
        <span>
          <DatabaseOutlined />
          資料管理
        </span>
      ),
      children: (
        <Card>
          <Form
            layout="vertical"
            initialValues={settings.dataManagement}
            onFinish={handleDataManagementSubmit}
          >
            <Form.Item
              name="autoBackup"
              label="自動備份"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="backupFrequency"
              label="備份頻率"
              rules={[{ required: true, message: '請選擇備份頻率' }]}
            >
              <Radio.Group>
                <Radio.Button value="daily">每天</Radio.Button>
                <Radio.Button value="weekly">每週</Radio.Button>
                <Radio.Button value="monthly">每月</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="backupLocation"
              label="備份位置"
              rules={[{ required: true, message: '請選擇備份位置' }]}
            >
              <Radio.Group>
                <Radio.Button value="local">本地存儲</Radio.Button>
                <Radio.Button value="cloud">雲端存儲</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                儲存資料管理設定
              </Button>
            </Form.Item>

            <Divider />

            <Space direction="vertical" size="middle">
              <Space>
                <Button type="default" onClick={handleExportSettings}>
                  匯出設定
                </Button>
                <label htmlFor="import-settings">
                  <Button type="default">
                    匯入設定
                  </Button>
                  <input
                    id="import-settings"
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportSettings}
                  />
                </label>
              </Space>
              <Button 
                danger 
                onClick={handleResetSettings}
              >
                {resetConfirm ? '確認重置所有設定' : '重置所有設定'}
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'about',
      label: (
        <span>
          <InfoCircleOutlined />
          關於系統
        </span>
      ),
      children: (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={4}>旅行計劃管理系統</Title>
            <Paragraph>
              一個全面的旅行管理應用程式，幫助您規劃、組織和管理您的旅行體驗。
            </Paragraph>
            
            <Divider />
            
            <Text strong>版本號：</Text>
            <Text>{settings.about.version}</Text>
            
            <Text strong>最後更新：</Text>
            <Text>{new Date(settings.about.lastUpdated).toLocaleDateString()}</Text>
            
            <Divider />
            
            <Title level={5}>開發者資訊</Title>
            <Text strong>開發者：</Text>
            <Text>旅行計劃管理系統開發團隊</Text>
            
            <Text strong>聯絡信箱：</Text>
            <Text>contact@travelplan.example.com</Text>
            
            <Text strong>官方網站：</Text>
            <Text>https://travelplan.example.com</Text>
            
            <Divider />
            
            <Text>© {new Date().getFullYear()} 旅行計劃管理系統 版權所有</Text>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="系統設定" isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
        <div className="p-6 overflow-y-auto bg-gray-50">
          <div className="container mx-auto">
            <Tabs defaultActiveKey="theme" items={tabItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 