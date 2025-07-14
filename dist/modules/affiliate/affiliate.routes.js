"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const affiliate_controller_1 = __importDefault(require("./affiliate.controller"));
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/earnings', auth_1.authenticateToken, affiliate_controller_1.default.getEarnings);
exports.default = router;
//# sourceMappingURL=affiliate.routes.js.map