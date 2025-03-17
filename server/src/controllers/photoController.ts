import { Request, Response } from 'express';
import multer from 'multer';
import { pool } from '../config/db';
import * as azureStorage from '../services/azureStorageService';

// 配置 multer 以處理記憶體中的文件
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制 5MB
  },
  fileFilter: (_req, file, cb) => {
    // 僅接受圖片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('僅允許上傳圖片文件'));
    }
  }
});

// @desc   上傳照片到 Azure Blob Storage
// @route  POST /api/photos/upload
// @access Private
export const uploadPhoto = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: '未授權' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: '請提供照片文件' });
    return;
  }

  const { tripId, activityId, description, takenAt } = req.body;

  if (!tripId) {
    res.status(400).json({ message: '請提供旅行計劃 ID' });
    return;
  }

  try {
    // 確認旅行計劃存在且屬於該用戶
    const tripResult = await pool.query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    if (tripResult.rows.length === 0) {
      res.status(404).json({ message: '未找到旅行計劃或無權限上傳照片' });
      return;
    }

    // 上傳到 Azure Blob Storage
    const azureUrl = await azureStorage.uploadFile(req.file);

    // 儲存照片信息到數據庫
    const result = await pool.query(
      `INSERT INTO photos 
      (trip_id, activity_id, file_name, azure_url, description, taken_at) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        tripId,
        activityId || null,
        req.file.originalname,
        azureUrl,
        description || null,
        takenAt || new Date()
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('上傳照片時出錯:', error);
    res.status(500).json({ message: '上傳照片失敗' });
  }
};

// @desc   獲取旅行計劃的所有照片
// @route  GET /api/photos/trip/:tripId
// @access Private
export const getTripPhotos = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: '未授權' });
    return;
  }

  const { tripId } = req.params;

  try {
    // 確認旅行計劃存在且屬於該用戶
    const tripResult = await pool.query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    if (tripResult.rows.length === 0) {
      res.status(404).json({ message: '未找到旅行計劃或無權限查看照片' });
      return;
    }

    // 獲取照片
    const photosResult = await pool.query(
      'SELECT * FROM photos WHERE trip_id = $1 ORDER BY taken_at DESC',
      [tripId]
    );

    res.json(photosResult.rows);
  } catch (error) {
    console.error('獲取旅行照片時出錯:', error);
    res.status(500).json({ message: '獲取照片失敗' });
  }
};

// @desc   獲取照片
// @route  GET /api/photos/:id
// @access Private
export const getPhotoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const photoId = req.params.id;
    const userId = req.user?.id;

    // 獲取照片同時檢查用戶是否有權限訪問
    const result = await pool.query(
      `SELECT p.* FROM photos p 
       JOIN trips t ON p.trip_id = t.id 
       WHERE p.id = $1 AND t.user_id = $2`,
      [photoId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: '照片未找到或無權訪問' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('獲取照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取照片失敗'
    });
  }
};

// @desc   刪除照片
// @route  DELETE /api/photos/:id
// @access Private
export const deletePhoto = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: '未授權' });
    return;
  }

  const photoId = req.params.id;

  try {
    // 獲取照片信息
    const photoResult = await pool.query(
      'SELECT p.* FROM photos p JOIN trips t ON p.trip_id = t.id WHERE p.id = $1 AND t.user_id = $2',
      [photoId, req.user.id]
    );

    if (photoResult.rows.length === 0) {
      res.status(404).json({ message: '未找到照片或無權限刪除' });
      return;
    }

    const photo = photoResult.rows[0];

    // 從 Azure Blob Storage 刪除照片
    await azureStorage.deleteFile(photo.azure_url);

    // 從數據庫中刪除照片記錄
    await pool.query(
      'DELETE FROM photos WHERE id = $1',
      [photoId]
    );

    res.json({ message: '照片已成功刪除' });
  } catch (error) {
    console.error('刪除照片時出錯:', error);
    res.status(500).json({ message: '刪除照片失敗' });
  }
};
