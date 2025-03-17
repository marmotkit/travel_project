import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// 用戶類型定義
interface User {
  id: string;
  username?: string;
  email: string;
  fullName?: string;
  isAdmin: boolean;
  lastLogin?: string;
  loginCount?: number;
}

// 認證上下文類型定義
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

// 創建認證上下文
const AuthContext = createContext<AuthContextType | null>(null);

// 認證提供者組件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // 初始化- 檢查是否已登入
  useEffect(() => {
    checkAuth();
  }, []);
  
  // 檢查用戶是否已認證
  const checkAuth = (): boolean => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error("認證檢查失敗", error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    return false;
  };
  
  // 登入函數
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 清除前後空格避免輸入問題
      const trimmedEmail = email.trim();
      
      // 從 localStorage 中獲取用戶資料
      const usersStr = localStorage.getItem('users');
      if (!usersStr) {
        console.error('用戶資料不存在');
        return false;
      }
      
      // 從用戶列表中查找匹配的電子郵件
      const users: any[] = JSON.parse(usersStr);
      
      // 不區分大小寫比對電子郵件
      const foundUser = users.find(user => 
        user.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
      
      if (foundUser && foundUser.password === password) {
        // 檢查用戶狀態
        if (foundUser.status === 'inactive') {
          console.error('用戶帳號已停用');
          return false;
        }
        
        // 更新用戶登入資訊
        const updatedUser = {
          ...foundUser,
          lastLogin: new Date().toISOString(),
          loginCount: (foundUser.loginCount || 0) + 1,
          isAdmin: foundUser.role === 'admin'
        };
        
        // 更新 localStorage 中的用戶列表
        const updatedUsers = users.map(user => 
          user.id === foundUser.id ? updatedUser : user
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // 設置當前登入用戶
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // 更新狀態
        setUser(updatedUser);
        setIsAuthenticated(true);
        
        return true;
      }
    } catch (error) {
      console.error("登入失敗", error);
    }
    
    return false;
  };
  
  // 登出函數
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isAdmin: user?.isAdmin || false, 
        login, 
        logout, 
        checkAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 自定義hook用於獲取認證上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  
  return context;
};
