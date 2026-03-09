import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getBudgets, createOrUpdateBudget, getBudgetStatus } from '../controllers/budgetController';

const router = Router();

router.use(authMiddleware);

router.get('/status', getBudgetStatus);
router.get('/', getBudgets);
router.post('/', createOrUpdateBudget);

export default router;
