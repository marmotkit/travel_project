import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'travel-plan-images';

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

// 初始化容器（如果不存在）
export const initContainer = async (): Promise<void> => {
  try {
    // 檢查容器是否存在
    const exists = await containerClient.exists();
    if (!exists) {
      console.log(`正在創建容器 ${containerName}`);
      await containerClient.create({ access: 'blob' });
      console.log(`容器 ${containerName} 已創建`);
    }
  } catch (error) {
    console.error('初始化容器失敗:', error);
    throw new Error('無法初始化存儲容器');
  }
};

// 獲取 Blob 客戶端
export const getBlobClient = (filename: string): BlockBlobClient => {
  return containerClient.getBlockBlobClient(filename);
};

// 上傳文件
export const uploadFile = async (file: Express.Multer.File): Promise<string> => {
  try {
    const blobName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(file.buffer, file.size);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('上傳文件到 Azure Blob Storage 失敗:', error);
    throw new Error('上傳文件失敗');
  }
};

// 刪除文件
export const deleteFile = async (blobUrl: string): Promise<void> => {
  try {
    // 從 URL 中提取 blobName
    const blobName = blobUrl.split('/').pop();
    if (!blobName) {
      throw new Error('無效的 blob URL');
    }
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error('從 Azure Blob Storage 刪除文件失敗:', error);
    throw new Error('刪除文件失敗');
  }
};
