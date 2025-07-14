"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../../middlewares/errorHandler");
const price_service_1 = require("./price.service");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const symbol = String(req.query.symbol || '').trim();
    if (!symbol) {
        throw (0, errorHandler_1.createError)('Parâmetro "symbol" é obrigatório', 400, 'MISSING_SYMBOL');
    }
    try {
        const price = await price_service_1.priceService.fetchCurrentPrice(symbol);
        return res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                price,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('🛑 Erro em PriceService.fetchCurrentPrice', {
            symbol,
            message: err.message,
            status: err.response?.status,
            responseData: err.response?.data,
            stack: err.stack,
        });
        throw (0, errorHandler_1.createError)(`Falha ao buscar preço para ${symbol.toUpperCase()}`, err.response?.status ?? 500, 'PRICE_ERROR');
    }
}));
exports.default = router;
//# sourceMappingURL=price.routes.js.map