import { Request, Response } from 'express';
import db from '../config/db';
import * as azureStorage from '../services/azureStorageService';

// @desc   獲取用戶的所有旅行計劃
// @route  GET /api/trips
// @access Private
export const getTrips = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: '未授權' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('獲取旅行計劃時出錯:', error);
    res.status(500).json({ message: '無法獲取旅行計劃' });
  }
};

// @desc   獲取單個旅行計劃詳情
// @route  GET /api/trips/:id
// @access Private
export const getTripById = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: '未授權' });
  }

  const tripId = req.params.id;

  try {
    // 獲取旅行計劃基本信息
    const tripResult = await db.query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: '未找到旅行計劃' });
    }

    const trip = tripResult.rows[0];

    // 獲取行程信息
    const itinerariesResult = await db.query(
      'SELECT * FROM itineraries WHERE trip_id = $1 ORDER BY day_number ASC',
      [tripId]
    );

    // 獲取活動信息
    const activitiesPromises = itinerariesResult.rows.map(async (itinerary) => {
      const activitiesResult = await db.query(
        'SELECT * FROM activities WHERE itinerary_id = $1 ORDER BY start_time ASC',
        [itinerary.id]
      );
      return {
        ...itinerary,
        activities: activitiesResult.rows
      };
    });

    const itinerariesWithActivities = await Promise.all(activitiesPromises);

    // 獲取住宿信息
    const accommodationsResult = await db.query(
      'SELECT * FROM accommodations WHERE trip_id = $1 ORDER BY check_in_date ASC',
      [tripId]
    );

    // 獲取交通信息
    const transportationsResult = await db.query(
      'SELECT * FROM transportations WHERE trip_id = $1 ORDER BY departure_time ASC',
      [tripId]
    );

    // 獲取照片信息
    const photosResult = await db.query(
      'SELECT * FROM photos WHERE trip_id = $1 ORDER BY taken_at DESC',
      [tripId]
    );

    res.json({
      ...trip,
      itineraries: itinerariesWithActivities,
      accommodations: accommodationsResult.rows,
      transportations: transportationsResult.rows,
      photos: photosResult.rows
    });
  } catch (error) {
    console.error('獲取旅行計劃詳情時出錯:', error);
    res.status(500).json({ message: '無法獲取旅行計劃詳情' });
  }
};

// @desc   創建新旅行計劃
// @route  POST /api/trips
// @access Private
export const createTrip = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: '未授權' });
  }

  const { 
    title, 
    destination, 
    country, 
    start_date, 
    end_date, 
    description,
    type,
    coordinates
  } = req.body;

  if (!title || !destination || !start_date || !end_date) {
    return res.status(400).json({ message: '請提供所有必填字段' });
  }

  try {
    const result = await db.query(
      `INSERT INTO trips 
      (user_id, title, destination, country, start_date, end_date, description, type, coordinates) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        req.user.id, 
        title, 
        destination, 
        country, 
        start_date, 
        end_date, 
        description || null,
        type || null,
        coordinates || null
      ]
    );

    const trip = result.rows[0];

    // 自動創建行程（根據旅行天數）
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      await db.query(
        'INSERT INTO itineraries (trip_id, day_number, date, description) VALUES ($1, $2, $3, $4)',
        [trip.id, i + 1, currentDate, `第 ${i + 1} 天`]
      );
    }

    res.status(201).json(trip);
  } catch (error) {
    console.error('創建旅行計劃時出錯:', error);
    res.status(500).json({ message: '無法創建旅行計劃' });
  }
};

// @desc   更新旅行計劃
// @route  PUT /api/trips/:id
// @access Private
export const updateTrip = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: '未授權' });
  }

  const tripId = req.params.id;
  const { 
    title, 
    destination, 
    country, 
    start_date, 
    end_date, 
    description,
    status,
    type,
    coordinates
  } = req.body;

  try {
    // 確認旅行計劃存在且屬於該用戶
    const checkResult = await db.query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: '未找到旅行計劃或無權限更新' });
    }

    const updateQuery = `
      UPDATE trips 
      SET title = $1, destination = $2, country = $3, start_date = $4, end_date = $5, 
          description = $6, status = $7, type = $8, coordinates = $9, updated_at = NOW()
      WHERE id = $10 AND user_id = $11
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      title || checkResult.rows[0].title,
      destination || checkResult.rows[0].destination,
      country || checkResult.rows[0].country,
      start_date || checkResult.rows[0].start_date,
      end_date || checkResult.rows[0].end_date,
      description !== undefined ? description : checkResult.rows[0].description,
      status || checkResult.rows[0].status,
      type !== undefined ? type : checkResult.rows[0].type,
      coordinates !== undefined ? coordinates : checkResult.rows[0].coordinates,
      tripId,
      req.user.id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('更新旅行計劃時出錯:', error);
    res.status(500).json({ message: '無法更新旅行計劃' });
  }
};

// @desc   刪除旅行計劃
// @route  DELETE /api/trips/:id
// @access Private
export const deleteTrip = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: '未授權' });
  }

  const tripId = req.params.id;

  try {
    // 確認旅行計劃存在且屬於該用戶
    const checkResult = await db.query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: '未找到旅行計劃或無權限刪除' });
    }

    // 獲取與此旅行計劃相關的照片
    const photosResult = await db.query(
      'SELECT * FROM photos WHERE trip_id = $1',
      [tripId]
    );

    // 刪除 Azure Blob Storage 中的照片
    for (const photo of photosResult.rows) {
      try {
        await azureStorage.deleteFile(photo.azure_url);
      } catch (error) {
        console.error(`無法刪除照片 ${photo.id} 的 Azure Blob: ${error}`);
        // 繼續刪除其他照片，不中斷流程
      }
    }

    // 刪除旅行計劃（級聯刪除相關記錄）
    await db.query(
      'DELETE FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    res.json({ message: '旅行計劃已成功刪除' });
  } catch (error) {
    console.error('刪除旅行計劃時出錯:', error);
    res.status(500).json({ message: '無法刪除旅行計劃' });
  }
};

// @desc   獲取旅行統計信息
// @route  GET /api/trips/stats
// @access Private
export const getTripStats = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: '未授權' });
  }

  try {
    // 獲取旅行總數
    const totalTripsResult = await db.query(
      'SELECT COUNT(*) FROM trips WHERE user_id = $1',
      [req.user.id]
    );
    
    // 獲取已完成旅行數量
    const completedTripsResult = await db.query(
      "SELECT COUNT(*) FROM trips WHERE user_id = $1 AND status = 'completed'",
      [req.user.id]
    );
    
    // 獲取計劃中旅行數量
    const plannedTripsResult = await db.query(
      "SELECT COUNT(*) FROM trips WHERE user_id = $1 AND status = 'planning'",
      [req.user.id]
    );
    
    // 獲取訪問的國家/地區數量
    const countriesResult = await db.query(
      'SELECT DISTINCT country FROM trips WHERE user_id = $1 AND country IS NOT NULL',
      [req.user.id]
    );
    
    // 獲取訪問的城市數量
    const citiesResult = await db.query(
      'SELECT DISTINCT destination FROM trips WHERE user_id = $1',
      [req.user.id]
    );

    // 獲取總旅行天數
    const daysResult = await db.query(
      `SELECT SUM(
        EXTRACT(DAY FROM (end_date - start_date)) + 1
      ) as total_days
      FROM trips WHERE user_id = $1`,
      [req.user.id]
    );

    // 按年度統計旅行數量
    const yearlyTripsResult = await db.query(
      `SELECT 
        EXTRACT(YEAR FROM start_date) as year,
        COUNT(*) as trip_count
      FROM trips 
      WHERE user_id = $1
      GROUP BY EXTRACT(YEAR FROM start_date)
      ORDER BY year DESC`,
      [req.user.id]
    );

    // 獲取最常訪問的國家/地區
    const popularCountriesResult = await db.query(
      `SELECT 
        country, 
        COUNT(*) as visit_count
      FROM trips 
      WHERE user_id = $1 AND country IS NOT NULL
      GROUP BY country
      ORDER BY visit_count DESC
      LIMIT 5`,
      [req.user.id]
    );

    res.json({
      total_trips: parseInt(totalTripsResult.rows[0].count),
      completed_trips: parseInt(completedTripsResult.rows[0].count),
      planned_trips: parseInt(plannedTripsResult.rows[0].count),
      countries_visited: countriesResult.rows.length,
      cities_visited: citiesResult.rows.length,
      total_travel_days: parseInt(daysResult.rows[0].total_days) || 0,
      yearly_trips: yearlyTripsResult.rows,
      popular_countries: popularCountriesResult.rows
    });
  } catch (error) {
    console.error('獲取旅行統計信息時出錯:', error);
    res.status(500).json({ message: '無法獲取旅行統計信息' });
  }
};
