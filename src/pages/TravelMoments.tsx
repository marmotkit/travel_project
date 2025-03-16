import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tabs, message, Modal, Upload, Form, Input, Select } from 'antd';
import { PlusOutlined, UploadOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';

interface Album {
  id: string;
  tripId: string;
  title: string;
  coverUrl: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Media {
  id: string;
  albumId: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

interface TimelineViewProps {
  albums: any[];
  trips: any[];
  onAlbumClick: (albumId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ albums, trips, onAlbumClick }) => {
  const sortedAlbums = [...albums].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto">
        {sortedAlbums.map((album, index) => (
          <div key={album.id} className="relative pb-8">
            {/* 時間軸線條 */}
            {index < sortedAlbums.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
            )}
            
            {/* 相冊卡片 */}
            <div className="relative flex items-start space-x-4">
              {/* 時間軸圓點 */}
              <div className="relative">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                  <PictureOutlined className="text-blue-500" />
                </div>
              </div>
              
              {/* 相冊內容 */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                     onClick={() => onAlbumClick(album.id)}>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium truncate" title={album.title}>
                        {album.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(album.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {album.coverUrl && (
                      <div className="aspect-w-16 aspect-h-9 mb-2">
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{album.itemCount} 個項目</span>
                      {album.tripId && trips.find(t => t.id === album.tripId) && (
                        <span>
                          關聯行程：{trips.find(t => t.id === album.tripId).title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TravelMoments: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('albums');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [form] = Form.useForm();
  const [trips, setTrips] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // 載入相冊數據和用戶資料
  useEffect(() => {
    const loadData = () => {
      try {
        // 載入相冊數據
        const savedAlbums = localStorage.getItem('albums');
        if (savedAlbums) {
          setAlbums(JSON.parse(savedAlbums));
        }

        // 載入行程數據
        const savedTrips = localStorage.getItem('trips');
        if (savedTrips) {
          setTrips(JSON.parse(savedTrips));
        }
        
        // 載入用戶資料，設定管理員狀態
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setIsAdmin(user.isAdmin || false);
        }
      } catch (error) {
        console.error('載入數據失敗:', error);
        message.error('載入數據失敗');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 處理創建相冊
  const handleCreateAlbum = () => {
    setShowCreateAlbumModal(true);
  };

  // 確認創建相冊
  const handleConfirmCreateAlbum = async () => {
    try {
      const values = await form.validateFields();
      const newAlbum: Album = {
        id: uuidv4(),
        tripId: values.tripId || uuidv4(),
        title: values.title,
        coverUrl: values.coverUrl || '/default-album-cover.jpg',
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedAlbums = [...albums, newAlbum];
      setAlbums(updatedAlbums);
      localStorage.setItem('albums', JSON.stringify(updatedAlbums));
      
      message.success('相冊創建成功');
      setShowCreateAlbumModal(false);
      form.resetFields();
    } catch (error) {
      console.error('創建相冊失敗:', error);
      message.error('創建相冊失敗');
    }
  };

  // 處理文件選擇
  const handleFileSelect = (info: any) => {
    setSelectedFiles(info.fileList);
  };

  // 處理批量上傳
  const handleBatchUpload = () => {
    if (!selectedAlbum || selectedFiles.length === 0) {
      message.warning('請選擇相冊和文件');
      return;
    }

    let processingErrors = 0;
    const totalFiles = selectedFiles.length;
    let processedFiles = 0;

    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dataUrl = e.target?.result as string;
          
          // 壓縮圖片尺寸以減小存儲大小
          const resizeAndStoreImage = (imageUrl: string, callback: (resizedUrl: string) => void) => {
            const img = new Image();
            img.onload = () => {
              // 計算縮小比例，最大尺寸為 800px
              const MAX_SIZE = 800;
              let width = img.width;
              let height = img.height;
              
              if (width > MAX_SIZE || height > MAX_SIZE) {
                if (width > height) {
                  height = Math.round(height * (MAX_SIZE / width));
                  width = MAX_SIZE;
                } else {
                  width = Math.round(width * (MAX_SIZE / height));
                  height = MAX_SIZE;
                }
              }
              
              // 創建 canvas 來調整圖片大小
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              // 使用較低的品質輸出 JPEG
              const resizedUrl = canvas.toDataURL('image/jpeg', 0.7);
              callback(resizedUrl);
            };
            img.src = imageUrl;
          };
          
          // 處理並存儲圖片
          resizeAndStoreImage(dataUrl, (resizedUrl) => {
            const newMedia: Media = {
              id: uuidv4(),
              albumId: selectedAlbum!.id,
              type: file.type.startsWith('image/') ? 'photo' : 'video',
              url: resizedUrl,
              thumbnail: resizedUrl,
              title: file.name,
              createdAt: new Date().toISOString()
            };
            
            try {
              // 更新相冊媒體列表
              const albumMediaKey = `album_media_${selectedAlbum!.id}`;
              const existingMedia = JSON.parse(localStorage.getItem(albumMediaKey) || '[]');
              const updatedMedia = [...existingMedia, newMedia];
              
              try {
                localStorage.setItem(albumMediaKey, JSON.stringify(updatedMedia));
                
                // 更新相冊信息
                const updatedAlbum = {
                  ...selectedAlbum!,
                  itemCount: selectedAlbum!.itemCount + 1,
                  updatedAt: new Date().toISOString(),
                  coverUrl: selectedAlbum!.itemCount === 0 ? resizedUrl : selectedAlbum!.coverUrl
                };
                
                const updatedAlbums = albums.map(a => 
                  a.id === selectedAlbum!.id ? updatedAlbum : a
                );
                
                setAlbums(updatedAlbums);
                localStorage.setItem('albums', JSON.stringify(updatedAlbums));
              } catch (storageError) {
                console.error('儲存失敗，可能超出空間限制:', storageError);
                processingErrors++;
                message.error(`文件 ${file.name} 儲存失敗: 超出儲存空間限制`);
              }
            } catch (jsonError) {
              console.error('解析媒體數據失敗:', jsonError);
              processingErrors++;
            }
            
            // 所有文件處理完成後的操作
            processedFiles++;
            if (processedFiles === totalFiles) {
              if (processingErrors > 0) {
                message.warning(`有 ${processingErrors} 個文件上傳失敗，請嘗試使用較小的文件或清理舊數據`);
              } else {
                message.success('所有文件上傳成功');
              }
              
              setShowUploadModal(false);
              setSelectedAlbum(null);
              setSelectedFiles([]);
            }
          });
        } catch (error) {
          console.error('處理文件失敗:', error);
          processedFiles++;
          processingErrors++;
          
          if (processedFiles === totalFiles) {
            if (processingErrors > 0) {
              message.warning(`有 ${processingErrors} 個文件上傳失敗`);
            }
            
            setShowUploadModal(false);
            setSelectedAlbum(null);
            setSelectedFiles([]);
          }
        }
      };
      
      reader.onerror = () => {
        console.error('讀取文件失敗');
        processedFiles++;
        processingErrors++;
        
        if (processedFiles === totalFiles) {
          message.warning(`有 ${processingErrors} 個文件上傳失敗`);
          setShowUploadModal(false);
          setSelectedAlbum(null);
          setSelectedFiles([]);
        }
      };
      
      reader.readAsDataURL(file.originFileObj);
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="旅遊花絮" 
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
            <div className="bg-white rounded-lg shadow">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <Tabs
                  defaultActiveKey="album"
                  items={[
                    {
                      key: 'album',
                      label: '相簿檢視'
                    },
                    {
                      key: 'timeline',
                      label: '時間軸檢視'
                    }
                  ]}
                  onChange={(key) => setActiveTab(key)}
                />
                <div className="flex gap-4">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateAlbum}
                    className="bg-blue-500"
                  >
                    創建相簿
                  </Button>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-500"
                  >
                    上傳花絮
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'album' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {albums.map(album => (
                      <div
                        key={album.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
                        onClick={() => navigate(`/moments/album/${album.id}`)}
                      >
                        <div className="aspect-w-16 aspect-h-9">
                          <img
                            src={album.coverUrl || '/default-album-cover.jpg'}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-medium mb-2 truncate" title={album.title}>
                            {album.title}
                          </h3>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{album.itemCount} 個項目</span>
                            <span>{new Date(album.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TimelineView 
                    albums={albums} 
                    trips={trips}
                    onAlbumClick={(albumId) => navigate(`/moments/album/${albumId}`)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 創建相冊模態框 */}
      <Modal
        title="創建相冊"
        open={showCreateAlbumModal}
        onCancel={() => setShowCreateAlbumModal(false)}
        onOk={handleConfirmCreateAlbum}
        okText="確定"
        cancelText="取消"
        okButtonProps={{
          className: 'bg-blue-500 hover:bg-blue-600'
        }}
        className="top-8"
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item
            name="title"
            label="相冊名稱"
            rules={[{ required: true, message: '請輸入相冊名稱' }]}
          >
            <Input placeholder="請輸入相冊名稱" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="tripId"
            label="關聯行程"
          >
            <Select
              placeholder="選擇關聯行程"
              allowClear
              className="w-full"
            >
              {trips.map((trip: any) => (
                <Select.Option key={trip.id} value={trip.id}>
                  {trip.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 上傳花絮對話框 */}
      <Modal
        title="上傳花絮"
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          setSelectedFiles([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowUploadModal(false);
            setSelectedFiles([]);
          }}>
            取消
          </Button>,
          <Button 
            key="upload" 
            type="primary" 
            onClick={handleBatchUpload}
            disabled={!selectedAlbum || selectedFiles.length === 0}
            className="bg-blue-500"
          >
            確認上傳
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item
            label="選擇相簿"
            required
          >
            <Select
              placeholder="請選擇相簿"
              onChange={(value) => {
                const album = albums.find(a => a.id === value);
                setSelectedAlbum(album || null);
              }}
            >
              {albums.map(album => (
                <Select.Option key={album.id} value={album.id}>
                  {album.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="選擇檔案"
            required
          >
            <Upload
              listType="picture"
              multiple
              beforeUpload={() => false}
              onChange={handleFileSelect}
              fileList={selectedFiles}
            >
              <Button icon={<UploadOutlined />}>選擇檔案</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TravelMoments; 