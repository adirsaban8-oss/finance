import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getPasswords, createPassword, updatePassword, deletePassword } from '../controllers/passwordController';

const router = Router();

router.use(authMiddleware);

router.get('/', getPasswords);
router.post('/', createPassword);
router.put('/:id', updatePassword);
router.delete('/:id', deletePassword);

export default router;
