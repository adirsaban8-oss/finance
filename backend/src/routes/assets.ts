import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getAssets, addAssetItem, updateAssetItem, deleteAssetItem } from '../controllers/assetController';

const router = Router();

router.use(authMiddleware);

router.get('/', getAssets);
router.post('/items', addAssetItem);
router.put('/items/:id', updateAssetItem);
router.delete('/items/:id', deleteAssetItem);

export default router;
