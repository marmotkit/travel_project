import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Typography, 
  Divider, 
  message, 
  Upload, 
  Space 
} from 'antd';
import { 
  UploadOutlined, 
  SafetyOutlined, 
  MedicineBoxOutlined, 
  GlobalOutlined, 
  CarOutlined,
  CloudOutlined,
  IdcardOutlined,
  ShoppingOutlined,
  WalletOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { TravelNote } from './TravelNotes';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import { logActivity } from '../services/ActivityService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
}

// 類別選項配置
const categoryOptions = [
  { value: 'safety', label: '安全', icon: <SafetyOutlined /> },
  { value: 'health', label: '健康', icon: <MedicineBoxOutlined /> },
  { value: 'culture', label: '文化禮儀', icon: <GlobalOutlined /> },
  { value: 'transportation', label: '交通', icon: <CarOutlined /> },
  { value: 'weather', label: '天氣', icon: <CloudOutlined /> },
  { value: 'documents', label: '證件', icon: <IdcardOutlined /> },
  { value: 'luggage', label: '行李', icon: <ShoppingOutlined /> },
  { value: 'budget', label: '預算', icon: <WalletOutlined /> },
  { value: 'others', label: '其他', icon: <MoreOutlined /> },
];

// 優先級選項配置
const priorityOptions = [
  { value: 'high', label: '高', icon: <ExclamationCircleOutlined style={{ color: 'red' }} /> },
  { value: 'medium', label: '中', icon: <InfoCircleOutlined style={{ color: 'orange' }} /> },
  { value: 'low', label: '低', icon: <CheckCircleOutlined style={{ color: 'green' }} /> },
];

// 旅行階段選項配置
const stageOptions = [
  { value: 'before-departure', label: '出發前' },
  { value: 'during-trip', label: '旅途中' },
  { value: 'before-return', label: '返程前' },
];

const TravelNoteForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditMode = id && id !== 'new';
  const [form] = Form.useForm();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileList, setFileList] = useState<any[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // 從查詢參數中獲取預選的旅行ID
  const getPreselectedTripId = () => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('tripId') || undefined;
  };

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        // 載入用戶資料，設定管理員狀態
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setIsAdmin(user.isAdmin || false);
        }
        
        // 載入旅行資料
        const tripsStr = localStorage.getItem('trips');
        if (tripsStr) {
          setTrips(JSON.parse(tripsStr));
        }
        
        // 如果是編輯模式，載入注意事項資料
        if (isEditMode) {
          const notesStr = localStorage.getItem('travelNotes');
          if (notesStr) {
            const notes = JSON.parse(notesStr);
            const note = notes.find((n: TravelNote) => n.id === id);
            
            if (note) {
              // 設置表單初始值
              form.setFieldsValue({
                ...note,
                reminderDate: note.reminderDate ? dayjs(note.reminderDate) : undefined,
              });
              
              // 如果有附件，設置附件列表
              if (note.attachments && note.attachments.length > 0) {
                setFileList(note.attachments.map((url: string, index: number) => ({
                  uid: `-${index}`,
                  name: url.split('/').pop() || `file-${index}`,
                  status: 'done',
                  url,
                })));
              }
            } else {
              message.error('找不到要編輯的注意事項');
              navigate('/notes');
            }
          }
        } else {
          // 如果是新增模式，設置預選的旅行ID
          const preselectedTripId = getPreselectedTripId();
          if (preselectedTripId) {
            form.setFieldsValue({ tripId: preselectedTripId });
          }
        }
      } catch (error) {
        console.error('載入數據失敗:', error);
        message.error('載入數據失敗');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [form, id, isEditMode, navigate, location.search]);

  // 提交表單
  const handleSubmit = async (values: any) => {
    try {
      const notesStr = localStorage.getItem('travelNotes');
      const notes = notesStr ? JSON.parse(notesStr) : [];
      
      // 處理日期格式
      const formattedValues = {
        ...values,
        reminderDate: values.reminderDate ? values.reminderDate.format('YYYY-MM-DD') : undefined,
        attachments: fileList.map(file => file.url || file.response?.url),
      };
      
      if (isEditMode) {
        // 編輯現有的注意事項
        const updatedNotes = notes.map((note: TravelNote) => 
          note.id === id ? { 
            ...note, 
            ...formattedValues, 
            updatedAt: new Date().toISOString() 
          } : note
        );
        
        localStorage.setItem('travelNotes', JSON.stringify(updatedNotes));
        
        // 記錄更新注意事項的活動
        const selectedTrip = trips.find(trip => trip.id === values.tripId);
        logActivity(
          'note_updated',
          '更新了旅行注意事項',
          {
            id: id as string,
            name: values.title,
            type: 'note'
          }
        );
        
        message.success('注意事項已更新');
      } else {
        // 創建新的注意事項
        const newNote: TravelNote = {
          id: uuidv4(),
          ...formattedValues,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        notes.push(newNote);
        localStorage.setItem('travelNotes', JSON.stringify(notes));
        
        // 記錄創建注意事項的活動
        const selectedTrip = trips.find(trip => trip.id === values.tripId);
        logActivity(
          'note_created',
          '創建了新的旅行注意事項',
          {
            id: newNote.id,
            name: values.title,
            type: 'note'
          }
        );
        
        message.success('注意事項已創建');
      }
      
      // 返回到注意事項列表頁
      navigate('/notes');
    } catch (error) {
      console.error('保存注意事項失敗:', error);
      message.error('保存注意事項失敗');
    }
  };

  // 文件上傳前的處理
  const beforeUpload = (file: RcFile) => {
    // 模擬文件上傳，實際應用中應該上傳到服務器
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const url = reader.result;
        // 在實際應用中，這裡應該是從服務器返回的URL
        // 這裡為了演示，直接使用DataURL
        (file as any).url = url as string;
        resolve();
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 文件上傳變更處理
  const handleUploadChange = ({ fileList }: any) => {
    setFileList(fileList);
  };

  // 渲染上傳按鈕
  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>上傳附件</div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={isEditMode ? '編輯注意事項' : '新增注意事項'} 
          isAdmin={isAdmin}
          onToggleAdmin={() => {
            setIsAdmin(!isAdmin);
            
            // 更新 localStorage 中的用戶管理員狀態
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                user.isAdmin = !isAdmin;
                localStorage.setItem('user', JSON.stringify(user));
              } catch (err) {
                console.error('更新用戶管理員狀態出錯:', err);
              }
            }
          }}
        />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow p-6">
              {loading ? (
                <div className="text-center py-6">載入中...</div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    priority: 'medium',
                    stage: 'before-departure',
                    category: 'others',
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Title level={4}>{isEditMode ? '編輯注意事項' : '創建新的注意事項'}</Title>
                      <Text type="secondary">填寫以下信息以{isEditMode ? '更新' : '創建'}注意事項</Text>
                    </div>
                    
                    <Form.Item
                      name="title"
                      label="標題"
                      rules={[{ required: true, message: '請輸入注意事項標題' }]}
                    >
                      <Input placeholder="輸入一個清晰的標題" />
                    </Form.Item>
                    
                    <Form.Item
                      name="tripId"
                      label="關聯旅行"
                      rules={[{ required: true, message: '請選擇關聯的旅行' }]}
                    >
                      <Select placeholder="選擇關聯的旅行">
                        {trips.map(trip => (
                          <Option key={trip.id} value={trip.id}>{trip.title}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="category"
                      label="類別"
                      rules={[{ required: true, message: '請選擇注意事項類別' }]}
                    >
                      <Select placeholder="選擇類別">
                        {categoryOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            <Space>
                              {option.icon}
                              {option.label}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="priority"
                      label="優先級"
                      rules={[{ required: true, message: '請選擇優先級' }]}
                    >
                      <Select placeholder="選擇優先級">
                        {priorityOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            <Space>
                              {option.icon}
                              {option.label}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="stage"
                      label="旅行階段"
                      rules={[{ required: true, message: '請選擇旅行階段' }]}
                    >
                      <Select placeholder="選擇旅行階段">
                        {stageOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="reminderDate"
                      label="提醒日期"
                      help="選擇何時提醒此注意事項，可選"
                    >
                      <DatePicker 
                        style={{ width: '100%' }}
                        placeholder="選擇提醒日期" 
                      />
                    </Form.Item>
                    
                    <div className="md:col-span-2">
                      <Form.Item
                        name="content"
                        label="內容"
                        rules={[{ required: true, message: '請輸入注意事項內容' }]}
                      >
                        <TextArea
                          rows={6}
                          placeholder="詳細描述這個注意事項的內容，包括重要信息和建議"
                        />
                      </Form.Item>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Divider orientation="left">附件</Divider>
                      <Form.Item
                        label="附件上傳"
                        help="上傳相關附件如照片、文件等（可選）"
                      >
                        <Upload
                          listType="picture-card"
                          fileList={fileList}
                          beforeUpload={beforeUpload}
                          onChange={handleUploadChange}
                        >
                          {fileList.length >= 5 ? null : uploadButton}
                        </Upload>
                      </Form.Item>
                    </div>
                    
                    <div className="md:col-span-2 flex justify-end space-x-4">
                      <Button onClick={() => navigate('/notes')}>
                        取消
                      </Button>
                      <Button type="primary" htmlType="submit" className="bg-blue-500">
                        {isEditMode ? '更新注意事項' : '創建注意事項'}
                      </Button>
                    </div>
                  </div>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelNoteForm; 