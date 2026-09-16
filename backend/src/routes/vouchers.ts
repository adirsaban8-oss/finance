import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  getVouchers,
  getVoucherUsages,
  createVoucher,
  updateVoucher,
  useVoucher,
  deleteVoucher,
} from '../controllers/voucherController';

const router = Router();

router.use(authMiddleware);

router.get('/', getVouchers);
router.post('/', createVoucher);
router.get('/:id/usages', getVoucherUsages);
router.post('/:id/use', useVoucher);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);

export default router;
