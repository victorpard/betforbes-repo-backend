import prisma from '../../lib/prisma';
import { PriceService } from '../price/price.service';
import { Order, RevenueType } from '@prisma/client';
import Decimal from 'decimal.js';

class BetsService {
  private priceService: PriceService;

  constructor() {
    this.priceService = new PriceService();
  }

  /** Retorna o preço atual de um ativo, normalizando o símbolo para o PriceService */
  async fetchCurrentPrice(asset: string): Promise<number> {
    const normalized = asset.replace(/[-\/]/g, '').toUpperCase();
    return this.priceService.fetchCurrentPrice(normalized);
  }

  /** Cria uma nova ordem de aposta */
  async create(data: {
    userId: string;
    asset: string;
    type: string;
    amount: number;
    leverage: number;
    direction: string;
  }): Promise<Order> {
    const entryPrice = await this.fetchCurrentPrice(data.asset);

    const orderWithUser = await prisma.order.create({
      data: {
        userId: data.userId,
        asset: data.asset,
        type: data.type,
        amount: data.amount,
        leverage: data.leverage,
        direction: data.direction,
        entryPrice,
        status: 'OPEN',
      },
      include: {
        user: { select: { referrerId: true } },
      },
    });

    const leverageFee = new Decimal(orderWithUser.amount)
      .times(orderWithUser.leverage)
      .times(0.02);

    const revenue = await prisma.revenueEvent.create({
      data: {
        userId: orderWithUser.userId,
        type: RevenueType.LEVERAGE_FEE,
        amount: leverageFee.toString(),
        orderId: orderWithUser.id,
      },
    });

    if (orderWithUser.user.referrerId) {
      await prisma.commissionEvent.create({
        data: {
          affiliateId: orderWithUser.user.referrerId,
          revenueEventId: revenue.id,
          amount: leverageFee.times(0.1).toString(),
        },
      });
    }

    return orderWithUser;
  }

  /** Lista todas as ordens de um usuário */
  async list(userId: string): Promise<Order[]> {
    return prisma.order.findMany({ where: { userId } });
  }

  /** Fecha uma ordem existente */
  async close(userId: string, orderId: string): Promise<Order> {
    // Busca a ordem existente para obter os dados necessários
    const existing = await prisma.order.findUnique({
      where: { id: orderId, userId: userId }, // Garante que o usuário só pode fechar suas próprias ordens
      include: { user: { select: { referrerId: true } } },
    });

    // Se a ordem não existir ou já estiver fechada, lança um erro
    if (!existing || existing.status !== 'OPEN') {
      throw new Error('Ordem não encontrada ou já está fechada.');
    }

    // Busca o preço de saída atual do ativo
    const exitPrice = await this.fetchCurrentPrice(existing.asset);

    // Calcula o lucro ou prejuízo (Profit/Loss)
    const profit = new Decimal(exitPrice)
      .minus(existing.entryPrice)
      .times(existing.amount)
      .times(existing.leverage);

    // Atualiza a ordem no banco de dados, fechando-a
    const closedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        exitPrice,
        status: 'CLOSED',
        profitLoss: profit.toString(),
      },
    });

    // Se houve lucro (profit > 0), calcula e registra a taxa de performance
    if (profit.gt(0)) {
      const profitFee = profit.times(0.05); // 5% de taxa sobre o lucro
      const revenue = await prisma.revenueEvent.create({
        data: {
          userId,
          type: RevenueType.PROFIT_FEE,
          amount: profitFee.toString(),
          orderId: closedOrder.id,
        },
      });

      // Se o usuário tiver um afiliado, paga a comissão sobre a taxa
      if (existing.user.referrerId) {
        await prisma.commissionEvent.create({
          data: {
            affiliateId: existing.user.referrerId,
            revenueEventId: revenue.id,
            amount: profitFee.times(0.1).toString(), // 10% da taxa de lucro
          },
        });
      }
    }

    return closedOrder;
  }
}

export const betsService = new BetsService();
