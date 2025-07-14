"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const decimal_js_1 = __importDefault(require("decimal.js"));
class AffiliateService {
    async getEarnings(affiliateId) {
        const commissions = await prisma_1.default.commissionEvent.findMany({
            where: { affiliateId },
            include: { revenueEvent: true },
            orderBy: { createdAt: 'desc' },
        });
        const total = commissions.reduce((sum, c) => sum.plus(new decimal_js_1.default(c.amount.toString())), new decimal_js_1.default(0));
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
exports.default = new AffiliateService();
//# sourceMappingURL=affiliate.service.js.map