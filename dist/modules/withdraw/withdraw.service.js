"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../lib/prisma"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const client_1 = require("@prisma/client");
class WithdrawService {
    async withdraw(userId, amount) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                balance: {
                    decrement: amount,
                },
            },
        });
        const withdrawalFee = new decimal_js_1.default(amount).times(0.02);
        const revenue = await prisma_1.default.revenueEvent.create({
            data: {
                userId,
                type: client_1.RevenueType.WITHDRAWAL_FEE,
                amount: withdrawalFee.toString(),
            },
        });
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { referrerId: true },
        });
        if (user?.referrerId) {
            await prisma_1.default.commissionEvent.create({
                data: {
                    affiliateId: user.referrerId,
                    revenueEventId: revenue.id,
                    amount: withdrawalFee.times(0.1).toString(),
                },
            });
        }
        return { success: true };
    }
}
exports.default = new WithdrawService();
//# sourceMappingURL=withdraw.service.js.map