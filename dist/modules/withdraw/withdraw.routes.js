"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const withdraw_service_1 = __importDefault(require("./withdraw.service"));
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;
        const result = await withdraw_service_1.default.withdraw(userId, amount);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=withdraw.routes.js.map