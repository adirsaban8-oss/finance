import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';

const router = Router();

router.use(authMiddleware);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
