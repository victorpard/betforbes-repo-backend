"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceService = exports.PriceService = void 0;
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../middlewares/errorHandler");
const logger_1 = require("../../utils/logger");
class PriceService {
    rest;
    infoUrl;
    constructor() {
        const apiUrl = process.env.HYPERLIQUID_API_URL;
        this.infoUrl = (process.env.HYPERLIQUID_INFO_URL || apiUrl).replace('/evm', '');
        this.rest = axios_1.default.create({ baseURL: this.infoUrl });
    }
    async fetchCurrentPrice(asset) {
        const pair = asset.includes('/') ? asset : `${asset}/USDC`;
        try {
            const perpRes = await this.rest.get(`/v2/markets/${pair}/ticker`);
            return parseFloat(perpRes.data.price);
        }
        catch (err) {
            logger_1.logger.warn(`Não foi possível buscar o preço perpétuo para ${pair}. Tentando fallback. Erro: ${err.message}`);
        }
        let infoRes;
        try {
            infoRes = await this.rest.post(`/info`, { type: 'metaAndAssetCtxs' });
        }
        catch (err) {
            throw (0, errorHandler_1.createError)(`Falha ao buscar preço perpétuo para ${pair}`, err.response?.status ?? 500, 'PRICE_FEED_ERROR');
        }
        const data = infoRes.data;
        const assetCtx = data.assetCtxs?.find((ctx) => {
            if (!pair.includes('/'))
                throw new Error(`Par inválido: ${pair}`);
            const symbolKey = pair.split('/')[0].toUpperCase();
            return ctx.symbol === symbolKey;
        });
        if (!assetCtx || !assetCtx.markPx) {
            throw (0, errorHandler_1.createError)(`Ativo ${pair} não encontrado na resposta da API`, 500, 'PRICE_FEED_ERROR');
        }
        return parseFloat(assetCtx.markPx);
    }
}
exports.PriceService = PriceService;
exports.priceService = new PriceService();
//# sourceMappingURL=price.service.js.map