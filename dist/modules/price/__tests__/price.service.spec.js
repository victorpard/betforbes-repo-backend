"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const axios_mock_adapter_1 = __importDefault(require("axios-mock-adapter"));
const price_service_1 = require("../price.service");
describe('PriceService', () => {
    let localAxiosInstance;
    let mock;
    let priceService;
    beforeEach(() => {
        localAxiosInstance = axios_1.default.create();
        mock = new axios_mock_adapter_1.default(localAxiosInstance);
        priceService = new price_service_1.PriceService(localAxiosInstance);
    });
    afterEach(() => {
        mock.restore();
    });
    it('should return perpetual price when the ticker API succeeds', async () => {
        const symbol = 'BTC';
        const pair = `${symbol}/USDC`;
        const expectedPrice = 65000.50;
        mock.onGet((0, price_service_1.getTickerUrl)(pair)).reply(200, [{ px: expectedPrice.toString() }]);
        const price = await priceService.fetchCurrentPrice(symbol);
        expect(price).toBe(expectedPrice);
    });
    it('should fallback to spot price when the ticker API fails', async () => {
        const symbol = 'ETH';
        const pair = `${symbol}/USDC`;
        const expectedSpotPrice = 3500.75;
        mock.onGet((0, price_service_1.getTickerUrl)(pair)).networkError();
        mock.onPost((0, price_service_1.getInfoUrl)()).reply(200, {
            assetCtxs: [{ name: 'ETH', markPx: expectedSpotPrice.toString() }],
        });
        const price = await priceService.fetchCurrentPrice(symbol);
        expect(price).toBe(expectedSpotPrice);
    });
    it('should throw an error if both APIs fail', async () => {
        const symbol = 'LTC';
        const pair = `${symbol}/USDC`;
        mock.onGet((0, price_service_1.getTickerUrl)(pair)).networkError();
        mock.onPost((0, price_service_1.getInfoUrl)()).reply(500);
        await expect(priceService.fetchCurrentPrice(symbol)).rejects.toThrow(`Falha ao buscar preço spot para ${symbol}`);
    });
    it('should throw an error if no price is found for the asset', async () => {
        const symbol = 'DOGE';
        const pair = `${symbol}/USDC`;
        mock.onGet((0, price_service_1.getTickerUrl)(pair)).networkError();
        mock.onPost((0, price_service_1.getInfoUrl)()).reply(200, {
            assetCtxs: [{ name: 'BTC', markPx: '65000' }],
        });
        await expect(priceService.fetchCurrentPrice(symbol)).rejects.toThrow(`Não foi possível encontrar um preço para o ativo ${symbol}`);
    });
});
//# sourceMappingURL=price.service.spec.js.map