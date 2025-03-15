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
  loginCount?: number;
}

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 檢查用戶身份並加載用戶數據
  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return false;
      }
      
      try {
        const user = JSON.parse(userStr);
        if (!user.isAdmin) {
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

    const loadUsers = () => {
      // 模擬從API加載用戶數據
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          fullName: '系統管理員',
          role: 'admin',
          status: 'active',
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
          createdAt: '2023-01-10T00:00:00.000Z',
          lastLogin: '2023-03-14T09:15:00.000Z'
        },
        {
          id: '3',
          username: 'wangxiao',
          email: 'wang@example.com',
          fullName: '王小明',
          role: 'user',
          status: 'active',
          createdAt: '2023-02-05T00:00:00.000Z',
          lastLogin: '2023-03-10T14:20:00.000Z'
        },
        {
          id: '4',
          username: 'zhanghua',
          email: 'zhang@example.com',
          fullName: '張華',
          role: 'user',
          status: 'inactive',
          createdAt: '2023-02-15T00:00:00.000Z',
          lastLogin: '2023-02-28T11:45:00.000Z'
        },
        {
          id: '5',
          username: 'liuxiaomei',
          email: 'liu@example.com',
          fullName: '劉小美',
          role: 'user',
          status: 'active',
          createdAt: '2023-03-01T00:00:00.000Z',
          lastLogin: '2023-03-12T16:30:00.000Z'
        }
      ];

      // 將模擬數據存儲到localStorage
      if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(mockUsers));
      }

      // 從localStorage讀取用戶數據
      try {
        const usersData = localStorage.getItem('users');
        if (usersData) {
          const parsedUsers = JSON.parse(usersData);
          setUsers(parsedUsers);
          setFilteredUsers(parsedUsers);
        }
      } catch (error) {
        console.error('讀取用戶數據時出錯:', error);
      }
      
      setIsLoading(false);
    };

    const isAuth = checkAuth();
    if (isAuth) {
      loadUsers();
    }
  }, [navigate]);

  // 過濾用戶
  useEffect(() => {
    let result = [...users];
    
    // 按搜索關鍵詞過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.fullName && user.fullName.toLowerCase().includes(query))
      );
    }
    
    // 按狀態過濾
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    // 按角色過濾
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(result);
  }, [users, searchQuery, statusFilter, roleFilter]);

  // 處理選擇用戶
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // 處理全選
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
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

  // 處理狀態變更
  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive') => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, status: newStatus };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  // 處理批量操作
  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) return;
    
    let updatedUsers = [...users];
    
    if (action === 'activate' || action === 'deactivate') {
      updatedUsers = updatedUsers.map(user => {
        if (selectedUsers.includes(user.id)) {
          return { 
            ...user, 
            status: action === 'activate' ? 'active' : 'inactive' 
          };
        }
        return user;
      });
    } else if (action === 'delete') {
      // 在實際應用中可能需要確認對話框
      updatedUsers = updatedUsers.filter(user => !selectedUsers.includes(user.id));
    }
    
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setSelectedUsers([]);
  };

  // 導航到用戶詳情頁面
  const handleUserDetail = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  // 導航到新增用戶頁面
  const handleAddUser = () => {
    navigate('/admin/users/new');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">加載中...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="用戶管理" 
          isAdmin={isAdmin} 
          onToggleAdmin={() => {}} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
                用戶列表
              </h2>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i>
                新增用戶
              </button>
            </div>
            
            {/* 搜索和過濾 */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 搜索框 */}
                <div className="relative md:col-span-2">
                  <input
                    type="text"
                    placeholder="搜索用戶名、姓名或電子郵件..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
                
                {/* 狀態過濾 */}
                <div>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  >
                    <option value="all">所有狀態</option>
                    <option value="active">活躍</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
                
                {/* 角色過濾 */}
                <div>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                  >
                    <option value="all">所有角色</option>
                    <option value="admin">管理員</option>
                    <option value="user">一般用戶</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* 批量操作按鈕 */}
            {selectedUsers.length > 0 && (
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  啟用所選
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  停用所選
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  刪除所選
                </button>
                <span className="ml-2 text-sm text-gray-600 self-center">
                  已選擇 {selectedUsers.length} 個用戶
                </span>
              </div>
            )}
            
            {/* 用戶列表表格 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用戶名/姓名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最後登入
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      創建日期
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {user.fullName && user.fullName.length > 0 ? user.fullName.charAt(0) : user.username.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.fullName || '未設置姓名'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-xs text-gray-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'admin' ? '管理員' : '一般用戶'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status === 'active' ? '活躍' : '停用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? formatDate(user.lastLogin) : '從未登入'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUserDetail(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleStatusChange(
                                user.id, 
                                user.status === 'active' ? 'inactive' : 'active'
                              )}
                              className={`${
                                user.status === 'active' 
                                  ? 'text-orange-600 hover:text-orange-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              <i className={`fas ${user.status === 'active' ? 'fa-ban' : 'fa-check-circle'}`}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        沒有找到符合條件的用戶
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserList; 