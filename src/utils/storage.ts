interface StorageItem {
  key: string;
  value: any;
  expiresAt?: number;
}

// 本地儲存服務
const StorageService = {
  // 設置項目到localStorage
  setItem: (key: string, value: any, expiresInDays?: number): void => {
    const item: StorageItem = {
      key,
      value,
    };
    
    if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      item.expiresAt = expiresAt.getTime();
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  // 從localStorage獲取項目
  getItem: (key: string): any => {
    try {
      const itemStr = localStorage.getItem(key);
      
      if (!itemStr) {
        return null;
      }
      
      const item: StorageItem = JSON.parse(itemStr);
      
      if (item.expiresAt && new Date().getTime() > item.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error('Error retrieving from localStorage:', error);
      return null;
    }
  },
  
  // 從localStorage移除項目
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  // 清空localStorage
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export default StorageService; 