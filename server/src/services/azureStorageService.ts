import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import * as multer from 'multer';

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'travel-plan-images';

// 檢查連接字符串是否存在
if (!connectionString) {
  console.warn('警告: AZURE_STORAGE_CONNECTION_STRING 環境變量未設置。');
  console.warn('圖像上傳功能將無法正常工作，但應用程序將繼續運行。');
}

let blobServiceClient;
let containerClient;

try {
  // 僅當連接字符串存在時初始化
  if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
  }
} catch (error) {
  console.error('初始化 Azure Blob Storage 失敗:', error);
  console.warn('圖像上傳功能將無法使用，但應用程序將繼續運行。');
}

// 初始化容器（如果不存在）
export const initContainer = async (): Promise<void> => {
  if (!containerClient) {
    console.warn('跳過容器初始化，因為 Azure 存儲未正確配置。');
    return;
  }

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
export const getBlobClient = (filename: string): BlockBlobClient | null => {
  if (!containerClient) {
    console.warn('Azure 存儲未正確配置，無法獲取 Blob 客戶端');
    return null;
  }
  return containerClient.getBlockBlobClient(filename);
};

// 定義一個符合 Multer 文件對象結構的接口
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// 上傳文件
export const uploadFile = async (file: MulterFile): Promise<string> => {
  if (!containerClient) {
    throw new Error('Azure 存儲未正確配置，無法上傳文件');
  }

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
  if (!containerClient) {
    throw new Error('Azure 存儲未正確配置，無法刪除文件');
  }

  try {
    // 從 URL 中提取 blobName
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/');
    const blobName = pathParts[pathParts.length - 1];
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error('從 Azure Blob Storage 刪除文件失敗:', error);
    throw new Error('刪除文件失敗');
  }
};
