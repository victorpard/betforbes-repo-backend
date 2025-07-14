import prisma from '../../lib/prisma'
import priceService from '../price/price.service'
import { Order, RevenueType } from '@prisma/client'
import Decimal from 'decimal.js'

class BetsService {
  /** Retorna o preço atual de um ativo, normalizando o símbolo para o PriceService */
  async fetchCurrentPrice(asset: string): Promise<number> {
    // Remove qualquer traço e deixa em uppercase (ex: "btc-usdc" → "BTCUSDC")
    const normalized = asset.replace(/[-\/]/g, '').toUpperCase()
    return priceService.fetchCurrentPrice(normalized)
  }

  /** Cria uma nova ordem de aposta */
  async create(data: {
    userId: string
    asset: string
    type: string
    amount: number
    leverage: number
    direction: string
  }): Promise<Order> {
    // Busca preço de entrada real
    const entryPrice = await this.fetchCurrentPrice(data.asset)

    // Cria a ordem e já carrega o referrerId do usuário
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
        user: { select: { referrerId: true } }
      }
    })

    // 2% sobre o valor alavancado
    const leverageFee = new Decimal(orderWithUser.amount)
      .times(orderWithUser.leverage)
      .times(0.02)

    // Gera o evento de receita para a casa
    const revenue = await prisma.revenueEvent.create({
      data: {
        userId: orderWithUser.userId,
        type: RevenueType.LEVERAGE_FEE,
        amount: leverageFee.toString(),
        orderId: orderWithUser.id
      }
    })

    // Se houver afiliado, gera o evento de comissão (10% do revenue)
    if (orderWithUser.user.referrerId) {
      await prisma.commissionEvent.create({
        data: {
          affiliateId: orderWithUser.user.referrerId,
          revenueEventId: revenue.id,
          amount: leverageFee.times(0.1).toString()
        }
      })
    }

    return orderWithUser
  }

  /** Lista todas as ordens de um usuário */
  async list(userId: string): Promise<Order[]> {
    return prisma.order.findMany({ where: { userId } })
  }

  /** Fecha uma ordem existente */
  async close(userId: string, orderId: string): Promise<Order> {
    // Busca a ordem com entryPrice e referrer
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { referrerId: true } } }
    })
    if (!existing) throw new Error('Ordem não encontrada')

    // Busca preço de saída real
    const exitPrice = await this.fetchCurrentPrice(existing.asset)

    // Calcula P/L simples: (exit - entry) * amount * leverage
    const profit = new Decimal(exitPrice)
      .minus(existing.entryPrice)
      .times(existing.amount)
      .times(existing.leverage)

    // Fecha a ordem e grava profitLoss
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        exitPrice,
        status: 'CLOSED',
        profitLoss: profit.toString()
      }
    })

    // Se houve lucro positivo, aplica fee de 5%
    if (profit.gt(0)) {
      const profitFee = profit.times(0.05)
      const revenue = await prisma.revenueEvent.create({
        data: {
          userId,
          type: RevenueType.PROFIT_FEE,
          amount: profitFee.toString(),
          orderId: order.id
        }
      })

      if (existing.user.referrerId) {
        await prisma.commissionEvent.create({
          data: {
            affiliateId: existing.user.referrerId,
            revenueEventId: revenue.id,
            amount: profitFee.times(0.1).toString()
          }
        })
      }
    }

    return order
  }
}

export const betsService = new BetsService()
