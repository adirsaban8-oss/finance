import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getSalaries, createSalary, updateSalary, deleteSalary } from '../controllers/salaryController';

const router = Router();

router.use(authMiddleware);

router.get('/', getSalaries);
router.post('/', createSalary);
router.put('/:id', updateSalary);
router.delete('/:id', deleteSalary);

export default router;
