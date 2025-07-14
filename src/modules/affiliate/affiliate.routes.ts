import { Router } from 'express';
import affiliateController from './affiliate.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// GET /api/affiliates/earnings
router.get('/earnings', authenticateToken, affiliateController.getEarnings);

export default router;
