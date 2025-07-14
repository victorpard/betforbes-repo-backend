import prisma from '../../lib/prisma';
import Decimal from 'decimal.js';

class AffiliateService {
  async getEarnings(affiliateId: string) {
    const commissions = await prisma.commissionEvent.findMany({
      where: { affiliateId },
      include: { revenueEvent: true },
      orderBy: { createdAt: 'desc' },
    });

    const total = commissions.reduce(
      (sum, c) => sum.plus(new Decimal(c.amount.toString())),
      new Decimal(0),
    );

    return {
      total: total.toFixed(8),
      commissions: commissions.map(c => ({
        id: c.id,
        revenueType: c.revenueEvent.type,
        revenueAmount: c.revenueEvent.amount.toFixed(8),
        commissionAmount: c.amount.toFixed(8),
        createdAt: c.createdAt,
      })),
    };
  }
}

export default new AffiliateService();
