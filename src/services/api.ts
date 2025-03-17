import axios from 'axios';

// 創建 axios 實例，支援開發和生產環境
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加 token 到請求頭
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 響應攔截器 - 處理錯誤和刷新 token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 處理 401 未授權錯誤 - 可能需要刷新 token 或登出
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 如果有實現 refresh token 可以在這裡添加
      // 若刷新 token 失敗，則登出用戶
      try {
        // 這裡可以實現刷新 token 的邏輯
        // const refreshToken = localStorage.getItem('refreshToken');
        // const response = await axios.post(`${baseURL}/users/refreshToken`, { refreshToken });
        // localStorage.setItem('token', response.data.token);
        // originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        // return api(originalRequest);
        
        // 暫時直接登出
        localStorage.removeItem('token');
        window.location.href = '/login';
      } catch (_) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// User API 服務
export const userAPI = {
  register: (data: { username: string; email: string; password: string }) => 
    api.post('/users/register', data),
  
  login: (data: { email: string; password: string }) => 
    api.post('/users/login', data),
  
  getProfile: () => 
    api.get('/users/profile'),
  
  updateProfile: (data: any) => 
    api.put('/users/profile', data)
};

// Trip API 服務
export const tripAPI = {
  getTrips: () => 
    api.get('/trips'),
  
  getTripById: (id: string) => 
    api.get(`/trips/${id}`),
  
  createTrip: (data: any) => 
    api.post('/trips', data),
  
  updateTrip: (id: string, data: any) => 
    api.put(`/trips/${id}`, data),
  
  deleteTrip: (id: string) => 
    api.delete(`/trips/${id}`),
  
  getTripStats: () => 
    api.get('/trips/stats')
};

// Photo API 服務
export const photoAPI = {
  uploadPhoto: (formData: FormData) => 
    api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  getTripPhotos: (tripId: string) => 
    api.get(`/photos/trip/${tripId}`),
  
  deletePhoto: (id: string) => 
    api.delete(`/photos/${id}`)
};

export default api;
