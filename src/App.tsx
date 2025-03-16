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
    // 初始化默認旅程數據（如果不存在）
    const trips = localStorage.getItem('trips');
    if (!trips) {
      const defaultTrips = [
        {
          id: '1',
          title: '東京五日遊',
          destination: '日本東京',
          startDate: '2023-12-15',
          endDate: '2023-12-20',
          status: 'upcoming',
          description: '期待已久的東京旅行，將會參觀多個景點並體驗當地美食。',
          budget: 50000,
          currency: 'TWD',
          categories: ['leisure', 'cultural', 'food'],
          participants: [
            { id: '101', name: '王小明', email: 'wang@example.com' },
            { id: '102', name: '李小華', email: 'lee@example.com' }
          ],
          notes: '記得帶轉接頭和保暖衣物',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: '台南三日遊',
          destination: '台灣台南',
          startDate: '2023-11-10',
          endDate: '2023-11-12',
          status: 'completed',
          description: '短暫的台南小旅行，主要是品嚐美食和參觀歷史景點。',
          budget: 8000,
          currency: 'TWD',
          categories: ['leisure', 'food'],
          participants: [
            { id: '201', name: '張小美', email: 'mei@example.com' }
          ],
          notes: '安平古堡、赤崁樓必去',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('trips', JSON.stringify(defaultTrips));
    }
    
    // 初始化默認行程數據（如果不存在）
    const itinerary = localStorage.getItem('itinerary');
    if (!itinerary) {
      const defaultItinerary = [
        {
          id: '1',
          tripId: '1', // 關聯到東京五日遊
          date: '2023-12-15',
          dayNumber: 1,
          title: '抵達東京/成田機場',
          description: '抵達東京，辦理入住手續，探索酒店周邊。',
          activities: [
            {
              id: '101',
              startTime: '14:00',
              endTime: '15:30',
              title: '成田機場抵達',
              description: '抵達成田機場，領取行李並辦理入境手續',
              location: '成田國際機場',
              address: '千葉縣成田市',
              category: 'transportation'
            },
            {
              id: '102',
              startTime: '16:00',
              endTime: '17:30',
              title: '前往酒店',
              description: '乘坐機場巴士前往東京市區酒店',
              location: '成田機場 → 東京市區',
              cost: 3000,
              currency: 'JPY',
              category: 'transportation'
            },
            {
              id: '103',
              startTime: '18:00',
              endTime: '19:30',
              title: '晚餐',
              description: '在酒店附近的拉麵店享用晚餐',
              location: '一蘭拉麵 新宿店',
              address: '東京都新宿區歌舞伎町1-22-7',
              cost: 1500,
              currency: 'JPY',
              category: 'meal',
              notes: '人氣店可能需要排隊'
            }
          ],
          accommodationId: 'a1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          tripId: '1', // 關聯到東京五日遊
          date: '2023-12-16',
          dayNumber: 2,
          title: '探索淺草和晴空塔',
          description: '參觀淺草寺和東京晴空塔，體驗傳統與現代的東京。',
          activities: [
            {
              id: '201',
              startTime: '09:00',
              endTime: '10:30',
              title: '淺草寺',
              description: '參觀東京最古老的寺廟',
              location: '淺草寺',
              address: '東京都台東區淺草2-3-1',
              cost: 0,
              currency: 'JPY',
              category: 'sightseeing',
              notes: '記得在雷門拍照'
            },
            {
              id: '202',
              startTime: '11:00',
              endTime: '12:30',
              title: '仲見世街',
              description: '在淺草寺附近的傳統購物街逛街',
              location: '仲見世街',
              address: '東京都台東區淺草1-36',
              category: 'activity'
            }
          ],
          accommodationId: 'a1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('itinerary', JSON.stringify(defaultItinerary));
    }
    
    // 初始化默認住宿數據（如果不存在）
    const accommodations = localStorage.getItem('accommodations');
    if (!accommodations) {
      const defaultAccommodations = [
        {
          id: 'a1',
          name: '東京新宿格拉斯麗酒店',
          address: '東京都新宿區西新宿2-19-12',
          checkIn: '15:00',
          checkOut: '11:00',
          price: 12000,
          currency: 'JPY',
          confirmationNumber: 'HT12345'
        }
      ];
      
      localStorage.setItem('accommodations', JSON.stringify(defaultAccommodations));
    }
    
    // 初始化默認交通數據（如果不存在）
    const transportations = localStorage.getItem('transportations');
    if (!transportations) {
      const defaultTransportations = [
        {
          id: 't1',
          type: 'flight',
          departureLocation: '台北桃園機場',
          arrivalLocation: '東京成田機場',
          departureTime: '2023-12-15T09:00:00.000Z',
          arrivalTime: '2023-12-15T13:00:00.000Z',
          referenceNumber: 'JL802',
          price: 15000,
          currency: 'TWD'
        },
        {
          id: 't2',
          type: 'flight',
          departureLocation: '東京成田機場',
          arrivalLocation: '台北桃園機場',
          departureTime: '2023-12-20T14:00:00.000Z',
          arrivalTime: '2023-12-20T17:00:00.000Z',
          referenceNumber: 'JL805',
          price: 15000,
          currency: 'TWD'
        }
      ];
      
      localStorage.setItem('transportations', JSON.stringify(defaultTransportations));
    }
    
    // 初始化默認餐飲數據（如果不存在）
    const meals = localStorage.getItem('meals');
    if (!meals) {
      const defaultMeals = [
        {
          id: 'm1',
          name: '壽司大',
          location: '東京都新宿區歌舞伎町2-25-4',
          time: '12:00',
          type: 'lunch',
          reservationInfo: '03-1234-5678',
          price: 4000,
          currency: 'JPY'
        },
        {
          id: 'm2',
          name: '燒肉王',
          location: '東京都新宿區西新宿1-12-9',
          time: '18:30',
          type: 'dinner',
          reservationInfo: '03-8765-4321',
          price: 6000,
          currency: 'JPY'
        }
      ];
      
      localStorage.setItem('meals', JSON.stringify(defaultMeals));
    }
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
