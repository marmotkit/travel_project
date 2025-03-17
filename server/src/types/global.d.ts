// 全局類型聲明文件

// 為 Node.js 核心全局變量聲明類型
declare var process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    JWT_SECRET?: string;
    JWT_EXPIRE?: string;
    AZURE_STORAGE_CONNECTION_STRING?: string;
    AZURE_STORAGE_CONTAINER_NAME?: string;
  };
};

// 聲明 __dirname 變量
declare var __dirname: string;

// Express Multer 擴展
declare namespace Express {
  interface Multer {
    // 添加任何必要的類型定義
    [key: string]: any;
  }
}

// 為常用 Node.js 模塊添加聲明
declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  // 添加其他需要的 path 函數
}
