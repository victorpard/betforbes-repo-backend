import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middlewares/auth';
import { betsService } from './bets.service';
import prisma from '../../lib/prisma';

const router = Router();

router.get(
  '/',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const orders = await betsService.list(userId);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      return res.json({
        success: true,
        data: { orders, balance: user?.balance ?? 0 },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post(
  '/',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const order = await betsService.create({ userId, ...req.body });
      return res.json({ success: true, data: order });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
);

router.post(
  '/:id/close',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const updated = await betsService.close(userId, req.params.id!);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
);

export default router;
