import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  password?: string;
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'trips' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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
        
        setUser(foundUser);
        
        // 加載該用戶相關的旅行
        const tripsStr = localStorage.getItem('trips');
        if (tripsStr) {
          const allTrips: Trip[] = JSON.parse(tripsStr);
          // 在真實環境中，會根據用戶ID過濾旅行
          // 這裡我們僅作模擬
          const mockUserTrips = allTrips.slice(0, 2);
          setUserTrips(mockUserTrips);
        }
        
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

  // 處理更新用戶角色
  const handleRoleChange = (newRole: 'admin' | 'user') => {
    if (!user) return;
    
    const updatedUser = { ...user, role: newRole };
    updateUser(updatedUser);
  };

  // 處理更新用戶狀態
  const handleStatusChange = (newStatus: 'active' | 'inactive') => {
    if (!user) return;
    
    const updatedUser = { ...user, status: newStatus };
    updateUser(updatedUser);
  };

  // 處理密碼更新
  const handlePasswordChange = () => {
    if (!user) return;
    
    // 重置訊息
    setPasswordError(null);
    setPasswordSuccess(null);
    
    // 驗證密碼
    if (!newPassword) {
      setPasswordError('請輸入新密碼');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('密碼長度不能少於6個字符');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('兩次輸入的密碼不一致');
      return;
    }
    
    // 更新密碼
    const updatedUser = { ...user, password: newPassword };
    updateUser(updatedUser);
    
    // 顯示成功訊息
    setPasswordSuccess('密碼已成功更新');
    
    // 清空輸入框
    setNewPassword('');
    setConfirmPassword('');
  };

  // 更新用戶數據
  const updateUser = (updatedUser: User) => {
    try {
      const usersStr = localStorage.getItem('users');
      if (!usersStr) return;
      
      const users: User[] = JSON.parse(usersStr);
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUser(updatedUser);
      
      // 檢查是否是當前登入的用戶，如果是則同時更新 localStorage 中的 'user' 項目
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === updatedUser.id || currentUser.email === updatedUser.email) {
          // 保留 isAdmin 屬性
          const isAdmin = currentUser.isAdmin || updatedUser.role === 'admin';
          localStorage.setItem('user', JSON.stringify({
            ...updatedUser,
            isAdmin
          }));
          console.log('同時更新了當前登入用戶資訊', updatedUser);
        }
      }
    } catch (error) {
      console.error('更新用戶數據時出錯:', error);
      setError('更新用戶數據失敗');
    }
  };

  // 處理刪除用戶
  const handleDeleteUser = () => {
    if (!user || !confirmDelete) return;
    
    try {
      const usersStr = localStorage.getItem('users');
      if (!usersStr) return;
      
      const users: User[] = JSON.parse(usersStr);
      const filteredUsers = users.filter(u => u.id !== user.id);
      
      localStorage.setItem('users', JSON.stringify(filteredUsers));
      navigate('/admin/users');
    } catch (error) {
      console.error('刪除用戶時出錯:', error);
      setError('刪除用戶失敗');
    }
  };

  // 導航到編輯頁面
  const handleEditUser = () => {
    navigate(`/admin/users/${id}/edit`);
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
            onClick={() => navigate('/admin/users')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            返回用戶列表
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
          title="用戶詳情" 
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
                用戶詳情
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleEditUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <i className="fas fa-edit mr-2"></i>
                編輯
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  刪除
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">確認刪除？</span>
                  <button
                    onClick={handleDeleteUser}
                    className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    是
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    否
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 用戶基本信息卡片 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="flex flex-col md:flex-row">
              <div className="bg-gray-800 text-white p-6 flex flex-col items-center justify-center md:w-1/4">
                <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-4xl text-gray-600 mb-4">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{user.fullName && user.fullName.length > 0 ? user.fullName.charAt(0) : user.username.charAt(0)}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1">{user.fullName || user.username}</h2>
                <p className="text-gray-300 mb-3">@{user.username}</p>
                <div className="flex space-x-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-purple-600' : 'bg-green-600'
                  }`}>
                    {user.role === 'admin' ? '管理員' : '一般用戶'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {user.status === 'active' ? '活躍' : '停用'}
                  </span>
                </div>
              </div>
              
              <div className="p-6 md:w-3/4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">用戶資訊</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">電子郵件</p>
                      <p>{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">電話</p>
                      <p>{user.phone || '未設置'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">帳號創建日期</p>
                      <p>{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">最後登入</p>
                      <p>{user.lastLogin ? formatDate(user.lastLogin) : '從未登入'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">地址</p>
                      <p>{user.address || '未設置'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">權限設定</h3>
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">用戶角色</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRoleChange('admin')}
                          className={`px-3 py-1 rounded-md ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-600 border border-purple-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          管理員
                        </button>
                        <button
                          onClick={() => handleRoleChange('user')}
                          className={`px-3 py-1 rounded-md ${
                            user.role === 'user'
                              ? 'bg-blue-100 text-blue-600 border border-blue-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          一般用戶
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-2">帳號狀態</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange('active')}
                          className={`px-3 py-1 rounded-md ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-600 border border-green-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          啟用
                        </button>
                        <button
                          onClick={() => handleStatusChange('inactive')}
                          className={`px-3 py-1 rounded-md ${
                            user.status === 'inactive'
                              ? 'bg-red-100 text-red-600 border border-red-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          停用
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {user.bio && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-2">個人簡介</h3>
                    <p className="text-gray-700">{user.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 標籤頁 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b">
              <nav className="flex">
                <button
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  用戶詳情
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'trips'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('trips')}
                >
                  旅程記錄
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'security'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('security')}
                >
                  安全設定
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">詳細資訊</h3>
                  <p className="text-gray-600 mb-4">
                    此處顯示用戶的詳細資訊和活動歷史。
                  </p>
                  <div className="border rounded-md p-4 bg-gray-50">
                    <h4 className="font-medium mb-2">活動記錄</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>首次登入</span>
                        <span className="text-gray-500">{formatDate(user.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>最後活動</span>
                        <span className="text-gray-500">{user.lastLogin ? formatDate(user.lastLogin) : '從未登入'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>登入次數</span>
                        <span className="text-gray-500">12 次</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'trips' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">旅程記錄</h3>
                  {userTrips.length > 0 ? (
                    <div className="space-y-4">
                      {userTrips.map(trip => (
                        <div key={trip.id} className="border rounded-md p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{trip.title}</h4>
                              <p className="text-gray-500 text-sm">{trip.destination}</p>
                              <p className="text-gray-500 text-xs">
                                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              trip.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                              trip.status === 'ongoing' ? 'bg-green-100 text-green-600' :
                              trip.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {trip.status === 'upcoming' ? '即將到來' :
                               trip.status === 'ongoing' ? '進行中' :
                               trip.status === 'completed' ? '已完成' : '已取消'}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => navigate(`/trips/${trip.id}`)}
                              className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                              查看詳情
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">此用戶尚未創建任何旅程。</p>
                  )}
                </div>
              )}
              
              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">安全設定</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">密碼管理</h4>
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
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">新密碼</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">確認密碼</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          onClick={handlePasswordChange}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          更新密碼
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">重設密碼</h4>
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        發送重設密碼郵件
                      </button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">雙因素認證</h4>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">未啟用</span>
                        <button
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          啟用雙因素認證
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-red-600 mb-2">危險操作</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStatusChange(user.status === 'active' ? 'inactive' : 'active')}
                          className={`px-4 py-2 rounded-md ${
                            user.status === 'active' 
                              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {user.status === 'active' ? '停用帳號' : '啟用帳號'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                        >
                          刪除帳號
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDetail; 