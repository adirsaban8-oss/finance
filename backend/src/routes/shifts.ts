import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getShifts, createShift, updateShift, deleteShift, getShiftSummary } from '../controllers/shiftController';

const router = Router();

router.use(authMiddleware);

router.get('/summary', getShiftSummary);
router.get('/', getShifts);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

export default router;
