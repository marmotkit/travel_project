import React, { useEffect, useState, createContext } from 'react';
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
import SystemSettings from './pages/SystemSettings';
import Analytics from './pages/Analytics';
import MapTest from './pages/MapTest';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 路由保護組件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // 使用 AuthContext 替代直接檢查 localStorage
  const { isAuthenticated, checkAuth } = useAuth();
  
  // 確保認證狀態是最新的
  const isLoggedIn = checkAuth();
  
  if (!isLoggedIn) {
    // 用戶未登入，重定向到登入頁面
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 管理員路由保護組件
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  // 使用 AuthContext 替代直接檢查 localStorage
  const { isAuthenticated, isAdmin, checkAuth } = useAuth();
  
  // 確保認證狀態是最新的
  const isLoggedIn = checkAuth();
  
  if (!isLoggedIn) {
    // 用戶未登入，重定向到登入頁面
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    // 非管理員用戶，重定向到儀表板頁面
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
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
            destination: '東京, 日本',
            startDate: '2023-08-15',
            endDate: '2023-08-20',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc',
            members: ['1', '2'],
            coordinates: [139.6917, 35.6895],
            type: '休閒',
            transport: '飛機',
            accommodation: '酒店',
            memberCount: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: '峇里島度假',
            description: '在美麗的峇里島放鬆身心，享受陽光與海灘',
            destination: '峇里島, 印尼',
            startDate: '2023-09-10',
            endDate: '2023-09-17',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
            members: ['1', '3'],
            coordinates: [115.1889, -8.4095],
            type: '度假',
            transport: '飛機',
            accommodation: '度假村',
            memberCount: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: '台北週末行',
            description: '短暫的台北之旅，品嚐美食，探索城市',
            destination: '台北, 台灣',
            startDate: '2023-06-02',
            endDate: '2023-06-04',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1517030330234-94c4fb948ebc',
            members: ['1'],
            coordinates: [121.5654, 25.0330],
            type: '美食',
            transport: '高鐵',
            accommodation: '民宿',
            memberCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '4',
            title: '香港三日遊',
            description: '發現香港的獨特魅力和美食文化',
            destination: '香港, 中國',
            startDate: '2023-10-20',
            endDate: '2023-10-23',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1536599424071-7a534a0b6a83',
            members: ['1', '2', '3'],
            coordinates: [114.1694, 22.3193],
            type: '城市探索',
            transport: '飛機',
            accommodation: '酒店',
            memberCount: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '5',
            title: '京都文化之旅',
            description: '探索日本傳統文化和歷史景點',
            destination: '京都, 日本',
            startDate: '2023-11-15',
            endDate: '2023-11-20',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
            members: ['1'],
            coordinates: [135.7681, 35.0116],
            type: '文化',
            transport: '飛機',
            accommodation: '傳統旅館',
            memberCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '6',
            title: '新加坡城市探索',
            description: '發現新加坡的現代建築和多元文化',
            destination: '新加坡, 新加坡',
            startDate: '2024-01-05',
            endDate: '2024-01-10',
            status: 'upcoming',
            coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd',
            members: ['1', '2'],
            coordinates: [103.8198, 1.3521],
            type: '城市探索',
            transport: '飛機',
            accommodation: '酒店',
            memberCount: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '7',
            title: '沖繩海灘度假',
            description: '在沖繩的美麗海灘放鬆和享受海洋活動',
            destination: '沖繩, 日本',
            startDate: '2023-07-10',
            endDate: '2023-07-16',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f',
            members: ['1', '3'],
            coordinates: [127.6809, 26.2124],
            type: '度假',
            transport: '飛機',
            accommodation: '度假村',
            memberCount: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '8',
            title: '首爾美食探索',
            description: '探索韓國首爾的美食和文化',
            destination: '首爾, 韓國',
            startDate: '2023-04-12',
            endDate: '2023-04-17',
            status: 'completed',
            coverImage: 'https://images.unsplash.com/photo-1538485399081-7a534a0b6a83',
            members: ['1', '2'],
            coordinates: [126.9780, 37.5665],
            type: '美食',
            transport: '飛機',
            accommodation: '公寓',
            memberCount: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
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

      // 費用數據初始化
      if (!localStorage.getItem('expenses')) {
        const defaultExpenses = [
          {
            id: '1',
            tripId: '1',
            category: '交通',
            title: '機票',
            amount: 15000,
            currency: 'TWD',
            date: '2023-08-01',
            notes: '來回機票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            tripId: '1',
            category: '住宿',
            title: '東京酒店',
            amount: 25000,
            currency: 'TWD',
            date: '2023-08-02',
            notes: '四星級酒店，5晚',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            tripId: '1',
            category: '餐飲',
            title: '餐費',
            amount: 12000,
            currency: 'TWD',
            date: '2023-08-15',
            notes: '所有餐費總和',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '4',
            tripId: '1',
            category: '景點',
            title: '門票',
            amount: 5000,
            currency: 'TWD',
            date: '2023-08-16',
            notes: '各景點門票總和',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '5',
            tripId: '1',
            category: '購物',
            title: '伴手禮',
            amount: 8000,
            currency: 'TWD',
            date: '2023-08-19',
            notes: '紀念品和禮物',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '6',
            tripId: '2',
            category: '交通',
            title: '機票',
            amount: 20000,
            currency: 'TWD',
            date: '2023-09-01',
            notes: '來回機票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '7',
            tripId: '2',
            category: '住宿',
            title: '峇里島度假村',
            amount: 35000,
            currency: 'TWD',
            date: '2023-09-02',
            notes: '全包式度假村，7晚',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '8',
            tripId: '2',
            category: '餐飲',
            title: '餐費',
            amount: 15000,
            currency: 'TWD',
            date: '2023-09-10',
            notes: '所有餐費總和',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '9',
            tripId: '2',
            category: '活動',
            title: '水上活動',
            amount: 10000,
            currency: 'TWD',
            date: '2023-09-12',
            notes: '潛水和衝浪',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '10',
            tripId: '2',
            category: '其他',
            title: 'SPA',
            amount: 8000,
            currency: 'TWD',
            date: '2023-09-15',
            notes: '按摩和SPA',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '11',
            tripId: '3',
            category: '交通',
            title: '高鐵票',
            amount: 3000,
            currency: 'TWD',
            date: '2023-06-01',
            notes: '來回高鐵票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '12',
            tripId: '3',
            category: '住宿',
            title: '台北民宿',
            amount: 4000,
            currency: 'TWD',
            date: '2023-06-01',
            notes: '兩晚住宿',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '13',
            tripId: '3',
            category: '餐飲',
            title: '夜市小吃',
            amount: 2000,
            currency: 'TWD',
            date: '2023-06-02',
            notes: '各種夜市美食',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '14',
            tripId: '3',
            category: '購物',
            title: '伴手禮',
            amount: 1500,
            currency: 'TWD',
            date: '2023-06-03',
            notes: '台北特產',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '15',
            tripId: '4',
            category: '交通',
            title: '機票',
            amount: 8000,
            currency: 'TWD',
            date: '2023-10-01',
            notes: '香港來回機票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '16',
            tripId: '4',
            category: '住宿',
            title: '香港酒店',
            amount: 12000,
            currency: 'TWD',
            date: '2023-10-05',
            notes: '三晚住宿',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '17',
            tripId: '4',
            category: '餐飲',
            title: '點心和餐廳',
            amount: 9000,
            currency: 'TWD',
            date: '2023-10-20',
            notes: '各種美食',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '18',
            tripId: '4',
            category: '景點',
            title: '主題公園',
            amount: 6000,
            currency: 'TWD',
            date: '2023-10-21',
            notes: '迪士尼門票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '19',
            tripId: '4',
            category: '購物',
            title: '購物',
            amount: 15000,
            currency: 'TWD',
            date: '2023-10-22',
            notes: '各種商店購物',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '20',
            tripId: '5',
            category: '交通',
            title: '機票',
            amount: 16000,
            currency: 'TWD',
            date: '2023-11-01',
            notes: '京都來回機票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '21',
            tripId: '5',
            category: '住宿',
            title: '京都傳統旅館',
            amount: 20000,
            currency: 'TWD',
            date: '2023-11-05',
            notes: '五晚住宿',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '22',
            tripId: '5',
            category: '餐飲',
            title: '傳統料理',
            amount: 10000,
            currency: 'TWD',
            date: '2023-11-15',
            notes: '各種日本料理',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '23',
            tripId: '5',
            category: '景點',
            title: '寺廟參觀',
            amount: 3000,
            currency: 'TWD',
            date: '2023-11-16',
            notes: '各寺廟門票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '24',
            tripId: '5',
            category: '購物',
            title: '傳統工藝品',
            amount: 8000,
            currency: 'TWD',
            date: '2023-11-19',
            notes: '和服和茶具',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '25',
            tripId: '7',
            category: '交通',
            title: '機票',
            amount: 12000,
            currency: 'TWD',
            date: '2023-07-01',
            notes: '沖繩來回機票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '26',
            tripId: '7',
            category: '住宿',
            title: '沖繩度假村',
            amount: 30000,
            currency: 'TWD',
            date: '2023-07-02',
            notes: '六晚住宿',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '27',
            tripId: '7',
            category: '餐飲',
            title: '餐費',
            amount: 15000,
            currency: 'TWD',
            date: '2023-07-10',
            notes: '各種美食',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '28',
            tripId: '7',
            category: '活動',
            title: '海上活動',
            amount: 8000,
            currency: 'TWD',
            date: '2023-07-12',
            notes: '潛水和帆船',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '29',
            tripId: '8',
            category: '交通',
            title: '機票',
            amount: 10000,
            currency: 'TWD',
            date: '2023-04-01',
            notes: '首爾來回機票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '30',
            tripId: '8',
            category: '住宿',
            title: '首爾公寓',
            amount: 15000,
            currency: 'TWD',
            date: '2023-04-02',
            notes: '五晚住宿',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '31',
            tripId: '8',
            category: '餐飲',
            title: '韓式料理',
            amount: 12000,
            currency: 'TWD',
            date: '2023-04-12',
            notes: '各種韓國美食',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '32',
            tripId: '8',
            category: '景點',
            title: '景點門票',
            amount: 5000,
            currency: 'TWD',
            date: '2023-04-13',
            notes: '各景點門票',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '33',
            tripId: '8',
            category: '購物',
            title: '購物',
            amount: 18000,
            currency: 'TWD',
            date: '2023-04-15',
            notes: '化妝品和服飾',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
        localStorage.setItem('expenses', JSON.stringify(defaultExpenses));
      }
    };

    initializeAppData();
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
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
            
            {/* 系統設定路由 */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <SystemSettings />
              </ProtectedRoute>
            } />
            
            {/* 報表分析路由 */}
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            
            <Route path="/map-test" element={
              <ProtectedRoute>
                <MapTest />
              </ProtectedRoute>
            } />
            
            {/* 舊的照片路由重定向到新的花絮路由 */}
            <Route path="/photos" element={<Navigate replace to="/moments" />} />
            <Route path="/photos/*" element={<Navigate replace to="/moments" />} />
            
            {/* 默認路由 */}
            <Route path="/" element={<Navigate replace to="/login" />} />
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
