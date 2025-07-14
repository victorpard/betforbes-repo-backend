"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.betsService = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const price_service_1 = __importDefault(require("../price/price.service"));
const client_1 = require("@prisma/client");
const decimal_js_1 = __importDefault(require("decimal.js"));
class BetsService {
    async fetchCurrentPrice(asset) {
        const normalized = asset.replace(/[-\/]/g, '').toUpperCase();
        return price_service_1.default.fetchCurrentPrice(normalized);
    }
    async create(data) {
        const entryPrice = await this.fetchCurrentPrice(data.asset);
        const orderWithUser = await prisma_1.default.order.create({
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
        });
        const leverageFee = new decimal_js_1.default(orderWithUser.amount)
            .times(orderWithUser.leverage)
            .times(0.02);
        const revenue = await prisma_1.default.revenueEvent.create({
            data: {
                userId: orderWithUser.userId,
                type: client_1.RevenueType.LEVERAGE_FEE,
                amount: leverageFee.toString(),
                orderId: orderWithUser.id
            }
        });
        if (orderWithUser.user.referrerId) {
            await prisma_1.default.commissionEvent.create({
                data: {
                    affiliateId: orderWithUser.user.referrerId,
                    revenueEventId: revenue.id,
                    amount: leverageFee.times(0.1).toString()
                }
            });
        }
        return orderWithUser;
    }
    async list(userId) {
        return prisma_1.default.order.findMany({ where: { userId } });
    }
    async close(userId, orderId) {
        const existing = await prisma_1.default.order.findUnique({
            where: { id: orderId },
            include: { user: { select: { referrerId: true } } }
        });
        if (!existing)
            throw new Error('Ordem não encontrada');
        const exitPrice = await this.fetchCurrentPrice(existing.asset);
        const profit = new decimal_js_1.default(exitPrice)
            .minus(existing.entryPrice)
            .times(existing.amount)
            .times(existing.leverage);
        const order = await prisma_1.default.order.update({
            where: { id: orderId },
            data: {
                exitPrice,
                status: 'CLOSED',
                profitLoss: profit.toString()
            }
        });
        if (profit.gt(0)) {
            const profitFee = profit.times(0.05);
            const revenue = await prisma_1.default.revenueEvent.create({
                data: {
                    userId,
                    type: client_1.RevenueType.PROFIT_FEE,
                    amount: profitFee.toString(),
                    orderId: order.id
                }
            });
            if (existing.user.referrerId) {
                await prisma_1.default.commissionEvent.create({
                    data: {
                        affiliateId: existing.user.referrerId,
                        revenueEventId: revenue.id,
                        amount: profitFee.times(0.1).toString()
                    }
                });
            }
        }
        return order;
    }
}
exports.betsService = new BetsService();
//# sourceMappingURL=bets.service.js.map