import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middlewares/errorHandler';
// CORREÇÃO 1: Importa a CLASSE 'PriceService' com 'P' maiúsculo.
import { PriceService } from './price.service';
import { logger } from '../../utils/logger';

const router = Router();
// CORREÇÃO 2: Cria uma nova instância do serviço para ser usada abaixo.
const priceService = new PriceService();

/**
 * @swagger
 * /api/price:
 *   get:
 *     summary: Retorna o preço atual de um símbolo
 *     tags: [Preço]
 *     parameters:
 *       - in: query
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Símbolo no formato 'BTC-USDT' ou 'BTC/USDT'
 *     responses:
 *       200:
 *         description: Preço buscado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                       example: BTC-USDC
 *                     price:
 *                       type: number
 *                       format: float
 *                       example: 100.0
 *       400:
 *         description: Parâmetro inválido ou ausente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno ao buscar preço
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const symbol = String(req.query.symbol || '').trim();
    if (!symbol) {
      throw createError('Parâmetro "symbol" é obrigatório', 400, 'MISSING_SYMBOL');
    }

    try {
      // A linha abaixo agora funciona porque 'priceService' é uma instância válida.
      const price = await priceService.fetchCurrentPrice(symbol);
      return res.json({
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          price,
        },
      });
    } catch (err: any) {
      logger.error('🛑 Erro em PriceService.fetchCurrentPrice', {
        symbol,
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack,
      });
      throw createError(
        `Falha ao buscar preço para ${symbol.toUpperCase()}`,
        err.response?.status ?? 500,
        'PRICE_ERROR'
      );
    }
  })
);

export default router;
