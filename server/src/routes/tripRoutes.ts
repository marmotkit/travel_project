import express from 'express';
import { 
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripStats
} from '../controllers/tripController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// 所有路由都需要認證
router.use(protect);

router.route('/')
  .get(getTrips)
  .post(createTrip);

router.route('/stats')
  .get(getTripStats);

router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

export default router;
