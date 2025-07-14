"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const bets_service_1 = require("./bets.service");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await bets_service_1.betsService.list(userId);
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        });
        return res.json({
            success: true,
            data: { orders, balance: user?.balance ?? 0 },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const order = await bets_service_1.betsService.create({ userId, ...req.body });
        return res.json({ success: true, data: order });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});
router.post('/:id/close', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const updated = await bets_service_1.betsService.close(userId, req.params.id);
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=bets.controller.js.map