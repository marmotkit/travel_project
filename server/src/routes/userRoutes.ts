import express, { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile
} from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// 公開路由
// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// 需要認證的路由
// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateUserProfile);

export default router;
