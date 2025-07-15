"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = exports.getInfoUrl = exports.getTickerUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../middlewares/errorHandler");
const getTickerUrl = (pair) => `https://api.hyperliquid.xyz/v2/markets/${pair}/ticker`;
exports.getTickerUrl = getTickerUrl;
const getInfoUrl = () => `https://api.hyperliquid.xyz/info`;
exports.getInfoUrl = getInfoUrl;
class PriceService {
    rest;
    constructor(axiosInstance = axios_1.default) {
        this.rest = axiosInstance;
    }
    async fetchCurrentPrice(asset) {
        if (!asset || typeof asset !== 'string') {
            throw (0, errorHandler_1.createError)('Ativo (asset) inválido fornecido', 400, 'INVALID_ASSET');
        }
        const pair = asset.includes('/') ? asset : `${asset}/USDC`;
        try {
            const perpUrl = (0, exports.getTickerUrl)(pair);
            const perpRes = await this.rest.get(perpUrl);
            if (perpRes.data && perpRes.data[0] && perpRes.data[0].px) {
                return parseFloat(perpRes.data[0].px);
            }
        }
        catch (error) {
            console.warn(`Não foi possível buscar o preço perpétuo para ${pair}. Tentando fallback. Erro: ${error.message}`);
        }
        try {
            const infoUrl = (0, exports.getInfoUrl)();
            const infoRes = await this.rest.post(infoUrl, { type: 'metaAndAssetCtxs' });
            const assetData = infoRes.data.assetCtxs.find((ctx) => ctx.name.toLowerCase() === asset.toLowerCase());
            if (assetData && assetData.markPx) {
                return parseFloat(assetData.markPx);
            }
        }
        catch (error) {
            throw (0, errorHandler_1.createError)(`Falha ao buscar preço spot para ${asset}`, 500, 'PRICE_ERROR_FALLBACK');
        }
        throw (0, errorHandler_1.createError)(`Não foi possível encontrar um preço para o ativo ${asset}`, 404, 'PRICE_NOT_FOUND');
    }
}
exports.PriceService = PriceService;
//# sourceMappingURL=price.service.js.map