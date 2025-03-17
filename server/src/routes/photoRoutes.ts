import express, { Router } from 'express';
import { 
  uploadPhoto,
  getTripPhotos,
  deletePhoto,
  getPhotoById,
  upload as photoUpload
} from '../controllers/photoController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// 所有路由都需要認證
// 使用 photoController 提供的 multer 設置
// @route   POST /api/photos/upload
// @desc    Upload a new photo
// @access  Private
router.post('/upload', protect, photoUpload.single('photo'), uploadPhoto);

// @route   GET /api/photos/trip/:tripId
// @desc    Get all photos for a trip
// @access  Private
router.get('/trip/:tripId', protect, getTripPhotos);

// @route   GET /api/photos/:id
// @desc    Get photo by ID
// @access  Private
router.get('/:id', protect, getPhotoById);

// @route   DELETE /api/photos/:id
// @desc    Delete a photo
// @access  Private
router.delete('/:id', protect, deletePhoto);

export default router;
