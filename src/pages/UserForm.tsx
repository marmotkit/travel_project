import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  bio?: string;
  password?: string;
  loginCount?: number;
}

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 表單狀態
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  
  // 驗證錯誤
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // 檢查用戶身份並加載用戶數據
  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return false;
      }
      
      try {
        const currentUser = JSON.parse(userStr);
        if (!currentUser.isAdmin) {
          navigate('/dashboard');
          return false;
        }
        setIsAdmin(true);
        return true;
      } catch (err) {
        navigate('/login');
        return false;
      }
    };

    const loadUserData = () => {
      if (!id) {
        // 新增用戶模式
        setIsLoading(false);
        return;
      }
      
      try {
        // 從localStorage讀取用戶數據
        const usersStr = localStorage.getItem('users');
        if (!usersStr) {
          setError('找不到用戶數據');
          setIsLoading(false);
          return;
        }

        const users: User[] = JSON.parse(usersStr);
        const foundUser = users.find(user => user.id === id);
        
        if (!foundUser) {
          setError('找不到該用戶');
          setIsLoading(false);
          return;
        }
        
        // 填充表單數據
        setUsername(foundUser.username);
        setEmail(foundUser.email);
        setFullName(foundUser.fullName);
        setPhone(foundUser.phone || '');
        setAddress(foundUser.address || '');
        setBio(foundUser.bio || '');
        setRole(foundUser.role);
        setStatus(foundUser.status);
        
        // 編輯模式不需要填充密碼
        setPassword('');
        setConfirmPassword('');
        
        setIsLoading(false);
      } catch (error) {
        console.error('加載用戶數據時出錯:', error);
        setError('數據加載失敗');
        setIsLoading(false);
      }
    };

    const isAuth = checkAuth();
    if (isAuth) {
      loadUserData();
    }
  }, [id, navigate]);

  // 驗證表單
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!username.trim()) {
      newErrors.username = '請輸入用戶名';
    } else if (username.length < 3) {
      newErrors.username = '用戶名至少需要3個字符';
    }
    
    if (!email.trim()) {
      newErrors.email = '請輸入電子郵件';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }
    
    if (!id) { // 只在新增模式驗證密碼
      if (!password) {
        newErrors.password = '請輸入密碼';
      } else if (password.length < 6) {
        newErrors.password = '密碼至少需要6個字符';
      }
      
      if (password !== confirmPassword) {
        newErrors.confirmPassword = '兩次輸入的密碼不匹配';
      }
    } else if (password && password !== confirmPassword) {
      newErrors.confirmPassword = '兩次輸入的密碼不匹配';
    }
    
    if (!fullName.trim()) {
      newErrors.fullName = '請輸入姓名';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // 從localStorage讀取用戶數據
      const usersStr = localStorage.getItem('users');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const now = new Date().toISOString();
      
      if (id) {
        // 編輯現有用戶
        const updatedUsers = users.map(user => {
          if (user.id === id) {
            return {
              ...user,
              username,
              email,
              fullName,
              role,
              status,
              phone: phone || undefined,
              address: address || undefined,
              bio: bio || undefined,
              // 只有當輸入了新密碼時才更新密碼
              ...(password ? { password } : {}),
              updatedAt: now
            };
          }
          return user;
        });
        
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      } else {
        // 創建新用戶
        // 檢查用戶名和電子郵件是否已存在
        if (users.some(user => user.username === username)) {
          setErrors(prev => ({ ...prev, username: '此用戶名已被使用' }));
          return;
        }
        
        if (users.some(user => user.email === email)) {
          setErrors(prev => ({ ...prev, email: '此電子郵件已被使用' }));
          return;
        }
        
        const newUser: User = {
          id: uuidv4(),
          username,
          email,
          password,
          fullName,
          role,
          status,
          phone: phone || undefined,
          address: address || undefined,
          bio: bio || undefined,
          createdAt: now
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      // 重定向到用戶列表頁面
      navigate('/admin/users');
    } catch (error) {
      console.error('保存用戶數據時出錯:', error);
      setError('保存用戶數據失敗');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          <p className="font-bold">錯誤</p>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/admin/users')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            返回用戶列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={id ? '編輯用戶' : '新增用戶'} 
          isAdmin={isAdmin} 
          onToggleAdmin={() => {}} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/users')}
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">
                {id ? '編輯用戶' : '新增用戶'}
              </h1>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 用戶名 */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    用戶名 *
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formSubmitted && errors.username 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="請輸入用戶名"
                  />
                  {formSubmitted && errors.username && (
                    <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                  )}
                </div>

                {/* 電子郵件 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    電子郵件 *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formSubmitted && errors.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="請輸入電子郵件"
                  />
                  {formSubmitted && errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* 密碼 */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {id ? '密碼（留空則不變更）' : '密碼 *'}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formSubmitted && errors.password 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder={id ? '輸入新密碼（可選）' : '請輸入密碼'}
                  />
                  {formSubmitted && errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                {/* 確認密碼 */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {id ? '確認密碼（留空則不變更）' : '確認密碼 *'}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formSubmitted && errors.confirmPassword 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder={id ? '再次輸入新密碼（可選）' : '請再次輸入密碼'}
                  />
                  {formSubmitted && errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* 姓名 */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formSubmitted && errors.fullName 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="請輸入姓名"
                  />
                  {formSubmitted && errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* 電話 */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    電話
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入電話（選填）"
                  />
                </div>

                {/* 角色 */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    用戶角色 *
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">一般用戶</option>
                    <option value="admin">管理員</option>
                  </select>
                </div>

                {/* 狀態 */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    帳號狀態 *
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">活躍</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>

                {/* 地址 */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    地址
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入地址（選填）"
                  />
                </div>

                {/* 簡介 */}
                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    個人簡介
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入個人簡介（選填）"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {id ? '保存變更' : '創建用戶'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default UserForm; 