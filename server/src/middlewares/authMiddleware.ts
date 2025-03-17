import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

interface TokenPayload {
  id: string;
  role: string;
}

// 擴展 Express Request 類型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // 從 Authorization 頭獲取 token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: '未授權訪問，請先登入' });
    return;
  }

  try {
    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

    // 檢查用戶是否存在
    const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      res.status(401).json({ message: '用戶不存在或已被刪除' });
      return;
    }

    // 將用戶信息添加到請求對象
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('驗證 token 時出錯:', error);
    res.status(401).json({ message: 'Token 無效或已過期，請重新登入' });
  }
};

// 管理員權限中間件
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: '需要管理員權限' });
    return;
  }
  
  next();
};
