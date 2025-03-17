import React, { useState, useEffect } from 'react';
import { Tabs, Card, Form, Switch, Radio, Select, Input, Button, Divider, Typography, Space, ColorPicker, Alert, message } from 'antd';
import { CheckCircleOutlined, SaveOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { useSettings } from '../contexts/SettingsContext';
import type { SystemSettings as SystemSettingsType } from '../contexts/SettingsContext';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { HomeOutlined, GlobalOutlined, BellOutlined, DatabaseOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const SystemSettings: React.FC = () => {
  const { settings, updateTheme, updateLocalization, updateNotifications, updateDataManagement, resetSettings, applyTheme, setSidebarCollapsed, updateSettings } = useSettings();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 切換管理員模式
  const handleToggleAdmin = () => {
    setIsAdmin(!isAdmin);
  };

  // 主題設定表單提交
  const onThemeFormFinish = (values: any) => {
    console.log('提交主題設定表單:', values);
    
    // 設置按鈕為載入狀態
    setLoading(true);
    
    try {
      // 更新主題設定 (不包含側邊欄設定，因為側邊欄設定有專門的處理方法)
      updateTheme({
        mode: values.mode,
        primaryColor: values.primaryColor,
        fontSize: values.fontSize,
        // 不在這裡設置 sidebarCollapsed，改為專門的方法處理
      });
      
      // 主題設定立即生效
      applyTheme({
        ...settings.theme,
        mode: values.mode,
        primaryColor: values.primaryColor,
        fontSize: values.fontSize,
        // 保持側邊欄折疊狀態不變
        sidebarCollapsed: settings.theme.sidebarCollapsed,
      });
      
      // 顯示成功提示
      setSaveSuccess(true);
      
      // 5秒後自動隱藏成功提示
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
      
      console.log('主題設定更新成功');
    } catch (error) {
      console.error('更新主題設定時發生錯誤:', error);
      message.error({
        content: '主題設定儲存失敗',
        duration: 3,
        style: {
          marginTop: '20vh',
        }
      });
    } finally {
      // 不論成功或失敗，1秒後重設按鈕狀態
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  // 本地化設定表單提交
  const handleLocalizationSubmit = (values: SystemSettingsType['localization']) => {
    updateLocalization(values);
    message.success({
      content: '語言與地區設定已成功儲存',
      duration: 3,
      style: {
        marginTop: '20vh',
      }
    });
  };

  // 通知設定表單提交
  const handleNotificationsSubmit = (values: SystemSettingsType['notifications']) => {
    updateNotifications(values);
    message.success({
      content: '通知設定已成功儲存',
      duration: 3,
      style: {
        marginTop: '20vh',
      }
    });
  };

  // 數據管理設定表單提交
  const handleDataManagementSubmit = (values: SystemSettingsType['dataManagement']) => {
    updateDataManagement(values);
    message.success({
      content: '資料管理設定已成功儲存',
      duration: 3,
      style: {
        marginTop: '20vh',
      }
    });
  };

  // 關於系統表單提交
  const handleAboutSubmit = (values: SystemSettingsType['about']) => {
    // 顯示載入中
    setLoading(true);
    
    // 只更新可編輯字段，保留原有的版本號和更新日期
    const updatedAbout = {
      ...settings.about,
      developerName: values.developerName,
      contactEmail: values.contactEmail,
      websiteUrl: values.websiteUrl,
      description: values.description,
      copyright: values.copyright
    };

    try {
      // 更新設定
      updateSettings({
        about: updatedAbout
      });
      
      // 顯示成功狀態
      setSaveSuccess(true);
      
      // 顯示成功訊息
      message.success({
        content: '關於系統資訊已成功儲存',
        duration: 3,
        style: {
          marginTop: '20vh',
        }
      });
      
      // 3秒後重置成功狀態
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      // 顯示錯誤訊息
      message.error({
        content: '儲存失敗，請稍後再試',
        duration: 3,
        style: {
          marginTop: '20vh',
        }
      });
    } finally {
      // 結束載入狀態
      setLoading(false);
    }
  };

  // 側邊欄折疊設定變更處理
  const handleSidebarCollapsedChange = (checked: boolean) => {
    // 使用專門的方法設置側邊欄折疊狀態
    setSidebarCollapsed(checked);
    
    message.success({
      content: `側邊欄預設摺疊已設為${checked ? '開啟' : '關閉'}`,
      duration: 3,
      style: {
        marginTop: '20vh',
      }
    });
    
    console.log('SystemSettings - 側邊欄折疊設定變更:', checked);
  };

  // 重置所有設定
  const handleResetSettings = () => {
    if (resetConfirm) {
      resetSettings();
      message.success({
        content: '所有設定已恢復為預設值',
        duration: 3,
        style: {
          marginTop: '20vh',
        }
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

    message.success({
      content: '系統設定已成功匯出為JSON檔案',
      duration: 3,
      style: {
        marginTop: '20vh',
      }
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
            
            message.success({
              content: '系統設定已成功從檔案匯入',
              duration: 3,
              style: {
                marginTop: '20vh',
              }
            });
          }
        } catch (error) {
          message.error({
            content: '無法解析設定檔案，請確認檔案格式正確',
            duration: 3,
            style: {
              marginTop: '20vh',
            }
          });
        }
      };
      fileReader.onerror = () => {
        message.error({
          content: '讀取檔案時發生錯誤',
          duration: 3,
          style: {
            marginTop: '20vh',
          }
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
            onFinish={onThemeFormFinish}
          >
            <Form.Item
              name="mode"
              label="主題模式"
              rules={[{ required: true, message: '請選擇主題模式' }]}
            >
              <Radio.Group buttonStyle="solid" className="theme-mode-radio">
                <Radio.Button value="light">淺色模式</Radio.Button>
                <Radio.Button value="dark">深色模式</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="primaryColor"
              label="主題顏色"
              rules={[{ required: true, message: '請選擇主題顏色' }]}
            >
              <ColorPicker className="theme-color-picker" />
            </Form.Item>

            <Form.Item
              name="fontSize"
              label="字體大小"
              rules={[{ required: true, message: '請選擇字體大小' }]}
            >
              <Radio.Group buttonStyle="solid" className="font-size-radio">
                <Radio.Button value="small">小</Radio.Button>
                <Radio.Button value="medium">中</Radio.Button>
                <Radio.Button value="large">大</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="sidebarCollapsed"
              label="側邊欄預設摺疊"
              valuePropName="checked"
              tooltip="選擇側邊欄在應用啟動時是否預設為折疊狀態"
            >
              <Switch 
                checkedChildren="開" 
                unCheckedChildren="關" 
                className="custom-switch"
                checked={settings.theme.sidebarCollapsed}
                onChange={handleSidebarCollapsedChange}
              />
            </Form.Item>

            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                {saveSuccess && (
                  <Alert
                    message="設定已儲存"
                    description="主題設定已成功更新並應用"
                    type="success"
                    showIcon
                    closable
                    onClose={() => setSaveSuccess(false)}
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  儲存主題設定
                </Button>
              </Space>
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
                <Button 
                  type="default" 
                  onClick={handleExportSettings}
                  size="large" 
                  className="export-settings-btn"
                >
                  匯出設定
                </Button>
                <label htmlFor="import-settings" className="import-settings-label">
                  <Button 
                    type="default" 
                    size="large"
                    className="import-settings-btn"
                  >
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
                size="large"
                className="reset-settings-btn"
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
          {!isAdmin ? (
            // 一般用戶查看模式 - 只顯示資訊
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Title level={4}>旅行計劃管理系統</Title>
              <Paragraph>
                {settings.about.description}
              </Paragraph>
              
              <Divider />
              
              <Text strong>版本號：</Text>
              <Text>{settings.about.version}</Text>
              
              <Text strong>最後更新：</Text>
              <Text>{new Date(settings.about.lastUpdated).toLocaleDateString()}</Text>
              
              <Divider />
              
              <Title level={5}>開發者資訊</Title>
              <Text strong>開發者：</Text>
              <Text>{settings.about.developerName}</Text>
              
              <Text strong>聯絡信箱：</Text>
              <Text>{settings.about.contactEmail}</Text>
              
              <Text strong>官方網站：</Text>
              <Text>{settings.about.websiteUrl}</Text>
              
              <Divider />
              
              <Text>{settings.about.copyright}</Text>
            </Space>
          ) : (
            // 管理員編輯模式 - 顯示表單
            <Form
              layout="vertical"
              initialValues={settings.about}
              onFinish={handleAboutSubmit}
            >
              <Form.Item
                name="description"
                label="系統描述"
                rules={[{ required: true, message: '請輸入系統描述' }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              
              <Divider>系統資訊</Divider>
              
              <Form.Item label="版本號">
                <Input value={settings.about.version} disabled />
                <Text type="secondary">版本號無法手動修改，將隨系統更新自動變更</Text>
              </Form.Item>
              
              <Form.Item label="最後更新日期">
                <Input value={new Date(settings.about.lastUpdated).toLocaleDateString()} disabled />
                <Text type="secondary">更新日期無法手動修改，將隨系統更新自動變更</Text>
              </Form.Item>
              
              <Divider>開發者資訊</Divider>
              
              <Form.Item
                name="developerName"
                label="開發者名稱"
                rules={[{ required: true, message: '請輸入開發者名稱' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name="contactEmail"
                label="聯絡信箱"
                rules={[
                  { required: true, message: '請輸入聯絡信箱' },
                  { type: 'email', message: '請輸入有效的電子郵件地址' }
                ]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name="websiteUrl"
                label="官方網站"
                rules={[
                  { required: true, message: '請輸入官方網站URL' },
                  { 
                    pattern: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                    message: '請輸入有效的網址，例如：https://travelplan.example.com'
                  }
                ]}
                help="必須包含完整網址，例如：https://travelplan.example.com"
              >
                <Input placeholder="https://travelplan.example.com" />
              </Form.Item>
              
              <Form.Item
                name="copyright"
                label="版權資訊"
                rules={[{ required: true, message: '請輸入版權資訊' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={saveSuccess ? <CheckCircleOutlined /> : <SaveOutlined />}
                  style={saveSuccess ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
                >
                  {saveSuccess ? '儲存成功' : '儲存關於系統資訊'}
                </Button>
              </Form.Item>
            </Form>
          )}
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
            <Tabs defaultActiveKey="theme" items={tabItems} className="settings-tabs" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;