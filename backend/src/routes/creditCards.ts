import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  getCreditCards,
  createCreditCard,
  deleteCreditCard,
  addCharge,
  updateCharge,
  deleteCharge,
  getUpcomingCharges,
} from '../controllers/creditCardController';

const router = Router();

router.use(authMiddleware);

router.get('/', getCreditCards);
router.post('/', createCreditCard);
router.delete('/:id', deleteCreditCard);
router.post('/:cardId/charges', addCharge);

export default router;

// These routes are mounted separately for credit-charges
export const creditChargesRouter = Router();
creditChargesRouter.use(authMiddleware);
creditChargesRouter.get('/upcoming', getUpcomingCharges);
creditChargesRouter.put('/:id', updateCharge);
creditChargesRouter.delete('/:id', deleteCharge);
