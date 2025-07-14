"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const affiliate_service_1 = __importDefault(require("./affiliate.service"));
const errorHandler_1 = require("../../middlewares/errorHandler");
class AffiliateController {
    getEarnings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const affiliateId = req.user.id;
        const data = await affiliate_service_1.default.getEarnings(affiliateId);
        res.json({ success: true, data });
    });
}
exports.default = new AffiliateController();
//# sourceMappingURL=affiliate.controller.js.map