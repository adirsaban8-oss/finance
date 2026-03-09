import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getDashboard, exportExpenses } from '../controllers/dashboardController';

const router = Router();

router.use(authMiddleware);

router.get('/', getDashboard);
router.get('/export', exportExpenses);

export default router;
