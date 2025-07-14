import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middlewares/auth';
import { asyncHandler } from '../../middlewares/errorHandler';
import { betsService } from './bets.service';
import prisma from '../../lib/prisma';

const router = Router();

/**
 * GET /api/bets/
 * Lista todas as ordens do usuário autenticado
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const orders = await betsService.list(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    res.json({
      success: true,
      data: {
        orders,
        balance: user?.balance ?? 0,
      },
    });
  })
);

/**
 * POST /api/bets/
 * Cria uma nova ordem
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const order = await betsService.create({
      userId,
      asset: req.body.asset,
      type: req.body.type,
      amount: req.body.amount,
      leverage: req.body.leverage,
      direction: req.body.direction,
    });
    res.json({ success: true, data: order });
  })
);

/**
 * POST /api/bets/:id/close
 * Fecha uma ordem existente
 */
router.post(
  '/:id/close',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    // Asserção de que 'id' não é undefined
    const orderId = req.params.id!;
    const closed = await betsService.close(userId, orderId);
    res.json({ success: true, data: closed });
  })
);

export default router;
