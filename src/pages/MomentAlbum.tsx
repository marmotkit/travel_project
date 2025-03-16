import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Upload, message, Spin, Image, Form, Input, Select } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';

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

interface Album {
  id: string;
  tripId: string;
  title: string;
  coverUrl: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

const MomentAlbum: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [form] = Form.useForm();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  // 載入相冊和媒體數據
  useEffect(() => {
    const loadAlbumData = () => {
      try {
        // 載入相冊信息
        const savedAlbums = localStorage.getItem('albums');
        if (savedAlbums) {
          const albums = JSON.parse(savedAlbums);
          const currentAlbum = albums.find((a: Album) => a.id === albumId);
          if (currentAlbum) {
            setAlbum(currentAlbum);
          }
        }

        // 載入媒體列表
        const savedMedia = localStorage.getItem(`album_media_${albumId}`);
        if (savedMedia) {
          setMediaList(JSON.parse(savedMedia));
        }
      } catch (error) {
        console.error('載入相冊數據失敗:', error);
        message.error('載入相冊數據失敗');
      } finally {
        setLoading(false);
      }
    };

    loadAlbumData();
  }, [albumId]);

  // 處理媒體預覽
  const handlePreview = (media: Media) => {
    setPreviewMedia(media);
    setPreviewVisible(true);
  };

  // 處理媒體刪除
  const handleDelete = (mediaId: string) => {
    try {
      // 從媒體列表中移除
      const deletedMedia = mediaList.find(m => m.id === mediaId);
      const newMediaList = mediaList.filter(item => item.id !== mediaId);
      setMediaList(newMediaList);
      
      // 更新本地存儲
      localStorage.setItem(`album_media_${albumId}`, JSON.stringify(newMediaList));
      
      // 更新相冊項目計數
      if (album) {
        const updatedAlbum = {
          ...album,
          itemCount: Math.max(0, album.itemCount - 1),
          updatedAt: new Date().toISOString()
        };
        
        // 如果刪除的是封面圖片，需要更換封面
        if (deletedMedia && album.coverUrl === deletedMedia.url) {
          // 找到第一張照片作為新封面
          const firstPhoto = newMediaList.find(m => m.type === 'photo');
          if (firstPhoto) {
            updatedAlbum.coverUrl = firstPhoto.url;
          } else {
            // 如果沒有照片了，使用默認封面
            updatedAlbum.coverUrl = '/default-album-cover.jpg';
          }
        }
        
        // 更新相冊數據
        const savedAlbums = localStorage.getItem('albums');
        if (savedAlbums) {
          const albums = JSON.parse(savedAlbums);
          const updatedAlbums = albums.map((a: Album) =>
            a.id === album.id ? updatedAlbum : a
          );
          localStorage.setItem('albums', JSON.stringify(updatedAlbums));
          setAlbum(updatedAlbum);
        }
      }
      
      // 顯示成功消息，並提供撤銷選項
      if (deletedMedia) {
        message.success({
          content: '已刪除',
          key: `delete-${mediaId}`,
          duration: 3
        });
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      message.error('刪除失敗');
    }
  };

  // 處理媒體編輯
  const handleEdit = (media: Media) => {
    setEditingMedia(media);
    form.setFieldsValue({
      title: media.title,
      description: media.description,
      tags: media.tags
    });
  };

  // 確認編輯
  const handleConfirmEdit = async () => {
    try {
      const values = await form.validateFields();
      if (!editingMedia) return;

      const updatedMedia = {
        ...editingMedia,
        ...values
      };

      const newMediaList = mediaList.map(item =>
        item.id === editingMedia.id ? updatedMedia : item
      );

      setMediaList(newMediaList);
      localStorage.setItem(`album_media_${albumId}`, JSON.stringify(newMediaList));
      
      message.success('更新成功');
      setEditingMedia(null);
      form.resetFields();
    } catch (error) {
      console.error('更新失敗:', error);
      message.error('更新失敗');
    }
  };

  // 處理文件上傳
  const handleUpload = (info: any) => {
    setSelectedFiles(info.fileList);
  };

  // 確認上傳檔案
  const confirmUpload = () => {
    if (selectedFiles.length === 0) {
      message.warning('請選擇檔案');
      return;
    }

    let processedCount = 0;
    let successCount = 0;
    
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dataUrl = e.target?.result as string;
          
          // 處理圖片並儲存到本地
          const processAndSaveMedia = (fileUrl: string, fileType: 'photo' | 'video') => {
            try {
              const newMedia: Media = {
                id: uuidv4(),
                albumId: albumId || '',
                type: fileType,
                url: fileUrl,
                thumbnail: fileType === 'photo' ? fileUrl : '/video-thumbnail.jpg',
                title: file.name,
                createdAt: new Date().toISOString()
              };
              
              const updatedMediaList = [...mediaList, newMedia];
              setMediaList(updatedMediaList);
              localStorage.setItem(`album_media_${albumId}`, JSON.stringify(updatedMediaList));
              
              // 更新相冊信息
              if (album) {
                const updatedAlbum = {
                  ...album,
                  itemCount: album.itemCount + 1,
                  updatedAt: new Date().toISOString(),
                  coverUrl: album.itemCount === 0 && fileType === 'photo' ? fileUrl : album.coverUrl
                };
                
                const savedAlbums = localStorage.getItem('albums');
                if (savedAlbums) {
                  const albums = JSON.parse(savedAlbums);
                  const updatedAlbums = albums.map((a: Album) =>
                    a.id === album.id ? updatedAlbum : a
                  );
                  localStorage.setItem('albums', JSON.stringify(updatedAlbums));
                  setAlbum(updatedAlbum);
                }
              }
              
              successCount++;
              return true;
            } catch (error) {
              console.error('儲存文件失敗:', error);
              message.error(`${file.name} 儲存失敗`);
              return false;
            }
          };
          
          // 判斷檔案類型
          const fileType = file.type && file.type.startsWith('image/') ? 'photo' : 'video';
          
          // 圖片檔案需要壓縮
          if (fileType === 'photo') {
            const img = document.createElement('img');
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
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                
                // 使用較低的品質輸出 JPEG
                const resizedUrl = canvas.toDataURL('image/jpeg', 0.7);
                processAndSaveMedia(resizedUrl, 'photo');
              }
              
              processedCount++;
              checkAllProcessed();
            };
            
            img.onerror = () => {
              console.error('圖片載入失敗');
              processedCount++;
              checkAllProcessed();
            };
            
            img.src = dataUrl;
          } else {
            // 非圖片檔案直接儲存
            processAndSaveMedia(dataUrl, 'video');
            processedCount++;
            checkAllProcessed();
          }
        } catch (error) {
          console.error('處理文件失敗:', error);
          processedCount++;
          checkAllProcessed();
        }
      };
      
      reader.onerror = () => {
        console.error('讀取文件失敗');
        processedCount++;
        checkAllProcessed();
      };
      
      reader.readAsDataURL(file.originFileObj);
    });
    
    function checkAllProcessed() {
      if (processedCount === selectedFiles.length) {
        if (successCount > 0) {
          message.success(`成功上傳 ${successCount} 個檔案`);
          setShowUploadModal(false);
          setSelectedFiles([]);
        } else {
          message.error('上傳失敗');
        }
      }
    }
  };

  // 處理媒體預覽時的刪除
  const handlePreviewDelete = () => {
    if (!previewMedia) return;
    
    // 先關閉預覽視窗
    setPreviewVisible(false);
    
    // 延遲執行刪除操作，確保預覽視窗已經關閉
    setTimeout(() => {
      if (previewMedia) {
        handleDelete(previewMedia.id);
      }
    }, 300);
  };
  
  // 處理預覽時的編輯
  const handlePreviewEdit = () => {
    if (!previewMedia) return;
    
    // 先關閉預覽視窗
    setPreviewVisible(false);
    
    // 延遲執行編輯操作，確保預覽視窗已經關閉
    setTimeout(() => {
      if (previewMedia) {
        handleEdit(previewMedia);
      }
    }, 300);
  };

  // 渲染媒體網格
  const renderMediaGrid = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {mediaList.map(media => (
          <div 
            key={media.id}
            className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          >
            <div className="relative w-full h-full">
              {media.type === 'photo' ? (
                <img
                  src={media.url}
                  alt={media.title}
                  className="w-full h-full object-cover"
                  onClick={() => handlePreview(media)}
                />
              ) : (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  onClick={() => handlePreview(media)}
                />
              )}
              
              {/* 媒體信息覆蓋層 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                            transition-opacity flex items-end">
                <div className="w-full p-2 text-white">
                  <h4 className="text-sm font-medium truncate">{media.title}</h4>
                  {media.tags && media.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {media.tags.map(tag => (
                        <span key={tag} className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 獨立刪除按鈕區 */}
            <div 
              className="absolute top-0 right-0 w-10 h-10 bg-red-500 rounded-bl-lg flex items-center justify-center cursor-pointer z-50 shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(media.id);
              }}
            >
              <DeleteOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            
            {/* 獨立編輯按鈕區 */}
            <div 
              className="absolute top-0 left-0 w-10 h-10 bg-blue-500 rounded-br-lg flex items-center justify-center cursor-pointer z-50 shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEdit(media);
              }}
            >
              <EditOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">找不到相冊</h2>
          <Button onClick={() => navigate('/moments')}>返回花絮列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu isAdmin={false} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={album.title} 
          isAdmin={false}
          onToggleAdmin={() => {}}
        />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow">
              {/* 頁面標題和操作按鈕 */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <Button 
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/moments')}
                  >
                    返回
                  </Button>
                  <h2 className="text-xl font-semibold">{album.title}</h2>
                </div>
                <Button 
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-500"
                >
                  上傳花絮
                </Button>
              </div>

              {/* 媒體內容 */}
              {mediaList.length > 0 ? (
                renderMediaGrid()
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">這個相冊還沒有任何內容</p>
                  <Button 
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-500"
                  >
                    上傳花絮
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 上傳模態框 */}
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
          selectedFiles.length > 0 ? (
            <Button 
              key="confirm" 
              type="primary" 
              onClick={confirmUpload}
              className="bg-blue-500"
            >
              確認上傳
            </Button>
          ) : (
            <Button 
              key="upload" 
              type="primary" 
              className="bg-blue-500"
            >
              選擇檔案
            </Button>
          )
        ]}
      >
        <Upload.Dragger
          multiple
          listType="picture"
          accept="image/*,video/*"
          beforeUpload={() => false}
          onChange={handleUpload}
          fileList={selectedFiles}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined className="text-2xl" />
          </p>
          <p className="ant-upload-text">點擊或拖拽文件到此區域上傳</p>
          <p className="ant-upload-hint">
            支援單個或批量上傳，可上傳圖片或影片文件
          </p>
        </Upload.Dragger>
      </Modal>

      {/* 媒體預覽模態框 */}
      <Modal
        open={previewVisible}
        footer={[
          <Button 
            key="close" 
            onClick={() => setPreviewVisible(false)}
          >
            關閉
          </Button>,
          <Button 
            key="edit" 
            icon={<EditOutlined />}
            onClick={handlePreviewEdit}
          >
            編輯
          </Button>,
          <Button 
            key="delete" 
            danger
            icon={<DeleteOutlined />}
            onClick={handlePreviewDelete}
          >
            刪除
          </Button>
        ]}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ maxWidth: '1000px' }}
      >
        {previewMedia && (
          <div className="relative">
            {previewMedia.type === 'photo' ? (
              <Image
                src={previewMedia.url}
                alt={previewMedia.title}
                style={{ width: '100%' }}
                preview={false}
              />
            ) : (
              <video
                src={previewMedia.url}
                controls
                style={{ width: '100%' }}
              />
            )}
            <div className="mt-4">
              <h3 className="text-lg font-semibold">{previewMedia.title}</h3>
              {previewMedia.description && (
                <p className="text-gray-600 mt-2">{previewMedia.description}</p>
              )}
              {previewMedia.tags && previewMedia.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewMedia.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 編輯模態框 */}
      <Modal
        title="編輯媒體信息"
        open={!!editingMedia}
        onCancel={() => {
          setEditingMedia(null);
          form.resetFields();
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setEditingMedia(null);
              form.resetFields();
            }}
          >
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleConfirmEdit}
            className="bg-blue-500"
          >
            確認修改
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="標題"
            rules={[{ required: true, message: '請輸入標題' }]}
          >
            <Input placeholder="請輸入標題" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="請輸入描述" />
          </Form.Item>
          <Form.Item
            name="tags"
            label="標籤"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="輸入標籤並按 Enter"
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MomentAlbum; 