import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideMenu from '../components/layout/SideMenu';
import Header from '../components/layout/Header';

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
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // 表單狀態
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  
  // 密碼變更表單狀態
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // 檢查用戶身份並加載用戶數據
  useEffect(() => {
    const loadUserData = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      
      try {
        const currentUser = JSON.parse(userStr);
        setIsAdmin(currentUser.isAdmin || false);
        
        // 從users 集合中獲取完整的用戶資料
        const usersStr = localStorage.getItem('users');
        if (!usersStr) {
          // 如果沒有users集合，使用當前用戶資訊創建一個基本的用戶對象
          const basicUser: User = {
            id: '0',
            username: currentUser.email.split('@')[0],
            email: currentUser.email,
            fullName: currentUser.name,
            role: currentUser.isAdmin ? 'admin' : 'user',
            status: 'active',
            createdAt: new Date().toISOString()
          };
          setUser(basicUser);
          initFormValues(basicUser);
        } else {
          const users: User[] = JSON.parse(usersStr);
          const foundUser = users.find(u => u.email === currentUser.email);
          
          if (foundUser) {
            setUser(foundUser);
            initFormValues(foundUser);
          } else {
            // 同樣創建一個基本用戶
            const basicUser: User = {
              id: '0',
              username: currentUser.email.split('@')[0],
              email: currentUser.email,
              fullName: currentUser.name,
              role: currentUser.isAdmin ? 'admin' : 'user',
              status: 'active',
              createdAt: new Date().toISOString()
            };
            setUser(basicUser);
            initFormValues(basicUser);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('讀取用戶數據時出錯:', err);
        setError('加載用戶數據失敗');
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  // 初始化表單值
  const initFormValues = (user: User) => {
    setFullName(user.fullName || '');
    setPhone(user.phone || '');
    setAddress(user.address || '');
    setBio(user.bio || '');
  };

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // 更新用戶對象
      const updatedUser = {
        ...user,
        fullName,
        phone: phone || undefined,
        address: address || undefined,
        bio: bio || undefined
      };
      
      // 更新原始用戶列表（如果存在）
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        const users: User[] = JSON.parse(usersStr);
        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }
      
      // 更新當前登入用戶資訊
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const updatedCurrentUser = {
          ...currentUser,
          name: fullName
        };
        localStorage.setItem('user', JSON.stringify(updatedCurrentUser));
      }
      
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('保存用戶資料時出錯:', err);
      setError('保存用戶資料失敗');
    }
  };

  // 處理密碼變更
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    
    // 在實際應用中需要與後端API驗證當前密碼
    // 這裡僅作為前端展示
    
    if (newPassword.length < 6) {
      setPasswordError('新密碼長度至少為6個字符');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('新密碼與確認密碼不符');
      return;
    }
    
    // 模擬密碼更改成功
    setPasswordSuccess('密碼已成功更改');
    
    // 清空密碼欄位
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    // 幾秒後關閉成功訊息
    setTimeout(() => {
      setPasswordSuccess(null);
      setShowPasswordForm(false);
    }, 3000);
  };

  // 取消編輯
  const handleCancel = () => {
    if (user) {
      initFormValues(user);
    }
    setIsEditing(false);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            返回儀表板
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">找不到用戶數據</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="個人資料" 
          isAdmin={isAdmin} 
          onToggleAdmin={() => {}} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">個人資料</h2>
                  <div>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        編輯資料
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSubmit}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          保存
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          姓名
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          電子郵件
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={user.email}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                          disabled
                        />
                        <p className="mt-1 text-xs text-gray-500">電子郵件無法修改</p>
                      </div>
                      
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
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                          用戶名
                        </label>
                        <input
                          id="username"
                          type="text"
                          value={user.username}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                          disabled
                        />
                        <p className="mt-1 text-xs text-gray-500">用戶名無法修改</p>
                      </div>
                      
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
                        />
                      </div>
                      
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
                        ></textarea>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">姓名</h3>
                      <p className="mt-1">{user.fullName}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">電子郵件</h3>
                      <p className="mt-1">{user.email}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">電話</h3>
                      <p className="mt-1">{user.phone || '未設置'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">用戶名</h3>
                      <p className="mt-1">@{user.username}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">註冊日期</h3>
                      <p className="mt-1">{formatDate(user.createdAt)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">最後登入</h3>
                      <p className="mt-1">{user.lastLogin ? formatDate(user.lastLogin) : '未記錄'}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">地址</h3>
                      <p className="mt-1">{user.address || '未設置'}</p>
                    </div>
                    
                    {user.bio && (
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">個人簡介</h3>
                        <p className="mt-1">{user.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">安全設定</h2>
                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      變更密碼
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {showPasswordForm ? (
                  <form onSubmit={handlePasswordChange} className="max-w-lg">
                    {passwordError && (
                      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {passwordError}
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        {passwordSuccess}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        目前密碼
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        新密碼
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">密碼至少需要6個字符</p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        確認新密碼
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordError(null);
                          setPasswordSuccess(null);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        更新密碼
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center border-b pb-4 mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium">密碼</h3>
                        <p className="text-sm text-gray-500">上次更新：未知</p>
                      </div>
                      <div>
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                          已設置
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h3 className="font-medium">雙因素認證</h3>
                        <p className="text-sm text-gray-500">增強您帳戶的安全性</p>
                      </div>
                      <div>
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                          未啟用
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">偏好設定</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">電子郵件通知</h3>
                      <p className="text-sm text-gray-500">接收系統相關的電子郵件通知</p>
                    </div>
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">系統通知</h3>
                      <p className="text-sm text-gray-500">接收系統更新和提醒</p>
                    </div>
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">多語言</h3>
                      <p className="text-sm text-gray-500">選擇您偏好的語言</p>
                    </div>
                    <div>
                      <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="zh-TW">繁體中文</option>
                        <option value="en">English</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile; 