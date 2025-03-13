import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 測試帳號
  const testCredentials = {
    email: 'test@example.com',
    password: 'password123',
    isAdmin: true,
    name: '李明'
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 簡單的身份驗證邏輯
    if (email === testCredentials.email && password === testCredentials.password) {
      // 存儲用戶信息到 localStorage
      localStorage.setItem('user', JSON.stringify({
        email: testCredentials.email,
        name: testCredentials.name,
        isAdmin: testCredentials.isAdmin
      }));
      
      // 導航到儀表板
      navigate('/dashboard');
    } else {
      setError('電子郵件或密碼不正確');
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
          <p className="font-medium">測試帳號：</p>
          <p>電子郵件：test@example.com</p>
          <p>密碼：password123</p>
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