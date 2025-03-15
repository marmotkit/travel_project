import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  password?: string;
  loginCount?: number;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 預設測試帳號密碼
  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  // 初始化用戶資料
  useEffect(() => {
    // DEBUG: 在開發模式下強制重置用戶資料
    const DEBUG = false; // 關閉 DEBUG 模式，保留用戶修改的資料
    if (DEBUG) {
      console.log('DEBUG 模式: 重置用戶資料');
      localStorage.removeItem('users');
      localStorage.removeItem('user');
    }

    // 確保用戶數據已初始化
    if (!localStorage.getItem('users')) {
      const mockUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          fullName: '系統管理員',
          role: 'admin',
          status: 'active',
          password: 'admin123',
          createdAt: '2023-01-01T00:00:00.000Z',
          lastLogin: '2023-03-15T08:30:00.000Z'
        },
        {
          id: '2',
          username: 'liming',
          email: 'test@example.com',
          fullName: '李明',
          role: 'admin',
          status: 'active',
          password: 'password123',
          createdAt: '2023-01-10T00:00:00.000Z',
          lastLogin: '2023-03-14T09:15:00.000Z',
          loginCount: 8
        },
        {
          id: '3',
          username: 'wangxiao',
          email: 'wang@example.com',
          fullName: '王小明',
          role: 'user',
          status: 'active',
          password: 'wang123',
          createdAt: '2023-02-05T00:00:00.000Z',
          lastLogin: '2023-03-10T14:20:00.000Z',
          loginCount: 5
        },
        {
          id: '4',
          username: 'zhanghua',
          email: 'zhang@example.com',
          fullName: '張華',
          role: 'user',
          status: 'inactive',
          password: 'zhang123',
          createdAt: '2023-02-15T00:00:00.000Z',
          lastLogin: '2023-02-28T11:45:00.000Z',
          loginCount: 3
        },
        {
          id: '5',
          username: 'liuxiaomei',
          email: 'liu@example.com',
          fullName: '劉小美',
          role: 'user',
          status: 'active',
          password: 'liu123',
          createdAt: '2023-03-01T00:00:00.000Z',
          lastLogin: '2023-03-12T16:30:00.000Z',
          loginCount: 6
        }
      ];
      localStorage.setItem('users', JSON.stringify(mockUsers));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 清除前後空格避免輸入問題
    const trimmedEmail = email.trim();
    
    try {
      // 從 localStorage 中獲取用戶資料
      const usersStr = localStorage.getItem('users');
      if (!usersStr) {
        console.error('用戶資料不存在，重新初始化...');
        // 強制初始化用戶資料
        const mockUsers = [
          {
            id: '2',
            username: 'liming',
            email: testEmail,
            fullName: '李明',
            role: 'admin',
            status: 'active',
            password: testPassword,
            createdAt: '2023-01-10T00:00:00.000Z',
            lastLogin: new Date().toISOString(),
            loginCount: 1
          }
        ];
        localStorage.setItem('users', JSON.stringify(mockUsers));
        
        // 如果輸入的是測試帳號，允許直接登入
        if (trimmedEmail === testEmail && password === testPassword) {
          // 直接設置登入用戶資訊
          localStorage.setItem('user', JSON.stringify({
            id: '2',
            username: 'liming',
            email: testEmail,
            fullName: '李明',
            role: 'admin',
            status: 'active',
            isAdmin: true,
            lastLogin: new Date().toISOString(),
            loginCount: 1
          }));
          
          navigate('/dashboard');
        } else {
          setError('電子郵件或密碼不正確');
        }
        return;
      }
      
      // 從用戶列表中查找匹配的電子郵件
      const users: User[] = JSON.parse(usersStr);
      console.log('用戶列表:', users);
      
      // 不區分大小寫比對電子郵件
      const foundUser = users.find(user => 
        user.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
      
      console.log('找到的用戶:', foundUser);
      
      if (foundUser) {
        // 檢查用戶狀態是否為活躍
        if (foundUser.status === 'inactive') {
          setError('此帳號已被停用，請聯絡管理員');
          return;
        }
        
        // 驗證密碼
        if (foundUser.password !== password) {
          setError('電子郵件或密碼不正確');
          return;
        }
        
        // 更新最後登入時間
        const updatedUsers = users.map(user => {
          if (user.email.toLowerCase() === trimmedEmail.toLowerCase()) {
            return {
              ...user,
              lastLogin: new Date().toISOString(),
              loginCount: (user.loginCount || 0) + 1
            };
          }
          return user;
        });
        
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // 將用戶信息存儲到 localStorage 中
        localStorage.setItem('user', JSON.stringify({
          ...foundUser,
          lastLogin: new Date().toISOString(),
          loginCount: (foundUser.loginCount || 0) + 1,
          isAdmin: foundUser.role === 'admin'
        }));
        
        // 導航到儀表板
        navigate('/dashboard');
      } else {
        console.error('找不到匹配的用戶記錄，檢查用戶名是否正確');
        setError('電子郵件或密碼不正確');
      }
    } catch (err) {
      console.error('登錄時出錯:', err);
      setError('登錄過程中出現錯誤');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">旅遊管理系統</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
          <p className="font-medium">測試帳號說明：</p>
          <p>預設管理員帳號：test@example.com</p>
          <p>預設管理員密碼：password123</p>
          <p className="text-xs mt-2">其他用戶密碼請參考用戶管理設定</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              密碼
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            登入
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/register" className="text-blue-500 hover:text-blue-700 text-sm">
            還沒有帳號？立即註冊
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 