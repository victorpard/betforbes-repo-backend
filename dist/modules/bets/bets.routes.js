"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const errorHandler_1 = require("../../middlewares/errorHandler");
const bets_service_1 = require("./bets.service");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const orders = await bets_service_1.betsService.list(userId);
    const user = await prisma_1.default.user.findUnique({
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
}));
router.post('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const order = await bets_service_1.betsService.create({
        userId,
        asset: req.body.asset,
        type: req.body.type,
        amount: req.body.amount,
        leverage: req.body.leverage,
        direction: req.body.direction,
    });
    res.json({ success: true, data: order });
}));
router.post('/:id/close', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;
    const closed = await bets_service_1.betsService.close(userId, orderId);
    res.json({ success: true, data: closed });
}));
exports.default = router;
//# sourceMappingURL=bets.routes.js.map