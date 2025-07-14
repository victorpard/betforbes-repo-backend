import prisma from '../../lib/prisma'
import Decimal from 'decimal.js'
import { RevenueType } from '@prisma/client'

class WithdrawService {
  /**
   * Processa um saque: debita o saldo, cria RevenueEvent e CommissionEvent.
   */
  async withdraw(userId: string, amount: number): Promise<{ success: boolean }> {
    // 1) Debitar o saldo do usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    })

    // 2% sobre o valor do saque
    const withdrawalFee = new Decimal(amount).times(0.02)

    // 2) Grava evento de receita da casa
    const revenue = await prisma.revenueEvent.create({
      data: {
        userId,
        type: RevenueType.WITHDRAWAL_FEE,
        amount: withdrawalFee.toString(),
      },
    })

    // 3) Se o usuário tiver um referrer, grava evento de comissão (10% da fee)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referrerId: true },
    })

    if (user?.referrerId) {
      await prisma.commissionEvent.create({
        data: {
          affiliateId: user.referrerId,
          revenueEventId: revenue.id,
          amount: withdrawalFee.times(0.1).toString(),
        },
      })
    }

    return { success: true }
  }
}

export default new WithdrawService()
