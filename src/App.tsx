import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import TripForm from './pages/TripForm';
import UserList from './pages/UserList';
import UserDetail from './pages/UserDetail';
import UserForm from './pages/UserForm';
import Profile from './pages/Profile';
import Itinerary from './pages/Itinerary';
import ItineraryDayDetail from './pages/ItineraryDayDetail';
import ItineraryDayForm from './pages/ItineraryDayForm';
import Transportation from './pages/Transportation';
import TransportationForm from './pages/TransportationForm';
import Accommodation from './pages/Accommodation';
import AccommodationForm from './pages/AccommodationForm';
import AccommodationDetail from './pages/AccommodationDetail';
import Meal from './pages/Meal';
import MealForm from './pages/MealForm';
import MealDetail from './pages/MealDetail';
import Document from './pages/Document';
import DocumentForm from './pages/DocumentForm';
import DocumentDetail from './pages/DocumentDetail';
import Budget from './pages/Budget';
import BudgetForm from './pages/BudgetForm';
import ExpenseForm from './pages/ExpenseForm';
import ExpenseList from './pages/ExpenseList';
import BudgetAnalysis from './pages/BudgetAnalysis';
import TravelMoments from './pages/TravelMoments';
import MomentAlbum from './pages/MomentAlbum';
import TravelNotes from './pages/TravelNotes';
import TravelNoteForm from './pages/TravelNoteForm';
import TravelNoteDetail from './pages/TravelNoteDetail';

// 路由保護組件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    // 用戶未登入，重定向到登入頁面
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 管理員路由保護組件
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    // 用戶未登入，重定向到登入頁面
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    if (!user.isAdmin) {
      // 非管理員用戶，重定向到儀表板頁面
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
  } catch (err) {
    // 解析出錯，視為未登入
    return <Navigate to="/login" replace />;
  }
};

function App() {
  useEffect(() => {
    // 初始化應用程序數據
    const initializeAppData = () => {
      // 用戶數據初始化
      if (!localStorage.getItem('user')) {
        const defaultUser = {
          id: '1',
          name: '測試用戶',
          email: 'user@example.com',
          password: 'password',
          isAdmin: true,
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          phone: '0912-345-678',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('user', JSON.stringify(defaultUser));
      }

      // 用戶列表初始化
      if (!localStorage.getItem('users')) {
        const defaultUsers = [
          {
            id: '1',
            name: '測試用戶',
            email: 'user@example.com',
            password: 'password',
            isAdmin: true,
            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
            phone: '0912-345-678',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: '張小明',
            email: 'zhang@example.com',
            password: 'password',
            isAdmin: false,
            avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
            phone: '0923-456-789',
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: '李小紅',
            email: 'li@example.com',
            password: 'password',
            isAdmin: false,
            avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
            phone: '0934-567-890',
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }

      // 旅行數據初始化
      if (!localStorage.getItem('trips')) {
        const defaultTrips = [
          {
            id: '1',
            title: '東京五日遊',
            description: '探索東京的現代與傳統，體驗日本文化',
            destination: '日本東京',
            startDate: '2023-08-15',
            endDate: '2023-08-20',
            status: 'upcoming',
            coverImage: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc',
            members: ['1', '2'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: '峇里島度假',
            description: '在美麗的峇里島放鬆身心，享受陽光與海灘',
            destination: '印尼峇里島',
            startDate: '2023-09-10',
            endDate: '2023-09-17',
            status: 'upcoming',
            coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
            members: ['1', '3'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: '台北週末行',
            description: '短暫的台北之旅，品嚐美食，探索城市',
            destination: '台灣台北',
            startDate: '2023-06-02',
            endDate: '2023-06-04',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1517030330234-94c4fb948ebc',
            members: ['1'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem('trips', JSON.stringify(defaultTrips));
      }

      // 注意事項數據初始化
      if (!localStorage.getItem('travelNotes')) {
        const defaultNotes = [
          {
            id: '1',
            tripId: '1',
            title: '日本入境注意事項',
            content: '1. 確保護照有效期至少6個月以上\n2. 準備好入境卡和海關申報表\n3. 攜帶旅行保險證明\n4. 注意日本的插座是雙孔扁插，電壓為110V',
            category: 'documents',
            priority: 'high',
            stage: 'before-departure',
            reminderDate: '2023-08-10',
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            tripId: '1',
            title: '東京地鐵使用指南',
            content: '1. 購買Suica或Pasmo卡更方便搭乘\n2. 避開早晨8-9點和晚上5-7點的尖峰時段\n3. 地鐵內保持安靜，不要通話\n4. 留意末班車時間，通常在晚上12點左右',
            category: 'transportation',
            priority: 'medium',
            stage: 'during-trip',
            reminderDate: null,
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            tripId: '2',
            title: '峇里島健康注意事項',
            content: '1. 攜帶防蚊液和防曬霜\n2. 避免飲用自來水，只喝瓶裝水\n3. 準備一些腹瀉和暈車藥物\n4. 在當地飲食要注意衛生',
            category: 'health',
            priority: 'high',
            stage: 'before-departure',
            reminderDate: '2023-09-05',
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '4',
            tripId: '2',
            title: '峇里島文化禮儀',
            content: '1. 進入寺廟時需穿著得體，覆蓋肩膀和膝蓋\n2. 用右手接受和給予物品\n3. 尊重當地的宗教儀式和傳統\n4. 與當地人交流時保持微笑和禮貌',
            category: 'culture',
            priority: 'medium',
            stage: 'during-trip',
            reminderDate: null,
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '5',
            tripId: '3',
            title: '台北旅遊安全提示',
            content: '1. 保管好個人財物，特別是在夜市等人多的地方\n2. 注意交通安全，過馬路時要走斑馬線\n3. 緊急情況撥打110（警察）或119（救護）\n4. 隨身攜帶酒店名片，以防迷路',
            category: 'safety',
            priority: 'low',
            stage: 'before-departure',
            reminderDate: '2023-06-01',
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '6',
            tripId: '1',
            title: '返回前檢查清單',
            content: '1. 確保所有購物收據已妥善保存（退稅用）\n2. 檢查所有房間，確保沒有遺留物品\n3. 兌換足夠當地貨幣用於機場交通\n4. 完成酒店結賬手續',
            category: 'others',
            priority: 'medium',
            stage: 'before-return',
            reminderDate: '2023-08-19',
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
        localStorage.setItem('travelNotes', JSON.stringify(defaultNotes));
      }
    };

    initializeAppData();
  }, []);

  return (
    <Router>
      <Routes>
        {/* 公開路由 */}
        <Route path="/login" element={<Login />} />
        
        {/* 保護路由 */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/trips" element={
          <ProtectedRoute>
            <Trips />
          </ProtectedRoute>
        } />
        
        {/* 注意：特定路由需要放在參數路由之前，避免路由衝突 */}
        <Route path="/trips/new" element={
          <ProtectedRoute>
            <TripForm />
          </ProtectedRoute>
        } />
        
        <Route path="/trips/:id/edit" element={
          <ProtectedRoute>
            <TripForm />
          </ProtectedRoute>
        } />
        
        <Route path="/trips/:id" element={
          <ProtectedRoute>
            <TripDetail />
          </ProtectedRoute>
        } />
        
        {/* 行程管理路由 */}
        <Route path="/itinerary" element={
          <ProtectedRoute>
            <Itinerary />
          </ProtectedRoute>
        } />
        
        <Route path="/itinerary/day/new" element={
          <ProtectedRoute>
            <ItineraryDayForm />
          </ProtectedRoute>
        } />
        
        <Route path="/itinerary/day/:id/edit" element={
          <ProtectedRoute>
            <ItineraryDayForm />
          </ProtectedRoute>
        } />
        
        <Route path="/itinerary/day/:id" element={
          <ProtectedRoute>
            <ItineraryDayDetail />
          </ProtectedRoute>
        } />
        
        {/* 交通管理路由 */}
        <Route path="/transportation" element={
          <ProtectedRoute>
            <Transportation />
          </ProtectedRoute>
        } />
        
        <Route path="/transportation/new" element={
          <ProtectedRoute>
            <TransportationForm />
          </ProtectedRoute>
        } />
        
        <Route path="/transportation/:id/edit" element={
          <ProtectedRoute>
            <TransportationForm />
          </ProtectedRoute>
        } />
        
        {/* 住宿管理路由 */}
        <Route path="/accommodation" element={
          <ProtectedRoute>
            <Accommodation />
          </ProtectedRoute>
        } />
        
        <Route path="/accommodation/new" element={
          <ProtectedRoute>
            <AccommodationForm />
          </ProtectedRoute>
        } />
        
        <Route path="/accommodation/:id" element={
          <ProtectedRoute>
            <AccommodationDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/accommodation/:id/edit" element={
          <ProtectedRoute>
            <AccommodationForm />
          </ProtectedRoute>
        } />
        
        {/* 餐飲管理路由 */}
        <Route path="/meals" element={
          <ProtectedRoute>
            <Meal />
          </ProtectedRoute>
        } />
        
        <Route path="/meals/new" element={
          <ProtectedRoute>
            <MealForm />
          </ProtectedRoute>
        } />
        
        <Route path="/meals/:id" element={
          <ProtectedRoute>
            <MealDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/meals/:id/edit" element={
          <ProtectedRoute>
            <MealForm />
          </ProtectedRoute>
        } />
        
        {/* 證件管理路由 */}
        <Route path="/documents" element={
          <ProtectedRoute>
            <Document />
          </ProtectedRoute>
        } />
        
        <Route path="/documents/:type/new" element={
          <ProtectedRoute>
            <DocumentForm />
          </ProtectedRoute>
        } />
        
        <Route path="/documents/:type/:id" element={
          <ProtectedRoute>
            <DocumentDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/documents/:type/:id/edit" element={
          <ProtectedRoute>
            <DocumentForm />
          </ProtectedRoute>
        } />
        
        {/* 用戶管理路由 */}
        <Route path="/admin/users" element={
          <AdminRoute>
            <UserList />
          </AdminRoute>
        } />
        
        <Route path="/admin/users/new" element={
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        } />
        
        <Route path="/admin/users/:id/edit" element={
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        } />
        
        <Route path="/admin/users/:id" element={
          <AdminRoute>
            <UserDetail />
          </AdminRoute>
        } />
        
        {/* 個人資料路由 */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* 預算管理路由 */}
        <Route path="/budgets" element={
          <ProtectedRoute>
            <Budget />
          </ProtectedRoute>
        } />
        
        <Route path="/budgets/new" element={
          <ProtectedRoute>
            <BudgetForm />
          </ProtectedRoute>
        } />
        
        <Route path="/budgets/:id/edit" element={
          <ProtectedRoute>
            <BudgetForm />
          </ProtectedRoute>
        } />
        
        <Route path="/budgets/:budgetId/expenses" element={
          <ProtectedRoute>
            <ExpenseList />
          </ProtectedRoute>
        } />
        
        <Route path="/budgets/:budgetId/analysis" element={
          <ProtectedRoute>
            <BudgetAnalysis />
          </ProtectedRoute>
        } />
        
        <Route path="/expenses/new" element={
          <ProtectedRoute>
            <ExpenseForm />
          </ProtectedRoute>
        } />
        
        <Route path="/expenses/:id/edit" element={
          <ProtectedRoute>
            <ExpenseForm />
          </ProtectedRoute>
        } />
        
        {/* 旅遊花絮路由 */}
        <Route path="/moments" element={
          <ProtectedRoute>
            <TravelMoments />
          </ProtectedRoute>
        } />
        <Route path="/moments/album/:albumId" element={
          <ProtectedRoute>
            <MomentAlbum />
          </ProtectedRoute>
        } />
        
        {/* 注意事項路由 */}
        <Route path="/notes" element={
          <ProtectedRoute>
            <TravelNotes />
          </ProtectedRoute>
        } />
        
        <Route path="/notes/new" element={
          <ProtectedRoute>
            <TravelNoteForm />
          </ProtectedRoute>
        } />
        
        <Route path="/notes/:id" element={
          <ProtectedRoute>
            <TravelNoteDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/notes/:id/edit" element={
          <ProtectedRoute>
            <TravelNoteForm />
          </ProtectedRoute>
        } />
        
        {/* 舊的照片路由重定向到新的花絮路由 */}
        <Route path="/photos" element={<Navigate replace to="/moments" />} />
        <Route path="/photos/*" element={<Navigate replace to="/moments" />} />
        
        {/* 默認路由 */}
        <Route path="/" element={<Navigate replace to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
